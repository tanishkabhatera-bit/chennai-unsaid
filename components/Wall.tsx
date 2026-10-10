"use client";

import { POSE_IMAGE, type Scene } from "@/lib/driver";
import { LEVEL_HEIGHT, LEVEL_LABEL, type WaterLevel } from "@/lib/levels";
import { heatMood, type CurrentWeather } from "@/lib/weather";

export type WallMode = "water" | "heat";

interface Props {
  mode: WallMode;
  /** Water level to show (one year, or "now"). */
  level: WaterLevel;
  /** What the driver is doing and saying. */
  scene: Scene;
  /** Tapping the driver or his bubble. */
  onTap?: () => void;
  /** Live reading for heat mode; null while loading or if unavailable. */
  weather?: CurrentWeather | null;
  /** Painted on the wall, e.g. the locality name. */
  title?: string;
  /** Right-hand caption under the wall. */
  caption?: string;
  /** It's raining in the area right now (water mode shows the monsoon sky). */
  raining?: boolean;
  /** No area picked yet: show a shallow layer of water so the wall reads as a flood wall. */
  puddle?: boolean;
}

/**
 * A compound wall with an auto parked in front and its driver standing beside it.
 * Water mode: the water sits at `level`. Heat mode: the sun comes out and the wall bakes.
 * The driver changes pose with the scene and talks in a speech bubble.
 */
export default function Wall({ mode, level, scene, onTap, weather, title, caption, raining, puddle }: Props) {
  const water = mode === "water" ? LEVEL_HEIGHT[level] || (puddle ? 0.14 : 0) : 0;
  const hot = mode === "heat" && !!weather && ["hot", "scorching"].includes(heatMood(weather.feelsLike));
  const tappable = !!onTap && !!scene.hint;

  return (
    <div className={`wall ${mode === "heat" ? "wall-heat" : ""} relative w-full overflow-hidden rounded-[28px] border-[6px] border-ink shadow-[8px_8px_0_#121212]`}>
      <div className="wall-face relative aspect-[4/5] w-full sm:aspect-[16/10]">
        {title && (
          <div className="absolute left-4 top-4 z-10 max-w-[50%] -rotate-2 bg-ink px-3 py-1 font-display text-base uppercase leading-tight text-chalk sm:text-xl">
            {title}
          </div>
        )}

        {/* Sun (heat mode): the painted sun, bigger and brighter when it's hot */}
        {mode === "heat" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/sun.png" alt="" className={`sunglow absolute left-[50%] top-[-10%] z-[2] w-[30%] sm:left-[48%] sm:top-[-14%] sm:w-[26%] ${hot ? "sunglow-hot" : "opacity-80"}`} />
        )}

        {/* Monsoon sky (water mode, when it's raining now): clouds along the top */}
        {mode === "water" && raining && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/monsoon-sky.png" alt="" className="sky absolute left-0 top-0 z-[2] w-full" />
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

        {/* Auto */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/auto.png" alt="" className="absolute bottom-[2%] left-[10%] z-[5] h-[52%] w-auto sm:left-[20%] sm:h-[70%]" />

        {/* Driver */}
        <button
          type="button"
          onClick={onTap}
          disabled={!tappable}
          aria-label={tappable ? "Tap the auto driver" : undefined}
          className={`absolute bottom-[2%] left-[62%] z-[6] h-[72%] sm:left-[70%] sm:h-[84%] ${tappable ? "cursor-pointer" : "cursor-default"} disabled:cursor-default`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={scene.pose} src={POSE_IMAGE[scene.pose]} alt="" className="pose h-full w-auto" />
        </button>

        {/* Speech bubble */}
        <div key={scene.bubble} className="bubble absolute left-[4%] top-[18%] z-[9] w-[56%] sm:left-[24%] sm:top-[16%] sm:w-[40%]">
          <button
            type="button"
            onClick={onTap}
            disabled={!tappable}
            className={`relative block w-full rounded-2xl border-[3px] border-ink bg-chalk px-3.5 py-3 text-left shadow-[5px_5px_0_#121212] ${tappable ? "cursor-pointer hover:bg-white" : "cursor-default"}`}
          >
            <p className="font-body text-[13px] leading-snug text-ink sm:text-[15px]">{scene.bubble}</p>
            {scene.hint && <p className="mt-1.5 font-marker text-xs text-rust sm:text-sm">{scene.hint} →</p>}
            {/* tail, pointing right at the driver */}
            <span className="absolute -right-[11px] top-[42%] h-5 w-5 rotate-45 border-r-[3px] border-t-[3px] border-ink bg-chalk" />
          </button>
        </div>

        {/* Water: the painted flood strip drifts along the waterline, muddy fill below it */}
        {mode === "water" && water > 0 && (
          <div className="water absolute inset-x-0 bottom-0 z-[7] overflow-hidden" style={{ height: `${water * 100}%` }} aria-label={LEVEL_LABEL[level]}>
            <div className="flood-strip absolute left-0 top-0 h-[120px] w-[400%] sm:h-[150px]" />
            <div className="absolute inset-x-0 bottom-0 top-[110px] bg-[#8d5a26] sm:top-[140px]" />
          </div>
        )}

      </div>

      {/* Caption strip */}
      <div className="flex items-center justify-between gap-3 border-t-[6px] border-ink bg-chalk px-4 py-3">
        {mode === "water" ? (
          <>
            <span className="font-display text-sm uppercase text-ink sm:text-base">{puddle ? "Pick an area" : LEVEL_LABEL[level]}</span>
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
