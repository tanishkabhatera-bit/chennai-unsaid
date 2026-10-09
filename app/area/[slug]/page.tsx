import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import FloodTimeline from "@/components/FloodTimeline";
import HeatCard from "@/components/HeatCard";
import ReportForm from "@/components/ReportForm";
import ResidentReports from "@/components/ResidentReports";
import RiskBadge from "@/components/RiskBadge";
import SummarySection, { SummarySkeleton } from "@/components/SummarySection";
import YearWall from "@/components/YearWall";
import { getAreaReport, getLocality } from "@/lib/data";
import { nowState, wallMarks } from "@/lib/levels";
import { fetchCurrent } from "@/lib/weather";

export async function generateMetadata({ params }: PageProps<"/area/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locality = getLocality(slug);
  return {
    title: locality ? `${locality.name}: how high did the water come? | Chennai Unsaid` : "Area not found | Chennai Unsaid",
  };
}

export default async function AreaPage({ params }: PageProps<"/area/[slug]">) {
  const { slug } = await params;
  const report = await getAreaReport(slug);
  if (!report) notFound();

  const marks = wallMarks(report.floodRecords);
  const now = nowState(report.floodRecords, report.latestReports);
  const weather = await fetchCurrent(report.locality.lat, report.locality.lon);

  return (
    <div className="space-y-10 py-8">
      <div>
        <Link href="/" className="font-marker text-lg text-rust hover:underline">← another area</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-4xl uppercase leading-none text-ink sm:text-6xl">{report.locality.name}</h1>
          <RiskBadge risk={report.risk} />
        </div>
      </div>

      <YearWall mode="water" title={report.locality.name} marks={marks} now={now} />

      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection locality={report.locality} records={report.floodRecords} heat={report.heat} reports={report.latestReports} />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <FloodTimeline records={report.floodRecords} />
        <div className="space-y-8">
          <HeatCard heat={report.heat} weather={weather} />
          <ResidentReports counts={report.reportCounts} latest={report.latestReports} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ReportForm slug={report.locality.slug} name={report.locality.name} />
        <button
          type="button"
          disabled
          className="rounded-2xl border-[4px] border-ink bg-chalk px-5 py-3 font-display text-sm uppercase text-ink shadow-[6px_6px_0_#121212] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send to the group
        </button>
        <span className="self-center font-body text-sm text-ink/60">Sharing comes next.</span>
      </div>
    </div>
  );
}
