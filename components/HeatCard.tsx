import { HEAT_STYLES } from "@/lib/labels";
import type { HeatRating } from "@/lib/types";

export default function HeatCard({ heat }: { heat: HeatRating | null }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">Heat</h2>
      {heat ? (
        <>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${HEAT_STYLES[heat.rating]}`}>
            {heat.rating}
          </span>
          <p className="mt-2 text-slate-700">{heat.reason}.</p>
          <p className="mt-2 text-sm text-slate-500">
            Indicative, based on tree cover, coastal distance and density.
          </p>
        </>
      ) : (
        <p className="mt-2 text-slate-600">Heat rating not available yet.</p>
      )}
    </section>
  );
}
