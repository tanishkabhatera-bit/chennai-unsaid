import { LEVELS, maxLevel, recordLevel, type WaterLevel } from "./levels";
import type { FloodRecord, HeatRating, Report } from "./types";

export type Floor = "ground" | "low" | "high" | "top";
export type Parking = "none" | "stilt" | "basement";
export type Use = "rent" | "buy";
export type VerdictLevel = "go" | "ask" | "think";

export const FLOORS: { id: Floor; label: string }[] = [
  { id: "ground", label: "Ground floor" },
  { id: "low", label: "1st or 2nd floor" },
  { id: "high", label: "3rd floor or higher" },
  { id: "top", label: "Top floor" },
];
export const PARKINGS: { id: Parking; label: string }[] = [
  { id: "none", label: "No parking" },
  { id: "stilt", label: "Stilt parking" },
  { id: "basement", label: "Basement parking" },
];

export interface Concern {
  topic: "water" | "heat" | "vehicle" | "residents";
  /** 0 fine, 1 note, 2 real concern, 3 serious */
  weight: number;
  text: string;
}

export interface Verdict {
  level: VerdictLevel;
  headline: string;
  concerns: Concern[];
  /** Transparent explanation of how the level was reached. */
  rule: string;
  facts: {
    years: number;
    yearList: string[];
    worst: WaterLevel;
    longestStay: number | null;
    heat: HeatRating | null;
  };
}

export const VERDICT_RULE =
  "Water: the worst level the news reported for the area in the last 10 years, weighed against your floor. Heat: the area's indicative rating, weighed against a top floor. Vehicles: stilt or basement parking in an area where water reached knee height or more. The strongest concern sets the verdict: none or mild → Good to go; one real concern → Go, but ask first; a serious one → Think hard.";

const LEVEL_WORD: Record<WaterLevel, string> = {
  dry: "no flooding",
  ankle: "ankle-deep water",
  knee: "knee-deep water",
  waist: "waist-deep water",
  chest: "chest-deep water, inside homes",
};

export function computeVerdict(
  records: FloodRecord[],
  heat: HeatRating | null,
  reports: Report[],
  floor: Floor,
  parking: Parking,
  now = new Date(),
): Verdict {
  const firstYear = now.getFullYear() - 9;
  const recent = records.filter((r) => Number(r.date.slice(0, 4)) >= firstYear);
  const yearList = [...new Set(recent.map((r) => r.date.slice(0, 4)))].sort();
  const worst = maxLevel(recent.map(recordLevel));
  const longestStay = recent.reduce<number | null>((m, r) => (r.water_stayed_days != null && (m == null || r.water_stayed_days > m) ? r.water_stayed_days : m), null);
  const idx = LEVELS.indexOf(worst); // 0 dry … 4 chest
  const concerns: Concern[] = [];

  // Water vs floor
  let water = 0;
  if (floor === "ground") water = [0, 1, 2, 3, 3][idx];
  else if (floor === "low") water = [0, 0, 1, 1, 2][idx];
  else water = [0, 0, 0, 1, 1][idx];
  if (recent.length === 0) {
    concerns.push({ topic: "water", weight: 0, text: "No flood report for this area in the news we've read. Good sign, not proof. Ask neighbours about the last big rain." });
  } else {
    const stay = longestStay ? ` Water stayed up to ${longestStay} days at least once.` : "";
    const floorNote =
      floor === "ground"
        ? idx >= 3
          ? " On a ground floor, that is water in the house."
          : idx === 2
            ? " A ground floor here needs a raised plinth and a plan for the car."
            : idx === 1
              ? " Ground floor: check the step height at the entrance."
              : ""
        : idx >= 3
          ? " Your floor stays dry, but the lift, power room and parking below may not."
          : "";
    concerns.push({ topic: "water", weight: water, text: `Flooded in ${yearList.length} of the last 10 years (${yearList.join(", ")}); worst reported: ${LEVEL_WORD[worst]}.${stay}${floorNote}` });
  }

  // Vehicles vs parking
  if (parking !== "none" && idx >= 2) {
    const w = parking === "basement" ? (idx >= 3 ? 3 : 2) : idx >= 3 ? 2 : 1;
    concerns.push({ topic: "vehicle", weight: w, text: `${parking === "basement" ? "Basement" : "Stilt"} parking in an area with ${LEVEL_WORD[worst]} on record: ask whether vehicles were damaged, and where people park when rain is forecast.` });
  }

  // Heat vs floor
  if (heat) {
    let h = heat.rating === "Hotter" ? 1 : 0;
    if (floor === "top") h += heat.rating === "Cooler" ? 0 : 1;
    const topNote = floor === "top" ? " A top floor takes the roof's heat all afternoon; ask about a roof garden, white paint or a false ceiling." : "";
    const lead = heat.rating === "Average" ? "About average for the city" : `${heat.rating} than most of the city`;
    concerns.push({ topic: "heat", weight: h, text: `${lead}: ${heat.reason.charAt(0).toLowerCase()}${heat.reason.slice(1)}.${topNote}` });
  }

  // Residents
  const counts: Record<string, number> = {};
  for (const r of reports) counts[r.category] = (counts[r.category] ?? 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const label: Record<string, string> = { flooding: "flooding", heat: "heat", "power-cuts": "power cuts during rain", dengue: "dengue after waterlogging", "water-supply": "water supply and tankers" };
    concerns.push({ topic: "residents", weight: top[1] >= 3 ? 1 : 0, text: `Residents here most often report ${label[top[0]] ?? top[0]} (${top[1]} ${top[1] === 1 ? "report" : "reports"}).` });
  }

  const strongest = Math.max(0, ...concerns.map((c) => c.weight));
  const level: VerdictLevel = strongest >= 3 ? "think" : strongest === 2 ? "ask" : "go";
  const headline = {
    go: "Good to go. Still ask the questions below.",
    ask: "Go, but ask these first.",
    think: "Think hard, and ask everything.",
  }[level];

  concerns.sort((a, b) => b.weight - a.weight);
  return { level, headline, concerns, rule: VERDICT_RULE, facts: { years: yearList.length, yearList, worst, longestStay, heat } };
}
