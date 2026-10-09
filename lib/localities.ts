import type { Locality } from "./types";

/** Lowercase and drop spaces/punctuation so "T. Nagar" and "tnagar" match. */
export function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Edit distance, capped: stops early once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Localities matching the query, best first: exact prefix, then contains,
 * then close misspellings ("ananagar" → Anna Nagar, "velacheri" → Velachery).
 */
export function searchLocalities(localities: Locality[], query: string): Locality[] {
  const q = normalise(query);
  if (!q) return [];
  const tolerance = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;

  const scored: { locality: Locality; score: number }[] = [];
  for (const locality of localities) {
    const names = [locality.name, ...locality.aliases].map(normalise);
    let score = Infinity;
    for (const n of names) {
      if (n.startsWith(q)) score = Math.min(score, 0);
      else if (n.includes(q)) score = Math.min(score, 1);
      else if (tolerance) {
        // Compare against the same-length start of the name too, so partial typing still fuzzy-matches.
        const d = Math.min(editDistance(q, n, tolerance), editDistance(q, n.slice(0, q.length), tolerance));
        if (d <= tolerance) score = Math.min(score, 2 + d);
      }
    }
    if (score < Infinity) scored.push({ locality, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.locality);
}
