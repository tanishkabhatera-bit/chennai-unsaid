"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import Wall from "./Wall";
import { searchLocalities } from "@/lib/localities";
import { FLOORS, PARKINGS, type Floor, type Parking, type Verdict } from "@/lib/verdict";
import type { Locality } from "@/lib/types";
import type { Pose } from "@/lib/driver";

interface Side {
  area: Locality | null;
  query: string;
  floor: Floor;
  parking: Parking;
}
interface Result {
  locality: Locality;
  verdict: Verdict;
  questions: string[];
}

const POSE: Record<Verdict["level"], Pose> = { go: "thumbs", ask: "worried", think: "sad" };
const TONE: Record<Verdict["level"], string> = { go: "bg-sign text-chalk", ask: "bg-sun text-ink", think: "bg-rust text-chalk" };
const RANK: Record<Verdict["level"], number> = { go: 0, ask: 1, think: 2 };
const TOPIC: Record<string, string> = { water: "Water", heat: "Heat", vehicle: "Vehicle", residents: "Residents" };

function SideForm({ side, set, localities, label }: { side: Side; set: (s: Side) => void; localities: Locality[]; label: string }) {
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
          autoComplete="off"
          value={side.query}
          placeholder="Area"
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
      <select value={side.floor} onChange={(e) => set({ ...side, floor: e.target.value as Floor })} className="w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body">
        {FLOORS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>
      <select value={side.parking} onChange={(e) => set({ ...side, parking: e.target.value as Parking })} className="w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body">
        {PARKINGS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </div>
  );
}

export default function CompareCheck({ localities }: { localities: Locality[] }) {
  const [a, setA] = useState<Side>({ area: null, query: "", floor: "ground", parking: "stilt" });
  const [b, setB] = useState<Side>({ area: null, query: "", floor: "low", parking: "stilt" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<[Result, Result] | null>(null);

  async function compare(e: React.FormEvent) {
    e.preventDefault();
    if (!a.area || !b.area) return;
    setState("loading");
    const q = (s: Side) => fetch(`/api/check?area=${s.area!.slug}&floor=${s.floor}&parking=${s.parking}&use=rent`).then((r) => (r.ok ? r.json() : Promise.reject()));
    try {
      setResults((await Promise.all([q(a), q(b)])) as [Result, Result]);
      setState("done");
    } catch {
      setState("error");
    }
  }

  const sides = results ? [{ s: a, r: results[0] }, { s: b, r: results[1] }] : null;
  const better = results ? (RANK[results[0].verdict.level] === RANK[results[1].verdict.level] ? null : RANK[results[0].verdict.level] < RANK[results[1].verdict.level] ? 0 : 1) : null;

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
        {state === "loading" ? "Comparing…" : "Compare"}
      </button>
      {state === "error" && <p className="font-body text-sm text-rust">Something went wrong. Try again.</p>}

      {sides && (
        <div className="space-y-6">
          {better !== null ? (
            <p className="rounded-2xl border-[4px] border-ink bg-sun px-5 py-3 font-marker text-xl text-ink">
              Auto anna says: on water and heat alone, <strong>Flat {better === 0 ? "A" : "B"}</strong> ({sides[better].r.locality.name}, {FLOORS.find((f) => f.id === sides[better].s.floor)?.label.toLowerCase()}) comes out ahead. Rent, commute and the landlord are still your call.
            </p>
          ) : (
            <p className="rounded-2xl border-[4px] border-ink bg-sun px-5 py-3 font-marker text-xl text-ink">
              Auto anna says: on water and heat these two come out level. Decide on the rest, and ask the questions below in both places.
            </p>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            {sides.map(({ s, r }, i) => (
              <div key={i} className={`space-y-4 ${better === i ? "" : "lg:opacity-95"}`}>
                <Wall
                  mode="water"
                  level={r.verdict.facts.worst}
                  scene={{ pose: POSE[r.verdict.level], bubble: r.verdict.headline }}
                  title={`${i === 0 ? "A" : "B"} · ${r.locality.name}`}
                  caption={r.verdict.facts.years ? `${r.verdict.facts.years} flood years · ${FLOORS.find((f) => f.id === s.floor)?.label}` : "No flood on record"}
                />
                <div className="rounded-[24px] border-[4px] border-ink bg-chalk p-4 shadow-[6px_6px_0_#121212]">
                  <span className={`inline-block rounded-full border-[3px] border-ink px-3 py-1 font-display text-xs uppercase ${TONE[r.verdict.level]}`}>{r.verdict.headline}</span>
                  <ul className="mt-3 space-y-2">
                    {r.verdict.concerns.map((c) => (
                      <li key={c.topic} className="flex gap-2 font-body text-sm text-ink">
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink ${c.weight >= 3 ? "bg-rust" : c.weight === 2 ? "bg-sun" : c.weight === 1 ? "bg-chalk" : "bg-sign"}`} />
                        <span><strong className="font-display text-[11px] uppercase">{TOPIC[c.topic]}.</strong> {c.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/area/${r.locality.slug}`} className="mt-3 inline-block font-marker text-rust hover:underline">Full wall →</Link>
                </div>
              </div>
            ))}
          </div>
          <p className="font-body text-xs text-ink/60">Same rule on both sides: worst reported water level against the floor, parking against knee-deep water, heat rating against a top floor. Not a promotion, not a rating agency.</p>
        </div>
      )}
    </form>
  );
}
