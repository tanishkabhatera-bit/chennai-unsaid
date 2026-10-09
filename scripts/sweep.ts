// Searches the news sites for each locality and collects flood/rain article links.
//   npm run sweep              every locality
//   npm run sweep -- kolathur  one locality
// Appends new links to articles/urls.txt (then run fetch-articles, extract, audit, load).
import { readFile, writeFile } from "node:fs/promises";
import localitiesJson from "../data/localities.json";
import type { Locality } from "../lib/types";

const KEYWORDS = /flood|rain|waterlog|water-log|inundat|cyclone|monsoon|deluge|stagnat|submerg/i;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

const SITES: { name: string; search: (q: string) => string; article: RegExp }[] = [
  {
    name: "dtnext",
    search: (q) => `https://www.dtnext.in/search?q=${encodeURIComponent(q)}`,
    article: /https?:\/\/(?:www\.)?dtnext\.in\/(?:news\/(?:chennai|city|tamilnadu)|city\/\d{4}\/\d{2}\/\d{2})\/[a-z0-9-]+/gi,
  },
  {
    name: "citizenmatters",
    search: (q) => `https://citizenmatters.in/?s=${encodeURIComponent(q)}`,
    article: /https?:\/\/(?:chennai\.)?citizenmatters\.in\/[a-z0-9-]{20,}\/?/gi,
  },
  {
    name: "deccanherald",
    search: (q) => `https://www.deccanherald.com/search?q=${encodeURIComponent(q)}`,
    article: /https?:\/\/(?:www\.)?deccanherald\.com\/(?:india\/tamil-nadu|india)\/[a-z0-9-]+-\d{6,}/gi,
  },
];

async function searchLinks(site: (typeof SITES)[number], query: string): Promise<string[]> {
  try {
    const res = await fetch(site.search(query), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const html = await res.text();
    const links = new Set<string>();
    for (const m of html.matchAll(site.article)) {
      const url = m[0].replace(/\/$/, "");
      if (KEYWORDS.test(url) && !/\/(city|tag|category|author|search)\//.test(url)) links.add(url);
    }
    return [...links];
  } catch {
    return [];
  }
}

async function main() {
  // npm run sweep -- [slug] [--sites=citizenmatters,dtnext]
  const args = process.argv.slice(2);
  const only = args.find((a) => !a.startsWith("--"));
  const siteArg = args.find((a) => a.startsWith("--sites="))?.slice(8);
  const sites = siteArg ? SITES.filter((s) => siteArg.split(",").includes(s.name)) : SITES;
  const localities = (localitiesJson as Locality[]).filter((l) => !only || l.slug === only);
  const existing = new Set((await readFile("articles/urls.txt", "utf8")).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("http")));
  const found = new Map<string, string[]>(); // url -> localities that surfaced it

  for (const l of localities) {
    const queries = [`${l.name} Chennai waterlogging`, `${l.name} Chennai flood`];
    let n = 0;
    for (const site of sites) {
      for (const q of queries) {
        for (const url of await searchLinks(site, q)) {
          if (existing.has(url)) continue;
          found.set(url, [...(found.get(url) ?? []), l.name]);
          n++;
        }
      }
    }
    console.log(`${l.name}: ${n} candidate links`);
  }

  const urls = [...found.keys()];
  if (urls.length) {
    const block = `\n# Sweep ${new Date().toISOString().slice(0, 10)}\n` + urls.join("\n") + "\n";
    await writeFile("articles/urls.txt", (await readFile("articles/urls.txt", "utf8")) + block);
  }
  console.log(`\n${urls.length} new links appended to articles/urls.txt`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
