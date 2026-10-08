import { NextResponse } from "next/server";
import { getLocalities } from "@/lib/data";

export function GET() {
  return NextResponse.json(getLocalities());
}
