import { NextResponse } from "next/server";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { confirmSpot } from "@/lib/spots-db";

/** "Still here": one tap per person per spot per day. */
export async function POST(req: Request, ctx: RouteContext<"/api/spots/[id]/confirm">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Demo entries can't be confirmed" }, { status: 400 });
  if (rateLimited(`confirm:${clientIp(req)}:${id}`, 1, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "You've already confirmed this one today." }, { status: 429 });
  }
  const confirms = await confirmSpot(id);
  if (confirms === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ confirms });
}
