// Live and historical weather from Open-Meteo (free, no key). https://open-meteo.com
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  /** Rain in the last hour, mm. */
  rain: number;
  /** ISO time of the reading, Asia/Kolkata. */
  time: string;
}

export interface RainDay {
  date: string;
  /** Total expected rain, mm. */
  mm: number;
  /** Chance of rain, 0–100. */
  chance: number;
}

export interface RainOutlook {
  /** Rain in the last 24 hours, mm. */
  last24h: number;
  /** Today and the next three days. */
  days: RainDay[];
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
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation&timezone=${TZ}`;
  try {
    const res = await fetch(url, { next: { revalidate: 900 } }); // 15 minutes
    if (!res.ok) return null;
    const j = await res.json();
    return {
      temperature: j.current.temperature_2m,
      feelsLike: j.current.apparent_temperature,
      humidity: j.current.relative_humidity_2m,
      rain: j.current.precipitation ?? 0,
      time: j.current.time,
    };
  } catch {
    return null;
  }
}

/** Rain in the last 24 hours and the outlook for today plus three days. */
export async function fetchRain(lat: number, lon: number): Promise<RainOutlook | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=precipitation&past_days=1&forecast_days=4&daily=precipitation_sum,precipitation_probability_max&timezone=${TZ}`;
  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const j = await res.json();
    const nowIdx = (j.hourly.time as string[]).findIndex((t) => t > new Date().toISOString().slice(0, 13));
    const end = nowIdx === -1 ? j.hourly.time.length : nowIdx;
    const last24h = (j.hourly.precipitation as number[]).slice(Math.max(0, end - 24), end).reduce((a, b) => a + (b ?? 0), 0);
    const days: RainDay[] = (j.daily.time as string[]).slice(1).map((date, i) => ({
      date,
      mm: j.daily.precipitation_sum[i + 1] ?? 0,
      chance: j.daily.precipitation_probability_max[i + 1] ?? 0,
    }));
    return { last24h: Math.round(last24h * 10) / 10, days };
  } catch {
    return null;
  }
}

/** The driver's one-liner about rain. */
export function rainLine(r: RainOutlook): string {
  const today = r.days[0];
  const next = r.days.slice(1).find((d) => d.mm >= 10);
  const d = (x: string) => new Date(x).toLocaleDateString("en-IN", { weekday: "long" });
  if (r.last24h >= 30) return `${Math.round(r.last24h)} mm of rain in the last 24 hours. Heavy. Check the streets before you step out.`;
  if (r.last24h >= 5) return `${Math.round(r.last24h)} mm of rain in the last 24 hours. Roads will be wet, drains working overtime.`;
  if (today && today.mm >= 10) return `Rain coming today, around ${Math.round(today.mm)} mm expected. Umbrella in the auto.`;
  if (next) return `Dry now. ${d(next.date)} looks wet, about ${Math.round(next.mm)} mm. Plan the house visit before that.`;
  return "Dry now and nothing heavy in the next three days.";
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
    advice: "Stay in between 12 and 3. Umbrella, a bottle of water, and buttermilk when you can get it.",
  },
  scorching: {
    line: "Vera level heat. The seat is hotter than the tea.",
    advice: "Don't step out in the afternoon. ORS, water, shade. Check on older people at home.",
  },
};
