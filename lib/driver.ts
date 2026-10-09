import type { WaterLevel } from "./levels";
import { HEAT_LINES, heatMood, type CurrentWeather, type HottestDay } from "./weather";

export type Pose = "standing" | "drink" | "wipe" | "relaxed" | "phone";

export const POSE_IMAGE: Record<Pose, string> = {
  standing: "/driver.png",
  drink: "/driver-drink.png",
  wipe: "/driver-wipe.png",
  relaxed: "/driver-relaxed.png",
  phone: "/driver-phone.png",
};

export interface Scene {
  pose: Pose;
  /** What the auto anna says. */
  bubble: string;
  /** Small prompt under the bubble, e.g. "Tap me". Absent when tapping does nothing. */
  hint?: string;
  /** Tears over his face. */
  tears?: boolean;
}

const WATER_LINES: Record<WaterLevel, string> = {
  dry: "Dry that time, boss. Nothing to report.",
  ankle: "Ankle deep. Chappals gone, that's all.",
  knee: "Knee deep. Autos stopped, people waded through.",
  waist: "Waist deep. Bikes went under, ground floors got water.",
  chest: "Chest deep. Water inside homes. People left by boat.",
};

interface Args {
  mode: "water" | "heat";
  /** The level the wall is showing. */
  level: WaterLevel;
  /** "now" or a year like "2023". */
  selected: string;
  /** Event name for the selected year, if any. */
  event?: string | null;
  /** The "now" note, e.g. "No flooding reported here in the last 14 days." */
  nowNote: string;
  weather?: CurrentWeather | null;
  hottest?: HottestDay | null;
  /** How many times the driver has been tapped in this state. */
  step: number;
}

function hottestLine(h: HottestDay | null | undefined): string {
  if (!h) return "Phone says the archive is down. Ask me again in a minute.";
  const d = new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return `Phone says the worst day this past year was ${d}: it felt like ${Math.round(h.feelsLike)}°. Plan for that, not for today.`;
}

/** What the driver is doing and saying, given the wall's state. */
export function driverScene(a: Args): Scene {
  if (a.mode === "heat") {
    if (a.weather === undefined) return { pose: "phone", bubble: "One second, checking the thermometer…" };
    if (a.weather === null) return { pose: "relaxed", bubble: "Can't reach the weather service right now. Try again in a minute." };
    const mood = heatMood(a.weather.feelsLike);
    const tapped = a.step % 2 === 1;
    if (mood === "hot" || mood === "scorching") {
      return tapped
        ? { pose: "drink", bubble: HEAT_LINES[mood].advice, hint: "Tap again" }
        : { pose: "wipe", bubble: HEAT_LINES[mood].line, hint: "Tap me" };
    }
    return tapped
      ? { pose: "phone", bubble: hottestLine(a.hottest), hint: "Tap again" }
      : { pose: "relaxed", bubble: HEAT_LINES[mood].line, hint: "Tap me" };
  }

  // Water mode
  if (a.selected === "now") {
    if (a.level === "dry") return { pose: "phone", bubble: a.nowNote };
    return { pose: "standing", bubble: `Right now: ${WATER_LINES[a.level].toLowerCase()} ${a.nowNote}.`, tears: a.level === "waist" || a.level === "chest" };
  }
  const when = a.event ? `${a.event}, ${a.selected}` : a.selected;
  return {
    pose: "standing",
    bubble: `${when}: ${WATER_LINES[a.level]}`,
    tears: a.level === "waist" || a.level === "chest",
  };
}
