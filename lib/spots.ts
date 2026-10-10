// Community spots: shared by the server routes and the map page. No server-only imports here.

export type SpotKind = "shade" | "no-shade" | "water-point" | "waterlogged";

/** pending: waiting for a photo check. community: photo checked, shown. verified: checked by us. */
export type SpotStatus = "pending" | "community" | "verified" | "rejected";

/** How much to trust a pin, shown as a label on every spot. */
export type Trust = "demo" | "community" | "verified";

export interface SpotKindInfo {
  id: SpotKind;
  theme: "heat" | "water";
  label: string;
  /** What to photograph, shown in the form. */
  hint: string;
  /** The one-line question for this kind. */
  why: string;
  whyExample: string;
  color: string;
  /** SVG path drawn in a 24×24 box, white stroke. */
  icon: string;
}

export const SPOT_KINDS: SpotKindInfo[] = [
  {
    id: "shade",
    theme: "heat",
    label: "Shade to rest",
    hint: "A tree, a covered bench, a library or temple hall where anyone can sit out of the sun.",
    why: "Why is it a good spot?",
    whyExample: "e.g. Big neem trees and benches, open till 9 pm",
    color: "#2f7d4f",
    icon: "M12 3a5 5 0 0 0-4.6 7A4 4 0 0 0 8 18h8a4 4 0 0 0 .6-8A5 5 0 0 0 12 3zM12 18v3",
  },
  {
    id: "no-shade",
    theme: "heat",
    label: "No-shade stretch",
    hint: "A road or walk with no shade at all, like a bus stop with no roof or a long bare footpath.",
    why: "What makes it hard?",
    whyExample: "e.g. Bus stop with no roof, 20 minute waits in the sun",
    color: "#b5451b",
    icon: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  },
  {
    id: "water-point",
    theme: "water",
    label: "Free drinking water",
    hint: "A public tap, water ATM, pot or dispenser anyone can drink from.",
    why: "Why is it useful?",
    whyExample: "e.g. Clean free tap, working every day, near the bus stop",
    color: "#1f5fa8",
    icon: "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z",
  },
  {
    id: "waterlogged",
    theme: "water",
    label: "Waterlogged street",
    hint: "A street or underpass where water is standing after rain. Show how deep it is.",
    why: "How bad is it?",
    whyExample: "e.g. Knee deep, bikes turning back",
    color: "#7a5a2f",
    icon: "M3 9c3-2 6 2 9 0s6-2 9 0M3 15c3-2 6 2 9 0s6-2 9 0",
  },
];

export const KIND = Object.fromEntries(SPOT_KINDS.map((k) => [k.id, k])) as Record<SpotKind, SpotKindInfo>;

/** What the map gets. Never includes pending or rejected spots. */
export interface PublicSpot {
  id: string;
  kind: SpotKind;
  trust: Trust;
  locality: string;
  landmark: string;
  note: string;
  lat: number;
  lon: number;
  /** YYYY-MM-DD, the day the person saw it. */
  seen_on: string;
  confirms: number;
  /** Name the person chose to show, or null. */
  by: string | null;
  /** null for demo entries, which have no real photo. */
  photo: string | null;
}

/** "Still here" taps needed before a community pin counts as verified. */
export const CONFIRMS_TO_VERIFY = 3;

export const TRUST_LABEL: Record<Trust, { label: string; text: string }> = {
  demo: { label: "Demo", text: "Example only, to show how the map works. Not a real report." },
  community: { label: "Community report", text: "Sent by a resident. We checked the photo, not the place." },
  verified: { label: "Verified", text: `Confirmed by ${CONFIRMS_TO_VERIFY} or more people, or checked by us.` },
};

/** Waterlogging drains away, so these reports go stale fast. Shade and water points don't. */
export const STALE_DAYS: Partial<Record<SpotKind, number>> = { waterlogged: 3 };

/** Rough box around Chennai and its suburbs. Pins outside it are refused. */
export const CHENNAI_BOUNDS = { south: 12.75, north: 13.35, west: 79.95, east: 80.4 };

export function insideChennai(lat: number, lon: number): boolean {
  const b = CHENNAI_BOUNDS;
  return lat >= b.south && lat <= b.north && lon >= b.west && lon <= b.east;
}

export function daysSince(date: string, now = new Date()): number {
  const then = new Date(`${date}T00:00:00+05:30`).getTime();
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}

/** Distance in km between two points. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(bLat - aLat);
  const dLon = r(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Today in Chennai, as YYYY-MM-DD. */
export function todayIST(now = new Date()): string {
  return new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}
