// Spec Part C1 / D1: turn news articles in articles/*.txt into flood records.
//
//   npm run extract            only articles not yet extracted
//   npm run extract -- --force re-run every article
//
// Writes data/extracted/<id>.json per article and data/flood-records.json combined.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import localitiesJson from "../data/localities.json";
import { bedrock, MODEL_ID } from "../lib/aws";
import { normalise } from "../lib/localities";
import type { FloodRecord, Locality, Severity } from "../lib/types";

const ARTICLES_DIR = "articles";
const OUT_DIR = path.join("data", "extracted");
const COMBINED = path.join("data", "flood-records.json");
const MAX_TEXT_CHARS = 15000;
const SEVERITIES: Severity[] = ["minor", "moderate", "severe"];

interface Article {
  id: string;
  url: string;
  title: string;
  outlet: string;
  published: string;
  text: string;
}

interface RawRecord {
  locality?: unknown;
  date?: unknown;
  event?: unknown;
  severity?: unknown;
  water_stayed_days?: unknown;
  detail?: unknown;
}

const PROMPT = `You extract flood records from a news article about Chennai, India.
Return ONLY a JSON array, no prose.
For every Chennai locality the article says was waterlogged, flooded or inundated, output one object:
{
 "locality": string (as written in the article),
 "date": ISO date YYYY-MM-DD (use the article's published date if the event date is not stated),
 "event": string or null (e.g. "Cyclone Michaung"),
 "severity": "minor" | "moderate" | "severe"
   (minor = roads waterlogged; moderate = traffic disrupted or knee-deep water; severe = water in homes, evacuations, relief camps, deaths),
 "water_stayed_days": integer or null (only if the article states a duration),
 "detail": one sentence, only facts stated in the article
}
Use only facts in the article. Only localities explicitly named in the article. If no locality qualifies, return [].

ARTICLE TITLE: {title}
ARTICLE URL: {url}
ARTICLE PUBLISHED: {published}
ARTICLE TEXT:
{text}`;

/** Article files start with "KEY: value" header lines, then a line of "---", then the text. */
function parseArticle(id: string, raw: string): Article {
  const [head, ...body] = raw.replace(/\r\n/g, "\n").split(/^---$/m);
  const fields = Object.fromEntries(
    head
      .split("\n")
      .map((line) => line.match(/^(\w+):\s*(.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1].toUpperCase(), m[2].trim()]),
  );
  const article = {
    id,
    url: fields.URL ?? "",
    title: fields.TITLE ?? "",
    outlet: fields.OUTLET ?? "",
    published: fields.PUBLISHED ?? "",
    text: body.join("---").trim(),
  };
  if (!article.url || !/^\d{4}-\d{2}-\d{2}$/.test(article.published) || !article.text) {
    throw new Error(`${id}: needs URL, PUBLISHED (YYYY-MM-DD) and text after a --- line. See articles/README.md`);
  }
  return article;
}

// Known names, longest first so "West Mambalam" wins over "Mambalam".
const NAMES = (localitiesJson as Locality[])
  .flatMap((l) => [l.name, ...l.aliases].map((n) => ({ key: normalise(n), slug: l.slug })))
  .sort((a, b) => b.key.length - a.key.length);

/** Spec C1: map name variants to one slug. "Ram Nagar, Velachery" → velachery. */
function toSlug(name: string): string | null {
  const key = normalise(name);
  return (
    NAMES.find((n) => n.key === key)?.slug ??
    NAMES.find((n) => n.key.length >= 4 && key.includes(n.key))?.slug ??
    null
  );
}

function parseJsonArray(text: string): RawRecord[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end < start) return [];
  const parsed = JSON.parse(text.slice(start, end + 1));
  return Array.isArray(parsed) ? parsed : [];
}

function urlHash(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 10);
}

async function extract(article: Article) {
  const prompt = PROMPT.replace("{title}", article.title)
    .replace("{url}", article.url)
    .replace("{published}", article.published)
    .replace("{text}", article.text.slice(0, MAX_TEXT_CHARS));

  const res = await bedrock.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { temperature: 0, maxTokens: 3000 },
    }),
  );
  const reply = res.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";

  const records: (FloodRecord & { sk: string; locality_as_written: string })[] = [];
  const unmatched: string[] = [];
  for (const raw of parseJsonArray(reply)) {
    const written = typeof raw.locality === "string" ? raw.locality.trim() : "";
    const slug = written ? toSlug(written) : null;
    if (!slug) {
      if (written) unmatched.push(written);
      continue;
    }
    const date =
      typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : article.published;
    const severity = SEVERITIES.includes(raw.severity as Severity) ? (raw.severity as Severity) : "minor";
    const days = Number.isInteger(raw.water_stayed_days) ? (raw.water_stayed_days as number) : null;
    records.push({
      locality: slug,
      sk: `${date}#${urlHash(article.url)}`,
      date,
      event: typeof raw.event === "string" && raw.event.trim() ? raw.event.trim() : null,
      severity,
      water_stayed_days: days,
      detail: typeof raw.detail === "string" ? raw.detail.trim() : "",
      source_url: article.url,
      source_title: article.title,
      locality_as_written: written,
    });
  }

  // One row per locality per article (the DynamoDB key), keeping the most severe mention.
  const bySlug = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    const prev = bySlug.get(r.locality);
    if (!prev || SEVERITIES.indexOf(r.severity) > SEVERITIES.indexOf(prev.severity)) bySlug.set(r.locality, r);
  }
  return { records: [...bySlug.values()], unmatched, reply };
}

async function main() {
  const force = process.argv.includes("--force");
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".txt")).sort();
  if (files.length === 0) {
    console.log(`No articles found. Add .txt files to ${ARTICLES_DIR}/ (see articles/README.md).`);
    return;
  }

  for (const file of files) {
    const id = path.basename(file, ".txt");
    const outFile = path.join(OUT_DIR, `${id}.json`);
    if (!force && existsSync(outFile)) continue;
    try {
      const article = parseArticle(id, await readFile(path.join(ARTICLES_DIR, file), "utf8"));
      const result = await extract(article);
      await writeFile(
        outFile,
        JSON.stringify({ article: { ...article, text: undefined }, ...result }, null, 2) + "\n",
      );
      console.log(
        `${id}: ${result.records.length} records` +
          (result.unmatched.length ? ` (not in locality list: ${result.unmatched.join(", ")})` : ""),
      );
    } catch (err) {
      console.error(`${id}: FAILED - ${(err as Error).message}`);
    }
  }

  const all: FloodRecord[] = [];
  for (const f of (await readdir(OUT_DIR)).filter((f) => f.endsWith(".json")).sort()) {
    const { records } = JSON.parse(await readFile(path.join(OUT_DIR, f), "utf8"));
    all.push(...records);
  }
  all.sort((a, b) => a.locality.localeCompare(b.locality) || b.date.localeCompare(a.date));
  await writeFile(COMBINED, JSON.stringify(all, null, 2) + "\n");
  console.log(`\n${all.length} records in total → ${COMBINED}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
