"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { MapFocus } from "./SpotMap";
import { normalise, searchLocalities } from "@/lib/localities";
import { daysSince, distanceKm, insideChennai, KIND, SPOT_KINDS, STALE_DAYS, TRUST_LABEL, type PublicSpot, type SpotKind } from "@/lib/spots";
import type { Locality } from "@/lib/types";

const SpotMap = dynamic(() => import("./SpotMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[22rem] w-full place-items-center rounded-[20px] border-[4px] border-ink bg-chalk font-display text-sm uppercase text-ink/60 shadow-[6px_6px_0_#121212] sm:h-[30rem]">
      Loading the map…
    </div>
  ),
});

// The form reads today's date, so it renders in the browser only.
const AddSpotForm = dynamic(() => import("./AddSpotForm"), {
  ssr: false,
  loading: () => <span className="inline-block h-[52px] w-40 rounded-2xl border-[4px] border-ink bg-rust/60" aria-hidden="true" />,
});

/** Real places to cool off and drink water the community is trying to map. */
const CHALLENGE_GOAL = 100;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function seenText(s: PublicSpot): string {
  if (s.trust === "reference") return `${s.photo ? "Photo from" : "Reported"} ${MONTHS[Number(s.seen_on.slice(5, 7)) - 1]} ${s.seen_on.slice(0, 4)}`;
  const date = s.seen_on;
  const d = daysSince(date);
  return d === 0 ? "Seen today" : d === 1 ? "Seen yesterday" : `Seen ${d} days ago`;
}

function TrustBadge({ trust }: { trust: PublicSpot["trust"] }) {
  const style =
    trust === "demo"
      ? "border-dashed border-ink/60 bg-white text-ink/70"
      : trust === "reference"
        ? "border-ink bg-sun text-ink"
        : trust === "verified"
        ? "border-ink bg-[#2f7d4f] text-chalk"
        : "border-ink bg-sign text-chalk";
  return (
    <span title={TRUST_LABEL[trust].text} className={`inline-block rounded-full border-2 px-2 py-0.5 font-display text-[10px] uppercase tracking-wide ${style}`}>
      {trust === "verified" ? "✓ " : ""}
      {TRUST_LABEL[trust].label}
    </span>
  );
}

function KindIcon({ kind, size = 28 }: { kind: SpotKind; size?: number }) {
  const k = KIND[kind];
  return (
    <span className="grid shrink-0 place-items-center rounded-full border-2 border-ink" style={{ background: k.color, width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size * 0.58} height={size * 0.58} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={k.icon} />
      </svg>
    </span>
  );
}

export default function SpotsExplorer({ localities }: { localities: Locality[] }) {
  const [spots, setSpots] = useState<PublicSpot[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [kinds, setKinds] = useState<Set<SpotKind>>(new Set(SPOT_KINDS.map((k) => k.id)));
  const [showDemo, setShowDemo] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [meState, setMeState] = useState<"idle" | "finding" | "error">("idle");
  const [confirmed, setConfirmed] = useState<Record<string, string>>({});
  const cards = useRef<Record<string, HTMLLIElement | null>>({});
  const focusSeq = useRef(0);

  const names = useMemo(() => Object.fromEntries(localities.map((l) => [l.slug, l.name])), [localities]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/spots", { cache: "no-store" });
      const data = (await res.json()) as { spots: PublicSpot[]; error: string | null };
      setSpots(data.spots);
      setLoadError(data.error);
    } catch {
      setLoadError("The map couldn't load. Check your connection and refresh.");
      setSpots([]);
    }
  }, []);

  useEffect(() => {
    let live = true;
    fetch("/api/spots", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { spots: PublicSpot[]; error: string | null }) => {
        if (!live) return;
        setSpots(data.spots);
        setLoadError(data.error);
      })
      .catch(() => {
        if (!live) return;
        setLoadError("The map couldn't load. Check your connection and refresh.");
        setSpots([]);
      });
    return () => {
      live = false;
    };
  }, []);

  const areaMatches = useMemo(() => searchLocalities(localities, query).slice(0, 3), [localities, query]);

  const visible = useMemo(() => {
    const q = normalise(query);
    const areaSlugs = new Set(areaMatches.map((l) => l.slug));
    const list = (spots ?? []).filter((s) => {
      if (!kinds.has(s.kind)) return false;
      if (!showDemo && s.trust === "demo") return false;
      if (!q) return true;
      return areaSlugs.has(s.locality) || normalise(`${s.landmark} ${s.note} ${names[s.locality] ?? ""}`).includes(q);
    });
    const rank = (s: PublicSpot) => (s.trust === "demo" ? 2 : s.trust === "reference" ? 1 : 0);
    return list.sort((a, b) =>
      me
        ? distanceKm(me.lat, me.lon, a.lat, a.lon) - distanceKm(me.lat, me.lon, b.lat, b.lon)
        : rank(a) - rank(b) || b.seen_on.localeCompare(a.seen_on),
    );
  }, [spots, kinds, showDemo, query, areaMatches, names, me]);

  const real = (spots ?? []).filter((s) => s.trust === "community" || s.trust === "verified");
  const challengeCount = real.filter((s) => s.kind === "shade" || s.kind === "water-point").length;

  const select = useCallback((id: string) => {
    setSelectedId(id);
    cards.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  function showOnMap(s: PublicSpot) {
    setSelectedId(s.id);
    setFocus({ lat: s.lat, lon: s.lon, zoom: 16, key: ++focusSeq.current });
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    const area = areaMatches[0];
    if (area) setFocus({ lat: area.lat, lon: area.lon, zoom: 14, key: ++focusSeq.current });
  }

  function nearMe() {
    if (!navigator.geolocation) return setMeState("error");
    setMeState("finding");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lon: p.coords.longitude };
        if (!insideChennai(here.lat, here.lon)) return setMeState("error");
        setMe(here);
        setMeState("idle");
        setFocus({ ...here, zoom: 14, key: ++focusSeq.current });
      },
      () => setMeState("error"),
      { timeout: 10_000 },
    );
  }

  async function stillHere(s: PublicSpot) {
    const res = await fetch(`/api/spots/${s.id}/confirm`, { method: "POST" }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { confirms?: number; error?: string };
    if (res?.ok && typeof data.confirms === "number") {
      setSpots((list) => (list ?? []).map((x) => (x.id === s.id ? { ...x, confirms: data.confirms! } : x)));
      setConfirmed((c) => ({ ...c, [s.id]: "Thanks, counted." }));
    } else {
      setConfirmed((c) => ({ ...c, [s.id]: data.error ?? "Couldn't count that. Try again." }));
    }
  }

  function toggleKind(id: SpotKind) {
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const typedArea = query.trim() && areaMatches[0];
  const noneInArea = typedArea && spots && visible.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <AddSpotForm localities={localities} onAdded={load} />
        <button
          type="button"
          onClick={nearMe}
          disabled={meState === "finding"}
          className="rounded-2xl border-[4px] border-ink bg-chalk px-4 py-3 font-display text-sm uppercase text-ink shadow-[4px_4px_0_#121212] disabled:opacity-60"
        >
          {meState === "finding" ? "Finding you…" : "Near me"}
        </button>
        {meState === "error" && <span className="font-body text-sm text-rust">Couldn&apos;t find you inside Chennai.</span>}
      </div>

      <form role="search" onSubmit={search} className="flex gap-2">
        <label htmlFor="spot-search" className="sr-only">
          Search an area or landmark
        </label>
        <input
          id="spot-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search an area or landmark, e.g. Guindy"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border-[3px] border-ink bg-white px-4 py-3 font-body outline-none focus:ring-2 focus:ring-sign/40"
        />
        <button type="submit" className="rounded-xl border-[3px] border-ink bg-sign px-4 py-3 font-display text-sm uppercase text-chalk">
          Go
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Show these kinds of spots">
        {SPOT_KINDS.map((k) => {
          const on = kinds.has(k.id);
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggleKind(k.id)}
              className={`flex items-center gap-2 rounded-full border-[3px] border-ink py-1 pl-1 pr-3 font-body text-sm transition ${on ? "bg-chalk" : "bg-white/40 opacity-50"}`}
            >
              <KindIcon kind={k.id} size={24} />
              {k.label}
            </button>
          );
        })}
        {spots?.some((s) => s.trust === "demo") && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={showDemo} onChange={(e) => setShowDemo(e.target.checked)} className="h-4 w-4 accent-ink" />
            Show demo examples
          </label>
        )}
      </div>

      {loadError && <p className="rounded-xl border-[3px] border-rust bg-chalk px-3 py-2 font-body text-sm text-rust">{loadError}</p>}

      <SpotMap spots={visible} selectedId={selectedId} onSelect={select} focus={focus} me={me} />

      <p className="font-body text-sm text-ink/70">
        <strong>Reference</strong> pins are real places the team added, each with a credited photo or a news source. Everything else comes from residents.
        {real.length === 0 && spots ? " There are no resident reports yet." : ""}
      </p>

      {/* The challenge counts real reports only. Demo entries never count. */}
      <section className="rounded-[24px] border-[4px] border-ink bg-ink p-5 text-chalk shadow-[6px_6px_0_#B5451B]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-marker text-lg text-sun">The 100 spots challenge</p>
            <h2 className="font-display text-lg uppercase leading-tight sm:text-xl">
              Map {CHALLENGE_GOAL} places to sit in the shade or drink water, before next summer
            </h2>
          </div>
          <p className="font-display text-3xl text-sun">
            {spots ? challengeCount : "–"}
            <span className="text-base text-chalk/70"> / {CHALLENGE_GOAL}</span>
          </p>
        </div>
        <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-chalk bg-ink" role="progressbar" aria-valuemin={0} aria-valuemax={CHALLENGE_GOAL} aria-valuenow={challengeCount} aria-label="Real spots mapped so far">
          <div className="h-full bg-sun" style={{ width: `${Math.min(100, (challengeCount / CHALLENGE_GOAL) * 100)}%` }} />
        </div>
        <p className="mt-2 font-body text-sm text-chalk/80">
          Only real, photo-checked reports count. {challengeCount === 0 ? "None yet, so the first one could be yours." : ""}
        </p>
      </section>

      {noneInArea ? (
        <div className="rounded-[20px] border-[4px] border-ink bg-chalk p-5">
          <p className="font-display uppercase">Nothing in {typedArea.name} yet</p>
          <p className="mt-1 font-body text-ink/80">Know a shady place to sit or a free water tap there? Add it and you&apos;re the first.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visible.map((s) => {
            const k = KIND[s.kind];
            const stale = STALE_DAYS[s.kind] !== undefined && daysSince(s.seen_on) > STALE_DAYS[s.kind]!;
            const dist = me ? distanceKm(me.lat, me.lon, s.lat, s.lon) : null;
            return (
              <li
                key={s.id}
                ref={(el) => {
                  cards.current[s.id] = el;
                }}
                className={`overflow-hidden rounded-[20px] border-[4px] bg-chalk shadow-[5px_5px_0_#121212] ${s.trust === "demo" ? "border-dashed border-ink/70" : "border-ink"} ${selectedId === s.id ? "ring-4 ring-rust" : ""}`}
              >
                {s.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo} alt={`Photo of ${k.label.toLowerCase()}: ${s.landmark}`} loading="lazy" className="h-40 w-full border-b-[3px] border-ink object-cover" />
                ) : (
                  <div className="demo-photo grid h-28 place-items-center border-b-[3px] border-dashed border-ink/60 px-4 text-center font-display text-xs uppercase text-ink/60">
                    {s.trust === "demo" ? "Demo entry, no real photo" : "No photo yet. Been here? Add one."}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <KindIcon kind={s.kind} size={24} />
                    <span className="font-display text-xs uppercase">{k.label}</span>
                    <TrustBadge trust={s.trust} />
                  </div>
                  <p className="mt-2 font-body font-semibold leading-snug">{s.landmark}</p>
                  <p className="font-body text-sm text-ink/70">
                    {names[s.locality] ?? s.locality} · {seenText(s)}
                    {dist !== null ? ` · ${dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`} away` : ""}
                  </p>
                  {stale && <p className="mt-1 font-body text-sm text-rust">Water drains. This may be gone now.</p>}
                  {s.note && <p className="mt-2 font-body text-sm">&ldquo;{s.note}&rdquo;</p>}
                  {s.trust === "reference" ? (
                    <p className="mt-1 font-marker text-sm text-rust">Added by the Chennai Unsaid team</p>
                  ) : s.trust !== "demo" ? (
                    <p className="mt-1 font-marker text-sm text-rust">Shared by {s.by ?? "a resident"}</p>
                  ) : null}
                  {s.source && (
                    <p className="mt-1 font-body text-xs text-ink/60">
                      Source:{" "}
                      <a href={s.source.url} target="_blank" rel="noreferrer" className="underline">
                        {s.source.title}
                      </a>
                    </p>
                  )}
                  {s.credit && (
                    <p className="mt-1 font-body text-xs text-ink/60">
                      Photo:{" "}
                      <a href={s.credit.url} target="_blank" rel="noreferrer" className="underline">
                        {s.credit.author}
                      </a>
                      , {s.credit.license}, via Wikimedia Commons
                    </p>
                  )}
                  <p className="mt-2 font-body text-xs text-ink/60">{TRUST_LABEL[s.trust].text}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => showOnMap(s)} className="rounded-xl border-[3px] border-ink bg-sun px-3 py-1 font-display text-xs uppercase">
                      Show on map
                    </button>
                    {(s.trust === "community" || s.trust === "verified") && (
                      <button
                        type="button"
                        onClick={() => stillHere(s)}
                        disabled={Boolean(confirmed[s.id])}
                        className="rounded-xl border-[3px] border-ink bg-white px-3 py-1 font-display text-xs uppercase disabled:opacity-60"
                      >
                        Still here{s.confirms > 0 ? ` · ${s.confirms}` : ""}
                      </button>
                    )}
                    {confirmed[s.id] && <span className="font-body text-xs text-ink/70">{confirmed[s.id]}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
