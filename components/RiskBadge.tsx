import { RISK_RULE } from "@/lib/risk";
import type { FloodRisk, RiskLevel } from "@/lib/types";

const STYLES: Record<RiskLevel, string> = {
  High: "bg-rust text-chalk",
  Moderate: "bg-sun text-ink",
  Low: "bg-sign text-chalk",
  Unknown: "bg-chalk text-ink",
};

export default function RiskBadge({ risk }: { risk: FloodRisk }) {
  const label = risk.level === "Unknown" ? "No flood records yet" : `${risk.level} flood risk`;

  return (
    <details className="group relative">
      <summary
        title={RISK_RULE}
        className={`inline-block cursor-pointer list-none rounded-full border-[3px] border-ink px-4 py-1.5 font-display text-xs uppercase shadow-[3px_3px_0_#121212] sm:text-sm ${STYLES[risk.level]}`}
      >
        {label} <span className="font-marker normal-case">· how?</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border-[3px] border-ink bg-chalk p-3 font-body text-sm text-ink shadow-[4px_4px_0_#121212]">
        <p>
          {risk.level === "Unknown"
            ? "We haven't found news records for this area yet."
            : `Flooded in ${risk.years} of the last 10 years${risk.longStay ? ", and water stayed 5 or more days at least once" : ""}.`}
        </p>
        <p className="mt-1 text-ink/70">{RISK_RULE}</p>
      </div>
    </details>
  );
}
