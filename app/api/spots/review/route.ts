import { NextResponse } from "next/server";
import { connection } from "next/server";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { reviewKeyOk } from "@/lib/review-key";
import { listPendingSpots, setSpotStatus } from "@/lib/spots-db";
import type { SpotStatus } from "@/lib/spots";

const ACTIONS: Record<string, SpotStatus> = { approve: "community", verify: "verified", reject: "rejected" };

function denied(req: Request) {
  // Slow down key guessing.
  if (rateLimited(`review-fail:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many tries" }, { status: 429 });
  }
  return NextResponse.json({ error: "Wrong review key" }, { status: 401 });
}

export async function GET(req: Request) {
  await connection();
  if (!reviewKeyOk(req)) return denied(req);
  const pending = await listPendingSpots();
  return NextResponse.json({ pending });
}

export async function POST(req: Request) {
  if (!reviewKeyOk(req)) return denied(req);
  const body = (await req.json().catch(() => ({}))) as { id?: unknown; action?: unknown };
  const status = typeof body.action === "string" ? ACTIONS[body.action] : undefined;
  if (typeof body.id !== "string" || !status) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const spot = await setSpotStatus(body.id, status);
  if (!spot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, status });
}
