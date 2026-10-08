import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FloodTimeline from "@/components/FloodTimeline";
import HeatCard from "@/components/HeatCard";
import ResidentReports from "@/components/ResidentReports";
import RiskBadge from "@/components/RiskBadge";
import SummaryCard from "@/components/SummaryCard";
import { getAreaReport, getLocality } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/area/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locality = getLocality(slug);
  return {
    title: locality ? `${locality.name}: floods, heat and residents | Chennai Unsaid` : "Area not found | Chennai Unsaid",
  };
}

export default async function AreaPage({ params }: PageProps<"/area/[slug]">) {
  const { slug } = await params;
  const report = await getAreaReport(slug);
  if (!report) notFound();

  return (
    <div className="space-y-8 py-8">
      <div>
        <Link href="/" className="text-sm font-medium text-teal-800 hover:underline">
          ← Search another area
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{report.locality.name}</h1>
        <div className="mt-3">
          <RiskBadge risk={report.risk} />
        </div>
      </div>

      {report.isSampleData && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Sample data for testing the layout. Real records from news articles replace this soon.
        </p>
      )}

      <SummaryCard summary={report.summary} />
      <FloodTimeline records={report.floodRecords} />
      <HeatCard heat={report.heat} />
      <ResidentReports counts={report.reportCounts} latest={report.latestReports} />

      <div>
        <button
          type="button"
          disabled
          className="w-full rounded-xl bg-teal-700 px-5 py-3.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Report something about this area
        </button>
        <p className="mt-2 text-sm text-slate-500">Reporting opens in a later step.</p>
      </div>
    </div>
  );
}
