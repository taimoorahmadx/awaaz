"use client";

import { MapPin } from "lucide-react";
import type { Complaint, Urgency } from "@/lib/types";
import { DEPARTMENT_LABELS, STATUS_BADGE, STATUS_LABELS, URGENCY_BADGE, URGENCY_LABELS } from "@/lib/labels";

const URGENCY_RANK: Record<Urgency, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

interface WorkerQueueProps {
  complaints: Complaint[];
  onUpdateComplaint: (complaint: Complaint) => void;
}

/** Open (REPORTED) complaints sorted by urgency; "Claim Ticket" moves them to IN_PROGRESS. */
export default function WorkerQueue({ complaints, onUpdateComplaint }: WorkerQueueProps) {
  const open = complaints
    .filter((c) => c.status === "REPORTED")
    .sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || a.sla.hoursRemaining - b.sla.hoursRemaining);

  if (open.length === 0) {
    return <p className="px-4 py-12 text-center text-sm text-civic-muted">No open tickets. Nice work.</p>;
  }

  return (
    <ul className="flex flex-col gap-3 p-4">
      {open.map((c) => (
        <li
          key={c.id}
          data-testid="queue-ticket"
          data-complaint-id={c.id}
          className="flex flex-col gap-2 rounded-2xl bg-civic-raised p-3 ring-1 ring-civic-border">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${URGENCY_BADGE[c.urgency]}`}>
              {URGENCY_LABELS[c.urgency]}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${STATUS_BADGE[c.status]}`}>
              {STATUS_LABELS[c.status]}
            </span>
            <span className="ml-auto text-[11px] text-civic-muted">{c.sla.hoursRemaining}h SLA</span>
          </div>
          <div className="flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.beforePhotoUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-civic-border" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-50">{c.title}</h3>
              <p className="text-xs text-civic-muted">{DEPARTMENT_LABELS[c.department]} · {c.category}</p>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-civic-muted">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                {c.location.landmark}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUpdateComplaint({ ...c, status: "IN_PROGRESS", updatedAt: new Date().toISOString() })}
            className="rounded-lg bg-civic-accent px-3 py-2 text-sm font-semibold text-slate-950"
          >
            Claim Ticket
          </button>
        </li>
      ))}
    </ul>
  );
}
