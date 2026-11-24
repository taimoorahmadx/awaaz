"use client";

import { useEffect, useRef } from "react";
import { ArrowBigUp, Building2, MapPin, X } from "lucide-react";
import type { Complaint } from "@/lib/types";
import {
  DEPARTMENT_LABELS,
  STATUS_BADGE,
  STATUS_LABELS,
  URGENCY_BADGE,
  URGENCY_HEX,
  URGENCY_LABELS,
} from "@/lib/labels";

interface MapDrawerProps {
  complaint: Complaint | null;
  onClose: () => void;
}

/** Slide-up bottom sheet for the tapped map pin. */
export default function MapDrawer({ complaint, onClose }: MapDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const openId = complaint?.id;

  // Move focus into the sheet when it opens; Escape closes it.
  useEffect(() => {
    if (!openId) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId, onClose]);

  if (!complaint) return null;

  const photo = complaint.afterPhotoUrl && complaint.status === "RESOLVED"
    ? complaint.afterPhotoUrl
    : complaint.beforePhotoUrl;

  return (
    <section
      key={complaint.id}
      aria-labelledby="map-drawer-title"
      className="absolute inset-x-0 bottom-0 z-10 animate-sheet-up rounded-t-2xl border-t border-civic-border bg-civic-raised/95 p-4 pt-2 shadow-2xl shadow-black/70 backdrop-blur"
    >
      {/* Grab handle */}
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-civic-border" aria-hidden="true" />

      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- local offline SVG, no optimisation needed */}
        <img
          src={photo}
          alt={`Photo of ${complaint.category.toLowerCase()} at ${complaint.location.landmark}`}
          className="h-24 w-24 shrink-0 rounded-xl border border-civic-border bg-civic-surface object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2
              id="map-drawer-title"
              lang="ur"
              className="urdu line-clamp-2 flex-1 text-right text-base font-bold text-slate-50"
            >
              {complaint.titleUrdu}
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="-mr-1 -mt-0.5 shrink-0 rounded-full p-1.5 text-civic-muted transition hover:bg-civic-surface hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="truncate text-sm text-slate-300">{complaint.title}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-civic-muted">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {complaint.location.landmark} · {complaint.location.sector}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${URGENCY_BADGE[complaint.urgency]}`}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: URGENCY_HEX[complaint.urgency] }}
            aria-hidden="true"
          />
          {URGENCY_LABELS[complaint.urgency]}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-civic-surface px-2 py-0.5 text-slate-200 ring-1 ring-civic-border">
          <Building2 className="h-3 w-3" aria-hidden="true" />
          {DEPARTMENT_LABELS[complaint.department]}
        </span>
        <span className={`rounded-full px-2 py-0.5 ring-1 ${STATUS_BADGE[complaint.status]}`}>
          {STATUS_LABELS[complaint.status]}
        </span>
        <span
          className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-civic-accent/15 px-2 py-0.5 text-civic-accent ring-1 ring-civic-accent/40"
          aria-label={`${complaint.votes.score} upvotes`}
        >
          <ArrowBigUp className="h-3.5 w-3.5" aria-hidden="true" />
          {complaint.votes.score}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-civic-muted">Reported by {complaint.reporter.citizenName}</p>
    </section>
  );
}
