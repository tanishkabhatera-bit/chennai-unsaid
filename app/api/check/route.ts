import { NextResponse } from "next/server";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrock, MODEL_ID } from "@/lib/aws";
import { getLocality } from "@/lib/data";
import { getCachedSummary, getHeatRating, putSummary, queryFloodRecords, queryReports } from "@/lib/db";
import { computeVerdict, FLOORS, PARKINGS, type Floor, type Parking, type Use, type Verdict } from "@/lib/verdict";

const DAY = 24 * 60 * 60 * 1000;
const BANNED = /don'?t (buy|rent|live)|do not (buy|rent|live)|avoid this|stay away|never (buy|rent)/i;

/** Questions to ask the owner, written by Bedrock for this exact case. Cached a day per case. */
async function questions(name: string, floor: Floor, parking: Parking, use: Use, verdict: Verdict): Promise<string[]> {
  const key = `check#${name}#${floor}#${parking}#${use}`;
  const cached = await getCachedSummary(key);
  if (cached && Date.now() - new Date(cached.generated_at).getTime() < DAY) return cached.questions;

  const prompt = `Someone is about to ${use === "buy" ? "buy" : "rent"} a ${FLOORS.find((f) => f.id === floor)?.label.toLowerCase()} flat with ${PARKINGS.find((p) => p.id === parking)?.label.toLowerCase()} in ${name}, Chennai.
What we know (from news reports and resident reports):
${verdict.concerns.map((c) => `- ${c.text}`).join("\n")}

Write exactly 4 short, specific questions they should ask the ${use === "buy" ? "seller" : "landlord"} or neighbours before committing, each tied to one of the facts above (floor level, water entry, parking, pumps, backup power, roof heat, tankers, dengue, drains). Plain English, no preamble.
Rules: never say "don't buy", "don't rent" or "avoid". Do not invent facts. Return ONLY JSON: {"questions": ["...", "...", "...", "..."]}`;
  try {
    const res = await bedrock.send(
      new ConverseCommand({ modelId: MODEL_ID, messages: [{ role: "user", content: [{ text: prompt }] }], inferenceConfig: { temperature: 0.2, maxTokens: 400 } }),
    );
    const reply = res.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
    const j = JSON.parse(reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1));
    const qs: string[] = Array.isArray(j.questions) ? j.questions.map(String).filter((q: string) => !BANNED.test(q)).slice(0, 4) : [];
    if (qs.length >= 3) {
      await putSummary({ locality: key, summary: "", questions: qs, generated_at: new Date().toISOString() });
      return qs;
    }
  } catch {
    // fall through to the generic questions
  }
  return [
    "Did water enter this building, its parking or the ground floor in the last big rains? Which year?",
    "Is there a sump pump and backup power for the lift and water pumps during a power cut?",
    "Where do residents park their vehicles when heavy rain is forecast?",
    "How many days of tanker water did the building need last summer?",
  ];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locality = getLocality(url.searchParams.get("area") ?? "");
  const floor = url.searchParams.get("floor") as Floor;
  const parking = url.searchParams.get("parking") as Parking;
  const use = (url.searchParams.get("use") ?? "rent") as Use;
  if (!locality || !FLOORS.some((f) => f.id === floor) || !PARKINGS.some((p) => p.id === parking) || !["rent", "buy"].includes(use)) {
    return NextResponse.json({ error: "Pick an area, a floor and a parking option" }, { status: 400 });
  }

  const [records, heat, reports] = await Promise.all([queryFloodRecords(locality.slug), getHeatRating(locality.slug), queryReports(locality.slug)]);
  const verdict = computeVerdict(records, heat, reports, floor, parking);
  const qs = await questions(locality.name, floor, parking, use, verdict);
  return NextResponse.json({ locality, verdict, questions: qs });
}
