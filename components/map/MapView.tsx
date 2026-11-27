"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { LocateFixed, MapIcon } from "lucide-react";
import type { Complaint } from "@/lib/types";
import { useComplaints } from "@/lib/data/storage";
import { RESOLVED_HEX, URGENCY_HEX } from "@/lib/labels";
import MapDrawer from "./MapDrawer";
import ComplaintDetailModal from "@/components/feed/ComplaintDetailModal";

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

interface MapViewProps {
  viewerId?: string;
  viewerName?: string;
  onUpdateComplaint?: (c: Complaint) => void;
}

/** Map tab: full-height Leaflet map + legend + bottom drawer for the tapped pin. */
export default function MapView({ viewerId = "citizen-tariq", viewerName = "Tariq", onUpdateComplaint }: MapViewProps) {
  const { complaints } = useComplaints();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalId, setModalId] = useState<string | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const selected = complaints.find((c) => c.id === selectedId) ?? null;
  const modalComplaint = modalId ? complaints.find((c) => c.id === modalId) ?? null : null;
  const close = useCallback(() => setSelectedId(null), []);

  const handleUpdateComplaint = useCallback((c: Complaint) => {
    onUpdateComplaint?.(c);
  }, [onUpdateComplaint]);

  return (
    <div className="relative min-h-[420px] flex-1 overflow-hidden">
      {/* `isolate` keeps Leaflet's z-indexed panes below the sticky header and bottom nav. */}
      <div className="absolute inset-0 isolate z-0">
        <LeafletMap
          complaints={complaints}
          selectedId={selectedId}
          onSelect={setSelectedId}
          recenterSignal={recenterSignal}
        />
      </div>

      <button
        type="button"
        onClick={() => setRecenterSignal((n) => n + 1)}
        aria-label="Recenter map on Islamabad"
        title="Recenter map"
        className="absolute right-2.5 top-[78px] z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-civic-border bg-civic-surface text-slate-200 shadow-lg shadow-black/45 transition hover:bg-civic-raised hover:text-civic-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
      >
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
      </button>

      <ul
        aria-label="Pin colour legend"
        className="pointer-events-none absolute left-2 top-2 z-10 flex gap-2.5 rounded-full border border-civic-border bg-civic-surface/90 px-3 py-1.5 text-[11px] font-medium text-slate-200 backdrop-blur"
      >
        {LEGEND.map(({ label, color }) => (
          <li key={label} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>

      <MapDrawer complaint={selected} onClose={close} onOpenModal={(id) => { setSelectedId(null); setModalId(id); }} />

      <ComplaintDetailModal
        complaint={modalComplaint}
        viewerId={viewerId}
        viewerName={viewerName}
        onClose={() => setModalId(null)}
        onUpdateComplaint={handleUpdateComplaint}
      />
    </div>
  );
}
