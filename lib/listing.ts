import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrock, MODEL_ID } from "./aws";
import { searchLocalities } from "./localities";
import type { FloodRecord, HeatRating, Locality } from "./types";
import type { Floor, Parking, Use } from "./verdict";
import { LEVELS, maxLevel, recordLevel } from "./levels";

export interface ListingRead {
  /** The locality the listing is in, if we could match it. */
  locality: Locality | null;
  /** The place name as written, for the "we couldn't find…" message. */
  placeAsWritten: string | null;
  floor: Floor | null;
  parking: Parking | null;
  use: Use | null;
  /** Claims the listing makes about water, heat or the area. */
  claims: { text: string; topic: "water" | "heat" | "other" }[];
}

export interface ClaimCheck {
  claim: string;
  topic: "water" | "heat" | "other";
  status: "matches" | "contradicts" | "unverified";
  finding: string;
}

const PROMPT = `You read a property listing or a WhatsApp message about a flat in Chennai, India, and pull out facts.
Return ONLY JSON:
{
 "place": string or null (the locality / neighbourhood named, e.g. "Velachery", "Anna Nagar West"; null if none),
 "floor": "ground" | "low" | "high" | "top" | null (low = 1st–2nd floor, high = 3rd floor or above, top = explicitly the top floor),
 "parking": "none" | "stilt" | "basement" | null,
 "use": "rent" | "buy" | null,
 "claims": [ { "text": "the claim as written, short", "topic": "water" | "heat" | "other" } ]
}
Claims are statements about flooding, waterlogging, drainage, rain, heat, breeze, ventilation, water supply, tankers, power cuts, or the safety/quality of the area. Quote them briefly. Topic "water" means flooding, waterlogging, drainage or rain ONLY; water supply ("24 hrs water", "metro water", "borewell", "no water problem") is topic "other". If there are none, return an empty list. Do not invent anything.

TEXT:
`;

export async function readListing(text: string, localities: Locality[]): Promise<ListingRead> {
  const res = await bedrock.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      messages: [{ role: "user", content: [{ text: PROMPT + text.slice(0, 4000) }] }],
      inferenceConfig: { temperature: 0, maxTokens: 500 },
    }),
  );
  const reply = res.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
  const j = JSON.parse(reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1));
  const place = typeof j.place === "string" && j.place.trim() ? j.place.trim() : null;
  const locality = place ? (searchLocalities(localities, place)[0] ?? null) : null;
  const pick = <T extends string>(v: unknown, allowed: T[]): T | null => (allowed.includes(v as T) ? (v as T) : null);
  return {
    locality,
    placeAsWritten: place,
    floor: pick(j.floor, ["ground", "low", "high", "top"]),
    parking: pick(j.parking, ["none", "stilt", "basement"]),
    use: pick(j.use, ["rent", "buy"]),
    claims: Array.isArray(j.claims)
      ? j.claims
          .filter((c: { text?: unknown }) => typeof c.text === "string" && c.text.trim())
          .map((c: { text: string; topic?: string }) => ({ text: c.text.trim(), topic: ["water", "heat"].includes(c.topic ?? "") ? (c.topic as "water" | "heat") : "other" }))
          .slice(0, 6)
      : [],
  };
}

const NEVER = /never|no flood|not flood|doesn'?t flood|no water ?logging|no waterlogging|flood[- ]?free|not affected|safe from|dry area|no water problem|zero flood/i;
const COOL = /cool|breez|airy|ventilat|not hot|pleasant/i;

/** Compare each claim with what the news reported and the heat rating. Never calls anything false; says what the record shows. */
export function checkClaims(claims: ListingRead["claims"], records: FloodRecord[], heat: HeatRating | null, now = new Date()): ClaimCheck[] {
  const firstYear = now.getFullYear() - 9;
  const recent = records.filter((r) => Number(r.date.slice(0, 4)) >= firstYear);
  const years = [...new Set(recent.map((r) => r.date.slice(0, 4)))].sort();
  const worst = maxLevel(recent.map(recordLevel));
  const worstWord = { dry: "no flooding", ankle: "ankle-deep water", knee: "knee-deep water", waist: "waist-deep water", chest: "chest-deep water, inside homes" }[worst];

  return claims.map((c) => {
    if (c.topic === "water") {
      if (years.length === 0) {
        return { ...c, claim: c.text, status: "unverified", finding: "The news we've read has no flood report for this area. That supports the claim, but the news doesn't catch every street. Ask neighbours." };
      }
      const contradicts = NEVER.test(c.text);
      return {
        ...c,
        claim: c.text,
        status: contradicts ? "contradicts" : "unverified",
        finding: `The news reported flooding here in ${years.length} of the last 10 years (${years.join(", ")}); worst: ${worstWord}.${contradicts ? " That doesn't match the claim." : " Check the street itself: a locality floods unevenly."}`,
      };
    }
    if (c.topic === "heat") {
      if (!heat) return { ...c, claim: c.text, status: "unverified", finding: "No heat rating for this area yet." };
      const claimsCool = COOL.test(c.text);
      const status = claimsCool && heat.rating === "Hotter" ? "contradicts" : claimsCool && heat.rating === "Cooler" ? "matches" : "unverified";
      return { ...c, claim: c.text, status, finding: `Our indicative rating: ${heat.rating} than most of the city. ${heat.reason}. A top floor or a west-facing wall changes this a lot.` };
    }
    return { ...c, claim: c.text, status: "unverified", finding: "Not something we track. Ask the neighbours." };
  });
}

export { LEVELS };
