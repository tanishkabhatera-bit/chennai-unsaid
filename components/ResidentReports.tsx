import { REPORT_CATEGORIES, categoryLabel, monthYear } from "@/lib/labels";
import type { Report, ReportCategory } from "@/lib/types";

export default function ResidentReports({
  counts,
  latest,
}: {
  counts: Record<ReportCategory, number>;
  latest: Report[];
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">What residents report</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {REPORT_CATEGORIES.map(({ id, label }) => (
          <li key={id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-2xl font-semibold text-slate-900">{counts[id]}</div>
            <div className="text-sm leading-snug text-slate-600">{label}</div>
          </li>
        ))}
      </ul>

      {latest.length === 0 ? (
        <p className="mt-4 text-slate-600">No resident reports yet. Be the first.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {latest.map((r) => (
            <li key={r.created_at} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">
                {categoryLabel(r.category)} · {monthYear(r.when)}
              </div>
              <p className="mt-1 text-slate-800">&ldquo;{r.text}&rdquo;</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
