"use client";

import { ChevronRight, MapPin } from "lucide-react";
import type { Complaint } from "@/lib/types";
import {
  DEPARTMENT_LABELS,
  STATUS_BADGE,
  STATUS_LABELS,
  URGENCY_BADGE,
  URGENCY_HEX,
  URGENCY_LABELS,
} from "@/lib/labels";

interface ComplaintCardEmbedProps {
  complaint: Complaint;
  onOpenDetail: (complaint: Complaint) => void;
}

/** Compact live complaint preview embedded inside a group message. Tapping opens Detail Modal. */
export default function ComplaintCardEmbed({ complaint, onOpenDetail }: ComplaintCardEmbedProps) {
  return (
    <button
      type="button"
      onClick={() => onOpenDetail(complaint)}
      data-testid="complaint-embed"
      data-complaint-id={complaint.id}
      aria-label={`View complaint details: ${complaint.title}`}
      className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-civic-border bg-civic-surface p-2 text-left transition hover:border-civic-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
    >
      {complaint.beforePhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={complaint.beforePhotoUrl}
          alt={complaint.title}
          className="h-12 w-14 shrink-0 rounded-lg object-cover ring-1 ring-civic-border"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1 text-[10px] font-semibold">
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ring-1 ${URGENCY_BADGE[complaint.urgency]}`}>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: URGENCY_HEX[complaint.urgency] }}
              aria-hidden="true"
            />
            {URGENCY_LABELS[complaint.urgency]}
          </span>
          <span className={`rounded-full px-1.5 py-0.5 ring-1 ${STATUS_BADGE[complaint.status]}`}>
            {STATUS_LABELS[complaint.status]}
          </span>
        </div>
        <p className="truncate text-xs font-semibold text-slate-100">{complaint.title}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-civic-muted">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {complaint.location.sector} · {DEPARTMENT_LABELS[complaint.department]}
          </span>
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-civic-muted" aria-hidden="true" />
    </button>
  );
}

