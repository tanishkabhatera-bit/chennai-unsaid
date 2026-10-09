import { getSummary } from "@/lib/summary";
import type { FloodRecord, HeatRating, Locality, Report } from "@/lib/types";

/** Server component: generates (or reads the cached) AI summary. Wrap in <Suspense>. */
export default async function SummarySection({
  locality,
  records,
  heat,
  reports,
}: {
  locality: Locality;
  records: FloodRecord[];
  heat: HeatRating | null;
  reports: Report[];
}) {
  const summary = await getSummary(locality.slug, locality.name, records, heat, reports);

  return (
    <section className="rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]">
      <h2 className="font-display text-sm uppercase text-sign">The short version, by AI</h2>
      {summary ? (
        <>
          <p className="mt-2 font-body leading-relaxed text-ink">{summary.summary}</p>
          <h3 className="mt-4 font-display text-sm uppercase text-ink">Two questions to ask before you commit</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 font-body text-ink">
            {summary.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <p className="mt-3 font-body text-xs text-ink/60">
            Written by Amazon Nova Lite from the records on this page only. It can&apos;t know what the news didn&apos;t report.
          </p>
        </>
      ) : (
        <p className="mt-2 font-body text-ink/80">Summary unavailable, see the data below.</p>
      )}
    </section>
  );
}

export function SummarySkeleton() {
  return (
    <section className="animate-pulse rounded-[24px] border-[4px] border-ink bg-chalk p-5 shadow-[6px_6px_0_#121212]" aria-busy="true">
      <div className="h-4 w-40 rounded bg-ink/15" />
      <div className="mt-3 h-4 w-full rounded bg-ink/10" />
      <div className="mt-2 h-4 w-11/12 rounded bg-ink/10" />
      <div className="mt-2 h-4 w-3/4 rounded bg-ink/10" />
      <p className="mt-3 font-marker text-rust">Reading {"the"} news for you…</p>
    </section>
  );
}
