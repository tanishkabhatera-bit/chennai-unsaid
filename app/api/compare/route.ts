import { NextResponse } from "next/server";
import { getLocality } from "@/lib/data";
import { getHeatRating, queryFloodRecords, queryReports } from "@/lib/db";
import { compareDimension, floodReport, heatReport, waterReport } from "@/lib/evidence";
import { computeVerdict, FLOORS, PARKINGS, type Floor, type Parking } from "@/lib/verdict";
import { fetchClimateHistory, fetchCurrent } from "@/lib/weather";

async function side(slug: string, floor: Floor, parking: Parking) {
  const locality = getLocality(slug)!;
  const [records, heat, reports, current, climate] = await Promise.all([
    queryFloodRecords(slug),
    getHeatRating(slug),
    queryReports(slug),
    fetchCurrent(locality.lat, locality.lon),
    fetchClimateHistory(locality.lat, locality.lon),
  ]);
  return {
    locality,
    floor,
    parking,
    verdict: computeVerdict(records, heat, reports, floor, parking),
    flood: floodReport(records, floor, parking, climate),
    heat: heatReport(heat, current, climate, floor),
    water: waterReport(reports),
  };
}

// GET /api/compare?a=velachery&af=ground&ap=stilt&b=adyar&bf=low&bp=none
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const ok = (s: string | null, f: string | null, p: string | null) =>
    !!s && !!getLocality(s) && FLOORS.some((x) => x.id === f) && PARKINGS.some((x) => x.id === p);
  if (!ok(q.get("a"), q.get("af"), q.get("ap")) || !ok(q.get("b"), q.get("bf"), q.get("bp"))) {
    return NextResponse.json({ error: "Pick two areas, each with a floor and parking" }, { status: 400 });
  }
  const [A, B] = await Promise.all([
    side(q.get("a")!, q.get("af") as Floor, q.get("ap") as Parking),
    side(q.get("b")!, q.get("bf") as Floor, q.get("bp") as Parking),
  ]);
  const names: [string, string] = [`A (${A.locality.name})`, `B (${B.locality.name})`];
  const differences = (["flood", "heat", "water"] as const).map((d) => compareDimension(A[d], B[d], names));
  return NextResponse.json({ a: A, b: B, differences, generated_at: new Date().toISOString() });
}
