"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { WallMode } from "./Wall";
import YearWall from "./YearWall";
import { searchLocalities } from "@/lib/localities";
import { HEAT_LINES, heatMood, type CurrentWeather, type HeatMood, type HottestDay, type RainOutlook } from "@/lib/weather";
import type { WallSummary } from "@/lib/wall-data";
import type { HeatRating, Locality } from "@/lib/types";

const EXAMPLES = ["velachery", "t-nagar", "adyar", "perambur"];

/** What a feels-like reading means for an ordinary day. */
const FEELS_MEANING: Record<HeatMood, string> = {
  chill: "Comfortable. Fine to be out most of the day.",
  warm: "Warm. Manageable, but you'll sweat on a walk or a two-wheeler.",
  hot: "Hot. Outdoor work and walking at midday are tiring; fans alone struggle in a top-floor flat.",
  scorching: "Dangerous heat. Risk of heat exhaustion outdoors at midday, especially for older people and children.",
};

function Tag({ kind }: { kind: "live" | "past" | "estimate" }) {
  const s = { live: ["Live", "bg-rust text-chalk"], past: ["Past year", "bg-sign text-chalk"], estimate: ["Estimate", "bg-sun text-ink"] }[kind];
  return <span className={`mr-1 inline-block rounded-full border-2 border-ink px-1.5 py-px font-display text-[9px] uppercase ${s[1]}`}>{s[0]}</span>;
}

/** undefined = still loading, null = unavailable. */
interface WeatherResponse {
  current: CurrentWeather | null | undefined;
  hottest: HottestDay | null | undefined;
  rain?: RainOutlook | null;
}

export default function HomeHero({
  localities,
  walls,
  heat,
}: {
  localities: Locality[];
  walls: Record<string, WallSummary>;
  heat: Record<string, HeatRating>;
}) {
  const id = useId();
  const listId = `${id}-list`;
  // /?mode=heat opens straight in heat mode (the menu's Heat entry links here).
  const params = useSearchParams();
  const urlMode: WallMode = params.get("mode") === "heat" ? "heat" : "water";
  const [mode, setMode] = useState<WallMode>(urlMode);
  const [lastUrlMode, setLastUrlMode] = useState<WallMode>(urlMode);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<Locality | null>(null);
  const [weather, setWeather] = useState<Record<string, WeatherResponse>>({});

  // Picking Water or Heat from the menu while already on the home page: start that mode fresh.
  if (urlMode !== lastUrlMode) {
    setLastUrlMode(urlMode);
    setMode(urlMode);
    setPicked(null);
    setQuery("");
  }

  const matches = useMemo(() => searchLocalities(localities, query).slice(0, 7), [localities, query]);
  const showList = open && matches.length > 0 && query !== picked?.name;
  const wall = picked
    ? (walls[picked.slug] ?? { years: 0, marks: [], now: { level: "dry" as const, note: "No flooding in the news for this area." } })
    : null;
  const wx = picked ? weather[picked.slug] : undefined;
  const rating = picked ? heat[picked.slug] : undefined;

  // Fetch live weather once per area. The live reading is quick; the hottest-day
  // lookup hits the archive and arrives a few seconds later, so fetch them separately.
  function loadWeather(slug: string) {
    if (weather[slug]) return;
    setWeather((w) => ({ ...w, [slug]: { current: undefined, hottest: undefined } }));
    fetch(`/api/weather/${slug}?part=current`)
      .then((r) => r.json())
      .then((current: CurrentWeather | null) => setWeather((w) => ({ ...w, [slug]: { ...w[slug], current } })))
      .catch(() => setWeather((w) => ({ ...w, [slug]: { ...w[slug], current: null } })));
    fetch(`/api/weather/${slug}?part=hottest`)
      .then((r) => r.json())
      .then((hottest: HottestDay | null) => setWeather((w) => ({ ...w, [slug]: { ...w[slug], hottest } })))
      .catch(() => setWeather((w) => ({ ...w, [slug]: { ...w[slug], hottest: null } })));
  }

  function loadRain(slug: string) {
    if (weather[slug]?.rain !== undefined) return;
    setWeather((w) => ({ ...w, [slug]: { current: w[slug]?.current, hottest: w[slug]?.hottest, rain: undefined } }));
    fetch(`/api/weather/${slug}?part=rain`)
      .then((r) => r.json())
      .then((rain: RainOutlook | null) => setWeather((w) => ({ ...w, [slug]: { ...w[slug], rain } })))
      .catch(() => setWeather((w) => ({ ...w, [slug]: { ...w[slug], rain: null } })));
  }

  function pick(l: Locality) {
    setPicked(l);
    setQuery(l.name);
    setOpen(false);
    if (mode === "heat") loadWeather(l.slug);
    else loadRain(l.slug);
  }

  function switchMode(m: WallMode) {
    setMode(m);
    if (!picked) return;
    if (m === "heat") loadWeather(picked.slug);
    else loadRain(picked.slug);
  }

  const mood = wx?.current ? heatMood(wx.current.feelsLike) : null;

  return (
    <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div>
        <p className="font-display text-xs uppercase tracking-[0.2em] text-rust sm:text-sm">
          Chennai Unsaid / {mode === "water" ? "Water" : "Heat"}
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-[0.95] text-ink sm:text-5xl">
          {mode === "water" ? (
            <>A place can look perfect.<br /><span className="text-sign">Until it rains.</span></>
          ) : (
            <>The rent is affordable.<br /><span className="text-rust">But can you live in that heat?</span></>
          )}
        </h1>
        <p className="mt-4 max-w-md font-body text-xl font-semibold text-ink sm:text-2xl">
          {mode === "water"
            ? "Check any Chennai area's flood history before you rent or buy."
            : "Check how hot any Chennai area gets before you rent or buy."}
        </p>
        <p className="mt-2 max-w-md font-body text-lg text-ink/80">
          {mode === "water"
            ? "How high the water came, which years, and the news report behind each one, for 200+ areas. Plus what to ask the landlord."
            : "Live temperature, the hottest day of the past year, and what it means for everyday life, for 200+ areas."}
        </p>

        {/* WATER / HEAT switch */}
        <div role="tablist" aria-label="Water or heat" className="mt-6 inline-flex rounded-2xl border-[4px] border-ink bg-chalk p-1 shadow-[6px_6px_0_#121212]">
          {(["water", "heat"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`rounded-xl px-5 py-2 font-display text-sm uppercase transition sm:text-base ${
                mode === m ? (m === "water" ? "bg-sign text-chalk" : "bg-rust text-chalk") : "text-ink hover:bg-sun"
              }`}
            >
              {m === "water" ? "💧 Water" : "☀️ Heat"}
            </button>
          ))}
        </div>

        <form
          role="search"
          className="relative mt-5 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const m = matches[active] ?? matches[0];
            if (m) pick(m);
          }}
        >
          <label htmlFor={id} className="sr-only">Chennai locality</label>
          <div className="flex rounded-2xl border-[4px] border-ink bg-chalk shadow-[6px_6px_0_#121212]">
            <input
              id={id}
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
              value={query}
              placeholder="Velachery, Anna Nagar, Adyar…"
              onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, matches.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
                if (e.key === "Escape") setOpen(false);
              }}
              className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-body text-lg text-ink outline-none placeholder:text-ink/40"
            />
            <button type="submit" className="bg-sign px-5 font-display text-sm uppercase text-chalk hover:bg-sign/90">Show</button>
          </div>
          {showList && (
            <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border-[4px] border-ink bg-chalk shadow-[6px_6px_0_#121212]">
              {matches.map((l, i) => (
                <li
                  key={l.slug}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => { e.preventDefault(); pick(l); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between px-4 py-3 font-body ${i === active ? "bg-sign text-chalk" : "text-ink"}`}
                >
                  <span>{l.name}</span>
                  <span className="font-marker text-sm opacity-70">
                    {mode === "water" ? (walls[l.slug] ? `${walls[l.slug].years} flood yrs` : "no record") : (heat[l.slug]?.rating ?? "")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((slug) => {
            const l = localities.find((x) => x.slug === slug)!;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => pick(l)}
                className={`rounded-full border-[3px] border-ink px-4 py-1.5 font-display text-xs uppercase transition ${picked?.slug === slug ? "bg-ink text-chalk" : "bg-chalk text-ink hover:bg-sun"}`}
              >
                {l.name}
              </button>
            );
          })}
        </div>

        {picked && mode === "heat" && (
          <div className="mt-6 max-w-md rounded-[20px] border-[4px] border-ink bg-chalk p-4 shadow-[6px_6px_0_#121212]">
            {wx === undefined || wx.current === undefined ? (
              <p className="font-body text-ink/70">Reading the thermometer in {picked.name}…</p>
            ) : !wx.current ? (
              <p className="font-body text-ink/70">Couldn&apos;t reach the weather service. Try again in a minute.</p>
            ) : (
              <>
                <p className="font-marker text-xl text-rust">&ldquo;{HEAT_LINES[mood!].line}&rdquo;</p>
                <p className="mt-1 font-body text-sm text-ink/70">— the auto anna</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 font-body text-sm">
                  <div>
                    <dt className="text-ink/60"><Tag kind="live" /> Feels like now</dt>
                    <dd className="font-display text-2xl text-ink">{Math.round(wx.current.feelsLike)}°C</dd>
                  </div>
                  <div>
                    <dt className="text-ink/60"><Tag kind="live" /> Air temperature</dt>
                    <dd className="font-display text-2xl text-ink">{Math.round(wx.current.temperature)}°C</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-ink/60">What it means</dt>
                    <dd className="text-ink">{FEELS_MEANING[mood!]} &ldquo;Feels like&rdquo; adds humidity ({wx.current.humidity}% now) to the air temperature: it&apos;s what your body deals with.</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-ink/60"><Tag kind="past" /> Hottest day in the last year</dt>
                    <dd className="text-ink">
                      {wx.hottest === undefined ? (
                        <span className="text-ink/60">Checking the last 365 days…</span>
                      ) : wx.hottest === null ? (
                        <span className="text-ink/60">Not available right now.</span>
                      ) : (
                        <>
                          Felt like <strong>{Math.round(wx.hottest.feelsLike)}°C</strong> on{" "}
                          {new Date(wx.hottest.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </>
                      )}
                    </dd>
                  </div>
                  {rating && (
                    <div className="col-span-2">
                      <dt className="text-ink/60"><Tag kind="estimate" /> This area, compared to the city</dt>
                      <dd className="text-ink"><strong>{rating.rating}.</strong> {rating.reason}. <span className="text-ink/60">Indicative.</span></dd>
                    </div>
                  )}
                </dl>
                <p className="mt-4 rounded-xl bg-sun p-3 font-body text-ink">
                  <strong>Auto anna says:</strong> {HEAT_LINES[mood!].advice}
                </p>
                <p className="mt-2 font-body text-xs text-ink/60">
                  Live: Open-Meteo forecast for {picked.name}, read at {wx.current.time.slice(11, 16)}, refreshed every 15 minutes. Past year: Open-Meteo historical archive. Estimate: our rating from coast distance, tree cover and density. Outdoor weather, not the temperature inside a flat.
                </p>
              </>
            )}
          </div>
        )}

        {picked && (
          <Link
            href={`/area/${picked.slug}`}
            className="mt-6 inline-block rounded-2xl border-[4px] border-ink bg-rust px-6 py-3 font-display text-base uppercase text-chalk shadow-[6px_6px_0_#121212] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#121212]"
          >
            Open {picked.name}&apos;s wall →
          </Link>
        )}
      </div>

      <div key={`${mode}-${picked?.slug ?? "empty"}`} className="lg:sticky lg:top-6">
        <YearWall
          mode={mode}
          title={picked ? picked.name : "Pick an area"}
          marks={wall?.marks ?? []}
          now={wall?.now ?? { level: "dry", note: "Pick an area to see its wall." }}
          weather={wx?.current}
          hottest={wx?.hottest}
          rain={wx?.rain}
          empty={!picked}
        />
      </div>
    </section>
  );
}
