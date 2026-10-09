import type { Metadata } from "next";
import CheckTabs from "@/components/CheckTabs";
import { getLocalities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Check a property | Chennai Unsaid",
  description: "Before you rent or buy in Chennai: ten years of flood news, the heat, and what residents say, checked against your floor and parking, or against the listing itself.",
};

export default function CheckPage() {
  return (
    <div className="space-y-8 py-8">
      <div>
        <p className="font-marker text-xl text-rust">Before you sign anything</p>
        <h1 className="mt-1 font-display text-3xl uppercase leading-none text-ink sm:text-5xl">Check a property</h1>
        <p className="mt-3 max-w-2xl font-body text-lg text-ink/80">
          Tell the auto anna where the flat is and which floor, or just paste the listing. He checks ten years of flood news, the heat and what residents report, and tells you what to ask before you pay the advance.
        </p>
      </div>
      <CheckTabs localities={getLocalities()} />
    </div>
  );
}
