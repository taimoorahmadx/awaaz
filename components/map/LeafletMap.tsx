"use client";

// Vanilla Leaflet in a useRef wrapper (no react-leaflet: React 19 peer conflict).
// IMPORTANT: this module touches `window` via leaflet. Only load it through
// `next/dynamic(() => import("./LeafletMap"), { ssr: false })` (see MapView.tsx).

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Complaint } from "@/lib/types";
import { URGENCY_LABELS, complaintColor } from "@/lib/labels";

/** F-10 Islamabad */
export const F10_CENTER: L.LatLngTuple = [33.6938, 73.0115];
const DEFAULT_ZOOM = 14;
const MAX_FIT_ZOOM = 15;

export interface LeafletMapProps {
  complaints: Complaint[];
  selectedId: string | null;
  /** Called with a complaint id on pin tap, or `null` when the empty map is tapped. */
  onSelect: (id: string | null) => void;
  /** Optional explicit center `[lat, lng]` (e.g. mini route card centered on a single pin). */
  center?: [number, number];
  /** Optional zoom level when `center` is supplied (default 15). */
  zoom?: number;
  /** Whether to show Leaflet's +/- zoom control (default true). */
  showZoomControl?: boolean;
}

/** Teardrop pin as inline SVG. Never use Leaflet's default PNG markers (404s in Next.js). */
function pinIcon(color: string, selected: boolean): L.DivIcon {
  const w = selected ? 38 : 28;
  const h = Math.round(w * 1.4);
  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40" width="${w}" height="${h}" aria-hidden="true"
      style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))">
      <path d="M14 1C7 1 1.5 6.4 1.5 13.3 1.5 22.6 14 39 14 39s12.5-16.4 12.5-25.7C26.5 6.4 21 1 14 1z"
        fill="${color}" stroke="${selected ? "#ffffff" : "#0f1622"}" stroke-width="${selected ? 2.5 : 1.5}"/>
      <circle cx="14" cy="13.5" r="5" fill="#0f1622" fill-opacity=".85"/>
    </svg>`;
  return L.divIcon({
    // Custom className replaces Leaflet's default white `leaflet-div-icon` box.
    className: "awaaz-pin",
    html,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

export default function LeafletMap({
  complaints,
  selectedId,
  onSelect,
  center,
  zoom,
  showZoomControl = true,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fittedRef = useRef(false);
  const centerLat = center?.[0];
  const centerLng = center?.[1];
  const initialCenterRef = useRef<L.LatLngTuple>(center ?? F10_CENTER);
  const initialZoomRef = useRef<number>(center ? (zoom ?? MAX_FIT_ZOOM) : DEFAULT_ZOOM);
  const showZoomRef = useRef<boolean>(showZoomControl);
  // Keep the latest callback without re-binding Leaflet handlers on every render.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once (cleanup handles React Strict Mode double-mount).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      zoomControl: false,
    });
    if (showZoomRef.current) {
      L.control.zoom({ position: "topright" }).addTo(map);
    }
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", () => onSelectRef.current(null));

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    // Keep tiles correct if the container changes size (orientation, desktop resize).
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  // (Re)draw pins whenever complaints or the selection change. 12-ish markers: cheap.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    for (const c of complaints) {
      const selected = c.id === selectedId;
      L.marker([c.location.lat, c.location.lng], {
        icon: pinIcon(complaintColor(c), selected),
        title: `${URGENCY_LABELS[c.urgency]}: ${c.title} (${c.location.sector})`,
        zIndexOffset: selected ? 1000 : 0,
        riseOnHover: true,
      })
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectRef.current(c.id);
        })
        .addTo(layer);
    }

    if (centerLat !== undefined && centerLng !== undefined) {
      fittedRef.current = true;
      map.setView([centerLat, centerLng], zoom ?? MAX_FIT_ZOOM, { animate: false });
      return;
    }

    // First load: stay centred on F-10 but zoom out just enough to show every pin.
    if (!fittedRef.current && complaints.length > 0) {
      fittedRef.current = true;
      const [lat0, lng0] = F10_CENTER;
      let dLat = 0;
      let dLng = 0;
      for (const c of complaints) {
        dLat = Math.max(dLat, Math.abs(c.location.lat - lat0));
        dLng = Math.max(dLng, Math.abs(c.location.lng - lng0));
      }
      const bounds = L.latLngBounds([lat0 - dLat, lng0 - dLng], [lat0 + dLat, lng0 + dLng]);
      const fitZoom = Math.min(map.getBoundsZoom(bounds, false, L.point(48, 48)), MAX_FIT_ZOOM);
      map.setView(F10_CENTER, fitZoom, { animate: false });
    }
  }, [complaints, selectedId, centerLat, centerLng, zoom]);

  return (
    <div
      ref={containerRef}
      className="awaaz-map h-full w-full"
      role="region"
      aria-label="Map of reported hazards in Islamabad"
    />
  );
}
