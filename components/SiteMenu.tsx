"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/?mode=water", title: "Water: how high did it come?", text: "A place can look perfect. Until it rains.", icon: "/driver-worried.png" },
  { href: "/?mode=heat", title: "Heat: how hot does it get?", text: "The rent is affordable. But can you live in that heat?", icon: "/driver-wipe.png" },
  { href: "/check", title: "Check a property", text: "Area, floor, parking, or paste the listing.", icon: "/icon-check.png" },
  { href: "/compare", title: "Compare two flats", text: "Flooding, heat and water side by side, with sources.", icon: "/icon-compare.png" },
  { href: "/live", title: "Right now, live", text: "Rain and heat in your area today.", icon: "/icon-monsoon.png" },
  { href: "/water", title: "Will your water last?", text: "Supply cut? Work out how many days you have.", icon: "/driver-drink.png" },
];

export default function SiteMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on Escape, and stop the page scrolling behind the open menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-xl border-[3px] border-ink bg-chalk shadow-[3px_3px_0_#121212] transition hover:bg-sun"
      >
        <span className={`h-[3px] w-6 rounded bg-ink transition ${open ? "translate-y-[8px] rotate-45" : ""}`} />
        <span className={`h-[3px] w-6 rounded bg-ink transition ${open ? "opacity-0" : ""}`} />
        <span className={`h-[3px] w-6 rounded bg-ink transition ${open ? "-translate-y-[8px] -rotate-45" : ""}`} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Site menu">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/50" />
          <nav id="site-menu" className="menu-panel absolute right-0 top-0 flex h-full w-[min(90vw,24rem)] flex-col overflow-y-auto border-l-[4px] border-ink bg-sun p-5 shadow-[-6px_0_0_#121212]">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg uppercase text-ink">Where to?</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-xl border-[3px] border-ink bg-chalk px-3 py-1 font-display text-sm uppercase hover:bg-white">
                Close
              </button>
            </div>
            <ul className="mt-5 space-y-3">
              {ITEMS.map((item) => {
                // The two home entries share "/", so neither is marked; the other pages are.
                const active = !item.href.startsWith("/?") && pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-2xl border-[3px] border-ink p-3 shadow-[4px_4px_0_#121212] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#121212] ${active ? "bg-ink text-chalk" : "bg-chalk text-ink"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.icon} alt="" className="h-14 w-14 shrink-0 object-contain" />
                      <span>
                        <span className="block font-display text-sm uppercase leading-tight">{item.title}</span>
                        <span className={`mt-0.5 block font-body text-sm ${active ? "text-chalk/80" : "text-ink/70"}`}>{item.text}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-auto pt-6 font-body text-xs text-ink/70">
              Flood marks come from news reports, checked twice. Weather is live from Open-Meteo. Not a promotion, just what listings leave out.
            </p>
          </nav>
        </div>
      )}
    </>
  );
}
