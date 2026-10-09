"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import Wall from "./Wall";
import { searchLocalities } from "@/lib/localities";
import { FLOORS, PARKINGS, type Floor, type Parking, type Verdict } from "@/lib/verdict";
import type { Difference, Dimension, DimensionReport, Kind } from "@/lib/evidence";
import type { Locality } from "@/lib/types";
import type { Pose } from "@/lib/driver";

interface SideInput {
  area: Locality | null;
  query: string;
  floor: Floor;
  parking: Parking;
}
interface SideResult {
  locality: Locality;
  floor: Floor;
  parking: Parking;
  verdict: Verdict;
  flood: DimensionReport;
  heat: DimensionReport;
  water: DimensionReport;
}
interface Result {
  a: SideResult;
  b: SideResult;
  differences: Difference[];
  generated_at: string;
}

const POSE: Record<Verdict["level"], Pose> = { go: "thumbs", ask: "worried", think: "sad" };
const DIMS: { id: Dimension; name: string; emoji: string }[] = [
  { id: "flood", name: "Flooding and waterlogging", emoji: "🌊" },
  { id: "heat", name: "Heat exposure", emoji: "☀️" },
  { id: "water", name: "Water availability", emoji: "🚰" },
];
const KIND: Record<Kind, { label: string; cls: string }> = {
  historical: { label: "Past record", cls: "bg-sign text-chalk" },
  current: { label: "Live now", cls: "bg-rust text-chalk" },
  indicative: { label: "Estimate", cls: "bg-sun text-ink" },
  resident: { label: "Resident", cls: "bg-chalk text-ink" },
  missing: { label: "Not available", cls: "bg-ink/10 text-ink/70" },
};

function SideForm({ side, set, localities, label }: { side: SideInput; set: (s: SideInput) => void; localities: Locality[]; label: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => searchLocalities(localities, side.query).slice(0, 6), [localities, side.query]);
  const showList = open && matches.length > 0 && side.query !== side.area?.name;
  return (
    <div className="space-y-3 rounded-[24px] border-[4px] border-ink bg-chalk p-4 shadow-[6px_6px_0_#121212]">
      <h3 className="font-display text-sm uppercase text-rust">{label}</h3>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-label={`${label} area`}
          autoComplete="off"
          value={side.query}
          placeholder="Area, e.g. Velachery"
          onChange={(e) => { set({ ...side, query: e.target.value, area: null }); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body outline-none focus:ring-2 focus:ring-sign/40"
        />
        {showList && (
          <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border-[3px] border-ink bg-chalk shadow-[4px_4px_0_#121212]">
            {matches.map((l) => (
              <li key={l.slug} role="option" aria-selected={false} onMouseDown={(e) => { e.preventDefault(); set({ ...side, area: l, query: l.name }); setOpen(false); }} className="cursor-pointer px-3 py-2 font-body hover:bg-sun">{l.name}</li>
            ))}
          </ul>
        )}
      </div>
      <select aria-label={`${label} floor`} value={side.floor} onChange={(e) => set({ ...side, floor: e.target.value as Floor })} className="w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body">
        {FLOORS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>
      <select aria-label={`${label} parking`} value={side.parking} onChange={(e) => set({ ...side, parking: e.target.value as Parking })} className="w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body">
        {PARKINGS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </div>
  );
}

function IndicatorList({ report }: { report: DimensionReport }) {
  return (
    <ul className="space-y-3">
      {report.indicators.map((ind, i) => (
        <li key={i} className="font-body text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border-2 border-ink px-2 py-0.5 font-display text-[10px] uppercase ${KIND[ind.kind].cls}`}>{KIND[ind.kind].label}</span>
            <span className="font-medium text-ink">{ind.label}</span>
          </div>
          <p className="mt-0.5 text-ink">{ind.value}</p>
          <p className="text-xs text-ink/60">
            {ind.href ? (
              <a href={ind.href} target="_blank" rel="noopener noreferrer" className="text-sign underline-offset-2 hover:underline">{ind.source}</a>
            ) : (
              ind.source
            )}
            {ind.date !== "—" && ` · ${ind.date}`}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function CompareCheck({ localities }: { localities: Locality[] }) {
  const [a, setA] = useState<SideInput>({ area: null, query: "", floor: "ground", parking: "stilt" });
  const [b, setB] = useState<SideInput>({ area: null, query: "", floor: "low", parking: "stilt" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);

  async function compare(e: React.FormEvent) {
    e.preventDefault();
    if (!a.area || !b.area) return;
    setState("loading");
    const qs = new URLSearchParams({ a: a.area.slug, af: a.floor, ap: a.parking, b: b.area.slug, bf: b.floor, bp: b.parking });
    const res = await fetch(`/api/compare?${qs}`);
    if (!res.ok) { setState("error"); return; }
    setResult(await res.json());
    setState("done");
  }

  const sides = result ? ([result.a, result.b] as const) : null;
  const tally = result ? result.differences.reduce((t, d) => (d.better === null ? t : (t[d.better]++, t)), [0, 0]) : [0, 0];
  const overall = !result ? null : tally[0] === tally[1] ? null : tally[0] > tally[1] ? 0 : 1;
  const label = (i: number) => (i === 0 ? "A" : "B");
  const floorName = (f: Floor) => FLOORS.find((x) => x.id === f)?.label.toLowerCase();

  return (
    <form onSubmit={compare} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SideForm side={a} set={setA} localities={localities} label="Flat A" />
        <SideForm side={b} set={setB} localities={localities} label="Flat B" />
      </div>
      <button
        type="submit"
        disabled={!a.area || !b.area || state === "loading"}
        className="rounded-2xl border-[4px] border-ink bg-rust px-6 py-3 font-display text-base uppercase text-chalk shadow-[6px_6px_0_#121212] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#121212] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state === "loading" ? "Gathering the evidence…" : "Compare"}
      </button>
      {state === "error" && <p className="font-body text-sm text-rust">Something went wrong. Try again.</p>}

      {result && sides && (
        <div className="space-y-8">
          {/* Headline */}
          <p className="rounded-2xl border-[4px] border-ink bg-sun px-5 py-3 font-marker text-xl text-ink">
            {overall === null
              ? "Auto anna says: on the evidence we have, these two come out level. Decide on the rest, and ask the questions below in both places."
              : `Auto anna says: Flat ${label(overall)} (${sides[overall].locality.name}, ${floorName(sides[overall].floor)}) has less environmental concern on ${tally[overall]} of 3 dimensions. Rent, commute and the landlord are still your call.`}
          </p>

          {/* Walls */}
          <div className="grid gap-6 lg:grid-cols-2">
            {sides.map((s, i) => (
              <Wall
                key={i}
                mode="water"
                level={(["dry", "ankle", "knee", "waist", "chest"] as const)[s.flood.score ?? 0]}
                scene={{ pose: POSE[s.verdict.level], bubble: s.verdict.headline }}
                title={`${label(i)} · ${s.locality.name}`}
                caption={`Worst reported water · ${floorName(s.floor)}`}
              />
            ))}
          </div>

          {/* Climate Compare, by dimension */}
          <section className="space-y-6">
            <h2 className="font-display text-2xl uppercase text-ink sm:text-3xl">Climate Compare</h2>
            {DIMS.map((d) => {
              const diff = result.differences.find((x) => x.dimension === d.id)!;
              return (
                <div key={d.id} className="rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
                  <h3 className="font-display text-lg uppercase text-ink">{d.emoji} {d.name}</h3>
                  <p className={`mt-2 rounded-xl px-3 py-2 font-body text-sm ${diff.better === null ? "bg-ink/5 text-ink" : "bg-sign/10 text-ink"}`}>{diff.why}</p>
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    {sides.map((s, i) => (
                      <div key={i} className={`rounded-xl border-[3px] p-4 ${diff.better === i ? "border-sign" : "border-ink/20"}`}>
                        <p className="font-display text-xs uppercase text-rust">
                          Flat {label(i)} · {s.locality.name} {diff.better === i && <span className="ml-1 rounded-full bg-sign px-2 py-0.5 text-chalk">less concern</span>}
                        </p>
                        <p className="mt-1 font-body text-sm font-medium text-ink">{s[d.id].headline}</p>
                        <div className="mt-3"><IndicatorList report={s[d.id]} /></div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 font-body text-xs text-ink/60"><strong>Limit:</strong> {sides[0][d.id].limit}</p>
                </div>
              );
            })}
          </section>

          {/* Decision report */}
          <section className="rounded-[24px] border-[4px] border-ink bg-sun p-5 shadow-[6px_6px_0_#121212]">
            <h2 className="font-display text-2xl uppercase text-ink">Your decision report</h2>

            <h3 className="mt-4 font-display text-sm uppercase text-ink">What the evidence suggests</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-body text-ink">
              {result.differences.map((d) => <li key={d.dimension}>{d.why}</li>)}
            </ul>

            <h3 className="mt-5 font-display text-sm uppercase text-ink">What we don&apos;t know</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-body text-ink">
              {[...new Set(sides.flatMap((s) => DIMS.flatMap((d) => s[d.id].missing)))].map((m) => <li key={m}>{m}</li>)}
            </ul>

            <h3 className="mt-5 font-display text-sm uppercase text-ink">What to verify before you pay the advance</h3>
            <div className="mt-2 grid gap-4 md:grid-cols-2">
              {sides.map((s, i) => (
                <div key={i}>
                  <p className="font-display text-xs uppercase text-rust">Flat {label(i)} · {s.locality.name}, {floorName(s.floor)}</p>
                  <ol className="mt-1 list-decimal space-y-1 pl-5 font-body text-sm text-ink">
                    {DIMS.flatMap((d) => s[d.id].verify.slice(0, d.id === "flood" ? 3 : 2)).map((v) => <li key={v}>{v}</li>)}
                  </ol>
                </div>
              ))}
            </div>

            <h3 className="mt-5 font-display text-sm uppercase text-ink">Where this came from</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-body text-sm text-ink">
              <li>Flood records: Chennai news articles (DT Next, Deccan Herald, Citizen Matters), 2015–2026, read by Amazon Bedrock and checked twice against the article.</li>
              <li>Rainfall and heat history: Open-Meteo historical weather (ERA5 reanalysis, ~10 km grid), the same indicator and period for both flats. Live readings: Open-Meteo forecast API.</li>
              <li>Heat rating: our estimate from coast distance, tree cover and density, labelled as an estimate.</li>
              <li>The comparison itself is a fixed rule, not an AI opinion. AI (Amazon Bedrock) is used only upstream, to read the news articles.</li>
              <li>Water availability: resident reports on this site. No official supply or groundwater data is connected yet.</li>
              <li>Report generated {new Date(result.generated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.</li>
            </ul>

            <p className="mt-5 rounded-xl border-[3px] border-ink bg-chalk p-3 font-body text-sm text-ink">
              <strong>Read this before deciding:</strong> a neighbourhood&apos;s flood history is not the risk of one plot, and outdoor weather is not your flat&apos;s indoor temperature. No record does not mean no risk. This is not a promotion or a rating agency, just what brokers, listings and landlords don&apos;t tell you.
            </p>
          </section>

          <div className="flex flex-wrap gap-4">
            {sides.map((s, i) => (
              <Link key={i} href={`/area/${s.locality.slug}`} className="font-marker text-lg text-rust hover:underline">Full wall for {s.locality.name} →</Link>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
