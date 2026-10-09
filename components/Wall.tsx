"use client";

import { Auto, Driver, type Mood } from "./AutoDriver";
import { LEVEL_HEIGHT, LEVEL_LABEL, type WallMark, type WaterLevel } from "@/lib/levels";
import { heatMood, type CurrentWeather } from "@/lib/weather";

export type WallMode = "water" | "heat";

interface Props {
  mode: WallMode;
  level: WaterLevel;
  marks: WallMark[];
  /** Live reading for heat mode; null while loading or if unavailable. */
  weather?: CurrentWeather | null;
  /** Painted on the wall, e.g. the locality name. */
  title?: string;
  /** Clicking a mark opens its source in a new tab. */
  interactive?: boolean;
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

/**
 * A compound wall with an auto parked in front and its driver standing beside it.
 * Water mode: water rises to `level` and each flood year is painted as a mark.
 * Heat mode: the sun comes out, the wall bakes and the driver sweats when it's hot.
 */
export default function Wall({ mode, level, marks, weather, title, interactive = true }: Props) {
  const water = mode === "water" ? LEVEL_HEIGHT[level] : 0;
  const mood = driverMood(mode, level, weather);
  const hot = mode === "heat" && weather && (heatMood(weather.feelsLike) === "hot" || heatMood(weather.feelsLike) === "scorching");

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

        {/* Height guides (water mode) */}
        {mode === "water" &&
          (["ankle", "knee", "waist", "chest"] as const).map((l) => (
            <div key={l} className="absolute right-0 left-0 border-t border-dashed border-ink/25" style={{ bottom: `${LEVEL_HEIGHT[l] * 100}%` }}>
              <span className="absolute right-3 -top-3 font-marker text-xs text-ink/50 sm:text-sm">{l}</span>
            </div>
          ))}

        {/* Painted marks, one per flood year (water mode) */}
        {mode === "water" &&
          marks.map((m, i) => {
            const Tag = interactive ? "a" : "div";
            return (
              <Tag
                key={m.year}
                {...(interactive ? { href: m.source_url, target: "_blank", rel: "noopener noreferrer" } : {})}
                title={m.source_title}
                className="mark group absolute z-[7] flex items-center gap-2"
                style={{
                  bottom: `${LEVEL_HEIGHT[m.level] * 100}%`,
                  left: `${4 + ((i * 13) % 40)}%`,
                  transform: `rotate(${((i % 3) - 1) * 2}deg)`,
                  animationDelay: `${0.9 + i * 0.12}s`,
                }}
              >
                <span className="h-[3px] w-6 bg-rust sm:w-10" />
                <span className="rounded-md bg-chalk/90 px-1.5 py-0.5 font-marker text-base leading-none text-rust shadow-[2px_2px_0_#121212] group-hover:underline sm:text-xl">
                  {m.year}
                </span>
              </Tag>
            );
          })}

        {/* Auto and driver */}
        <Auto className="absolute bottom-0 left-[38%] z-[5] h-[62%] w-auto sm:left-[44%]" />
        <Driver mood={mood} className="absolute bottom-0 left-[72%] z-[5] h-[80%] w-auto sm:left-[76%]" />

        {/* Water */}
        {mode === "water" && (
          <div className="water absolute inset-x-0 bottom-0 z-[6]" style={{ height: `${water * 100}%` }} aria-label={LEVEL_LABEL[level]}>
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
        {hot && <div className="shimmer pointer-events-none absolute inset-0 z-[6]" />}
      </div>

      {/* Caption strip */}
      <div className="flex items-center justify-between gap-3 border-t-[6px] border-ink bg-chalk px-4 py-3">
        {mode === "water" ? (
          <>
            <span className="font-display text-sm uppercase text-ink sm:text-base">{LEVEL_LABEL[level]}</span>
            <span className="font-body text-xs text-ink/70 sm:text-sm">
              {marks.length === 0 ? "No news record" : `${marks.length} flood ${marks.length === 1 ? "year" : "years"} in the news`}
            </span>
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
