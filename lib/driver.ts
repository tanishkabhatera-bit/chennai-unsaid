import type { WaterLevel } from "./levels";
import { HEAT_LINES, heatMood, type CurrentWeather, type HottestDay } from "./weather";

export type Pose =
  | "standing" | "drink" | "wipe" | "relaxed" | "phone" | "umbrella" | "worried" | "sad"
  | "point" | "thumbs" | "shrug" | "wave" | "show";

export const POSE_IMAGE: Record<Pose, string> = {
  standing: "/driver.png",
  drink: "/driver-drink.png",
  wipe: "/driver-wipe.png",
  relaxed: "/driver-relaxed.png",
  phone: "/driver-phone.png",
  umbrella: "/driver-umbrella.png",
  worried: "/driver-worried.png",
  sad: "/driver-sad.png",
  point: "/driver-point.png",
  thumbs: "/driver-thumbs.png",
  shrug: "/driver-shrug.png",
  wave: "/driver-wave.png",
  show: "/driver-show.png",
};

export interface Scene {
  pose: Pose;
  /** What the auto anna says. */
  bubble: string;
  /** Small prompt under the bubble, e.g. "Tap me". Absent when tapping does nothing. */
  hint?: string;
}

const WATER_POSE: Record<WaterLevel, Pose> = {
  dry: "relaxed",
  ankle: "umbrella",
  knee: "worried",
  waist: "sad",
  chest: "sad",
};

const WATER_LINES: Record<WaterLevel, string> = {
  dry: "Dry that time, boss. Nothing to report.",
  ankle: "Ankle deep. Umbrella out, chappals in hand, that's all.",
  knee: "Knee deep. Autos stopped, people waded through.",
  waist: "Waist deep. Bikes went under, ground floors got water.",
  chest: "Chest deep. Water inside homes. People left by boat.",
};

const WATER_ADVICE: Record<WaterLevel, string> = {
  dry: "Still ask the neighbours about the last big rain. The news doesn't catch every street.",
  ankle: "Ask for a ground floor that's raised a few steps. Check where the water went that time.",
  knee: "Ask if water entered the stilt parking or the ground floor. Keep the bike on a higher street in the rains.",
  waist: "Avoid a ground-floor flat here unless it's raised. Ask about a sump pump and backup power.",
  chest: "Take a higher floor. Ask the owner, in writing, whether water entered the house that year.",
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
  /** No area picked yet (home page). */
  empty?: boolean;
  /** The area has no flood records in the news at all. */
  noRecords?: boolean;
}

function hottestLine(h: HottestDay | null | undefined): string {
  if (!h) return "Phone says the archive is down. Ask me again in a minute.";
  const d = new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return `Phone says the worst day this past year was ${d}: it felt like ${Math.round(h.feelsLike)}°. Plan for that, not for today.`;
}

/** What the driver is doing and saying, given the wall's state. */
export function driverScene(a: Args): Scene {
  const tapped = a.step % 2 === 1;

  if (a.empty) {
    return { pose: "wave", bubble: a.mode === "heat" ? "Vanakkam! Type an area and I'll tell you how hot it really is." : "Vanakkam! Type an area and I'll show you how high the water came." };
  }

  if (a.mode === "heat") {
    if (a.weather === undefined) return { pose: "phone", bubble: "One second, checking the thermometer…" };
    if (a.weather === null) return { pose: "shrug", bubble: "Can't reach the weather service right now. Try again in a minute." };
    const mood = heatMood(a.weather.feelsLike);
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
    if (a.level === "dry") {
      if (a.noRecords) {
        return tapped
          ? { pose: "thumbs", bubble: "Could be good news. Still ask the neighbours about the last big rain.", hint: "Tap again" }
          : { pose: "shrug", bubble: "No flood report for this area in the news we've read. The news doesn't catch every street.", hint: "Tap me" };
      }
      return tapped
        ? { pose: "relaxed", bubble: "Pick a year below to see how high it came before.", hint: "Tap again" }
        : { pose: "phone", bubble: a.nowNote, hint: "Tap me" };
    }
    return tapped
      ? { pose: WATER_POSE[a.level], bubble: WATER_ADVICE[a.level], hint: "Tap again" }
      : { pose: WATER_POSE[a.level], bubble: `Right now: ${WATER_LINES[a.level]}`, hint: "Tap me" };
  }

  const when = a.event ? `${a.event}, ${a.selected}` : a.selected;
  return tapped
    ? { pose: WATER_POSE[a.level], bubble: WATER_ADVICE[a.level], hint: "Tap again" }
    : { pose: WATER_POSE[a.level], bubble: `${when}: ${WATER_LINES[a.level]}`, hint: "Tap me" };
}
