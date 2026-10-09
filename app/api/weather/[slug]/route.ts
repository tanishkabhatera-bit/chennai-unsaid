import { NextResponse } from "next/server";
import { getLocality } from "@/lib/data";
import { fetchCurrent, fetchHottestLastYear, fetchRain } from "@/lib/weather";

// ?part=current is fast (live reading); ?part=hottest hits the archive and can take a few seconds.
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const locality = getLocality(slug);
  if (!locality) return NextResponse.json({ error: "Unknown locality" }, { status: 404 });
  const part = new URL(req.url).searchParams.get("part");
  if (part === "current") return NextResponse.json(await fetchCurrent(locality.lat, locality.lon));
  if (part === "hottest") return NextResponse.json(await fetchHottestLastYear(locality.lat, locality.lon));
  if (part === "rain") return NextResponse.json(await fetchRain(locality.lat, locality.lon));
  const [current, hottest] = await Promise.all([
    fetchCurrent(locality.lat, locality.lon),
    fetchHottestLastYear(locality.lat, locality.lon),
  ]);
  return NextResponse.json({ current, hottest });
}
