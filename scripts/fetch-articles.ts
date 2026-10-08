// Download news articles into articles/*.txt in the format extract.ts reads.
//
//   npm run fetch-articles                 reads links from articles/urls.txt (one per line)
//   npm run fetch-articles -- <url> <url>  or pass links directly
//
// Many news sites block scripts. Those are listed at the end; copy-paste them by hand
// (see articles/README.md).
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ARTICLES_DIR = "articles";

const OUTLETS: Record<string, string> = {
  "dtnext.in": "DT Next",
  "thehindu.com": "The Hindu",
  "deccanherald.com": "Deccan Herald",
  "citizenmatters.in": "Citizen Matters",
  "timesofindia.indiatimes.com": "Times of India",
  "ndtv.com": "NDTV",
  "newindianexpress.com": "The New Indian Express",
};

function decode(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, name: string): string | undefined {
  const re = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${name}["'][^>]*>`, "i");
  return html.match(re)?.[0].match(/content=["']([^"']*)["']/i)?.[1];
}

function publishedDate(html: string): string | undefined {
  const raw =
    meta(html, "article:published_time") ??
    meta(html, "datePublished") ??
    html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1];
  return raw?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
}

function jsonLdParagraphs(html: string): string[] {
  const m = html.match(/"articleBody"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (!m) return [];
  const body = JSON.parse(`"${m[1]}"`) // undo JSON escaping
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return body
    .split(/<\/p>/i)
    .map((p: string) => decode(p))
    .filter((p: string) => p.length > 60);
}

function outletFor(url: URL): string {
  const host = url.hostname.replace(/^www\./, "");
  return Object.entries(OUTLETS).find(([domain]) => host.endsWith(domain))?.[1] ?? host;
}

function fileId(url: URL, date: string): string {
  const outlet = url.hostname.replace(/^www\./, "").split(".")[0];
  const slug = url.pathname
    .split("/")
    .filter(Boolean)
    .pop()!
    .replace(/\.\w+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()
    .slice(0, 60);
  return `${date}-${outlet}-${slug}`;
}

async function fetchOne(link: string): Promise<string> {
  const url = new URL(link);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const title = decode(meta(html, "og:title") ?? html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
  const date = publishedDate(html);
  if (!date) throw new Error("no published date found on the page");

  let paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decode(m[1]))
    .filter((p) => p.length > 60);
  // Some sites (Deccan Herald) keep the text only in JSON-LD, as an escaped HTML string.
  if (paragraphs.join(" ").length < 400) paragraphs = jsonLdParagraphs(html);
  if (paragraphs.join(" ").length < 400) throw new Error("couldn't find the article text (site may need copy-paste)");

  const id = fileId(url, date);
  const file = path.join(ARTICLES_DIR, `${id}.txt`);
  if (!existsSync(file)) {
    const header = `URL: ${link}\nTITLE: ${title}\nOUTLET: ${outletFor(url)}\nPUBLISHED: ${date}\n---\n`;
    await writeFile(file, header + paragraphs.join("\n\n") + "\n");
  }
  return id;
}

async function main() {
  let links = process.argv.slice(2).filter((a) => a.startsWith("http"));
  if (links.length === 0) {
    const list = path.join(ARTICLES_DIR, "urls.txt");
    if (!existsSync(list)) {
      console.log(`Put article links in ${list}, one per line, or pass them as arguments.`);
      return;
    }
    links = (await readFile(list, "utf8")).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("http"));
  }

  const failed: string[] = [];
  for (const link of links) {
    try {
      console.log(`saved  ${await fetchOne(link)}`);
    } catch (err) {
      console.log(`FAILED ${link}: ${(err as Error).message}`);
      failed.push(link);
    }
  }
  if (failed.length) {
    console.log(`\n${failed.length} need copy-paste by hand (see articles/README.md):\n${failed.join("\n")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
