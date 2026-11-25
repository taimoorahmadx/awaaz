"use client";

import dynamic from "next/dynamic";
import { ExternalLink, MapIcon, MapPin } from "lucide-react";
import type { Complaint } from "@/lib/types";
import { STATUS_BADGE, STATUS_LABELS, URGENCY_BADGE, URGENCY_LABELS } from "@/lib/labels";
import BeforeAfterViewer from "./BeforeAfterViewer";

const noop = () => {};

// Leaflet touches `window` at import time: client-only, never SSR.
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-civic-surface text-civic-muted">
      <MapIcon className="h-5 w-5 animate-pulse" aria-hidden="true" />
      <span className="sr-only">Loading route map…</span>
    </div>
  ),
});

interface WorkerHomeProps {
  complaints: Complaint[];
  workerId: string;
  onUpdateComplaint: (complaint: Complaint) => void;
}

/** Worker Home tab: assigned active route cards (mini map + Google Maps link + AI verification). */
export default function WorkerHome({ complaints, workerId, onUpdateComplaint }: WorkerHomeProps) {
  const assigned = complaints.filter((c) => c.assignedTo?.workerId === workerId);
  const inProgress = assigned.filter((c) => c.status === "IN_PROGRESS");
  const awaitingSignOff = assigned.filter((c) => c.status === "PENDING_COMMUNITY_VERIFICATION");
  // Keep IN_PROGRESS first and PENDING_COMMUNITY_VERIFICATION in the same list so BeforeAfterViewer stays mounted on verify.
  const myWork = [...inProgress, ...awaitingSignOff];

  if (myWork.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-civic-muted">
        No claimed tickets assigned to you. Claim one from the Queue.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between text-xs text-civic-muted">
        <span className="font-semibold text-slate-200">
          My Active Jobs ({inProgress.length} In Progress)
        </span>
        {awaitingSignOff.length > 0 && (
          <span>{awaitingSignOff.length} Awaiting Sign-off</span>
        )}
      </div>

      {myWork.map((c) => {
        const { lat, lng, landmark, sector } = c.location;
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        const isInProgress = c.status === "IN_PROGRESS";

        return (
          <article
            key={c.id}
            data-testid="worker-ticket"
            data-complaint-id={c.id}
            className="flex flex-col gap-3 rounded-2xl bg-civic-raised p-3 ring-1 ring-civic-border"
          >
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${URGENCY_BADGE[c.urgency]}`}>
                {URGENCY_LABELS[c.urgency]}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${STATUS_BADGE[c.status]}`}>
                {STATUS_LABELS[c.status]}
              </span>
              <span className="ml-auto text-[11px] text-civic-muted">{sector}</span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-50">{c.title}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-civic-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-civic-accent" aria-hidden="true" />
                <span>{landmark}</span>
              </p>
            </div>

            {isInProgress && (
              <div
                data-testid="worker-route-card"
                className="flex flex-col gap-2 rounded-xl border border-civic-border bg-civic-surface p-2.5"
              >
                <div className="relative isolate z-0 h-32 w-full overflow-hidden rounded-lg border border-civic-border">
                  <LeafletMap
                    complaints={[c]}
                    selectedId={c.id}
                    onSelect={noop}
                    center={[lat, lng]}
                    zoom={15}
                    showZoomControl={false}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span data-testid="worker-route-coords" className="font-mono text-[11px] text-civic-muted">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-civic-accent/40 bg-civic-accent/15 px-2.5 py-1.5 text-xs font-medium text-civic-accent transition hover:bg-civic-accent/25"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}

            <BeforeAfterViewer complaint={c} onUpdateComplaint={onUpdateComplaint} />
          </article>
        );
      })}
    </section>
  );
}

