// Second check on every extracted record (spec F4 step 3, done twice: rules + a fresh AI read).
//
//   npm run audit            check records not yet audited
//   npm run audit -- --force re-check everything
//
// Rule checks: named cyclones must land in their real month; dates must be within the article's
// window. AI check: Bedrock re-reads the article and says whether it supports the record.
// Writes data/audit/<article>.json and rebuilds data/flood-records.json with only confirmed records.
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrock, MODEL_ID } from "../lib/aws";
import type { FloodRecord } from "../lib/types";

const EXTRACTED = path.join("data", "extracted");
const AUDIT = path.join("data", "audit");
const COMBINED = path.join("data", "flood-records.json");

// Known events and the year-months they actually happened.
const EVENT_WINDOWS: [RegExp, string[]][] = [
  [/michaung/i, ["2023-12"]],
  [/fengal/i, ["2024-11", "2024-12"]],
  [/ditwah/i, ["2025-11", "2025-12"]],
  [/vardah/i, ["2016-12"]],
  [/nivar/i, ["2020-11"]],
  [/mandous/i, ["2022-12"]],
  [/2015/, ["2015-11", "2015-12"]],
];

interface Extracted {
  article: { id: string; url: string; title: string; published: string };
  records: (FloodRecord & { sk: string; locality_as_written: string })[];
}

interface Verdict {
  locality: string;
  date: string;
  ok: boolean;
  reasons: string[];
}

function ruleCheck(r: FloodRecord, published: string): string[] {
  const problems: string[] = [];
  const ym = r.date.slice(0, 7);
  for (const [re, months] of EVENT_WINDOWS) {
    if (r.event && re.test(r.event) && !months.includes(ym)) problems.push(`event "${r.event}" dated ${r.date}`);
  }
  // An article can't report a flood that happens after it was published (allow a 3-day forecast slack).
  const pub = new Date(published).getTime();
  if (new Date(r.date).getTime() > pub + 3 * 86400000) problems.push(`date ${r.date} is after the article (${published})`);
  if (new Date(r.date).getFullYear() < 2015) problems.push(`date ${r.date} is before 2015`);
  return problems;
}

async function aiCheck(text: string, r: FloodRecord, written: string): Promise<{ ok: boolean; reason: string }> {
  const prompt = `You are fact-checking one record extracted from a Chennai news article.
RECORD: locality "${written}" was waterlogged or flooded around ${r.date}; severity ${r.severity}; water stayed ${r.water_stayed_days ?? "unknown"} days; detail: "${r.detail}".
Does the ARTICLE TEXT below support this record? The locality must be named as flooded, waterlogged or inundated, and the detail must be stated in the article. The severity scale: minor = roads waterlogged; moderate = traffic disrupted or knee-deep water; severe = water in homes, evacuations, relief camps, deaths.
Reply with ONLY JSON: {"supported": true|false, "reason": "one short sentence"}.

ARTICLE TEXT:
${text.slice(0, 15000)}`;
  const res = await bedrock.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { temperature: 0, maxTokens: 200 },
    }),
  );
  const reply = res.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
  try {
    const j = JSON.parse(reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1));
    return { ok: j.supported === true, reason: String(j.reason ?? "") };
  } catch {
    return { ok: false, reason: "unreadable AI reply" };
  }
}

async function main() {
  const force = process.argv.includes("--force");
  await mkdir(AUDIT, { recursive: true });
  const files = (await readdir(EXTRACTED)).filter((f) => f.endsWith(".json")).sort();
  let kept = 0;
  let dropped = 0;

  for (const file of files) {
    const out = path.join(AUDIT, file);
    const ex: Extracted = JSON.parse(await readFile(path.join(EXTRACTED, file), "utf8"));
    if (!force && existsSync(out)) {
      const prev: Verdict[] = JSON.parse(await readFile(out, "utf8"));
      kept += prev.filter((v) => v.ok).length;
      dropped += prev.filter((v) => !v.ok).length;
      continue;
    }
    const raw = await readFile(path.join("articles", `${ex.article.id}.txt`), "utf8");
    const text = raw.split(/^---$/m).slice(1).join("---");
    const verdicts: Verdict[] = [];
    for (const r of ex.records) {
      const reasons = ruleCheck(r, ex.article.published);
      if (reasons.length === 0) {
        const ai = await aiCheck(text, r, r.locality_as_written);
        if (!ai.ok) reasons.push(`AI: ${ai.reason}`);
      }
      verdicts.push({ locality: r.locality, date: r.date, ok: reasons.length === 0, reasons });
      if (reasons.length) {
        dropped++;
        console.log(`DROP ${ex.article.id} ${r.locality} ${r.date}: ${reasons.join("; ")}`);
      } else kept++;
    }
    await writeFile(out, JSON.stringify(verdicts, null, 2) + "\n");
  }

  // Rebuild the combined file from confirmed records only.
  const all: FloodRecord[] = [];
  for (const file of files) {
    const ex: Extracted = JSON.parse(await readFile(path.join(EXTRACTED, file), "utf8"));
    const verdicts: Verdict[] = JSON.parse(await readFile(path.join(AUDIT, file), "utf8"));
    for (const r of ex.records) {
      const v = verdicts.find((x) => x.locality === r.locality && x.date === r.date);
      if (v?.ok) all.push(r);
    }
  }
  all.sort((a, b) => a.locality.localeCompare(b.locality) || b.date.localeCompare(a.date));
  await writeFile(COMBINED, JSON.stringify(all, null, 2) + "\n");
  console.log(`\nConfirmed ${kept}, dropped ${dropped}. ${all.length} records → ${COMBINED}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
