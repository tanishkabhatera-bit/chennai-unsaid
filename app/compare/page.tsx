import type { Metadata } from "next";
import CompareCheck from "@/components/CompareCheck";
import { getLocalities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Compare two flats | Chennai Unsaid",
  description: "Two Chennai flats side by side: flood history, heat and parking risk, same rule, same sources.",
};

export default function ComparePage() {
  return (
    <div className="space-y-8 py-8">
      <div>
        <p className="font-marker text-xl text-rust">Climate Compare</p>
        <h1 className="mt-1 font-display text-3xl uppercase leading-none text-ink sm:text-5xl">Compare two flats</h1>
        <p className="mt-3 max-w-2xl font-body text-lg text-ink/80">
          Two areas, or the same area on two floors. See flooding, heat and water availability side by side, with the source and date behind every line, what we don&apos;t know, and what to verify before you pay the advance.
        </p>
      </div>
      <CompareCheck localities={getLocalities()} />
    </div>
  );
}
