"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { searchLocalities } from "@/lib/localities";
import type { Locality } from "@/lib/types";

export default function SearchBox({ localities }: { localities: Locality[] }) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [missing, setMissing] = useState(false);

  const matches = useMemo(
    () => searchLocalities(localities, query).slice(0, 8),
    [localities, query],
  );
  const showList = open && matches.length > 0;

  function go(locality: Locality) {
    setOpen(false);
    setQuery(locality.name);
    router.push(`/area/${locality.slug}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pick = matches[active] ?? matches[0];
    if (pick) go(pick);
    else if (query.trim()) setMissing(true);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Chennai locality
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder="Type a Chennai locality, e.g. Velachery"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
            setMissing(false);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
        <button
          type="submit"
          className="rounded-xl bg-teal-700 px-5 py-3.5 font-medium text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Search
        </button>
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg"
        >
          {matches.map((locality, i) => (
            <li
              key={locality.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click, so it fires before the input's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                go(locality);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-3 ${i === active ? "bg-teal-50 text-teal-900" : "text-slate-800"}`}
            >
              {locality.name}
            </li>
          ))}
        </ul>
      )}

      {missing && (
        <p className="mt-3 text-sm text-slate-600">
          We don&apos;t cover &ldquo;{query}&rdquo; yet. Try a nearby locality.
        </p>
      )}
    </form>
  );
}
