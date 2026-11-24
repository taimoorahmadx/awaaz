"use client";

import { CheckCircle2, ClipboardList } from "lucide-react";
import type { Complaint } from "@/lib/types";
import { DEPARTMENT_LABELS, STATUS_BADGE, STATUS_LABELS, timeAgo } from "@/lib/labels";
import LifecycleStepper from "./LifecycleStepper";

interface MyReportsViewProps {
  /** Complaints filed by the current citizen (filter by reporter.citizenId upstream). */
  complaints: Complaint[];
  /** Persist the updated complaint (e.g. storage.updateComplaint). */
  onUpdateComplaint: (complaint: Complaint) => void;
  /** Current citizen id, recorded in communityImpact.verifiedBy on confirm. */
  citizenId?: string;
}

/** My Reports tab: the citizen's own tickets with lifecycle + "+1 Confirm Fix". */
export default function MyReportsView({ complaints, onUpdateComplaint, citizenId }: MyReportsViewProps) {
  const confirmFix = (c: Complaint) => {
    const verifiedBy = citizenId && !c.communityImpact.verifiedBy.includes(citizenId)
      ? [...c.communityImpact.verifiedBy, citizenId]
      : c.communityImpact.verifiedBy;
    onUpdateComplaint({
      ...c,
      status: "RESOLVED",
      communityImpact: { ...c.communityImpact, verifiedBy, verifiedCount: verifiedBy.length },
      updatedAt: new Date().toISOString(),
    });
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
            className={`rounded-xl border bg-civic-surface p-3 ${resolved ? "border-green-500/60" : "border-civic-border"}`}
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
                onClick={() => confirmFix(c)}
                data-testid="confirm-fix-button"
                className="mt-3 w-full rounded-lg bg-green-500 py-2 text-sm font-bold text-white shadow-lg shadow-green-500/30 transition hover:bg-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                +1 Confirm Fix (Verified)
              </button>
            )}
          </article>
        );
      })}
    </section>
  );
}
