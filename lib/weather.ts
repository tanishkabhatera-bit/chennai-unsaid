// Live and historical weather from Open-Meteo (free, no key). https://open-meteo.com
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  /** ISO time of the reading, Asia/Kolkata. */
  time: string;
}

export interface HottestDay {
  date: string;
  temperature: number;
  feelsLike: number;
}

const TZ = "Asia/Kolkata";

export async function fetchCurrent(lat: number, lon: number): Promise<CurrentWeather | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m&timezone=${TZ}`;
  try {
    const res = await fetch(url, { next: { revalidate: 900 } }); // 15 minutes
    if (!res.ok) return null;
    const j = await res.json();
    return {
      temperature: j.current.temperature_2m,
      feelsLike: j.current.apparent_temperature,
      humidity: j.current.relative_humidity_2m,
      time: j.current.time,
    };
  } catch {
    return null;
  }
}

/** The hottest day (by feels-like maximum) in the last 365 days. */
export async function fetchHottestLastYear(lat: number, lon: number): Promise<HottestDay | null> {
  const end = new Date();
  end.setDate(end.getDate() - 2); // the archive lags a couple of days
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);
  const d = (x: Date) => x.toISOString().slice(0, 10);
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${d(start)}&end_date=${d(end)}&daily=temperature_2m_max,apparent_temperature_max&timezone=${TZ}`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } }); // 1 day
    if (!res.ok) return null;
    const j = await res.json();
    const dates: string[] = j.daily.time;
    const temps: (number | null)[] = j.daily.temperature_2m_max;
    const feels: (number | null)[] = j.daily.apparent_temperature_max;
    let best = -1;
    for (let i = 0; i < dates.length; i++) {
      if (feels[i] != null && (best === -1 || feels[i]! > feels[best]!)) best = i;
    }
    if (best === -1) return null;
    return { date: dates[best], temperature: temps[best]!, feelsLike: feels[best]! };
  } catch {
    return null;
  }
}

export type HeatMood = "chill" | "warm" | "hot" | "scorching";

export function heatMood(feelsLike: number): HeatMood {
  if (feelsLike < 29) return "chill";
  if (feelsLike < 33) return "warm";
  if (feelsLike < 40) return "hot";
  return "scorching";
}

/** The auto driver's line and advice for the current feels-like temperature. */
export const HEAT_LINES: Record<HeatMood, { line: string; advice: string }> = {
  chill: {
    line: "Super weather, boss. Chennai also gets a break sometimes.",
    advice: "Go out, enjoy. Still carry water, this is Chennai.",
  },
  warm: {
    line: "Normal Chennai heat, da. Manageable, but don't test it.",
    advice: "Water bottle, cap, and keep the walking for the evening.",
  },
  hot: {
    line: "Semma heat, boss. Even the auto meter is sweating.",
    advice: "Stay in between 12 and 3. Umbrella, water, and nombu kanji if you get it.",
  },
  scorching: {
    line: "Vera level heat. The seat is hotter than the tea.",
    advice: "Don't step out in the afternoon. ORS, water, shade. Check on older people at home.",
  },
};
