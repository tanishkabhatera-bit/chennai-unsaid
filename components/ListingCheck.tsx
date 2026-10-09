"use client";

import { useState } from "react";
import Link from "next/link";
import Wall from "./Wall";
import type { ClaimCheck, ListingRead } from "@/lib/listing";
import { FLOORS, PARKINGS, type Floor, type Parking, type Verdict } from "@/lib/verdict";
import type { Pose } from "@/lib/driver";

interface Result {
  read: ListingRead;
  floor: Floor;
  parking: Parking;
  use: "rent" | "buy";
  verdict: Verdict;
  claims: ClaimCheck[];
  assumed: { floor: boolean; parking: boolean };
  error?: string;
}

const POSE: Record<Verdict["level"], Pose> = { go: "thumbs", ask: "point", think: "point" };
const TONE: Record<Verdict["level"], string> = { go: "bg-sign text-chalk", ask: "bg-sun text-ink", think: "bg-rust text-chalk" };
const STATUS: Record<ClaimCheck["status"], { label: string; cls: string }> = {
  matches: { label: "Matches the record", cls: "bg-sign text-chalk" },
  contradicts: { label: "Doesn't match the record", cls: "bg-rust text-chalk" },
  unverified: { label: "Can't confirm", cls: "bg-chalk text-ink" },
};

const SAMPLE = `2BHK for rent in Velachery, ground floor, stilt parking, 24hrs water. No flooding problem in this street, very safe area. Rent 18000. Call broker.`;

export default function ListingCheck() {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");
    const res = await fetch("/api/listing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || (j.error && !j.verdict)) {
      setState("error");
      setError(j.error ?? "Something went wrong. Try again.");
      return;
    }
    setResult(j);
    setState("done");
  }

  const v = result?.verdict;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
      <form onSubmit={check} className="space-y-4 rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
        <label className="block">
          <span className="font-display text-xs uppercase text-ink/70">Paste the listing, or the broker&apos;s message</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            maxLength={4000}
            placeholder={SAMPLE}
            className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2.5 font-body outline-none focus:ring-2 focus:ring-sign/40"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={text.trim().length < 20 || state === "loading"}
            className="rounded-2xl border-[4px] border-ink bg-rust px-5 py-3 font-display text-base uppercase text-chalk shadow-[6px_6px_0_#121212] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#121212] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === "loading" ? "Reading it…" : "Check what they said"}
          </button>
          <button type="button" onClick={() => setText(SAMPLE)} className="rounded-2xl border-[3px] border-ink bg-chalk px-4 py-3 font-marker text-rust">
            Try a sample
          </button>
        </div>
        {state === "error" && <p className="font-body text-sm text-rust">{error}</p>}
        <p className="font-body text-xs text-ink/60">We read the area, floor and parking from the text, then check every claim against ten years of flood news and the heat rating. Nothing you paste is stored.</p>
      </form>

      <div>
        {!result || !v ? (
          <div className="rounded-[24px] border-[4px] border-dashed border-ink/40 p-8 text-center font-body text-ink/60">
            Paste a NoBroker or MagicBricks ad, or the WhatsApp forward from the broker. The auto anna reads it and checks what they said.
          </div>
        ) : (
          <div className="space-y-5">
            <Wall
              mode="water"
              level={v.facts.worst}
              scene={{ pose: POSE[v.level], bubble: v.headline }}
              title={result.read.locality?.name}
              caption={v.facts.years ? `Worst in the last 10 years · ${v.facts.yearList.join(", ")}` : "No flood on record in the news"}
            />

            <div className="rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
              <p className="font-body text-sm text-ink/70">
                Read from the text: <strong>{result.read.locality?.name}</strong> · {FLOORS.find((f) => f.id === result.floor)?.label}
                {result.assumed.floor && " (not stated, assumed)"} · {PARKINGS.find((p) => p.id === result.parking)?.label}
                {result.assumed.parking && " (not stated, assumed)"} · {result.use === "buy" ? "buying" : "renting"}
              </p>
              <span className={`mt-3 inline-block rounded-full border-[3px] border-ink px-4 py-1 font-display text-sm uppercase ${TONE[v.level]}`}>{v.headline}</span>
            </div>

            <div className="rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
              <h3 className="font-display text-lg uppercase text-ink">What they said, and what the record says</h3>
              {result.claims.length === 0 ? (
                <p className="mt-2 font-body text-ink/80">The text makes no claims about water or heat. Smart broker. The verdict above still applies.</p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {result.claims.map((c) => (
                    <li key={c.claim} className="border-l-[4px] border-ink pl-3">
                      <p className="font-marker text-lg text-ink">&ldquo;{c.claim}&rdquo;</p>
                      <span className={`mt-1 inline-block rounded-full border-2 border-ink px-2.5 py-0.5 font-display text-[11px] uppercase ${STATUS[c.status].cls}`}>{STATUS[c.status].label}</span>
                      <p className="mt-1 font-body text-sm text-ink">{c.finding}</p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 font-body text-xs text-ink/60">We never call anyone a liar. We show what the news reported, with the articles behind it, and let you ask.</p>
            </div>

            <div className="rounded-[24px] border-[4px] border-ink bg-sun p-5 shadow-[6px_6px_0_#121212]">
              <h3 className="font-display text-lg uppercase text-ink">The concerns</h3>
              <ul className="mt-3 space-y-2">
                {v.concerns.map((c) => (
                  <li key={c.topic} className="flex gap-3">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-ink ${c.weight >= 3 ? "bg-rust" : c.weight === 2 ? "bg-chalk" : c.weight === 1 ? "bg-chalk" : "bg-sign"}`} />
                    <p className="font-body text-ink">{c.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            {result.read.locality && (
              <Link href={`/area/${result.read.locality.slug}`} className="inline-block font-marker text-lg text-rust hover:underline">
                See the full wall for {result.read.locality.name} →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
