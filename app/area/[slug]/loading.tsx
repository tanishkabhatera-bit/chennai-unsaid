export default function Loading() {
  return (
    <div className="animate-pulse space-y-8 py-8" aria-busy="true" aria-label="Loading area report">
      <div>
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-8 w-48 rounded bg-slate-200" />
        <div className="mt-3 h-7 w-36 rounded-full bg-slate-200" />
      </div>
      <div className="h-40 rounded-2xl bg-slate-200" />
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-slate-200" />
        <div className="h-16 rounded bg-slate-200" />
        <div className="h-16 rounded bg-slate-200" />
      </div>
    </div>
  );
}
