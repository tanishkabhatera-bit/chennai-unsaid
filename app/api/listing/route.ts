import { NextResponse } from "next/server";
import { getLocalities } from "@/lib/data";
import { getHeatRating, queryFloodRecords, queryReports } from "@/lib/db";
import { checkClaims, readListing } from "@/lib/listing";
import { computeVerdict } from "@/lib/verdict";

const LIMIT = 10; // per IP per hour
const WINDOW = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= LIMIT) return NextResponse.json({ error: "Too many checks. Try again in an hour." }, { status: 429 });
  recent.push(now);
  hits.set(ip, recent);

  let text = "";
  try {
    text = String((await req.json()).text ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (text.length < 20) return NextResponse.json({ error: "Paste the whole listing or message, at least a couple of lines." }, { status: 400 });

  let read;
  try {
    read = await readListing(text, getLocalities());
  } catch {
    return NextResponse.json({ error: "Couldn't read that. Try pasting plain text." }, { status: 502 });
  }
  if (!read.locality) {
    return NextResponse.json({ read, error: read.placeAsWritten ? `We don't cover "${read.placeAsWritten}" yet. Pick the nearest area above.` : "Couldn't find an area name in the text. Pick the area above." }, { status: 200 });
  }

  const slug = read.locality.slug;
  const [records, heat, reports] = await Promise.all([queryFloodRecords(slug), getHeatRating(slug), queryReports(slug)]);
  const floor = read.floor ?? "ground";
  const parking = read.parking ?? "none";
  const verdict = computeVerdict(records, heat, reports, floor, parking);
  const claims = checkClaims(read.claims, records, heat);
  return NextResponse.json({ read, floor, parking, use: read.use ?? "rent", verdict, claims, assumed: { floor: read.floor === null, parking: read.parking === null } });
}
