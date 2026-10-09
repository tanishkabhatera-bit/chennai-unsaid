import { SEVERITY_STYLES, monthYear } from "@/lib/labels";
import type { FloodRecord } from "@/lib/types";

export default function FloodTimeline({ records }: { records: FloodRecord[] }) {
  return (
    <section>
      <h2 className="font-display text-2xl uppercase text-ink">What the news reported</h2>
      {records.length === 0 ? (
        <p className="mt-2 font-body text-ink/80">
          No flood report found for this area in the articles we&apos;ve read. That is good news, but not proof. Ask neighbours.
        </p>
      ) : (
        <ol className="mt-4 space-y-5 border-l-[4px] border-ink pl-5">
          {records.map((r) => (
            <li key={`${r.date}-${r.source_url}`} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-[3px] border-ink bg-rust" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm uppercase text-ink">{monthYear(r.date)}</span>
                {r.event && <span className="font-marker text-rust">{r.event}</span>}
                <span className={`rounded-full px-2 py-0.5 font-body text-xs font-medium capitalize ${SEVERITY_STYLES[r.severity]}`}>
                  {r.severity}
                </span>
                {r.water_stayed_days !== null && (
                  <span className="font-body text-xs text-ink/70">
                    water stayed {r.water_stayed_days} {r.water_stayed_days === 1 ? "day" : "days"}
                  </span>
                )}
              </div>
              <p className="mt-1 font-body text-ink">{r.detail}</p>
              <a
                href={r.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-body text-sm font-medium text-sign underline-offset-2 hover:underline"
              >
                {r.source_title || "Source"} →
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
