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

export const NOW_WINDOW_DAYS = 14;

/**
 * What's happening now: the highest level from news records and resident flood marks
 * within the last NOW_WINDOW_DAYS. Dry if there's nothing.
 */
export function nowState(
  records: Pick<FloodRecord, "date" | "severity" | "detail" | "water_stayed_days">[],
  residentMarks: { created_at: string; level?: WaterLevel }[] = [],
  today = new Date(),
): { level: WaterLevel; note: string } {
  const cutoff = new Date(today.getTime() - NOW_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
  const recent = records.filter((r) => r.date >= cutoff);
  const marks = residentMarks.filter((m) => m.level && m.created_at.slice(0, 10) >= cutoff);
  const level = maxLevel([...recent.map(recordLevel), ...marks.map((m) => m.level!)]);
  if (level === "dry") return { level, note: `No flooding reported here in the last ${NOW_WINDOW_DAYS} days.` };
  const parts = [];
  if (recent.length) parts.push(`${recent.length} news ${recent.length === 1 ? "report" : "reports"}`);
  if (marks.length) parts.push(`${marks.length} resident ${marks.length === 1 ? "mark" : "marks"}`);
  return { level, note: `${parts.join(" and ")} in the last ${NOW_WINDOW_DAYS} days` };
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
