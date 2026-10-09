import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import { getLocalities } from "@/lib/data";
import { wallSummaries } from "@/lib/wall-data";

const DOORS = [
  {
    title: "See the wall",
    text: "Every flood year painted at the height the news reported, with the article behind each mark.",
    href: "/area/velachery",
    cta: "Try Velachery",
    color: "bg-sun",
  },
  {
    title: "Check a forward",
    text: "Paste a WhatsApp message about floods or heat. See what the news actually said, with sources.",
    href: "/check",
    cta: "Coming next",
    color: "bg-chalk",
  },
  {
    title: "Add your mark",
    text: "Ankle, knee, waist or inside the house? One tap puts your year on the wall. No name, no login.",
    href: "/area/velachery",
    cta: "Coming next",
    color: "bg-chalk",
  },
  {
    title: "Send it to the group",
    text: "One tap makes the wall into an image for WhatsApp, with the sources and a link back.",
    href: "/area/velachery",
    cta: "Coming next",
    color: "bg-chalk",
  },
];

export default function Home() {
  return (
    <div className="space-y-16 py-10 sm:py-14">
      <HomeHero localities={getLocalities()} walls={wallSummaries()} />

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
              <h3 className="font-display text-xl uppercase text-ink">{d.title}</h3>
              <p className="mt-2 font-body text-ink/80">{d.text}</p>
              <span className="mt-4 inline-block font-marker text-lg text-rust">{d.cta} →</span>
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
