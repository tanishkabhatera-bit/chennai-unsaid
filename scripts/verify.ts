// Spec F4 step 3: sanity-check extracted records against their articles.
// Flags any record whose locality (or an alias) never appears in the article text.
//   npm run verify
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import localitiesJson from "../data/localities.json";
import { normalise } from "../lib/localities";
import type { FloodRecord, Locality } from "../lib/types";

async function main() {
  const localities = localitiesJson as Locality[];
  const texts = new Map<string, string>();
  for (const f of (await readdir("articles")).filter((f) => f.endsWith(".txt") && f !== "urls.txt")) {
    const raw = await readFile(path.join("articles", f), "utf8");
    const url = raw.match(/^URL:\s*(.*)$/m)?.[1].trim() ?? "";
    texts.set(url, normalise(raw));
  }

  const records: FloodRecord[] = JSON.parse(await readFile("data/flood-records.json", "utf8"));
  let flagged = 0;
  for (const r of records) {
    const text = texts.get(r.source_url);
    const loc = localities.find((l) => l.slug === r.locality)!;
    const names = [loc.name, ...loc.aliases].map(normalise);
    if (!text || !names.some((n) => text.includes(n))) {
      flagged++;
      console.log(`CHECK ${r.locality} ${r.date} — name not found in ${r.source_url}`);
    }
  }
  console.log(`\n${records.length - flagged}/${records.length} records name a locality that appears in their article.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
