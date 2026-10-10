import Link from "next/link";
import { Suspense } from "react";
import HomeHero from "@/components/HomeHero";
import heatJson from "@/data/heat-ratings.json";
import { getLocalities } from "@/lib/data";
import { wallSummaries } from "@/lib/wall-data";
import type { HeatRating } from "@/lib/types";

const HEAT = Object.fromEntries((heatJson as HeatRating[]).map((h) => [h.locality, h]));

const DOORS = [
  {
    title: "Residents' Map",
    text: "Where to sit in the shade at 1 pm, where the free water tap is, which roads have no shade and which streets are under water. Marked by people who live there, with a photo.",
    href: "/spots",
    cta: "Open the map",
    icon: "/icon-map.png",
    color: "bg-sun",
  },
  {
    title: "Check a property",
    text: "Area, floor, parking. The auto anna checks ten years of floods, the heat and what residents say against your exact case, and tells you what to ask.",
    href: "/check",
    cta: "Check one now",
    icon: "/icon-check.png",
    color: "bg-sun",
  },
  {
    title: "Paste the listing",
    text: "Copy the ad or the broker's WhatsApp message. He reads the area, floor and parking, and checks every claim against the record.",
    href: "/check",
    cta: "Paste one",
    icon: "/icon-paste.png",
    color: "bg-chalk",
  },
  {
    title: "Right now, live",
    text: "Rain or heat, whichever is hitting your area today: live numbers, the next three days, and what residents are marking this week.",
    href: "/live",
    cta: "See it live",
    icon: "/icon-monsoon.png",
    color: "bg-chalk",
  },
  {
    title: "Compare two flats",
    text: "Two areas or two floors side by side, same rule, same sources. The way people actually decide.",
    href: "/compare",
    cta: "Compare two",
    icon: "/icon-compare.png",
    color: "bg-chalk",
  },
  {
    title: "Will your water last?",
    text: "Supply cut announced? Enter your household and storage: see how many days it lasts, the day you'd run short, and what to do before it starts.",
    href: "/water",
    cta: "Work it out",
    icon: "/driver-drink.png",
    color: "bg-chalk",
  },
];

export default function Home() {
  return (
    <div className="space-y-16 py-10 sm:py-14">
      <Suspense>
        <HomeHero localities={getLocalities()} walls={wallSummaries()} heat={HEAT} />
      </Suspense>

      <section>
        <h2 className="font-display text-2xl uppercase text-ink sm:text-3xl">What you can do here</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {DOORS.map((d, i) => (
            <Link
              key={d.title}
              href={d.href}
              className={`door block rounded-[24px] border-[4px] border-ink p-5 shadow-[6px_6px_0_#121212] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#121212] ${d.color}`}
              style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 0.6}deg)` }}
            >
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.icon} alt="" className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
                <div>
                  <h3 className="font-display text-xl uppercase text-ink">{d.title}</h3>
                  <p className="mt-2 font-body text-ink/80">{d.text}</p>
                  <span className="mt-3 inline-block font-marker text-lg text-rust">{d.cta} →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border-[4px] border-ink bg-ink p-6 text-chalk shadow-[6px_6px_0_#B5451B]">
        <h2 className="font-display text-xl uppercase sm:text-2xl">Where the marks come from</h2>
        <p className="mt-2 max-w-2xl font-body text-chalk/85">
          69 news articles from 2015 to 2026 (DT Next, Deccan Herald, Citizen Matters), read by Amazon Bedrock and
          turned into 338 dated, sourced flood records across 82 Chennai areas. Every mark links to its article.
          Heat ratings are indicative. The app informs; it never blacklists an area.
        </p>
      </section>
    </div>
  );
}
