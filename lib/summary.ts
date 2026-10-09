import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrock, MODEL_ID } from "./aws";
import { getCachedSummary, putSummary } from "./db";
import type { FloodRecord, HeatRating, Report, Summary } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const BANNED = /don'?t live here|do not live here|avoid this area|avoid the area|stay away/i;

// Spec D2, asking for JSON so the two questions come back as a list.
function prompt(name: string, records: FloodRecord[], heat: HeatRating | null, reports: Report[]) {
  const slim = records.map((r) => ({
    date: r.date,
    event: r.event,
    severity: r.severity,
    water_stayed_days: r.water_stayed_days,
    detail: r.detail,
    source: r.source_title,
  }));
  const slimReports = reports.map((r) => ({ category: r.category, when: r.when, text: r.text }));
  const thisYear = new Date().getFullYear();
  const recentYears = new Set(records.filter((r) => Number(r.date.slice(0, 4)) >= thisYear - 9).map((r) => r.date.slice(0, 4)));
  return `You write a short, neutral briefing for someone deciding whether to live in ${name}, Chennai.

DISTINCT FLOOD YEARS IN THE LAST 10 YEARS (${thisYear - 9}–${thisYear}): ${recentYears.size} (${[...recentYears].sort().join(", ") || "none"}). Use this number.
FLOOD RECORDS (JSON, from news articles): ${JSON.stringify(slim)}
HEAT RATING: ${heat ? `${heat.rating} — ${heat.reason}` : "not rated"}
RESIDENT REPORTS (JSON): ${JSON.stringify(slimReports)}

Write 3 to 5 plain sentences covering: how many of the last 10 monsoons it flooded and roughly when in the year; how long water stayed when known; heat exposure; the most-reported resident issues.
Then give two specific questions to ask a landlord or seller before committing (e.g. about floor level, basement parking, past water entry, backup power, tanker dependence).
Rules: never say "don't live here" or "avoid this area"; never invent facts not in the data; if data is thin, say so plainly. Count distinct years, not records.
Return ONLY JSON: {"summary": "...", "questions": ["...", "..."]}`;
}

export async function getSummary(
  slug: string,
  name: string,
  records: FloodRecord[],
  heat: HeatRating | null,
  reports: Report[],
): Promise<Summary | null> {
  const cached = await getCachedSummary(slug);
  const latestReport = reports[0]?.created_at ?? "";
  if (cached && Date.now() - new Date(cached.generated_at).getTime() < DAY && latestReport <= cached.generated_at) {
    return cached;
  }

  try {
    const res = await bedrock.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        messages: [{ role: "user", content: [{ text: prompt(name, records, heat, reports) }] }],
        inferenceConfig: { temperature: 0.2, maxTokens: 600 },
      }),
    );
    const reply = res.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
    const j = JSON.parse(reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1));
    const text = String(j.summary ?? "").trim();
    const questions = Array.isArray(j.questions) ? j.questions.map(String).slice(0, 2) : [];
    if (!text || questions.length < 2 || BANNED.test(text)) return cached ?? null;

    const summary: Summary = { locality: slug, summary: text, questions, generated_at: new Date().toISOString() };
    await putSummary(summary);
    return summary;
  } catch {
    return cached ?? null;
  }
}
