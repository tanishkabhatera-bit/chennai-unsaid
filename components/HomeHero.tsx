"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import Wall from "./Wall";
import { searchLocalities } from "@/lib/localities";
import type { WallSummary } from "@/lib/wall-data";
import type { Locality } from "@/lib/types";

const EXAMPLES = ["velachery", "t-nagar", "adyar", "perambur"];

export default function HomeHero({
  localities,
  walls,
}: {
  localities: Locality[];
  walls: Record<string, WallSummary>;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<Locality | null>(null);

  const matches = useMemo(() => searchLocalities(localities, query).slice(0, 7), [localities, query]);
  const showList = open && matches.length > 0 && query !== picked?.name;
  const wall = picked ? (walls[picked.slug] ?? { level: "dry" as const, years: 0, marks: [] }) : null;

  function pick(l: Locality) {
    setPicked(l);
    setQuery(l.name);
    setOpen(false);
  }

  return (
    <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="font-marker text-xl text-rust sm:text-2xl">Chennai, before you sign the lease</p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] text-ink sm:text-6xl">
          How high did
          <br />
          the water come?
        </h1>
        <p className="mt-4 max-w-md font-body text-lg text-ink/80">
          Ten years of Chennai flood news, painted on a wall. Type an area and watch.
        </p>

        <form
          role="search"
          className="relative mt-6 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const m = matches[active] ?? matches[0];
            if (m) pick(m);
          }}
        >
          <label htmlFor={id} className="sr-only">Chennai locality</label>
          <div className="flex rounded-2xl border-[4px] border-ink bg-chalk shadow-[6px_6px_0_#121212]">
            <input
              id={id}
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
              value={query}
              placeholder="Velachery, Perambur, Adyar…"
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setActive(0);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, matches.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
                if (e.key === "Escape") setOpen(false);
              }}
              className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-body text-lg text-ink outline-none placeholder:text-ink/40"
            />
            <button type="submit" className="bg-sign px-5 font-display text-sm uppercase text-chalk hover:bg-sign/90">
              Show
            </button>
          </div>
          {showList && (
            <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border-[4px] border-ink bg-chalk shadow-[6px_6px_0_#121212]">
              {matches.map((l, i) => (
                <li
                  key={l.slug}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => { e.preventDefault(); pick(l); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between px-4 py-3 font-body ${i === active ? "bg-sign text-chalk" : "text-ink"}`}
                >
                  <span>{l.name}</span>
                  <span className="font-marker text-sm opacity-70">
                    {walls[l.slug] ? `${walls[l.slug].years} flood yrs` : "no record"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((slug) => {
            const l = localities.find((x) => x.slug === slug)!;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => pick(l)}
                className={`rounded-full border-[3px] border-ink px-4 py-1.5 font-display text-xs uppercase transition ${picked?.slug === slug ? "bg-ink text-chalk" : "bg-chalk text-ink hover:bg-sun"}`}
              >
                {l.name}
              </button>
            );
          })}
        </div>

        {picked && (
          <Link
            href={`/area/${picked.slug}`}
            className="mt-6 inline-block rounded-2xl border-[4px] border-ink bg-rust px-6 py-3 font-display text-base uppercase text-chalk shadow-[6px_6px_0_#121212] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#121212]"
          >
            Open {picked.name}&apos;s wall →
          </Link>
        )}
      </div>

      <div key={picked?.slug ?? "empty"}>
        <Wall
          level={wall?.level ?? "dry"}
          marks={wall?.marks ?? []}
          title={picked ? picked.name : "Pick an area"}
        />
      </div>
    </section>
  );
}
