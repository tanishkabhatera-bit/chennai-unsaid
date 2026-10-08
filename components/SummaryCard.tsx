import type { Summary } from "@/lib/types";

export default function SummaryCard({ summary }: { summary: Summary | null }) {
  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">AI summary</h2>
      {summary ? (
        <>
          <p className="mt-2 leading-relaxed text-slate-800">{summary.summary}</p>
          <h3 className="mt-4 font-semibold text-slate-900">Two questions to ask before you commit</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-800">
            {summary.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-2 text-slate-700">Summary unavailable, see the data below.</p>
      )}
    </section>
  );
}
