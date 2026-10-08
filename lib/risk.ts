import type { FloodRecord, FloodRisk } from "./types";

export const RISK_RULE =
  "Based on news records from the last 10 years. High: flooded in 4 or more years, or water stayed 5+ days. Moderate: 2–3 years. Low: 0–1 years.";

/** Spec Part C5. With no records at all we say so rather than calling it Low. */
export function floodRisk(records: FloodRecord[], now = new Date()): FloodRisk {
  const firstYear = now.getFullYear() - 9;
  const recent = records.filter((r) => Number(r.date.slice(0, 4)) >= firstYear);
  const years = new Set(recent.map((r) => r.date.slice(0, 4))).size;
  const longStay = recent.some((r) => (r.water_stayed_days ?? 0) >= 5);

  if (records.length === 0) return { level: "Unknown", years, longStay };
  if (years >= 4 || longStay) return { level: "High", years, longStay };
  if (years >= 2) return { level: "Moderate", years, longStay };
  return { level: "Low", years, longStay };
}
