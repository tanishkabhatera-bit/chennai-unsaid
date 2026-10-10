"use client";

import { useState } from "react";
import Wall, { type WallMode } from "./Wall";
import { driverScene } from "@/lib/driver";
import type { WallMark } from "@/lib/levels";
import type { CurrentWeather, HottestDay, RainOutlook } from "@/lib/weather";

export interface NowState {
  level: WallMark["level"];
  /** e.g. "2 resident marks this week" or "No flooding reported in the last 14 days." */
  note: string;
}

interface Props {
  mode: WallMode;
  title: string;
  /** One mark per flood year, newest first. */
  marks: WallMark[];
  now: NowState;
  /** undefined = loading, null = unavailable. */
  weather?: CurrentWeather | null;
  hottest?: HottestDay | null;
  /** No area picked yet: the driver waves hello. */
  empty?: boolean;
  /** Live rain for the "Now" chip. */
  rain?: RainOutlook | null;
}

/** The wall plus the chips that choose which year's water it shows. "Now" is the default. */
export default function YearWall({ mode, title, marks, now, weather, hottest, empty, rain }: Props) {
  const [selected, setSelected] = useState<string>("now");
  const [step, setStep] = useState(0);
  const mark = marks.find((m) => m.year === selected);
  const level = mark ? mark.level : now.level;
  const caption = mark
    ? `${mark.event ? `${mark.event}, ` : ""}${mark.year} · as reported in the news`
    : now.note;

  const scene = driverScene({ mode, level, selected, event: mark?.event, nowNote: now.note, weather, hottest, step, empty, noRecords: marks.length === 0, rain });

  function choose(year: string) {
    setSelected(year);
    setStep(0);
  }

  return (
    <div>
      <Wall
        mode={mode}
        level={level}
        scene={scene}
        onTap={() => setStep((s) => s + 1)}
        weather={weather}
        title={title}
        caption={caption}
        puddle={empty}
        raining={selected === "now" && !!rain && (rain.last24h >= 5 || (rain.days[0]?.mm ?? 0) >= 10)}
      />

      {mode === "water" && !empty && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-marker text-rust">Show me:</span>
            <Chip active={selected === "now"} onClick={() => choose("now")}>Now</Chip>
            {[...marks].reverse().map((m) => (
              <Chip key={m.year} active={selected === m.year} onClick={() => choose(m.year)}>{m.year}</Chip>
            ))}
            {marks.length === 0 && <span className="font-body text-sm text-ink/60">No flood years in the news yet.</span>}
          </div>
          {mark && (
            <p className="mt-2 font-body text-sm text-ink/80">
              Source:{" "}
              <a href={mark.source_url} target="_blank" rel="noopener noreferrer" className="font-medium text-sign underline-offset-2 hover:underline">
                {mark.source_title || mark.source_url} →
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border-[3px] border-ink px-3.5 py-1 font-display text-xs uppercase transition sm:text-sm ${
        active ? "bg-sign text-chalk" : "bg-chalk text-ink hover:bg-sun"
      }`}
    >
      {children}
    </button>
  );
}
