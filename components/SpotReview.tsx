"use client";

import { useEffect, useState } from "react";
import { KIND, type SpotKind } from "@/lib/spots";

interface Pending {
  id: string;
  kind: SpotKind;
  locality: string;
  landmark: string;
  note: string;
  lat: number;
  lon: number;
  seen_on: string;
  created_at: string;
  by?: string;
}

const STORE = "spots-review-key";

function readKey(): string {
  try {
    return sessionStorage.getItem(STORE) ?? "";
  } catch {
    return "";
  }
}

/** Pending photos are private, so they're fetched with the key and shown from memory. */
function PendingPhoto({ id, reviewKey }: { id: string; reviewKey: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    fetch(`/api/spots/${id}/photo`, { headers: { "x-review-key": reviewKey } })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (b) {
          url = URL.createObjectURL(b);
          setSrc(url);
        }
      });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, reviewKey]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="Submitted photo" className="max-h-80 w-full rounded-xl border-[3px] border-ink object-contain bg-white" /> : <div className="h-40 rounded-xl border-[3px] border-ink bg-white" />;
}

export default function SpotReview() {
  const [key, setKey] = useState("");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function open(k: string) {
    setError("");
    const res = await fetch("/api/spots/review", { headers: { "x-review-key": k }, cache: "no-store" }).catch(() => null);
    if (!res?.ok) {
      setError(res?.status === 401 ? "That key is wrong." : "Couldn't load. Try again.");
      return;
    }
    try {
      sessionStorage.setItem(STORE, k);
    } catch {
      // Private mode: the key just won't be remembered.
    }
    setKey(k);
    setPending(((await res.json()) as { pending: Pending[] }).pending);
  }

  useEffect(() => {
    const saved = readKey();
    if (!saved) return;
    let live = true;
    fetch("/api/spots/review", { headers: { "x-review-key": saved }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { pending: Pending[] } | null) => {
        if (!live || !data) return;
        setKey(saved);
        setPending(data.pending);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  async function act(id: string, action: "approve" | "verify" | "reject") {
    setBusy(id);
    const res = await fetch("/api/spots/review", {
      method: "POST",
      headers: { "content-type": "application/json", "x-review-key": key },
      body: JSON.stringify({ id, action }),
    }).catch(() => null);
    setBusy(null);
    if (res?.ok) setPending((list) => (list ?? []).filter((p) => p.id !== id));
    else setError("That didn't save. Try again.");
  }

  if (!key) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          open(input.trim());
        }}
        className="flex max-w-md gap-2"
      >
        <label htmlFor="review-key" className="sr-only">
          Review key
        </label>
        <input
          id="review-key"
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Review key"
          className="min-w-0 flex-1 rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-body"
        />
        <button type="submit" className="rounded-xl border-[3px] border-ink bg-ink px-4 py-2 font-display text-sm uppercase text-chalk">
          Open
        </button>
        {error && <p className="self-center font-body text-sm text-rust">{error}</p>}
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <p className="font-body text-ink/80">{pending?.length ? `${pending.length} waiting.` : "Nothing waiting. All caught up."}</p>
      {error && <p className="font-body text-sm text-rust">{error}</p>}
      {pending?.map((p) => (
        <article key={p.id} className="grid gap-4 rounded-[20px] border-[4px] border-ink bg-chalk p-4 shadow-[5px_5px_0_#121212] sm:grid-cols-2">
          <PendingPhoto id={p.id} reviewKey={key} />
          <div className="space-y-1 font-body">
            <p className="font-display text-sm uppercase">{KIND[p.kind]?.label ?? p.kind}</p>
            <p className="font-semibold">{p.landmark}</p>
            <p className="text-sm text-ink/70">
              {p.locality} · seen {p.seen_on} · sent {p.created_at.slice(0, 16).replace("T", " ")} UTC
            </p>
            {p.note && <p className="text-sm">&ldquo;{p.note}&rdquo;</p>}
            <p className="text-sm text-ink/70">Shared by {p.by || "no name given"}</p>
            <a className="text-sm text-sign underline" href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}`} target="_blank" rel="noreferrer">
              Check the pin on a map
            </a>
            <div className="flex flex-wrap gap-2 pt-3">
              <button type="button" disabled={busy === p.id} onClick={() => act(p.id, "approve")} className="rounded-xl border-[3px] border-ink bg-sign px-3 py-1 font-display text-xs uppercase text-chalk disabled:opacity-60">
                Approve
              </button>
              <button type="button" disabled={busy === p.id} onClick={() => act(p.id, "verify")} className="rounded-xl border-[3px] border-ink bg-[#2f7d4f] px-3 py-1 font-display text-xs uppercase text-chalk disabled:opacity-60">
                Approve as verified
              </button>
              <button type="button" disabled={busy === p.id} onClick={() => act(p.id, "reject")} className="rounded-xl border-[3px] border-ink bg-rust px-3 py-1 font-display text-xs uppercase text-chalk disabled:opacity-60">
                Reject and delete
              </button>
            </div>
            <p className="pt-1 text-xs text-ink/60">Only use &quot;verified&quot; if you know the place yourself.</p>
          </div>
        </article>
      ))}
    </div>
  );
}
