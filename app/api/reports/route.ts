import { NextResponse } from "next/server";
import { getLocality } from "@/lib/data";
import { putReport } from "@/lib/db";
import { REPORT_CATEGORIES } from "@/lib/labels";
import type { Report, ReportCategory } from "@/lib/types";

const MAX_TEXT = 280;
const LIMIT = 5; // reports per IP per hour (spec E2)
const WINDOW = 60 * 60 * 1000;
const LEVELS = new Set(["ankle", "knee", "waist", "chest"]);

// In-memory per instance; good enough for a single Amplify server. Resets on deploy.
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= LIMIT) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many reports. Try again in an hour." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const locality = typeof body.locality === "string" ? getLocality(body.locality) : undefined;
  const category = REPORT_CATEGORIES.find((c) => c.id === body.category)?.id as ReportCategory | undefined;
  const text = typeof body.text === "string" ? body.text.trim().replace(/\s+/g, " ") : "";
  const when = typeof body.when === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(body.when) ? body.when : "";
  const level = typeof body.level === "string" && LEVELS.has(body.level) ? (body.level as Report["level"]) : undefined;

  if (!locality) return NextResponse.json({ error: "Unknown locality" }, { status: 400 });
  if (!category) return NextResponse.json({ error: "Pick a category" }, { status: 400 });
  if (text.length < 5 || text.length > MAX_TEXT) return NextResponse.json({ error: `Say what happened, in up to ${MAX_TEXT} characters` }, { status: 400 });
  if (!when || when > new Date().toISOString().slice(0, 7) || when < "2010-01") return NextResponse.json({ error: "Pick a month and year" }, { status: 400 });

  const report: Report = {
    locality: locality.slug,
    created_at: new Date().toISOString(),
    category,
    text,
    when,
    seeded: false,
    ...(category === "flooding" && level ? { level } : {}),
  };
  await putReport(report);
  return NextResponse.json({ ok: true });
}
