"use client";

import { AlertTriangle, CheckCircle2, MapPin, PlusCircle, Users } from "lucide-react";
import type { Complaint } from "@/lib/types";
import { STATUS_BADGE, STATUS_LABELS, URGENCY_BADGE, URGENCY_HEX, URGENCY_LABELS } from "@/lib/labels";

interface DuplicateCardProps {
  complaint: Complaint;
  distanceMeters: number;
  citizenId: string;
  impactSubmitted: boolean;
  onImpactMeToo: () => void;
  onSubmitSeparate: () => void;
}

/**
 * In-thread proximity duplicate prompt (AC-11.1, AC-11.2):
 * lets a citizen add "+1 Impacts Me Too" to an existing nearby ticket or submit separately.
 */
export default function DuplicateCard({
  complaint,
  distanceMeters,
  citizenId,
  impactSubmitted,
  onImpactMeToo,
  onSubmitSeparate,
}: DuplicateCardProps) {
  const confirmedList = complaint.communityImpact.impactConfirmedBy ?? [];
  const isReporter = complaint.reporter.citizenId === citizenId;
  const alreadyConfirmed = isReporter || confirmedList.includes(citizenId);
  const roundedMeters = Math.max(0, Math.round(distanceMeters));

  return (
    <article
      data-testid="duplicate-card"
      data-complaint-id={complaint.id}
      className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-civic-raised p-4 text-left shadow-lg shadow-black/30"
    >
      <div className="flex items-start gap-2 text-amber-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-xs font-semibold">
          A similar issue was reported ~{roundedMeters} m away
        </p>
      </div>

      <div className="mt-3 flex gap-3 rounded-xl border border-civic-border bg-civic-surface p-2.5">
        {complaint.beforePhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local offline asset or compressed JPEG
          <img
            src={complaint.beforePhotoUrl}
            alt={complaint.title}
            className="h-16 w-16 shrink-0 rounded-lg border border-civic-border object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${URGENCY_BADGE[complaint.urgency]}`}>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: URGENCY_HEX[complaint.urgency] }}
                aria-hidden="true"
              />
              {URGENCY_LABELS[complaint.urgency]}
            </span>
            <span className={`rounded-full px-2 py-0.5 ring-1 ${STATUS_BADGE[complaint.status]}`}>
              {STATUS_LABELS[complaint.status]}
            </span>
          </div>

          <h4 className="mt-1 truncate text-sm font-semibold text-slate-50">{complaint.title}</h4>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-civic-muted">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            {complaint.location.landmark}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-300">
            <Users className="h-3 w-3 shrink-0 text-civic-accent" aria-hidden="true" />
            <span data-testid="duplicate-impact-count">{complaint.communityImpact.affectedCount}</span> affected
            {confirmedList.length > 0 && (
              <span className="text-civic-muted">· {confirmedList.length} +1 confirmed</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onImpactMeToo}
          disabled={alreadyConfirmed}
          data-testid="impact-me-too-btn"
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent ${
            alreadyConfirmed
              ? "cursor-default border border-civic-border bg-civic-surface text-civic-muted"
              : "bg-civic-accent text-civic-bg hover:bg-civic-accent-strong"
          }`}
        >
          {alreadyConfirmed ? (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              You already reported this
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              +1 Impacts Me Too
            </>
          )}
        </button>

        {impactSubmitted ? (
          <p className="text-center text-xs text-emerald-300" data-testid="impact-confirmed-msg">
            ✓ Impact added to existing ticket — no duplicate created.
          </p>
        ) : (
          <button
            type="button"
            onClick={onSubmitSeparate}
            data-testid="submit-separate-ticket-btn"
            className="w-full rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
          >
            Submit as Separate Ticket
          </button>
        )}
      </div>
    </article>
  );
}

