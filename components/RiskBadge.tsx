import { RISK_STYLES } from "@/lib/labels";
import { RISK_RULE } from "@/lib/risk";
import type { FloodRisk } from "@/lib/types";

export default function RiskBadge({ risk }: { risk: FloodRisk }) {
  const label = risk.level === "Unknown" ? "No flood records yet" : `${risk.level} flood risk`;

  return (
    <div>
      <span
        title={RISK_RULE}
        className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${RISK_STYLES[risk.level]}`}
      >
        {label}
      </span>
      {/* A tap-friendly version of the tooltip, since phones can't hover. */}
      <details className="mt-2 text-sm text-slate-600">
        <summary className="cursor-pointer select-none text-teal-800">How is this worked out?</summary>
        <p className="mt-1">
          {risk.level === "Unknown"
            ? "We haven't found news records for this area yet."
            : `Flooded in ${risk.years} of the last 10 years${risk.longStay ? ", and water stayed 5 or more days at least once" : ""}.`}
        </p>
        <p className="mt-1">{RISK_RULE}</p>
      </details>
    </div>
  );
}
