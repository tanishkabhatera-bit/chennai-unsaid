import type { Metadata } from "next";
import SpotsExplorer from "@/components/SpotsExplorer";
import { getLocalities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Residents' Map: shade, water and problem spots | Chennai Unsaid",
  description:
    "A community map of Chennai: shady places to rest, free drinking water, roads with no shade and waterlogged streets. Every pin has a photo and a date, and demo entries are clearly marked.",
};

export default function SpotsPage() {
  return (
    <div className="space-y-8 py-8">
      <div>
        <p className="font-marker text-xl text-rust">Residents&apos; Map</p>
        <h1 className="mt-1 font-display text-3xl uppercase leading-none text-ink sm:text-5xl">Where to rest, where to drink, what to avoid.</h1>
        <p className="mt-3 max-w-2xl font-body text-lg text-ink/80">
          Nobody tells you where to sit out of the sun at 1 pm, or where the free water tap is. Residents do. Add a photo of a shady spot, a free water point, a road with no shade or a street under water, so the next person knows.
        </p>
      </div>
      <SpotsExplorer localities={getLocalities()} />
    </div>
  );
}
