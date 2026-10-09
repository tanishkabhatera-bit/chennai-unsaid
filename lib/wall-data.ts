import floodJson from "@/data/flood-records.json";
import { maxLevel, wallMarks, type WallMark, type WaterLevel } from "./levels";
import type { FloodRecord } from "./types";

export interface WallSummary {
  level: WaterLevel;
  years: number;
  marks: WallMark[];
}

// The home page animates every locality instantly, so it uses the committed snapshot
// of the extracted records. The Area Report reads the live DynamoDB tables.
const records = floodJson as FloodRecord[];

let cache: Record<string, WallSummary> | null = null;

export function wallSummaries(): Record<string, WallSummary> {
  if (cache) return cache;
  const bySlug = new Map<string, FloodRecord[]>();
  for (const r of records) bySlug.set(r.locality, [...(bySlug.get(r.locality) ?? []), r]);
  cache = Object.fromEntries(
    [...bySlug].map(([slug, rs]) => {
      const marks = wallMarks(rs);
      return [slug, { level: maxLevel(marks.map((m) => m.level)), years: marks.length, marks }];
    }),
  );
  return cache;
}
