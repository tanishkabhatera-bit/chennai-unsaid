import type { FloodRecord, Severity } from "./types";

/** Human-scale water levels, the unit the whole UI is drawn in. */
export type WaterLevel = "dry" | "ankle" | "knee" | "waist" | "chest";

export const LEVELS: WaterLevel[] = ["dry", "ankle", "knee", "waist", "chest"];

/** Height of each level as a share of the figure's height. */
export const LEVEL_HEIGHT: Record<WaterLevel, number> = {
  dry: 0,
  ankle: 0.1,
  knee: 0.3,
  waist: 0.5,
  chest: 0.72,
};

export const LEVEL_LABEL: Record<WaterLevel, string> = {
  dry: "No flood on record",
  ankle: "Ankle deep",
  knee: "Knee deep",
  waist: "Waist deep",
  chest: "Chest deep, water inside homes",
};

const HOME_WORDS = /\b(home|house|houses|homes|residence|flat|flats|evacuat|relief camp|rescued|boat)/i;

/** A record's level: the spec's severity scale, pushed one step up when water entered homes. */
export function recordLevel(r: Pick<FloodRecord, "severity" | "detail" | "water_stayed_days">): WaterLevel {
  const base: Record<Severity, WaterLevel> = { minor: "ankle", moderate: "knee", severe: "waist" };
  let level = base[r.severity];
  if (r.severity === "severe" && (HOME_WORDS.test(r.detail) || (r.water_stayed_days ?? 0) >= 3)) level = "chest";
  return level;
}

export function maxLevel(levels: WaterLevel[]): WaterLevel {
  return levels.reduce((a, b) => (LEVELS.indexOf(b) > LEVELS.indexOf(a) ? b : a), "dry");
}

export interface WallMark {
  year: string;
  level: WaterLevel;
  event: string | null;
  source_url: string;
  source_title: string;
}

/** One mark per year: the highest level recorded that year. */
export function wallMarks(records: FloodRecord[]): WallMark[] {
  const byYear = new Map<string, WallMark>();
  for (const r of records) {
    const year = r.date.slice(0, 4);
    const level = recordLevel(r);
    const prev = byYear.get(year);
    if (!prev || LEVELS.indexOf(level) > LEVELS.indexOf(prev.level)) {
      byYear.set(year, { year, level, event: r.event, source_url: r.source_url, source_title: r.source_title });
    }
  }
  return [...byYear.values()].sort((a, b) => b.year.localeCompare(a.year));
}
