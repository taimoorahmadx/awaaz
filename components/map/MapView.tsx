"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { MapIcon } from "lucide-react";
import { useComplaints } from "@/lib/data/storage";
import { RESOLVED_HEX, URGENCY_HEX } from "@/lib/labels";
import MapDrawer from "./MapDrawer";

// Leaflet touches `window` at import time: client-only, never SSR.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-civic-surface text-civic-muted">
      <MapIcon className="h-6 w-6 animate-pulse" aria-hidden="true" />
      <span className="sr-only">Loading map…</span>
    </div>
  ),
});

const LEGEND = [
  { label: "Critical", color: URGENCY_HEX.CRITICAL },
  { label: "High", color: URGENCY_HEX.HIGH },
  { label: "Medium", color: URGENCY_HEX.MEDIUM },
  { label: "Resolved", color: RESOLVED_HEX },
];

/** Map tab: full-height Leaflet map + legend + bottom drawer for the tapped pin. */
export default function MapView() {
  const { complaints } = useComplaints();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = complaints.find((c) => c.id === selectedId) ?? null;
  const close = useCallback(() => setSelectedId(null), []);

  return (
    <div className="relative min-h-[420px] flex-1 overflow-hidden">
      {/* `isolate` keeps Leaflet's z-indexed panes below the sticky header and bottom nav. */}
      <div className="absolute inset-0 isolate z-0">
        <LeafletMap complaints={complaints} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <ul
        aria-label="Pin colour legend"
        className="pointer-events-none absolute left-2 top-2 z-10 flex gap-2 rounded-full border border-civic-border bg-civic-surface/90 px-2.5 py-1 text-[10px] font-medium text-slate-200 backdrop-blur"
      >
        {LEGEND.map(({ label, color }) => (
          <li key={label} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>

      <MapDrawer complaint={selected} onClose={close} />
    </div>
  );
}
