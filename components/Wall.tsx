"use client";

import { LEVEL_HEIGHT, LEVEL_LABEL, type WaterLevel } from "@/lib/levels";
import { heatMood, type CurrentWeather } from "@/lib/weather";

export type WallMode = "water" | "heat";
export type Mood = "happy" | "worried" | "sad" | "sweating";

interface Props {
  mode: WallMode;
  /** Water level to show (one year, or "now"). */
  level: WaterLevel;
  /** Live reading for heat mode; null while loading or if unavailable. */
  weather?: CurrentWeather | null;
  /** Painted on the wall, e.g. the locality name. */
  title?: string;
  /** Right-hand caption under the wall. */
  caption?: string;
}

function driverMood(mode: WallMode, level: WaterLevel, weather?: CurrentWeather | null): Mood {
  if (mode === "heat") {
    if (!weather) return "happy";
    const m = heatMood(weather.feelsLike);
    return m === "hot" || m === "scorching" ? "sweating" : "happy";
  }
  const byLevel: Record<WaterLevel, Mood> = { dry: "happy", ankle: "happy", knee: "worried", waist: "sad", chest: "sad" };
  return byLevel[level];
}

/** Tears or sweat over the driver's face. The image is 275x764; his face is around x 40–60%, y 9–16%. */
function MoodOverlay({ mood }: { mood: Mood }) {
  if (mood === "happy" || mood === "worried") return null;
  const drops =
    mood === "sad"
      ? [[122, 118], [154, 118]]
      : [[104, 96], [172, 100], [138, 70]];
  return (
    <svg viewBox="0 0 275 764" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <g fill="#2e78b7">
        {drops.map(([x, y], i) => (
          <path key={i} className="sweat" style={{ animationDelay: `${i * 0.45}s` }} d={`M${x} ${y} q7 12 0 20 q-7 -8 0 -20z`} />
        ))}
      </g>
    </svg>
  );
}

/**
 * A compound wall with an auto parked in front and its driver standing beside it.
 * Water mode: the water sits at `level`. Heat mode: the sun comes out, the wall bakes
 * and the driver sweats when it's hot.
 */
export default function Wall({ mode, level, weather, title, caption }: Props) {
  const water = mode === "water" ? LEVEL_HEIGHT[level] : 0;
  const mood = driverMood(mode, level, weather);
  const hot = mode === "heat" && !!weather && ["hot", "scorching"].includes(heatMood(weather.feelsLike));

  return (
    <div className={`wall ${mode === "heat" ? "wall-heat" : ""} relative w-full overflow-hidden rounded-[28px] border-[6px] border-ink shadow-[8px_8px_0_#121212]`}>
      <div className="wall-face relative aspect-[4/5] w-full sm:aspect-[16/10]">
        {title && (
          <div className="absolute left-4 top-4 z-10 max-w-[60%] -rotate-2 bg-ink px-3 py-1 font-display text-lg uppercase leading-tight text-chalk sm:text-2xl">
            {title}
          </div>
        )}

        {/* Sun */}
        {mode === "heat" && (
          <svg viewBox="0 0 100 100" className={`sun absolute right-4 top-3 z-[4] h-20 w-20 sm:h-28 sm:w-28 ${hot ? "sun-angry" : ""}`} aria-hidden="true">
            <g stroke="#121212" strokeWidth="3">
              {Array.from({ length: 12 }, (_, i) => (
                <line key={i} x1="50" y1="4" x2="50" y2="16" transform={`rotate(${i * 30} 50 50)`} stroke="#b5451b" strokeWidth="4" />
              ))}
              <circle cx="50" cy="50" r="24" fill="#f2c94c" />
            </g>
            {hot && (
              <g fill="#121212">
                <path d="M36 44 l10 4" stroke="#121212" strokeWidth="3" />
                <path d="M64 44 l-10 4" stroke="#121212" strokeWidth="3" />
                <circle cx="42" cy="50" r="2.5" />
                <circle cx="58" cy="50" r="2.5" />
                <path d="M42 62 q8 -5 16 0" stroke="#121212" strokeWidth="3" fill="none" />
              </g>
            )}
          </svg>
        )}

        {/* Height scale on the left (water mode) */}
        {mode === "water" && (
          <div className="absolute bottom-0 left-0 top-0 z-[3] w-14 border-r-2 border-dashed border-ink/20 sm:w-20">
            {(["ankle", "knee", "waist", "chest"] as const).map((l) => (
              <div key={l} className="absolute left-0 right-0 flex items-center" style={{ bottom: `${LEVEL_HEIGHT[l] * 100}%` }}>
                <span className="h-[2px] w-3 bg-ink/40" />
                <span className={`ml-1 font-marker text-[11px] uppercase sm:text-sm ${level === l ? "text-rust" : "text-ink/50"}`}>{l}</span>
              </div>
            ))}
          </div>
        )}

        {/* Auto and driver (illustration cut out by scripts/cut-figures.ts) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/auto.png" alt="" className="absolute bottom-[2%] left-[12%] z-[5] h-[58%] w-auto sm:left-[22%] sm:h-[74%]" />
        <div className="absolute bottom-[2%] left-[64%] z-[6] h-[76%] sm:left-[72%] sm:h-[86%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mood === "sweating" ? "/driver-sweating.png" : "/driver.png"} alt="" className="h-full w-auto" />
          {mood !== "sweating" && <MoodOverlay mood={mood} />}
        </div>

        {/* Water */}
        {mode === "water" && (
          <div className="water absolute inset-x-0 bottom-0 z-[7]" style={{ height: `${water * 100}%` }} aria-label={LEVEL_LABEL[level]}>
            <svg className="wave absolute -top-5 left-0 h-6 w-[200%]" viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 12 Q75 0 150 12 T300 12 T450 12 T600 12 T750 12 T900 12 T1050 12 T1200 12 V24 H0 Z" fill="#2E78B7" />
            </svg>
            <svg className="wave wave-2 absolute -top-3 left-0 h-5 w-[200%]" viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 12 Q75 24 150 12 T300 12 T450 12 T600 12 T750 12 T900 12 T1050 12 T1200 12 V24 H0 Z" fill="#4A93CF" opacity="0.8" />
            </svg>
            <div className="h-full w-full bg-water/70" />
          </div>
        )}

        {/* Heat shimmer */}
        {hot && <div className="shimmer pointer-events-none absolute inset-0 z-[8]" />}
      </div>

      {/* Caption strip */}
      <div className="flex items-center justify-between gap-3 border-t-[6px] border-ink bg-chalk px-4 py-3">
        {mode === "water" ? (
          <>
            <span className="font-display text-sm uppercase text-ink sm:text-base">{LEVEL_LABEL[level]}</span>
            {caption && <span className="text-right font-body text-xs text-ink/70 sm:text-sm">{caption}</span>}
          </>
        ) : (
          <>
            <span className="font-display text-sm uppercase text-ink sm:text-base">
              {weather ? `Feels like ${Math.round(weather.feelsLike)}° right now` : "Reading the thermometer…"}
            </span>
            <span className="font-body text-xs text-ink/70 sm:text-sm">
              {weather ? `${Math.round(weather.temperature)}° air · ${weather.humidity}% humidity` : ""}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
