import { NextResponse } from "next/server";
import { getAreaReport } from "@/lib/data";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const report = await getAreaReport(slug);
  if (!report) return NextResponse.json({ error: "Unknown locality" }, { status: 404 });
  return NextResponse.json(report);
}
