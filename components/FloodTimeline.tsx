import { SEVERITY_STYLES, monthYear } from "@/lib/labels";
import type { FloodRecord } from "@/lib/types";

export default function FloodTimeline({ records }: { records: FloodRecord[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">Flood history</h2>
      {records.length === 0 ? (
        <p className="mt-2 text-slate-600">No flood records found for this area yet.</p>
      ) : (
        <ol className="mt-4 space-y-6 border-l-2 border-slate-200 pl-5">
          {records.map((r) => (
            <li key={`${r.date}-${r.source_url}`} className="relative">
              <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-700" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">{monthYear(r.date)}</span>
                {r.event && <span className="text-slate-700">{r.event}</span>}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SEVERITY_STYLES[r.severity]}`}>
                  {r.severity}
                </span>
              </div>
              {r.water_stayed_days !== null && (
                <p className="mt-1 text-sm font-medium text-slate-700">
                  Water stayed {r.water_stayed_days} {r.water_stayed_days === 1 ? "day" : "days"}
                </p>
              )}
              <p className="mt-1 text-slate-700">{r.detail}</p>
              <a
                href={r.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
              >
                Source →
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
