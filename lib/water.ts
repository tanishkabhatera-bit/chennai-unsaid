// "Will your water last?" A plain, deterministic calculation: no prediction of when supply fails,
// just how long the water you have lasts at the rate you use it.

/** CPHEEO Manual on Water Supply: recommended supply for Indian metropolitan cities with sewerage. */
export const NORMAL_LPCD = 135;
/** Sphere Handbook: minimum for drinking, cooking and basic hygiene in an emergency. */
export const SURVIVAL_LPCD = 15;
/** A practical "essentials only" day: drinking, cooking, one bucket bath, flushing with a bucket, dishes. */
export const ESSENTIAL_LPCD = 60;
/** Common private tanker size in Chennai (litres). Users can change it. */
export const TANKER_L = 12000;
/** A household bucket, for intuition. */
export const BUCKET_L = 15;

export interface WaterInput {
  people: number;
  /** Litres per person per day; defaults to the CPHEEO norm. */
  lpcd: number;
  sumpL: number;
  tankL: number;
  /** Other storage: drums, cans, pots. */
  otherL: number;
  /** Expected length of the supply cut, days. */
  cutDays: number;
  tankerL: number;
}

export interface WaterPlan {
  storedL: number;
  dailyL: number;
  daysNormal: number;
  daysEssential: number;
  daysSurvival: number;
  /** Litres missing at normal use over the cut; 0 if covered. */
  shortfallL: number;
  /** Litres missing even on essentials only. */
  shortfallEssentialL: number;
  tankersNeeded: number;
  status: "covered" | "tight" | "short" | "critical";
  /** Day of the cut (1-based) when water runs out at normal use; null if it lasts. */
  runsOutDay: number | null;
  steps: string[];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function planWater(i: WaterInput): WaterPlan {
  const people = Math.max(1, i.people);
  const storedL = Math.max(0, i.sumpL) + Math.max(0, i.tankL) + Math.max(0, i.otherL);
  const dailyL = people * Math.max(1, i.lpcd);
  const daysNormal = r1(storedL / dailyL);
  const daysEssential = r1(storedL / (people * ESSENTIAL_LPCD));
  const daysSurvival = r1(storedL / (people * SURVIVAL_LPCD));
  const needL = dailyL * i.cutDays;
  const shortfallL = Math.max(0, Math.round(needL - storedL));
  const shortfallEssentialL = Math.max(0, Math.round(people * ESSENTIAL_LPCD * i.cutDays - storedL));
  const tankersNeeded = shortfallEssentialL > 0 ? Math.ceil(shortfallEssentialL / Math.max(1000, i.tankerL)) : 0;

  const status: WaterPlan["status"] =
    daysNormal >= i.cutDays ? (daysNormal >= i.cutDays * 1.5 ? "covered" : "tight") : daysEssential >= i.cutDays ? "short" : "critical";
  const runsOutDay = daysNormal >= i.cutDays ? null : Math.floor(daysNormal) + 1;

  const steps: string[] = [];
  if (status === "covered") {
    steps.push("You're covered at normal use. Keep the sump topped up the day before the cut.");
    steps.push("Store 2–3 days of drinking water separately in clean cans, in case the sump gets contaminated.");
  }
  if (status === "tight") {
    steps.push(`Fill every bucket, drum and pot the day before; it buys you about ${r1((BUCKET_L * 10) / dailyL)} days per 10 buckets.`);
    steps.push("Switch to bucket baths and skip the washing machine for the length of the cut.");
  }
  if (status === "short" || status === "critical") {
    steps.push(`At normal use you run out on day ${runsOutDay} of ${i.cutDays}. Switch to essentials only (about ${ESSENTIAL_LPCD} L per person a day) from day 1.`);
    steps.push("Essentials: drinking and cooking first, one bucket bath each, flush with used bathing water, wash dishes in a basin.");
    steps.push("Run the washing machine and wash the car or bike only after supply returns.");
  }
  if (status === "critical") {
    steps.push(`Even on essentials you're ${shortfallEssentialL.toLocaleString("en-IN")} L short: book ${tankersNeeded} tanker${tankersNeeded === 1 ? "" : "s"} of ${i.tankerL.toLocaleString("en-IN")} L before the cut starts, when they're easier to get.`);
    steps.push(`If no tanker comes, keep at least ${SURVIVAL_LPCD} L per person a day for drinking, cooking and basic hygiene.`);
  }
  steps.push("Ask your building or RWA whether the sump is cleaned before and after a long cut.");

  return { storedL, dailyL, daysNormal, daysEssential, daysSurvival, shortfallL, shortfallEssentialL, tankersNeeded, status, runsOutDay, steps };
}
