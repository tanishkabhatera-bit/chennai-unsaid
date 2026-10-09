"use client";

import { useState } from "react";
import ListingCheck from "./ListingCheck";
import PropertyCheck from "./PropertyCheck";
import type { Locality } from "@/lib/types";

export default function CheckTabs({ localities }: { localities: Locality[] }) {
  const [tab, setTab] = useState<"form" | "paste">("paste");
  return (
    <div>
      <div role="tablist" aria-label="How to check" className="inline-flex rounded-2xl border-[4px] border-ink bg-chalk p-1 shadow-[6px_6px_0_#121212]">
        {(["paste", "form"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 font-display text-xs uppercase transition sm:text-sm ${tab === t ? "bg-rust text-chalk" : "text-ink hover:bg-sun"}`}
          >
            {t === "paste" ? "Paste the listing" : "Fill it in myself"}
          </button>
        ))}
      </div>
      <div className="mt-6">{tab === "paste" ? <ListingCheck /> : <PropertyCheck localities={localities} />}</div>
    </div>
  );
}
