"use client";

import { CheckCircle2, Clock, MapPin, Megaphone, RotateCcw, Shield, ShieldOff, UserCheck, XCircle } from "lucide-react";
import type { Complaint, ComplaintEvent, ComplaintEventType } from "@/lib/types";
import { confirmFix, rejectFix } from "@/lib/data/storage";
import CommentSection from "./CommentSection";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/common/LanguageProvider";
import { getComplaintSummary, getComplaintTitle } from "@/lib/i18n";
import {
  DEPARTMENT_LABELS,
  STATUS_BADGE,
  STATUS_LABELS,
  URGENCY_BADGE,
  URGENCY_HEX,
  URGENCY_LABELS,
  timeAgo,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  viewerId: string;
  viewerName: string;
  onClose: () => void;
  onUpdateComplaint: (c: Complaint) => void;
}

// Map event types to labels + icons + colour
const EVENT_META: Record<ComplaintEventType, { label: string; color: string }> = {
  REPORTED:            { label: "Reported",               color: "text-slate-300" },
  CLAIMED:             { label: "Claimed by worker",      color: "text-blue-300" },
  UNCLAIMED:           { label: "Returned to queue",      color: "text-slate-300" },
  WORKER_FIXED:        { label: "Marked fixed by worker", color: "text-emerald-400" },
  AI_VERIFIED:         { label: "AI Verified",            color: "text-green-400" },
  AI_REJECTED:         { label: "AI Rejected",            color: "text-red-400" },
  COMMUNITY_CONFIRMED: { label: "Community Confirmed",    color: "text-cyan-300" },
  FIX_REJECTED:        { label: "Reopened by citizen",    color: "text-amber-300" },
  RESOLVED:            { label: "Resolved",               color: "text-green-300" },
  IMPACT_ADDED:        { label: "Impact Added",           color: "text-slate-300" },
  URGENCY_RAISED:      { label: "Urgency Raised",         color: "text-amber-300" },
  DISPATCHED:          { label: "Rapid crew dispatched",  color: "text-red-300" },
};

function EventIcon({ type }: { type: ComplaintEventType }) {
  const size = "h-4 w-4 shrink-0 mt-0.5";
  switch (type) {
    case "REPORTED":            return <Clock className={cn(size, "text-slate-400")} aria-hidden />;
    case "CLAIMED":             return <UserCheck className={cn(size, "text-blue-300")} aria-hidden />;
    case "UNCLAIMED":           return <RotateCcw className={cn(size, "text-slate-400")} aria-hidden />;
    case "WORKER_FIXED":        return <CheckCircle2 className={cn(size, "text-emerald-400")} aria-hidden />;
    case "AI_VERIFIED":         return <Shield className={cn(size, "text-green-400")} aria-hidden />;
    case "AI_REJECTED":         return <ShieldOff className={cn(size, "text-red-400")} aria-hidden />;
    case "COMMUNITY_CONFIRMED": return <CheckCircle2 className={cn(size, "text-cyan-300")} aria-hidden />;
    case "FIX_REJECTED":        return <RotateCcw className={cn(size, "text-amber-300")} aria-hidden />;
    case "RESOLVED":            return <CheckCircle2 className={cn(size, "text-green-300")} aria-hidden />;
    case "DISPATCHED":          return <Megaphone className={cn(size, "text-red-300")} aria-hidden />;
    default:                    return <Clock className={cn(size, "text-slate-400")} aria-hidden />;
  }
}

function HistoryTimeline({ events }: { events: ComplaintEvent[] }) {
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  return (
    <ol aria-label="Lifecycle timeline" className="flex flex-col gap-0">
      {sorted.map((ev, i) => {
        const meta = EVENT_META[ev.type] ?? { label: ev.type, color: "text-slate-300" };
        const isLast = i === sorted.length - 1;
        return (
          <li key={`${ev.type}-${ev.at}-${i}`} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className="mt-0.5">
                <EventIcon type={ev.type} />
              </div>
              {!isLast && <div className="mt-1 w-px flex-1 bg-civic-border" />}
            </div>
            <div className={`pb-4 ${isLast ? "" : ""}`}>
              <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
              <p className="text-[11px] text-civic-muted">
                {ev.actorName} · <time dateTime={ev.at}>{timeAgo(ev.at)}</time>
              </p>
              {ev.note && (
                <p className="mt-0.5 text-[11px] text-slate-400 italic">{ev.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function ComplaintDetailModal({
  complaint,
  viewerId,
  viewerName,
  onClose,
  onUpdateComplaint,
}: ComplaintDetailModalProps) {
  const { lang, t, isRtl } = useLanguage();
  if (!complaint) return null;

  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const alreadyConfirmed = complaint.communityImpact.verifiedBy.includes(viewerId);
  const canConfirm = complaint.status === "PENDING_COMMUNITY_VERIFICATION" && !alreadyConfirmed;

  function handleConfirmFix(e: React.MouseEvent) {
    e.stopPropagation();
    const updated = confirmFix(complaint!.id, viewerId, viewerName);
    if (updated) onUpdateComplaint(updated);
  }

  function handleRejectFix(e: React.MouseEvent) {
    e.stopPropagation();
    const updated = rejectFix(complaint!.id, viewerId, viewerName);
    if (updated) onUpdateComplaint(updated);
  }

  const timeline = complaint.history ?? [];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className={cn(
          "max-w-md w-full overflow-y-auto max-h-[90dvh]",
          "border-civic-border bg-civic-raised text-slate-100 shadow-2xl",
          "gap-0 p-0",
        )}
        aria-label="Complaint details"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-civic-border bg-civic-raised/95 px-4 py-3 backdrop-blur">
          <DialogTitle
            dir={isRtl ? "rtl" : "ltr"}
            lang={isRtl ? "ur" : "en"}
            className={cn(
              "font-bold text-slate-50 leading-snug pr-6",
              isRtl ? "urdu text-right text-base" : "text-sm",
            )}
          >
            {getComplaintTitle(complaint, lang)}
          </DialogTitle>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${URGENCY_BADGE[complaint.urgency]}`}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: URGENCY_HEX[complaint.urgency] }} aria-hidden />
              {t.urgencies[complaint.urgency] ?? URGENCY_LABELS[complaint.urgency]}
            </span>
            <span className={`rounded-full px-2 py-0.5 ring-1 ${STATUS_BADGE[complaint.status]}`}>
              {t.statuses[complaint.status] ?? STATUS_LABELS[complaint.status]}
            </span>
            <span className="ml-auto flex items-center gap-1 text-civic-muted">
              <MapPin className="h-3 w-3" aria-hidden />
              {complaint.location.sector} · {complaint.location.landmark}
            </span>
          </div>

          {/* Department + Reporter */}
          <div className="flex items-center gap-2 text-[11px] text-civic-muted">
            <span className="font-medium text-slate-200">{t.departments[complaint.department] ?? DEPARTMENT_LABELS[complaint.department]}</span>
            <span>·</span>
            <span>Reported by <strong className="text-slate-100">{complaint.reporter.citizenName}</strong></span>
            <span>·</span>
            <time dateTime={complaint.createdAt}>{timeAgo(complaint.createdAt)}</time>
          </div>

          {/* Photos */}
          {(complaint.beforePhotoUrl || complaint.afterPhotoUrl) && (
            <div className="grid grid-cols-2 gap-2">
              {complaint.beforePhotoUrl && (
                <figure>
                  <figcaption className="mb-1 text-[10px] uppercase tracking-wider text-civic-muted">Before</figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={complaint.beforePhotoUrl}
                    alt={`Before: ${complaint.title}`}
                    className="aspect-video w-full rounded-xl object-cover ring-1 ring-civic-border"
                  />
                </figure>
              )}
            {complaint.afterPhotoUrl && (
              <figure>
                <figcaption className="mb-1 text-[10px] uppercase tracking-wider text-civic-muted">After</figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={complaint.afterPhotoUrl}
                  alt={`After: ${complaint.title}`}
                  className="aspect-video w-full rounded-xl object-cover ring-1 ring-civic-border"
                />
              </figure>
            )}
          </div>
          )}

          {/* Summary in active language */}
          <p
            dir={isRtl ? "rtl" : "ltr"}
            lang={isRtl ? "ur" : "en"}
            className={cn(
              "leading-relaxed text-slate-300",
              isRtl ? "urdu rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-right text-sm text-slate-200" : "text-xs",
            )}
          >
            {getComplaintSummary(complaint, lang)}
          </p>

          {/* Priority breakdown */}
          {complaint.priorityBreakdown && (
            <div className="rounded-xl border border-civic-border bg-civic-surface p-3 text-xs">
              <p className="mb-1 font-semibold uppercase tracking-wider text-civic-muted">Priority Breakdown</p>
              <p className="text-slate-200">Severity: <strong>{complaint.priorityBreakdown.issueSeverity}/10</strong></p>
              <p className="text-slate-200">Density Risk: <strong>{complaint.priorityBreakdown.publicDensityRisk}</strong></p>
              <p className="mt-1 text-slate-300">{complaint.priorityBreakdown.reasoning}</p>
            </div>
          )}

          {/* SLA */}
          <div className="flex items-center gap-2 text-[11px]">
            <Clock className="h-3.5 w-3.5 text-civic-muted" aria-hidden />
            {complaint.sla.isBreached ? (
              <span className="text-red-400 font-medium">Overdue · {complaint.sla.escalationLevel.replace(/_/g, " ")}</span>
            ) : (
              <span className="text-civic-muted">Fix due in {complaint.sla.hoursRemaining}h</span>
            )}
          </div>

          {/* AI Verification result */}
          {complaint.aiVerification && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-xl px-3 py-2 text-xs ring-1",
                complaint.aiVerification.passed
                  ? "bg-green-500/15 text-green-300 ring-green-500/40"
                  : "bg-red-500/15 text-red-300 ring-red-500/40",
              )}
            >
              {complaint.aiVerification.passed
                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
              <span>
                <strong>{complaint.aiVerification.passed ? "AI Verified" : "AI Rejected"}</strong>
                {" "}({pct(complaint.aiVerification.confidence)}): {complaint.aiVerification.reasoning}
              </span>
            </div>
          )}

          {/* +1 Confirm Fix / Reject Fix buttons */}
          {complaint.status === "PENDING_COMMUNITY_VERIFICATION" && !viewerId.startsWith("worker-") && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmFix}
                disabled={!canConfirm}
                data-testid="modal-confirm-fix-button"
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-bold shadow-lg transition",
                  canConfirm
                    ? "bg-green-500 text-white hover:bg-green-400 shadow-green-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                    : "bg-civic-surface text-civic-muted cursor-default",
                )}
              >
                {alreadyConfirmed ? "✓ You confirmed this fix" : "Confirm Fix"}
              </button>
              {canConfirm && (
                <button
                  type="button"
                  onClick={handleRejectFix}
                  data-testid="modal-reject-fix-button"
                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Not Fixed
                </button>
              )}
            </div>
          )}

          {/* Comments */}
          <CommentSection
            complaintId={complaint.id}
            comments={complaint.comments}
            viewerId={viewerId}
            viewerName={viewerName}
          />

          {/* Lifecycle Timeline */}
          {timeline.length > 0 && (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-civic-muted">
                Lifecycle History
              </p>
              <HistoryTimeline events={timeline} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

