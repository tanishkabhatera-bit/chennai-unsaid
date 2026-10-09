export type Severity = "minor" | "moderate" | "severe";

export type HeatLevel = "Cooler" | "Average" | "Hotter";

export type ReportCategory =
  | "flooding"
  | "heat"
  | "power-cuts"
  | "dengue"
  | "water-supply";

export interface Locality {
  slug: string;
  name: string;
  aliases: string[];
  /** Approximate centre, used for live weather. */
  lat: number;
  lon: number;
}

export interface FloodRecord {
  locality: string;
  date: string;
  event: string | null;
  severity: Severity;
  water_stayed_days: number | null;
  detail: string;
  source_url: string;
  source_title: string;
}

export interface HeatRating {
  locality: string;
  rating: HeatLevel;
  reason: string;
  coast_km: number;
}

export interface Report {
  locality: string;
  created_at: string;
  category: ReportCategory;
  text: string;
  /** Month the resident says it happened, as YYYY-MM. */
  when: string;
  /** For flooding reports: how high the water came. */
  level?: "ankle" | "knee" | "waist" | "chest";
  seeded: boolean;
}

export interface Summary {
  locality: string;
  summary: string;
  questions: string[];
  generated_at: string;
}

export type RiskLevel = "Low" | "Moderate" | "High" | "Unknown";

export interface FloodRisk {
  level: RiskLevel;
  /** Distinct years with a flood record in the last 10 years. */
  years: number;
  longStay: boolean;
}

export interface AreaReport {
  locality: Locality;
  floodRecords: FloodRecord[];
  heat: HeatRating | null;
  reportCounts: Record<ReportCategory, number>;
  latestReports: Report[];
  risk: FloodRisk;
  summary: Summary | null;
  isSampleData: boolean;
}
