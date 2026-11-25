"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import type { Complaint } from "@/lib/types";
import { confirmFix } from "@/lib/data/storage";
import { DEPARTMENT_LABELS, STATUS_BADGE, STATUS_LABELS, timeAgo } from "@/lib/labels";
import ComplaintDetailModal from "@/components/feed/ComplaintDetailModal";
import LifecycleStepper from "./LifecycleStepper";

interface MyReportsViewProps {
  /** Complaints filed by the current citizen (filter by reporter.citizenId upstream). */
  complaints: Complaint[];
  /** Persist the updated complaint (e.g. storage.updateComplaint). */
  onUpdateComplaint: (complaint: Complaint) => void;
  /** Current citizen id, recorded in communityImpact.verifiedBy on confirm. */
  citizenId?: string;
  /** Current citizen display name, for history events. */
  citizenName?: string;
}

/** My Reports tab: the citizen's own tickets with lifecycle + "+1 Confirm Fix". */
export default function MyReportsView({ complaints, onUpdateComplaint, citizenId, citizenName = "Citizen" }: MyReportsViewProps) {
  const [modalId, setModalId] = useState<string | null>(null);
  const modalComplaint = modalId ? complaints.find((c) => c.id === modalId) ?? null : null;

  const handleConfirmFix = (c: Complaint) => {
    if (!citizenId) return;
    const updated = confirmFix(c.id, citizenId, citizenName);
    if (updated) onUpdateComplaint(updated);
  };

  if (complaints.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
        <ClipboardList className="h-8 w-8" aria-hidden="true" />
        <p className="text-sm">You haven&apos;t filed any reports yet.</p>
      </div>
    );
  }

  const sorted = [...complaints].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <section className="flex flex-col gap-3 p-3" aria-label="My reports">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">My Reports ({complaints.length})</h2>
      {sorted.map((c) => {
        const resolved = c.status === "RESOLVED";
        return (
          <article
            key={c.id}
            data-testid="report-card"
            data-complaint-id={c.id}
            data-status={c.status}
            onClick={() => setModalId(c.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setModalId(c.id);
              }
            }}
            className={`cursor-pointer rounded-xl border bg-civic-surface p-3 ${resolved ? "border-green-500/60" : "border-civic-border"}`}
          >
            <header className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-100">{c.title}</h3>
                <p className="text-[11px] text-slate-400">
                  #{c.id} • {DEPARTMENT_LABELS[c.department]} • {c.location.sector} • {timeAgo(c.createdAt)}
                </p>
              </div>
              <span
                data-testid="report-status"
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  resolved ? "bg-green-500 text-white" : STATUS_BADGE[c.status]
                }`}
              >
                {resolved && <CheckCircle2 className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                {STATUS_LABELS[c.status]}
              </span>
            </header>

            <LifecycleStepper status={c.status} />

            {c.aiVerification && (
              <p
                data-testid="report-ai-line"
                className={`mt-2 text-[11px] ${c.aiVerification.passed ? "text-green-400" : "text-red-400"}`}>
                🤖 AI {c.aiVerification.passed ? "Verified" : "Rejected"} ({Math.round(c.aiVerification.confidence * 100)}%):{" "}
                {c.aiVerification.reasoning}
              </p>
            )}

            {c.status === "PENDING_COMMUNITY_VERIFICATION" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmFix(c);
                }}
                data-testid="confirm-fix-button"
                className="mt-3 w-full rounded-lg bg-green-500 py-2 text-sm font-bold text-white shadow-lg shadow-green-500/30 transition hover:bg-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                +1 Confirm Fix (Verified)
              </button>
            )}
          </article>
        );
      })}

      <ComplaintDetailModal
        complaint={modalComplaint}
        viewerId={citizenId ?? "citizen-tariq"}
        viewerName={citizenName}
        onClose={() => setModalId(null)}
        onUpdateComplaint={onUpdateComplaint}
      />
    </section>
  );
}
