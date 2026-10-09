"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import YearWall from "./YearWall";
import type { WallMode } from "./Wall";
import { searchLocalities } from "@/lib/localities";
import { HEAT_LINES, heatMood, rainLine, type CurrentWeather, type HottestDay, type RainOutlook } from "@/lib/weather";
import type { WallSummary } from "@/lib/wall-data";
import type { HeatRating, Locality } from "@/lib/types";

interface Live {
  current?: CurrentWeather | null;
  hottest?: HottestDay | null;
  rain?: RainOutlook | null;
}

const EXAMPLES = ["velachery", "perambur", "t-nagar", "adyar", "tambaram", "anna-nagar"];

export default function LivePanel({
  localities,
  walls,
  heat,
}: {
  localities: Locality[];
  walls: Record<string, WallSummary>;
  heat: Record<string, HeatRating>;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Locality | null>(null);
  const [mode, setMode] = useState<WallMode>("water");
  const [live, setLive] = useState<Record<string, Live>>({});

  const matches = useMemo(() => searchLocalities(localities, query).slice(0, 7), [localities, query]);
  const showList = open && matches.length > 0 && query !== picked?.name;
  const wall = picked ? (walls[picked.slug] ?? { years: 0, marks: [], now: { level: "dry" as const, note: "No flooding in the news for this area." } }) : null;
  const lv = picked ? live[picked.slug] : undefined;

  // Once rain and heat are both known, open the view that matters today:
  // rain now or today → water; otherwise hot → heat.
  function autoMode(slug: string, s: Record<string, Live>) {
    const l = s[slug];
    if (!l || l.rain === undefined || l.current === undefined) return;
    const wet = !!l.rain && (l.rain.last24h >= 5 || (l.rain.days[0]?.mm ?? 0) >= 10);
    const hot = !!l.current && ["hot", "scorching"].includes(heatMood(l.current.feelsLike));
    setMode(wet ? "water" : hot ? "heat" : "water");
  }

  function load(slug: string) {
    if (live[slug]) { autoMode(slug, live); return; }
    setLive((s) => ({ ...s, [slug]: {} }));
    for (const part of ["current", "hottest", "rain"] as const) {
      fetch(`/api/weather/${slug}?part=${part}`)
        .then((r) => r.json())
        .then((v) => setLive((s) => { const next = { ...s, [slug]: { ...s[slug], [part]: v } }; autoMode(slug, next); return next; }))
        .catch(() => setLive((s) => { const next = { ...s, [slug]: { ...s[slug], [part]: null } }; autoMode(slug, next); return next; }));
    }
  }

  function pick(l: Locality) {
    setPicked(l);
    setQuery(l.name);
    setOpen(false);
    load(l.slug);
  }

  const mood = lv?.current ? heatMood(lv.current.feelsLike) : null;
  const d = (x: string) => new Date(x).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <label htmlFor={id} className="sr-only">Chennai locality</label>
        <div className="flex rounded-2xl border-[4px] border-ink bg-chalk shadow-[6px_6px_0_#121212]">
          <input
            id={id}
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            autoComplete="off"
            value={query}
            placeholder="Which area are you in?"
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (matches[0]) pick(matches[0]); } }}
            className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-body text-lg text-ink outline-none placeholder:text-ink/40"
          />
          <button type="button" onClick={() => matches[0] && pick(matches[0])} className="bg-sign px-5 font-display text-sm uppercase text-chalk">Go</button>
        </div>
        {showList && (
          <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border-[4px] border-ink bg-chalk shadow-[6px_6px_0_#121212]">
            {matches.map((l) => (
              <li key={l.slug} role="option" aria-selected={false} onMouseDown={(e) => { e.preventDefault(); pick(l); }} className="cursor-pointer px-4 py-3 font-body hover:bg-sun">{l.name}</li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((slug) => {
            const l = localities.find((x) => x.slug === slug);
            return l ? (
              <button key={slug} type="button" onClick={() => pick(l)} className={`rounded-full border-[3px] border-ink px-3 py-1 font-display text-xs uppercase ${picked?.slug === slug ? "bg-ink text-chalk" : "bg-chalk hover:bg-sun"}`}>{l.name}</button>
            ) : null;
          })}
        </div>
      </div>

      {picked && (
        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
              <h2 className="font-display text-sm uppercase text-sign">Rain in {picked.name}</h2>
              {lv?.rain === undefined ? (
                <p className="mt-2 font-body text-ink/70">Checking the sky…</p>
              ) : lv.rain === null ? (
                <p className="mt-2 font-body text-ink/70">Weather service not reachable right now.</p>
              ) : (
                <>
                  <p className="mt-2 font-marker text-xl text-rust">&ldquo;{rainLine(lv.rain)}&rdquo;</p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 font-body text-sm">
                    <div>
                      <dt className="text-ink/60">Last 24 hours</dt>
                      <dd className="font-display text-2xl text-ink">{Math.round(lv.rain.last24h)} mm</dd>
                    </div>
                    <div>
                      <dt className="text-ink/60">Today</dt>
                      <dd className="font-display text-2xl text-ink">{Math.round(lv.rain.days[0]?.mm ?? 0)} mm <span className="font-body text-xs text-ink/60">({lv.rain.days[0]?.chance ?? 0}% chance)</span></dd>
                    </div>
                  </dl>
                  <ul className="mt-3 space-y-1 font-body text-sm text-ink">
                    {lv.rain.days.slice(1).map((day) => (
                      <li key={day.date} className="flex justify-between border-t border-ink/10 pt-1">
                        <span>{d(day.date)}</span>
                        <span><strong>{Math.round(day.mm)} mm</strong> · {day.chance}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="rounded-[24px] border-[4px] border-ink bg-sun p-5 shadow-[6px_6px_0_#121212]">
              <h2 className="font-display text-sm uppercase text-rust">Heat in {picked.name}</h2>
              {lv?.current === undefined ? (
                <p className="mt-2 font-body text-ink/70">Reading the thermometer…</p>
              ) : lv.current === null ? (
                <p className="mt-2 font-body text-ink/70">Weather service not reachable right now.</p>
              ) : (
                <>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="font-display text-4xl text-ink">{Math.round(lv.current.feelsLike)}°</span>
                    <span className="font-body text-sm text-ink/80">feels like · {Math.round(lv.current.temperature)}° air · {lv.current.humidity}% humidity</span>
                  </div>
                  {mood && <p className="mt-2 font-marker text-lg text-rust">&ldquo;{HEAT_LINES[mood].line}&rdquo;</p>}
                  <p className="mt-2 font-body text-sm text-ink">
                    <strong>Hottest day this past year:</strong>{" "}
                    {lv.hottest === undefined ? "checking…" : lv.hottest === null ? "not available" : `felt like ${Math.round(lv.hottest.feelsLike)}° on ${d(lv.hottest.date)}`}
                  </p>
                  {heat[picked.slug] && <p className="mt-1 font-body text-sm text-ink/80">{heat[picked.slug].rating} than most of the city: {heat[picked.slug].reason}. <span className="text-ink/60">Indicative.</span></p>}
                </>
              )}
            </div>

            <p className="font-body text-xs text-ink/60">Live from Open-Meteo, refreshed every 15 minutes. Flood marks come from news and residents.</p>
            <Link href={`/area/${picked.slug}`} className="inline-block font-marker text-lg text-rust hover:underline">Full wall for {picked.name} →</Link>
          </div>

          <div>
            <div role="tablist" aria-label="Water or heat" className="mb-3 inline-flex rounded-2xl border-[4px] border-ink bg-chalk p-1 shadow-[6px_6px_0_#121212]">
              {(["water", "heat"] as const).map((m) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-xl px-4 py-1.5 font-display text-xs uppercase sm:text-sm ${mode === m ? (m === "water" ? "bg-sign text-chalk" : "bg-rust text-chalk") : "text-ink hover:bg-sun"}`}>
                  {m === "water" ? "💧 Water" : "☀️ Heat"}
                </button>
              ))}
            </div>
            <div key={`${mode}-${picked.slug}`}>
              <YearWall mode={mode} title={picked.name} marks={wall!.marks} now={wall!.now} weather={lv?.current} hottest={lv?.hottest} rain={lv?.rain} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
