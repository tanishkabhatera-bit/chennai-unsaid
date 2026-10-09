"use client";

import { LEVEL_HEIGHT, LEVEL_LABEL, type WallMark, type WaterLevel } from "@/lib/levels";

interface Props {
  level: WaterLevel;
  marks: WallMark[];
  /** Shown painted on the wall, e.g. the locality name. */
  title?: string;
  /** Clicking a mark opens its source in a new tab. */
  interactive?: boolean;
}

/**
 * A compound wall with a person standing against it. Water rises to `level`
 * and each flood year is painted as a mark at the height the news reported.
 */
export default function Wall({ level, marks, title, interactive = true }: Props) {
  const water = LEVEL_HEIGHT[level];

  return (
    <div className="wall relative w-full overflow-hidden rounded-[28px] border-[6px] border-ink shadow-[8px_8px_0_#121212]">
      {/* Wall face */}
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
        {title && (
          <div className="absolute left-4 top-4 z-10 max-w-[70%] -rotate-2 bg-ink px-3 py-1 font-display text-lg uppercase leading-tight text-chalk sm:text-2xl">
            {title}
          </div>
        )}

        {/* Height guides */}
        {(["ankle", "knee", "waist", "chest"] as const).map((l) => (
          <div
            key={l}
            className="absolute right-0 left-0 border-t border-dashed border-ink/25"
            style={{ bottom: `${LEVEL_HEIGHT[l] * 100}%` }}
          >
            <span className="absolute right-3 -top-3 font-marker text-xs text-ink/50 sm:text-sm">{l}</span>
          </div>
        ))}

        {/* Painted marks, one per flood year */}
        {marks.map((m, i) => {
          const Tag = interactive ? "a" : "div";
          return (
            <Tag
              key={m.year}
              {...(interactive ? { href: m.source_url, target: "_blank", rel: "noopener noreferrer" } : {})}
              title={m.source_title}
              className="mark group absolute z-[7] flex items-center gap-2"
              style={{
                bottom: `${LEVEL_HEIGHT[m.level] * 100}%`,
                left: `${8 + ((i * 17) % 55)}%`,
                transform: `rotate(${((i % 3) - 1) * 2}deg)`,
                animationDelay: `${0.9 + i * 0.12}s`,
              }}
            >
              <span className="h-[3px] w-8 bg-rust sm:w-14" />
              <span className="rounded-md bg-chalk/90 px-1.5 py-0.5 font-marker text-lg leading-none text-rust shadow-[2px_2px_0_#121212] group-hover:underline sm:text-2xl">
                {m.year}
              </span>
            </Tag>
          );
        })}

        {/* Person */}
        <svg
          viewBox="0 0 100 300"
          className="absolute bottom-0 left-[62%] z-[5] h-full w-auto sm:left-[68%]"
          aria-hidden="true"
        >
          <g fill="none" stroke="#121212" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="50" cy="42" r="26" fill="#FAF3E0" />
            <path d="M50 70 V190" />
            <path d="M50 100 L18 150 M50 100 L82 150" />
            <path d="M50 190 L28 292 M50 190 L72 292" />
          </g>
        </svg>

        {/* Water */}
        <div
          className="water absolute inset-x-0 bottom-0 z-[6]"
          style={{ height: `${water * 100}%` }}
          aria-label={LEVEL_LABEL[level]}
        >
          <svg className="wave absolute -top-5 left-0 h-6 w-[200%]" viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 12 Q75 0 150 12 T300 12 T450 12 T600 12 T750 12 T900 12 T1050 12 T1200 12 V24 H0 Z" fill="#2E78B7" />
          </svg>
          <svg className="wave wave-2 absolute -top-3 left-0 h-5 w-[200%]" viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 12 Q75 24 150 12 T300 12 T450 12 T600 12 T750 12 T900 12 T1050 12 T1200 12 V24 H0 Z" fill="#4A93CF" opacity="0.8" />
          </svg>
          <div className="h-full w-full bg-water/70" />
        </div>
      </div>

      {/* Caption strip */}
      <div className="flex items-center justify-between gap-3 border-t-[6px] border-ink bg-chalk px-4 py-3">
        <span className="font-display text-sm uppercase text-ink sm:text-base">{LEVEL_LABEL[level]}</span>
        <span className="font-body text-xs text-ink/70 sm:text-sm">
          {marks.length === 0 ? "No news record" : `${marks.length} flood ${marks.length === 1 ? "year" : "years"} in the news`}
        </span>
      </div>
    </div>
  );
}
