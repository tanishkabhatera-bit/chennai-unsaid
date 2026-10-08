import { connection } from "next/server";
import localitiesJson from "@/data/localities.json";
import heatJson from "@/data/heat-ratings.json";
import seedReportsJson from "@/data/seed-reports.json";
import mockFloodJson from "@/data/mock/flood-records.json";
import mockSummariesJson from "@/data/mock/summaries.json";
import { REPORT_CATEGORIES } from "./labels";
import { floodRisk } from "./risk";
import type {
  AreaReport,
  FloodRecord,
  HeatRating,
  Locality,
  Report,
  ReportCategory,
  Summary,
} from "./types";

// Step 1 of the build: everything comes from local JSON. Later steps swap
// these reads for DynamoDB and Bedrock without changing the pages.
const localities = localitiesJson as Locality[];
const heatRatings = heatJson as HeatRating[];
const reports = seedReportsJson as Report[];
const floodRecords = mockFloodJson as FloodRecord[];
const summaries = mockSummariesJson as Summary[];

export function getLocalities(): Locality[] {
  return localities;
}

export function getLocality(slug: string): Locality | undefined {
  return localities.find((l) => l.slug === slug);
}

export async function getAreaReport(slug: string): Promise<AreaReport | null> {
  // Reports change as residents submit them, so always render at request time.
  await connection();
  const locality = getLocality(slug);
  if (!locality) return null;

  const records = floodRecords
    .filter((r) => r.locality === slug)
    .sort((a, b) => b.date.localeCompare(a.date));

  const areaReports = reports
    .filter((r) => r.locality === slug)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const reportCounts = Object.fromEntries(
    REPORT_CATEGORIES.map(({ id }) => [id, areaReports.filter((r) => r.category === id).length]),
  ) as Record<ReportCategory, number>;

  return {
    locality,
    floodRecords: records,
    heat: heatRatings.find((h) => h.locality === slug) ?? null,
    reportCounts,
    latestReports: areaReports.slice(0, 5),
    risk: floodRisk(records),
    summary: summaries.find((s) => s.locality === slug) ?? null,
    isSampleData: true,
  };
}
