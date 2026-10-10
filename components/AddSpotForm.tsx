"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchLocalities } from "@/lib/localities";
import { insideChennai, SPOT_KINDS, todayIST, type SpotKind } from "@/lib/spots";
import type { Locality } from "@/lib/types";

const MAX_SIDE = 1280;

/**
 * Redraws the photo at a sensible size and saves it as a JPEG. Redrawing drops
 * the phone's hidden data, including the GPS location of where it was taken.
 */
async function shrinkPhoto(file: File): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("unreadable"));
      img.src = URL.createObjectURL(file);
    });
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("unreadable"))), "image/jpeg", 0.82),
  );
}

function AreaPicker({ localities, value, onChange }: { localities: Locality[]; value: Locality | null; onChange: (l: Locality | null) => void }) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = useMemo(() => searchLocalities(localities, query).slice(0, 6), [localities, query]);
  const showList = open && matches.length > 0 && query !== value?.name;

  function pick(l: Locality) {
    onChange(l);
    setQuery(l.name);
    setOpen(false);
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="font-display text-xs uppercase text-ink/70">
        Area
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        autoComplete="off"
        required
        value={query}
        placeholder="e.g. Velachery"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && showList) {
            e.preventDefault();
            pick(matches[active]);
          }
        }}
        className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body outline-none focus:ring-2 focus:ring-sign/40"
      />
      {showList && (
        <ul id={listId} role="listbox" className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border-[3px] border-ink bg-chalk shadow-[4px_4px_0_#121212]">
          {matches.map((l, i) => (
            <li
              key={l.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(l);
              }}
              className={`cursor-pointer px-3 py-2 font-body ${i === active ? "bg-sun" : ""}`}
            >
              {l.name}
            </li>
          ))}
        </ul>
      )}
      {query && !value && !showList && <p className="mt-1 font-body text-xs text-rust">Pick the area from the list.</p>}
    </div>
  );
}

export default function AddSpotForm({ localities, onAdded }: { localities: Locality[]; onAdded: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<SpotKind | null>(null);
  const [area, setArea] = useState<Locality | null>(null);
  const [landmark, setLandmark] = useState("");
  const [note, setNote] = useState("");
  const [by, setBy] = useState("");
  const [seenOn, setSeenOn] = useState(todayIST());
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pin, setPin] = useState<{ lat: number; lon: number } | null>(null);
  const [pinState, setPinState] = useState<"idle" | "finding" | "error">("idle");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const [minDate] = useState(() => todayIST(new Date(Date.now() - 365 * 86_400_000)));

  async function onPhoto(file: File | undefined) {
    setError("");
    if (!file) return;
    try {
      const small = await shrinkPhoto(file);
      setPhoto(small);
      setPreview(URL.createObjectURL(small));
    } catch {
      setPhoto(null);
      setPreview(null);
      setError("That photo couldn't be read. Try a JPG or PNG.");
    }
  }

  function findMe() {
    if (!navigator.geolocation) return setPinState("error");
    setPinState("finding");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lon: p.coords.longitude };
        if (!insideChennai(here.lat, here.lon)) {
          setPin(null);
          setPinState("error");
          return;
        }
        setPin(here);
        setPinState("idle");
      },
      () => setPinState("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!kind) return setError("Pick what kind of spot it is.");
    if (!photo) return setError("Add a photo.");
    if (!area) return setError("Pick the area from the list.");
    setState("sending");
    setError("");
    const body = new FormData();
    body.set("kind", kind);
    body.set("locality", area.slug);
    body.set("landmark", landmark);
    body.set("note", note);
    body.set("by", by);
    body.set("seen_on", seenOn);
    body.set("consent", consent ? "yes" : "no");
    body.set("photo", photo, "spot.jpg");
    if (pin) {
      body.set("lat", String(pin.lat));
      body.set("lon", String(pin.lon));
    }
    const res = await fetch("/api/spots", { method: "POST", body }).catch(() => null);
    if (res?.ok) {
      setState("done");
      onAdded();
    } else {
      setState("error");
      setError((await res?.json().catch(() => ({})))?.error ?? "Something went wrong. Check your connection and try again.");
    }
  }

  function reset() {
    setKind(null);
    setLandmark("");
    setNote("");
    setSeenOn(todayIST());
    setPhoto(null);
    setPreview(null);
    setPin(null);
    setConsent(false);
    setState("idle");
    setError("");
  }

  function close() {
    dialog.current?.close();
    if (state === "done") reset();
  }

  const heat = SPOT_KINDS.filter((k) => k.theme === "heat");
  const water = SPOT_KINDS.filter((k) => k.theme === "water");
  const chosen = SPOT_KINDS.find((k) => k.id === kind);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="rounded-2xl border-[4px] border-ink bg-rust px-5 py-3 font-display text-sm uppercase text-chalk shadow-[6px_6px_0_#121212] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#121212]"
      >
        + Add a spot
      </button>

      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-auto max-h-[92vh] w-[min(94vw,34rem)] overflow-y-auto rounded-[24px] border-[4px] border-ink bg-chalk p-0 text-ink shadow-[8px_8px_0_#121212] backdrop:bg-ink/60"
      >
        <form onSubmit={submit} className="p-5">
          <h2 className="font-display text-xl uppercase">Add a spot</h2>
          <p className="mt-1 font-body text-sm text-ink/70">No login. Your name is optional. We check every photo before it goes on the map.</p>

          {state === "done" ? (
            <div className="mt-5">
              <p className="font-marker text-2xl text-rust">Thank you, it&apos;s in.</p>
              <p className="mt-1 font-body text-ink/80">
                We&apos;ll check the photo and put it on the map, usually within a day. Until then it isn&apos;t public.
              </p>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={reset} className="rounded-xl border-[3px] border-ink bg-sun px-4 py-2 font-display text-sm uppercase">
                  Add another
                </button>
                <button type="button" onClick={close} className="rounded-xl border-[3px] border-ink bg-chalk px-4 py-2 font-display text-sm uppercase">
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {[
                { title: "Heat", kinds: heat },
                { title: "Water", kinds: water },
              ].map((group) => (
                <fieldset key={group.title} className="mt-4">
                  <legend className="font-display text-xs uppercase text-ink/70">{group.title}</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {group.kinds.map((k) => (
                      <label
                        key={k.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border-[3px] border-ink px-3 py-2 font-body text-sm leading-tight ${kind === k.id ? "bg-ink text-chalk" : "bg-white"}`}
                      >
                        <input type="radio" name="kind" value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} className="sr-only" />
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: k.color }} aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={k.icon} />
                          </svg>
                        </span>
                        {k.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              {chosen && <p className="mt-2 font-body text-sm text-ink/70">{chosen.hint}</p>}

              <div className="mt-4">
                <span className="font-display text-xs uppercase text-ink/70">Photo</span>
                <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border-[3px] border-dashed border-ink bg-white p-3">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Your photo" className="h-20 w-20 rounded-lg border-2 border-ink object-cover" />
                  ) : (
                    <span className="grid h-20 w-20 place-items-center rounded-lg border-2 border-ink bg-sun font-display text-2xl" aria-hidden="true">
                      +
                    </span>
                  )}
                  <span className="font-body text-sm">
                    {preview ? "Change photo" : "Take or choose a photo"}
                    <span className="block text-xs text-ink/60">Location data inside the photo is removed.</span>
                  </span>
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
                </label>
              </div>

              <div className="mt-4">
                <AreaPicker localities={localities} value={area} onChange={setArea} />
              </div>

              <label className="mt-3 block">
                <span className="font-display text-xs uppercase text-ink/70">Street or landmark</span>
                <input
                  required
                  minLength={3}
                  maxLength={80}
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite the bus depot, 2nd Main Road"
                  className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body outline-none focus:ring-2 focus:ring-sign/40"
                />
              </label>

              <div className="mt-3 rounded-xl border-[3px] border-ink bg-white p-3">
                <p className="font-display text-xs uppercase text-ink/70">Exact pin (optional)</p>
                {pin ? (
                  <p className="mt-1 font-body text-sm">
                    Pinned where you are now.{" "}
                    <button type="button" onClick={() => setPin(null)} className="underline">
                      Remove
                    </button>
                  </p>
                ) : (
                  <>
                    <p className="mt-1 font-body text-sm text-ink/70">Standing at the spot? Pin it exactly. Otherwise it shows at the area&apos;s centre.</p>
                    <button type="button" onClick={findMe} disabled={pinState === "finding"} className="mt-2 rounded-xl border-[3px] border-ink bg-sun px-3 py-1 font-display text-xs uppercase disabled:opacity-60">
                      {pinState === "finding" ? "Finding you…" : "Use my location"}
                    </button>
                    {pinState === "error" && <p className="mt-1 font-body text-xs text-rust">Couldn&apos;t get a location inside Chennai. The area&apos;s centre will be used.</p>}
                  </>
                )}
              </div>

              <label className="mt-3 block">
                <span className="font-display text-xs uppercase text-ink/70">{chosen?.why ?? "Why does this spot matter?"} (one line)</span>
                <input
                  required
                  minLength={5}
                  maxLength={120}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={chosen?.whyExample ?? "e.g. Big neem trees and benches, open till 9 pm"}
                  className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body outline-none focus:ring-2 focus:ring-sign/40"
                />
              </label>

              <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr]">
                <label className="block">
                  <span className="font-display text-xs uppercase text-ink/70">Date you saw it</span>
                  <input
                    type="date"
                    required
                    min={minDate}
                    max={todayIST()}
                    value={seenOn}
                    onChange={(e) => setSeenOn(e.target.value)}
                    className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-xs uppercase text-ink/70">Your name (optional, shown)</span>
                  <input
                    maxLength={40}
                    value={by}
                    onChange={(e) => setBy(e.target.value)}
                    placeholder="e.g. Priya, or leave blank"
                    autoComplete="given-name"
                    className="mt-1 w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body outline-none focus:ring-2 focus:ring-sign/40"
                  />
                </label>
              </div>

              <label className="mt-4 flex items-start gap-2 font-body text-sm">
                <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-rust" />
                <span>I took this photo myself. No faces, number plates or the inside of anyone&apos;s home.</span>
              </label>

              {error && <p className="mt-3 font-body text-sm text-rust">{error}</p>}

              <div className="mt-5 flex gap-3">
                <button type="submit" disabled={state === "sending"} className="rounded-xl border-[3px] border-ink bg-rust px-5 py-2 font-display text-sm uppercase text-chalk disabled:opacity-60">
                  {state === "sending" ? "Sending…" : "Send it"}
                </button>
                <button type="button" onClick={close} className="rounded-xl border-[3px] border-ink bg-chalk px-5 py-2 font-display text-sm uppercase">
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
