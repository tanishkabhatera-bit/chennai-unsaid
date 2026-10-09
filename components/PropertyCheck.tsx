"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import Wall from "./Wall";
import { searchLocalities } from "@/lib/localities";
import { FLOORS, PARKINGS, type Floor, type Parking, type Use, type Verdict } from "@/lib/verdict";
import type { Locality } from "@/lib/types";
import type { Pose } from "@/lib/driver";

interface Result {
  locality: Locality;
  verdict: Verdict;
  questions: string[];
}

const POSE: Record<Verdict["level"], Pose> = { go: "thumbs", ask: "worried", think: "sad" };
const TONE: Record<Verdict["level"], string> = { go: "bg-sign text-chalk", ask: "bg-sun text-ink", think: "bg-rust text-chalk" };
const TOPIC: Record<string, string> = { water: "Water", heat: "Heat", vehicle: "Your vehicle", residents: "Residents say" };

export default function PropertyCheck({ localities }: { localities: Locality[] }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState<Locality | null>(null);
  const [floor, setFloor] = useState<Floor>("ground");
  const [parking, setParking] = useState<Parking>("stilt");
  const [use, setUse] = useState<Use>("rent");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);

  const matches = useMemo(() => searchLocalities(localities, query).slice(0, 6), [localities, query]);
  const showList = open && matches.length > 0 && query !== area?.name;

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!area) return;
    setState("loading");
    const res = await fetch(`/api/check?area=${area.slug}&floor=${floor}&parking=${parking}&use=${use}`);
    if (!res.ok) {
      setState("error");
      return;
    }
    setResult(await res.json());
    setState("done");
  }

  const v = result?.verdict;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
      <form onSubmit={check} className="space-y-5 rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
        <div className="relative">
          <label htmlFor={id} className="font-display text-xs uppercase text-ink/70">Which area?</label>
          <input
            id={id}
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            autoComplete="off"
            value={query}
            placeholder="Velachery, Anna Nagar, Adyar…"
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setArea(null); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2.5 font-body text-lg outline-none focus:ring-2 focus:ring-sign/40"
          />
          {showList && (
            <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border-[3px] border-ink bg-chalk shadow-[4px_4px_0_#121212]">
              {matches.map((l) => (
                <li key={l.slug} role="option" aria-selected={false} onMouseDown={(e) => { e.preventDefault(); setArea(l); setQuery(l.name); setOpen(false); }} className="cursor-pointer px-3 py-2 font-body hover:bg-sun">
                  {l.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <fieldset>
          <legend className="font-display text-xs uppercase text-ink/70">Which floor?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {FLOORS.map((f) => (
              <label key={f.id} className={`cursor-pointer rounded-xl border-[3px] border-ink px-3 py-2 text-center font-body text-sm ${floor === f.id ? "bg-ink text-chalk" : "bg-white"}`}>
                <input type="radio" name="floor" className="sr-only" checked={floor === f.id} onChange={() => setFloor(f.id)} />
                {f.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-xs uppercase text-ink/70">Parking?</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PARKINGS.map((p) => (
              <label key={p.id} className={`cursor-pointer rounded-xl border-[3px] border-ink px-2 py-2 text-center font-body text-sm ${parking === p.id ? "bg-ink text-chalk" : "bg-white"}`}>
                <input type="radio" name="parking" className="sr-only" checked={parking === p.id} onChange={() => setParking(p.id)} />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-xs uppercase text-ink/70">Renting or buying?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["rent", "buy"] as const).map((u) => (
              <label key={u} className={`cursor-pointer rounded-xl border-[3px] border-ink px-3 py-2 text-center font-body text-sm ${use === u ? "bg-ink text-chalk" : "bg-white"}`}>
                <input type="radio" name="use" className="sr-only" checked={use === u} onChange={() => setUse(u)} />
                {u === "rent" ? "Renting" : "Buying"}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={!area || state === "loading"}
          className="w-full rounded-2xl border-[4px] border-ink bg-rust px-5 py-3 font-display text-base uppercase text-chalk shadow-[6px_6px_0_#121212] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#121212] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "loading" ? "Asking the auto anna…" : "Check it"}
        </button>
        {state === "error" && <p className="font-body text-sm text-rust">Something went wrong. Try again.</p>}
        <p className="font-body text-xs text-ink/60">Not a promotion. Not a rating agency. Just what brokers, listings and landlords don&apos;t tell you.</p>
      </form>

      <div>
        {!result || !v ? (
          <div className="rounded-[24px] border-[4px] border-dashed border-ink/40 p-8 text-center font-body text-ink/60">
            Pick an area, your floor and parking. The auto anna checks ten years of flood news, the heat, and what residents say, against your exact case.
          </div>
        ) : (
          <div className="space-y-5">
            <Wall
              mode="water"
              level={v.facts.worst}
              scene={{ pose: POSE[v.level], bubble: v.headline }}
              title={result.locality.name}
              caption={v.facts.years ? `Worst in the last 10 years · ${v.facts.yearList.join(", ")}` : "No flood on record in the news"}
            />

            <div className="rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
              <span className={`inline-block rounded-full border-[3px] border-ink px-4 py-1 font-display text-sm uppercase ${TONE[v.level]}`}>{v.headline}</span>
              <ul className="mt-4 space-y-3">
                {v.concerns.map((c) => (
                  <li key={c.topic} className="flex gap-3">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-ink ${c.weight >= 3 ? "bg-rust" : c.weight === 2 ? "bg-sun" : c.weight === 1 ? "bg-chalk" : "bg-sign"}`} />
                    <p className="font-body text-ink"><strong className="font-display text-xs uppercase">{TOPIC[c.topic]}.</strong> {c.text}</p>
                  </li>
                ))}
              </ul>
              <details className="mt-4 font-body text-sm text-ink/70">
                <summary className="cursor-pointer font-marker text-rust">How is the verdict decided?</summary>
                <p className="mt-1">{v.rule}</p>
              </details>
            </div>

            <div className="rounded-[24px] border-[4px] border-ink bg-sun p-5 shadow-[6px_6px_0_#121212]">
              <h3 className="font-display text-lg uppercase text-ink">Ask the {use === "buy" ? "seller" : "landlord"} before you commit</h3>
              <ol className="mt-3 list-decimal space-y-2 pl-5 font-body text-ink">
                {result.questions.map((q) => <li key={q}>{q}</li>)}
              </ol>
              <p className="mt-3 font-body text-xs text-ink/60">Questions written by Amazon Nova Lite from the facts above. Take a screenshot and carry it to the visit.</p>
            </div>

            <Link href={`/area/${result.locality.slug}`} className="inline-block font-marker text-lg text-rust hover:underline">
              See the full wall for {result.locality.name} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
