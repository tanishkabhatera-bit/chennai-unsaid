import type { Metadata } from "next";
import heatJson from "@/data/heat-ratings.json";
import LivePanel from "@/components/LivePanel";
import { getLocalities } from "@/lib/data";
import { wallSummaries } from "@/lib/wall-data";
import type { HeatRating } from "@/lib/types";

export const metadata: Metadata = {
  title: "Right now, live | Chennai Unsaid",
  description: "Rain now and the next three days, live heat, and what residents are marking, for any Chennai area.",
};

const HEAT = Object.fromEntries((heatJson as HeatRating[]).map((h) => [h.locality, h]));

export default function LivePage() {
  return (
    <div className="space-y-8 py-8">
      <div>
        <p className="font-marker text-xl text-rust">Right now, in your area</p>
        <h1 className="mt-1 font-display text-3xl uppercase leading-none text-ink sm:text-5xl">Right now, live</h1>
        <p className="mt-3 max-w-2xl font-body text-lg text-ink/80">
          Rain in the last 24 hours and the next three days, how hot it feels right now, and what the news and residents have reported this fortnight. The wall opens on whichever is hitting your area today.
        </p>
      </div>
      <LivePanel localities={getLocalities()} walls={wallSummaries()} heat={HEAT} />
    </div>
  );
}
