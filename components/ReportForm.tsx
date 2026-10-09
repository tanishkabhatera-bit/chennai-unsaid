"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { REPORT_CATEGORIES } from "@/lib/labels";
import type { ReportCategory } from "@/lib/types";

const LEVELS = [
  { id: "ankle", label: "Ankle" },
  { id: "knee", label: "Knee" },
  { id: "waist", label: "Waist" },
  { id: "chest", label: "Inside the house" },
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportForm({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const now = new Date();
  const [category, setCategory] = useState<ReportCategory>("flooding");
  const [level, setLevel] = useState<(typeof LEVELS)[number]["id"] | null>(null);
  const [text, setText] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const years = Array.from({ length: 12 }, (_, i) => now.getFullYear() - i);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locality: slug, category, text, when: `${year}-${String(month).padStart(2, "0")}`, level }),
    });
    if (res.ok) {
      setState("done");
      router.refresh();
    } else {
      setState("error");
      setError((await res.json().catch(() => ({}))).error ?? "Something went wrong");
    }
  }

  function close() {
    dialog.current?.close();
    if (state === "done") {
      setState("idle");
      setText("");
      setLevel(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="rounded-2xl border-[4px] border-ink bg-sign px-5 py-3 font-display text-sm uppercase text-chalk shadow-[6px_6px_0_#121212] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#121212]"
      >
        Add your mark
      </button>

      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-auto w-[min(92vw,30rem)] rounded-[24px] border-[4px] border-ink bg-chalk p-0 text-ink shadow-[8px_8px_0_#121212] backdrop:bg-ink/60"
      >
        <form onSubmit={submit} className="p-5">
          <h2 className="font-display text-xl uppercase">Add your mark</h2>
          <p className="mt-1 font-body text-sm text-ink/70">
            For <strong>{name}</strong>. No name, no login. Just what happened.
          </p>

          {state === "done" ? (
            <div className="mt-5">
              <p className="font-marker text-2xl text-rust">Thanks, added.</p>
              <p className="mt-1 font-body text-ink/80">Your mark is on the wall now.</p>
              <button type="button" onClick={close} className="mt-4 rounded-xl border-[3px] border-ink bg-sun px-4 py-2 font-display text-sm uppercase">
                Close
              </button>
            </div>
          ) : (
            <>
              <fieldset className="mt-4">
                <legend className="font-display text-xs uppercase text-ink/70">What is it about?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REPORT_CATEGORIES.map((c) => (
                    <label key={c.id} className={`cursor-pointer rounded-full border-[3px] border-ink px-3 py-1 font-body text-sm ${category === c.id ? "bg-ink text-chalk" : "bg-chalk"}`}>
                      <input type="radio" name="category" value={c.id} checked={category === c.id} onChange={() => setCategory(c.id)} className="sr-only" />
                      {c.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {category === "flooding" && (
                <fieldset className="mt-4">
                  <legend className="font-display text-xs uppercase text-ink/70">How high did the water come?</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {LEVELS.map((l) => (
                      <label key={l.id} className={`cursor-pointer rounded-xl border-[3px] border-ink px-2 py-2 text-center font-display text-xs uppercase ${level === l.id ? "bg-water text-chalk" : "bg-chalk"}`}>
                        <input type="radio" name="level" value={l.id} checked={level === l.id} onChange={() => setLevel(l.id)} className="sr-only" />
                        {l.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <label className="mt-4 block">
                <span className="font-display text-xs uppercase text-ink/70">What happened?</span>
                <textarea
                  required
                  minLength={5}
                  maxLength={280}
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Water came up to the second step for three days."
                  className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body outline-none focus:ring-2 focus:ring-sign/40"
                />
                <span className="font-body text-xs text-ink/50">{text.length}/280</span>
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-display text-xs uppercase text-ink/70">Month</span>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body">
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-display text-xs uppercase text-ink/70">Year</span>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body">
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </label>
              </div>

              {state === "error" && <p className="mt-3 font-body text-sm text-rust">{error}</p>}

              <div className="mt-5 flex gap-3">
                <button type="submit" disabled={state === "sending"} className="rounded-xl border-[3px] border-ink bg-rust px-5 py-2 font-display text-sm uppercase text-chalk disabled:opacity-60">
                  {state === "sending" ? "Adding…" : "Add it"}
                </button>
                <button type="button" onClick={close} className="rounded-xl border-[3px] border-ink bg-chalk px-5 py-2 font-display text-sm uppercase">
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
