import type { Locality } from "./types";

/** Lowercase and drop spaces/punctuation so "T. Nagar" and "tnagar" match. */
export function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Localities matching the query: prefix matches first, then anything containing it. */
export function searchLocalities(localities: Locality[], query: string): Locality[] {
  const q = normalise(query);
  if (!q) return [];
  const starts: Locality[] = [];
  const contains: Locality[] = [];
  for (const locality of localities) {
    const names = [locality.name, ...locality.aliases].map(normalise);
    if (names.some((n) => n.startsWith(q))) starts.push(locality);
    else if (names.some((n) => n.includes(q))) contains.push(locality);
  }
  return [...starts, ...contains];
}
