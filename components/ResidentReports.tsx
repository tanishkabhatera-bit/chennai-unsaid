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
    <section className="rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
      <h2 className="font-display text-2xl uppercase text-ink">What residents say</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {REPORT_CATEGORIES.map(({ id, label }) => (
          <li key={id} className="rounded-full border-[3px] border-ink bg-sun px-3 py-1 font-body text-sm text-ink">
            <span className="font-display">{counts[id]}</span> {label}
          </li>
        ))}
      </ul>

      {latest.length === 0 ? (
        <p className="mt-4 font-body text-ink/80">No resident reports yet. Be the first.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {latest.map((r) => (
            <li key={r.created_at} className="border-l-[4px] border-rust pl-3">
              <div className="font-body text-xs text-ink/60">
                {categoryLabel(r.category)} · {monthYear(r.when)}
                {r.level && ` · water ${r.level === "chest" ? "inside the house" : `${r.level} deep`}`}
                {r.seeded && " · added by the team"}
              </div>
              <p className="mt-0.5 font-marker text-lg leading-snug text-ink">&ldquo;{r.text}&rdquo;</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
