"use client";

import { useMemo, useState } from "react";
import { POSE_IMAGE, type Pose } from "@/lib/driver";
import { BUCKET_L, ESSENTIAL_LPCD, NORMAL_LPCD, SURVIVAL_LPCD, TANKER_L, planWater, type WaterPlan } from "@/lib/water";

const STATUS: Record<WaterPlan["status"], { pose: Pose; tone: string; title: string }> = {
  covered: { pose: "thumbs", tone: "bg-sign text-chalk", title: "You're covered" },
  tight: { pose: "drink", tone: "bg-sun text-ink", title: "It'll be tight" },
  short: { pose: "worried", tone: "bg-sun text-ink", title: "Short at normal use" },
  critical: { pose: "sad", tone: "bg-rust text-chalk", title: "Not enough, even on essentials" },
};

const PRESETS = [
  { label: "Small flat", sumpL: 1000, tankL: 500 },
  { label: "Typical flat", sumpL: 1500, tankL: 500 },
  { label: "Independent house", sumpL: 6000, tankL: 1000 },
];

function NumberField({ label, value, onChange, min = 0, step = 1, suffix, hint }: { label: string; value: number; onChange: (n: number) => void; min?: number; step?: number; suffix?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="font-display text-xs uppercase text-ink/70">{label}</span>
      <div className="mt-1 flex items-center rounded-xl border-[3px] border-ink bg-white">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2 font-body text-lg outline-none"
        />
        {suffix && <span className="pr-3 font-body text-sm text-ink/60">{suffix}</span>}
      </div>
      {hint && <span className="mt-0.5 block font-body text-xs text-ink/60">{hint}</span>}
    </label>
  );
}

export default function WaterCalc() {
  const [people, setPeople] = useState(4);
  const [lpcd, setLpcd] = useState(NORMAL_LPCD);
  const [sumpL, setSumpL] = useState(1500);
  const [tankL, setTankL] = useState(500);
  const [otherL, setOtherL] = useState(0);
  const [cutDays, setCutDays] = useState(4);
  const [tankerL, setTankerL] = useState(TANKER_L);

  const plan = useMemo(() => planWater({ people, lpcd, sumpL, tankL, otherL, cutDays, tankerL }), [people, lpcd, sumpL, tankL, otherL, cutDays, tankerL]);
  const s = STATUS[plan.status];
  const days = Math.max(cutDays, Math.ceil(plan.daysNormal), 1);
  const bars = Math.min(days, 14);

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
      <div className="space-y-4 rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="People at home" value={people} onChange={setPeople} min={1} />
          <NumberField label="Supply cut" value={cutDays} onChange={setCutDays} min={1} suffix="days" />
        </div>
        <NumberField
          label="Normal use per person"
          value={lpcd}
          onChange={setLpcd}
          min={1}
          suffix="L / day"
          hint={`Default ${NORMAL_LPCD} L: the CPHEEO norm for Indian cities. Change it if you know your building's use.`}
        />

        <div>
          <span className="font-display text-xs uppercase text-ink/70">Storage, quick fill</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => { setSumpL(p.sumpL); setTankL(p.tankL); }} className="rounded-full border-[3px] border-ink bg-white px-3 py-1 font-body text-sm hover:bg-sun">
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Sump (your share)" value={sumpL} onChange={setSumpL} step={500} suffix="L" />
          <NumberField label="Overhead tank" value={tankL} onChange={setTankL} step={250} suffix="L" />
        </div>
        <NumberField label="Drums, cans, buckets" value={otherL} onChange={setOtherL} step={15} suffix="L" hint={`One bucket ≈ ${BUCKET_L} L. 10 buckets = ${BUCKET_L * 10} L.`} />
        <NumberField label="Tanker size" value={tankerL} onChange={setTankerL} step={1000} suffix="L" />
        <p className="font-body text-xs text-ink/60">Nothing you type leaves your phone. This is arithmetic, not a forecast of when supply will fail.</p>
      </div>

      <div className="space-y-5">
        <div className="flex gap-4 rounded-[24px] border-[4px] border-ink bg-sun p-5 shadow-[6px_6px_0_#121212]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={s.pose} src={POSE_IMAGE[s.pose]} alt="" className="pose h-40 w-auto shrink-0 sm:h-52" />
          <div>
            <span className={`inline-block rounded-full border-[3px] border-ink px-3 py-1 font-display text-xs uppercase ${s.tone}`}>{s.title}</span>
            <p className="mt-3 font-display text-4xl text-ink">{plan.daysNormal} days</p>
            <p className="font-body text-ink/80">
              {plan.storedL.toLocaleString("en-IN")} L stored ÷ {plan.dailyL.toLocaleString("en-IN")} L a day ({people} × {lpcd} L).
            </p>
            <p className="mt-2 font-marker text-lg text-rust">
              {plan.runsOutDay === null
                ? `"Lasts the full ${cutDays} days, boss."`
                : `"At normal use, you run dry on day ${plan.runsOutDay} of ${cutDays}."`}
            </p>
          </div>
        </div>

        {/* Day-by-day bar */}
        <div className="rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
          <h3 className="font-display text-sm uppercase text-ink">Day by day, at normal use</h3>
          <div className="mt-3 flex gap-1.5" role="img" aria-label={`Water lasts ${plan.daysNormal} days against a ${cutDays}-day cut`}>
            {Array.from({ length: bars }, (_, d) => {
              const left = Math.max(0, Math.min(1, plan.daysNormal - d));
              const inCut = d < cutDays;
              return (
                <div key={d} className="flex-1">
                  <div className={`relative h-20 overflow-hidden rounded-lg border-2 ${inCut ? "border-ink" : "border-ink/30"} bg-white`}>
                    <div className="absolute inset-x-0 bottom-0 bg-water transition-all" style={{ height: `${left * 100}%` }} />
                  </div>
                  <p className={`mt-1 text-center font-body text-[11px] ${inCut ? "text-ink" : "text-ink/40"}`}>D{d + 1}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-2 font-body text-xs text-ink/60">Dark-bordered days are the cut. Blue is water left at the start of each day.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: `Normal (${lpcd} L/person)`, days: plan.daysNormal },
            { label: `Essentials (${ESSENTIAL_LPCD} L/person)`, days: plan.daysEssential },
            { label: `Bare minimum (${SURVIVAL_LPCD} L/person)`, days: plan.daysSurvival },
          ].map((x) => (
            <div key={x.label} className={`rounded-2xl border-[3px] border-ink p-3 ${x.days >= cutDays ? "bg-chalk" : "bg-rust/10"}`}>
              <p className="font-body text-xs text-ink/70">{x.label}</p>
              <p className="font-display text-2xl text-ink">{x.days} days</p>
              <p className="font-body text-xs text-ink/70">{x.days >= cutDays ? "covers the cut" : `${r(cutDays - x.days)} days short`}</p>
            </div>
          ))}
        </div>

        {plan.shortfallL > 0 && (
          <p className="rounded-2xl border-[3px] border-ink bg-chalk p-3 font-body text-ink">
            Short by <strong>{plan.shortfallL.toLocaleString("en-IN")} L</strong> at normal use
            {plan.shortfallEssentialL > 0
              ? <>, and <strong>{plan.shortfallEssentialL.toLocaleString("en-IN")} L</strong> even on essentials: about <strong>{plan.tankersNeeded} tanker{plan.tankersNeeded === 1 ? "" : "s"}</strong> of {tankerL.toLocaleString("en-IN")} L.</>
              : <>; on essentials only you get through.</>}
          </p>
        )}

        <div className="rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
          <h3 className="font-display text-sm uppercase text-ink">What to do</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 font-body text-ink">
            {plan.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="mt-4 font-body text-xs text-ink/60">
            Norms: {NORMAL_LPCD} L/person/day is the CPHEEO Manual on Water Supply norm for Indian metropolitan cities; {SURVIVAL_LPCD} L/person/day is the Sphere Handbook emergency minimum for drinking, cooking and basic hygiene; {ESSENTIAL_LPCD} L/person/day is our &ldquo;essentials only&rdquo; day (one bucket bath, bucket flushing, cooking, drinking, dishes). Your real use depends on your building.
          </p>
        </div>
      </div>
    </div>
  );
}

function r(n: number) {
  return Math.round(n * 10) / 10;
}
