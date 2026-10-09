import type { Metadata } from "next";
import WaterCalc from "@/components/WaterCalc";

export const metadata: Metadata = {
  title: "Will your water last? | Chennai Unsaid",
  description: "Metro water cut announced? Enter your household and storage and see how many days your water lasts, when you'd run short, and what to do.",
};

export default function WaterPage() {
  return (
    <div className="space-y-8 py-8">
      <div>
        <p className="font-marker text-xl text-rust">Supply cut announced?</p>
        <h1 className="mt-1 font-display text-3xl uppercase leading-none text-ink sm:text-5xl">Will your water last?</h1>
        <p className="mt-3 max-w-2xl font-body text-lg text-ink/80">
          Chennai Metro Water announces cuts for pipeline work, and summers mean tankers. Tell the auto anna how many of you there are and what you&apos;ve stored. He works out how many days it lasts, the day you&apos;d run short, and what to do before the cut starts.
        </p>
      </div>
      <WaterCalc />
    </div>
  );
}
