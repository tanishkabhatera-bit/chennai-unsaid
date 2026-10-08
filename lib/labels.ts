import type { HeatLevel, ReportCategory, RiskLevel, Severity } from "./types";

export const REPORT_CATEGORIES: { id: ReportCategory; label: string }[] = [
  { id: "flooding", label: "Flooding" },
  { id: "heat", label: "Heat" },
  { id: "power-cuts", label: "Power cuts during rain" },
  { id: "dengue", label: "Dengue after waterlogging" },
  { id: "water-supply", label: "Water supply / tankers" },
];

export function categoryLabel(id: ReportCategory): string {
  return REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const SEVERITY_STYLES: Record<Severity, string> = {
  minor: "bg-amber-100 text-amber-800",
  moderate: "bg-orange-100 text-orange-800",
  severe: "bg-red-100 text-red-800",
};

export const HEAT_STYLES: Record<HeatLevel, string> = {
  Cooler: "bg-blue-100 text-blue-800",
  Average: "bg-slate-200 text-slate-800",
  Hotter: "bg-red-100 text-red-800",
};

export const RISK_STYLES: Record<RiskLevel, string> = {
  High: "bg-red-600 text-white",
  Moderate: "bg-orange-500 text-white",
  Low: "bg-emerald-600 text-white",
  Unknown: "bg-slate-200 text-slate-700",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2023-12-04" or "2023-12" → "Dec 2023". */
export function monthYear(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}
