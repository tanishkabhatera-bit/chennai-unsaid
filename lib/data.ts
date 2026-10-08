import { connection } from "next/server";
import localitiesJson from "@/data/localities.json";
import { getCachedSummary, getHeatRating, queryFloodRecords, queryReports } from "./db";
import { REPORT_CATEGORIES } from "./labels";
import { floodRisk } from "./risk";
import type { AreaReport, Locality, ReportCategory } from "./types";

// The locality list is static and ships with the app; everything else is in DynamoDB.
const localities = localitiesJson as Locality[];

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

  const [records, reports, heat, summary] = await Promise.all([
    queryFloodRecords(slug),
    queryReports(slug),
    getHeatRating(slug),
    getCachedSummary(slug),
  ]);

  const reportCounts = Object.fromEntries(
    REPORT_CATEGORIES.map(({ id }) => [id, reports.filter((r) => r.category === id).length]),
  ) as Record<ReportCategory, number>;

  return {
    locality,
    floodRecords: records,
    heat,
    reportCounts,
    latestReports: reports.slice(0, 5),
    risk: floodRisk(records),
    summary,
    isSampleData: false,
  };
}
