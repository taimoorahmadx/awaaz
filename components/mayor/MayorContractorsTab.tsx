"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleContractorPayout, useContractors } from "@/lib/data/storage";
import { DEPARTMENT_LABELS } from "@/lib/labels";
import ComplaintDetailModal from "@/components/feed/ComplaintDetailModal";
import type { Complaint, Contractor } from "@/lib/types";

interface MayorContractorsTabProps {
  complaints: Complaint[];
  onUpdateComplaint?: (c: Complaint) => void;
}

/** Mayor Contractors tab: persisted contractor ledger with Freeze/Unfreeze Payout Switch (AC-10.3) + AI fraud flags. */
export default function MayorContractorsTab({ complaints, onUpdateComplaint }: MayorContractorsTabProps) {
  const { contractors, hydrated } = useContractors();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = complaints.find((c) => c.id === selectedId) ?? null;

  const frozenCount = contractors.filter((c) => c.payoutStatus === "FROZEN").length;
  const totalFlagged = contractors.reduce((sum, c) => sum + c.flaggedIncidents, 0);
  const avgResolution = contractors.length
    ? (
        contractors.reduce((sum, c) => sum + c.verifiedResolutionPct, 0) / contractors.length
      ).toFixed(1)
    : "0.0";

  const rejectedComplaints = complaints.filter((c) => c.aiVerification?.passed === false);

  const kpis = [
    { v: `🛡️ ${avgResolution}%`, l: "Avg Fix Integrity", s: "Confirmed by AI + Citizens" },
    { v: `🚫 ${totalFlagged}`, l: "Flagged Incidents", s: "Tracked Across Vendors" },
    { v: `💰 ₨ ${(frozenCount * 120000).toLocaleString()}`, l: "Protected", s: "Taxpayer Funds Preserved" },
    {
      v: `🔒 ${frozenCount}`,
      l: "Payouts Frozen",
      s: frozenCount === 1 ? "1 Contractor Held" : `${frozenCount} Contractors Held`,
    },
  ];

  function handleToggle(contractor: Contractor) {
    const updated = toggleContractorPayout(contractor.id);
    if (!updated) return;
    if (updated.payoutStatus === "FROZEN") {
      toast.warning(`Payout frozen for ${updated.name}`);
    } else {
      toast.success(`Payout unfrozen for ${updated.name}`);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Contractor Integrity &amp; Anti-Ghosting Audit
      </h2>

      <div className="grid grid-cols-2 gap-2">
        {kpis.map((k) => (
          <div key={k.l} className="rounded-xl border border-civic-border bg-civic-surface p-3">
            <p className="text-base font-bold text-slate-100">{k.v}</p>
            <p className="text-xs font-semibold text-slate-200">{k.l}</p>
            <p className="text-[10px] text-slate-400">{k.s}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="contractor-roster-heading" className="flex flex-col gap-2">
        <h2
          id="contractor-roster-heading"
          className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"
        >
          Registered Contractors ({contractors.length})
        </h2>

        {!hydrated ? (
          <div className="h-24 animate-pulse rounded-xl border border-civic-border bg-civic-surface" />
        ) : (
          contractors.map((contractor) => {
            const isFrozen = contractor.payoutStatus === "FROZEN";
            const switchId = `payout-switch-${contractor.id}`;
            return (
              <article
                key={contractor.id}
                data-testid="contractor-card"
                data-contractor-id={contractor.id}
                className={`rounded-xl border bg-civic-surface p-3 transition ${
                  isFrozen ? "border-red-500/60 bg-red-950/15" : "border-civic-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-100">
                      {contractor.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {DEPARTMENT_LABELS[contractor.department]}
                    </p>
                  </div>
                  <span
                    data-testid="contractor-status-pill"
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      isFrozen
                        ? "border-red-500/50 bg-red-500/15 text-red-300"
                        : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {isFrozen ? (
                      <Lock className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    )}
                    {contractor.payoutStatus}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-slate-300">
                  <span>
                    Verified Resolution:{" "}
                    <strong className="text-slate-100">{contractor.verifiedResolutionPct}%</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    {contractor.flaggedIncidents > 0 && (
                      <AlertTriangle className="h-3 w-3 text-amber-400" aria-hidden="true" />
                    )}
                    Flagged:{" "}
                    <strong className="text-slate-100">{contractor.flaggedIncidents}</strong>
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-civic-border/70 pt-2.5">
                  <label
                    htmlFor={switchId}
                    className={`cursor-pointer text-xs font-semibold ${
                      isFrozen ? "text-red-300" : "text-slate-200"
                    }`}
                  >
                    {isFrozen ? "Unfreeze Payout" : "Freeze Payout"}
                  </label>
                  <Switch
                    id={switchId}
                    data-testid={`contractor-freeze-switch-${contractor.id}`}
                    checked={isFrozen}
                    onCheckedChange={() => handleToggle(contractor)}
                    aria-label={`${isFrozen ? "Unfreeze Payout" : "Freeze Payout"} for ${contractor.name}`}
                  />
                </div>
              </article>
            );
          })
        )}
      </section>

      <section aria-labelledby="flagged-audit-heading" className="flex flex-col gap-2">
        <h2
          id="flagged-audit-heading"
          className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"
        >
          Flagged Audit Incidents
        </h2>

        {rejectedComplaints.length === 0 ? (
          <div className="rounded-xl border border-civic-border bg-civic-surface p-3 text-xs text-slate-400">
            No AI-rejected incidents flagged right now.
          </div>
        ) : (
          rejectedComplaints.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className="w-full rounded-xl border border-red-500/50 bg-civic-surface p-3 text-left transition hover:border-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
            >
              <p className="flex items-center gap-1 text-[11px] font-bold text-red-400">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                AI VERIFICATION REJECTED · {c.id.toUpperCase()}
              </p>
              <p className="text-xs font-medium text-slate-200">
                {c.title} · {DEPARTMENT_LABELS[c.department]} ({c.location.sector})
              </p>
              {c.aiVerification && (
                <p className="mt-1 text-[11px] italic text-slate-400">
                  🤖 Rejected ({Math.round(c.aiVerification.confidence * 100)}%): &quot;
                  {c.aiVerification.reasoning}&quot;
                </p>
              )}
            </button>
          ))
        )}
      </section>

      <ComplaintDetailModal
        complaint={selected}
        viewerId="admin-nasir"
        viewerName="Comm. Nasir"
        onClose={() => setSelectedId(null)}
        onUpdateComplaint={(c) => onUpdateComplaint?.(c)}
      />
    </div>
  );
}

