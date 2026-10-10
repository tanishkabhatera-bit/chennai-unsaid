"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { KIND, type PublicSpot } from "@/lib/spots";

export interface MapFocus {
  lat: number;
  lon: number;
  zoom: number;
  /** Changes on every request, so asking for the same place twice still moves the map. */
  key: number;
}

const CHENNAI_CENTRE: [number, number] = [13.03, 80.22];

function pinHtml(spot: PublicSpot, selected: boolean): string {
  const k = KIND[spot.kind];
  const cls = ["spot-pin", spot.trust === "demo" ? "spot-pin--demo" : "", selected ? "spot-pin--on" : ""].join(" ");
  return `<span class="${cls}" style="--pin:${k.color}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${k.icon}"/></svg></span>`;
}

type Leaflet = typeof import("leaflet");

function drawPins(L: Leaflet, layer: LayerGroup, spots: PublicSpot[], selectedId: string | null, onSelect: (id: string) => void) {
  layer.clearLayers();
  for (const s of spots) {
    const icon = L.divIcon({ html: pinHtml(s, s.id === selectedId), className: "spot-pin-wrap", iconSize: [34, 34], iconAnchor: [17, 17] });
    const label = `${KIND[s.kind].label}: ${s.landmark}`;
    const marker = L.marker([s.lat, s.lon], {
      icon,
      title: label,
      alt: label,
      zIndexOffset: s.id === selectedId ? 1000 : s.trust === "demo" ? 0 : 500,
      keyboard: true,
    });
    marker.on("click", () => onSelect(s.id));
    layer.addLayer(marker);
  }
}

export default function SpotMap({
  spots,
  selectedId,
  onSelect,
  focus,
  me,
}: {
  spots: PublicSpot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  focus: MapFocus | null;
  me: { lat: number; lon: number } | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const pins = useRef<LayerGroup | null>(null);
  const meMarker = useRef<Marker | null>(null);
  const leaflet = useRef<Leaflet | null>(null);
  const [ready, setReady] = useState(false);

  // Leaflet touches `window` when it loads, so it's imported in the browser only.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !box.current || map.current) return;
      leaflet.current = L;
      const m = L.map(box.current, { zoomControl: true, scrollWheelZoom: false }).setView(CHENNAI_CENTRE, 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(m);
      // Scroll zoom only after a click on the map, so the page still scrolls past it.
      m.on("click", () => m.scrollWheelZoom.enable());
      m.on("mouseout", () => m.scrollWheelZoom.disable());
      pins.current = L.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (ready && leaflet.current && pins.current) drawPins(leaflet.current, pins.current, spots, selectedId, onSelect);
  }, [ready, spots, selectedId, onSelect]);

  useEffect(() => {
    if (focus && map.current) map.current.flyTo([focus.lat, focus.lon], focus.zoom, { duration: 0.8 });
  }, [focus]);

  useEffect(() => {
    const L = leaflet.current;
    if (!ready || !L || !map.current) return;
    meMarker.current?.remove();
    meMarker.current = me
      ? L.marker([me.lat, me.lon], {
          icon: L.divIcon({ html: '<span class="me-pin"></span>', className: "spot-pin-wrap", iconSize: [18, 18], iconAnchor: [9, 9] }),
          title: "You are here",
        }).addTo(map.current)
      : null;
  }, [ready, me]);

  return (
    <div
      ref={box}
      className="h-[22rem] w-full overflow-hidden rounded-[20px] border-[4px] border-ink bg-chalk shadow-[6px_6px_0_#121212] sm:h-[30rem]"
      role="region"
      aria-label="Map of community spots"
    />
  );
}
