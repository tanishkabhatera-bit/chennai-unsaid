// Climate Compare: the evidence behind each environmental dimension for one locality,
// with sources, dates, what is missing and what to verify. Nothing here is invented:
// every indicator either has a source or says it is unavailable.
import { LEVELS, maxLevel, recordLevel, type WaterLevel } from "./levels";
import type { FloodRecord, HeatRating, Report } from "./types";
import type { ClimateHistory, CurrentWeather } from "./weather";

const ARCHIVE = "Open-Meteo historical weather (ERA5 reanalysis, ~10 km grid)";
import type { Floor, Parking } from "./verdict";

export type Dimension = "flood" | "heat" | "water";
/** historical = past observations; current = live reading; indicative = our estimate, not a measurement. */
export type Kind = "historical" | "current" | "indicative" | "resident" | "missing";

export interface Indicator {
  label: string;
  value: string;
  kind: Kind;
  source: string;
  /** When the evidence is from, e.g. "2019–2025" or "read 9 Oct 2026, 20:00". */
  date: string;
  href?: string;
}

export interface DimensionReport {
  dimension: Dimension;
  /** 0 = least concern … 4 = most; null when there is no evidence at all. */
  score: number | null;
  /** A measured indicator, same definition and period for every location (higher = more concern). */
  measure?: { label: string; value: number; unit: string; period: string };
  headline: string;
  indicators: Indicator[];
  missing: string[];
  verify: string[];
  limit: string;
}

const LEVEL_WORD: Record<WaterLevel, string> = {
  dry: "no flooding reported",
  ankle: "ankle-deep",
  knee: "knee-deep",
  waist: "waist-deep",
  chest: "chest-deep, inside homes",
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function floodReport(records: FloodRecord[], floor: Floor, parking: Parking, climate: ClimateHistory | null, now = new Date()): DimensionReport {
  const firstYear = now.getFullYear() - 9;
  const recent = records.filter((r) => Number(r.date.slice(0, 4)) >= firstYear);
  const years = [...new Set(recent.map((r) => r.date.slice(0, 4)))].sort();
  const worst = maxLevel(recent.map(recordLevel));
  const longest = recent.reduce<number | null>((m, r) => (r.water_stayed_days != null && (m == null || r.water_stayed_days > m) ? r.water_stayed_days : m), null);
  const worstRecord = recent.find((r) => recordLevel(r) === worst);
  const sources = [...new Map(recent.map((r) => [r.source_url, r])).values()].sort((a, b) => b.date.localeCompare(a.date));

  const indicators: Indicator[] = recent.length
    ? [
        { label: "Flood years in the news", value: `${years.length} of the last 10 (${years.join(", ")})`, kind: "historical", source: `${sources.length} news ${sources.length === 1 ? "article" : "articles"}`, date: `${years[0]}–${years[years.length - 1]}` },
        { label: "Worst level reported", value: LEVEL_WORD[worst], kind: "historical", source: worstRecord?.source_title ?? "News report", date: worstRecord ? fmt(worstRecord.date) : "", href: worstRecord?.source_url },
        longest != null
          ? { label: "Longest water stayed", value: `${longest} ${longest === 1 ? "day" : "days"}`, kind: "historical", source: recent.find((r) => r.water_stayed_days === longest)?.source_title ?? "News report", date: fmt(recent.find((r) => r.water_stayed_days === longest)!.date), href: recent.find((r) => r.water_stayed_days === longest)?.source_url }
          : { label: "How long water stayed", value: "Not stated in the articles", kind: "missing", source: "—", date: "—" },
        ...sources.slice(0, 2).map((s) => ({ label: "Source", value: s.detail, kind: "historical" as const, source: s.source_title, date: fmt(s.date), href: s.source_url })),
      ]
    : [{ label: "Flood years in the news", value: "No report found", kind: "missing", source: "190 Chennai news articles, 2015–2026", date: "—" }];

  // Measured rainfall: same indicator, same period, for every location.
  let measure: DimensionReport["measure"];
  if (climate && climate.monsoonPeaks.length) {
    const p = climate.monsoonPeaks;
    const avg = Math.round(p.reduce((s, x) => s + x.mm, 0) / p.length);
    const top = p.reduce((a, b) => (b.mm > a.mm ? b : a));
    const period = `NE monsoons ${p[0].year}–${p[p.length - 1].year}`;
    indicators.push({ label: "Heaviest one-day rain, average per monsoon", value: `${avg} mm (Oct–Dec, ${p.length} monsoons)`, kind: "historical", source: ARCHIVE, date: period });
    indicators.push({ label: "Heaviest single day", value: `${Math.round(top.mm)} mm on ${fmt(top.date)}`, kind: "historical", source: ARCHIVE, date: fmt(top.date) });
    if (climate.michaungMm != null) indicators.push({ label: "Rain during Cyclone Michaung", value: `${Math.round(climate.michaungMm)} mm over 2–5 Dec 2023`, kind: "historical", source: ARCHIVE, date: "2–5 Dec 2023" });
    measure = { label: "average heaviest one-day monsoon rain", value: avg, unit: "mm", period };
  } else {
    indicators.push({ label: "Measured rainfall history", value: "Archive not reachable right now", kind: "missing", source: ARCHIVE, date: "—" });
  }

  const idx = LEVELS.indexOf(worst);
  const verify = [
    floor === "ground" ? "Ask in writing whether water entered this flat or the building's ground floor, and in which year." : "Ask whether water reached the building's lift room, power room or ground floor in past rains.",
    "Look for water marks on compound walls and the building's lowest walls; ask neighbours how high it came in Dec 2023.",
    "Check the plinth height: how many steps up is the entrance from the road?",
    ...(parking !== "none" && idx >= 2 ? [`Ask where residents move their vehicles when heavy rain is forecast; ${parking === "basement" ? "basements" : "stilt parking"} here may take water.`] : []),
    "Ask whether the storm-water drain on the street is connected and was desilted before this monsoon.",
  ];

  return {
    dimension: "flood",
    score: recent.length ? idx : null,
    measure,
    headline: recent.length ? `Reported flooding in ${years.length} of the last 10 years; worst: ${LEVEL_WORD[worst]}.` : "No flood report in the news we have read. That is not proof it stays dry.",
    indicators,
    missing: [
      "Street- and plot-level data: one locality floods unevenly.",
      ...(recent.length === 0 ? ["Any news coverage of this area: small streets are rarely reported."] : []),
      ...(longest == null ? ["How long water stayed: the articles don't say."] : []),
      "Official flood maps and the Tamil Nadu flood-monitoring and India-WRIS rain-gauge data: not connected in this prototype.",
      "Rainfall is from a ~10 km weather grid: neighbouring areas can share the same values.",
    ],
    verify,
    limit: "News reports show where water stood; rainfall shows how hard it rained. Neither is a flood model or a guarantee for one plot.",
  };
}

const HEAT_SCORE: Record<HeatRating["rating"], number> = { Cooler: 1, Average: 2, Hotter: 3 };

export function heatReport(heat: HeatRating | null, current: CurrentWeather | null, climate: ClimateHistory | null, floor: Floor): DimensionReport {
  const indicators: Indicator[] = [];
  const hottest = climate?.hottest ?? null;
  if (current) indicators.push({ label: "Feels like right now", value: `${Math.round(current.feelsLike)}°C (${Math.round(current.temperature)}° air, ${current.humidity}% humidity)`, kind: "current", source: "Open-Meteo", date: `read ${current.time.replace("T", " ")}` });
  else indicators.push({ label: "Feels like right now", value: "Weather service not reachable", kind: "missing", source: "Open-Meteo", date: "—" });
  if (climate) indicators.push({ label: "Days that felt 40°C or hotter, past year", value: `${climate.daysOver40} days`, kind: "historical", source: ARCHIVE, date: "last 365 days" });
  if (hottest) indicators.push({ label: "Hottest day, past year", value: `felt like ${Math.round(hottest.feelsLike)}°C (${Math.round(hottest.temperature)}° air)`, kind: "historical", source: ARCHIVE, date: fmt(hottest.date) });
  else indicators.push({ label: "Hottest day, past year", value: "Not available", kind: "missing", source: ARCHIVE, date: "—" });
  if (heat) indicators.push({ label: "Compared to the city", value: `${heat.rating}: ${heat.reason}`, kind: "indicative", source: "Our rating from coast distance, tree cover and density", date: "2026" });
  else indicators.push({ label: "Compared to the city", value: "Not rated", kind: "missing", source: "—", date: "—" });

  const score = heat ? HEAT_SCORE[heat.rating] + (floor === "top" && heat.rating !== "Cooler" ? 1 : 0) : null;
  return {
    dimension: "heat",
    score,
    measure: climate ? { label: "days that felt 40°C or hotter", value: climate.daysOver40, unit: "days", period: "the last 365 days" } : undefined,
    headline: heat
      ? `${heat.rating === "Average" ? "About average for the city" : `${heat.rating} than most of the city`}${floor === "top" ? ", and a top floor takes the roof's heat" : ""}.`
      : "No heat rating for this area yet.",
    indicators,
    missing: [
      "Indoor temperature: weather data is outdoors, not inside the flat.",
      "Satellite land-surface temperature for the street: not loaded in this prototype.",
      "Building orientation and shade: only a visit shows these.",
    ],
    verify: [
      floor === "top" ? "Top floor: ask about roof insulation, white roof paint or a terrace garden; touch the ceiling at 3 pm if you can." : "Ask which side the flat faces; west-facing rooms hold the afternoon heat.",
      "Check cross-ventilation: windows on two sides of the main room?",
      "Ask about power cuts in summer and whether there is backup power for fans.",
      "Look for trees or taller buildings shading the flat in the afternoon.",
    ],
    limit: "Outdoor weather for the area's centre, not your flat. The rating is our estimate, not a measurement.",
  };
}

export function waterReport(reports: Report[]): DimensionReport {
  const supply = reports.filter((r) => r.category === "water-supply").sort((a, b) => b.when.localeCompare(a.when));
  const indicators: Indicator[] = [
    { label: "Official supply or groundwater data", value: "Not available in this prototype", kind: "missing", source: "—", date: "—" },
    supply.length
      ? { label: "Residents on water supply", value: `${supply.length} ${supply.length === 1 ? "report" : "reports"}: “${supply[0].text}”`, kind: "resident", source: supply[0].seeded ? "Resident report (added by the team)" : "Resident report", date: supply[0].when }
      : { label: "Residents on water supply", value: "No reports yet", kind: "missing", source: "Resident reports", date: "—" },
  ];
  return {
    dimension: "water",
    score: supply.length ? Math.min(3, 1 + supply.length) : null,
    headline: supply.length ? `Residents report water-supply trouble (${supply.length}). No official data to confirm or rule it out.` : "No evidence either way. Treat it as unknown and ask.",
    indicators,
    missing: ["Metro Water supply schedule for the street.", "Groundwater level and quality.", "Tanker dependence in summer."],
    verify: [
      "Ask how many days a week Metro water comes, and for how long.",
      "Ask the borewell depth and whether the water is hard or salty.",
      "Ask how many tanker loads the building bought last summer, and at what price.",
      "Check for rainwater harvesting and the sump's size.",
    ],
    limit: "Resident reports only. No official supply or groundwater dataset is connected yet.",
  };
}

export interface Difference {
  dimension: Dimension;
  /** 0 = A has less concern, 1 = B has less concern, null = level or unknown. */
  better: 0 | 1 | null;
  why: string;
}

const DIM_NAME: Record<Dimension, string> = { flood: "Flooding", heat: "Heat", water: "Water availability" };

export function compareDimension(a: DimensionReport, b: DimensionReport, names: [string, string]): Difference {
  const name = DIM_NAME[a.dimension];
  if (a.score == null && b.score == null) return { dimension: a.dimension, better: null, why: `${name}: no evidence for either. Ask in both places.` };
  if (a.score == null || b.score == null) {
    return { dimension: a.dimension, better: null, why: `${name}: evidence only for ${a.score == null ? names[1] : names[0]}, so they can't be compared fairly.` };
  }
  if (a.score === b.score) {
    // Tie on the rule: fall back to the measured indicator, same definition and period on both sides.
    const ma = a.measure, mb = b.measure;
    if (ma && mb && Math.abs(ma.value - mb.value) >= Math.max(1, 0.1 * Math.max(ma.value, mb.value))) {
      const better = ma.value < mb.value ? 0 : 1;
      return {
        dimension: a.dimension,
        better,
        why: `${name}: level on the rule; on ${ma.label} over ${ma.period}, ${names[better]} measured ${[ma, mb][better].value} ${ma.unit} against ${[ma, mb][1 - better].value} ${ma.unit} for ${names[1 - better]}.`,
      };
    }
    return { dimension: a.dimension, better: null, why: `${name}: level on the evidence we have${ma && mb ? ` (${ma.label}: ${ma.value} vs ${mb.value} ${ma.unit}, ${ma.period})` : ""}.` };
  }
  const better = a.score < b.score ? 0 : 1;
  const m = a.measure && b.measure ? ` Measured: ${a.measure.label} ${names[0]} ${a.measure.value} vs ${names[1]} ${b.measure.value} ${a.measure.unit} (${a.measure.period}).` : "";
  return { dimension: a.dimension, better, why: `${name}: ${names[better]} has less concern. ${names[better]}: ${[a, b][better].headline} ${names[1 - better]}: ${[a, b][1 - better].headline}${m}` };
}

export { DIM_NAME };
