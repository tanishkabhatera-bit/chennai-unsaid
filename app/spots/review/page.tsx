import type { Metadata } from "next";
import SpotReview from "@/components/SpotReview";

export const metadata: Metadata = {
  title: "Review spots | Chennai Unsaid",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return (
    <div className="space-y-6 py-8">
      <h1 className="font-display text-3xl uppercase text-ink">Review new spots</h1>
      <p className="max-w-2xl font-body text-ink/80">
        Nothing goes on the map until it&apos;s approved here. Reject anything with faces, number plates, the inside of a home, or a photo that doesn&apos;t match what was reported.
      </p>
      <SpotReview />
    </div>
  );
}
