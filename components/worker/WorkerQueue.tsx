"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Complaint, Department, Urgency } from "@/lib/types";
import { claimComplaint } from "@/lib/data/storage";
import { DEPARTMENT_LABELS, STATUS_BADGE, STATUS_LABELS, URGENCY_BADGE, URGENCY_LABELS } from "@/lib/labels";
import { useLanguage } from "@/components/common/LanguageProvider";
import { getComplaintTitle } from "@/lib/i18n";
import ComplaintDetailModal from "@/components/feed/ComplaintDetailModal";

const URGENCY_RANK: Record<Urgency, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const DEPT_FILTERS: ("ALL" | Department)[] = ["ALL", "CDA_SANITATION", "CDA_ROADS", "IESCO", "WASA", "SNGPL"];

interface WorkerQueueProps {
  complaints: Complaint[];
  onUpdateComplaint: (complaint: Complaint) => void;
}

/** Open (REPORTED) complaints sorted by urgency; "Claim Ticket" moves them to IN_PROGRESS. */
export default function WorkerQueue({ complaints, onUpdateComplaint }: WorkerQueueProps) {
  const { lang, t, isRtl } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<"ALL" | Department>("ALL");

  const openAll = complaints
    .filter((c) => c.status === "REPORTED")
    .sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || a.sla.hoursRemaining - b.sla.hoursRemaining);

  const open = deptFilter === "ALL" ? openAll : openAll.filter((c) => c.department === deptFilter);
  const selected = complaints.find((c) => c.id === selectedId) ?? null;

  if (openAll.length === 0) {
    return (
      <>
        <p className="px-4 py-12 text-center text-sm text-civic-muted">{t.worker.noQueue}</p>
        <ComplaintDetailModal
          complaint={selected}
          viewerId="worker-sajid"
          viewerName="Sajid"
          onClose={() => setSelectedId(null)}
          onUpdateComplaint={onUpdateComplaint}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto border-b border-civic-border px-4 py-2.5 no-scrollbar">
        {DEPT_FILTERS.map((d) => {
          const active = deptFilter === d;
          const label = d === "ALL" ? `${t.worker.allDepts} (${openAll.length})` : t.departments[d] ?? DEPARTMENT_LABELS[d];
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDeptFilter(d)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent ${
                active
                  ? "bg-civic-accent/20 text-civic-accent ring-civic-accent/60"
                  : "bg-civic-raised text-slate-300 ring-civic-border hover:text-slate-100"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {open.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-civic-muted">{t.worker.noDeptQueue}</p>
      ) : (
        <ul className="flex flex-col gap-3 p-4">
          {open.map((c) => (
            <li
              key={c.id}
              data-testid="queue-ticket"
              data-complaint-id={c.id}
              className="flex flex-col gap-2 rounded-2xl bg-civic-raised p-3 ring-1 ring-civic-border">
              <button
                type="button"
                onClick={() => setSelectedId(c.id)}
                className="flex flex-col gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent rounded-lg"
              >
                <div className="flex w-full items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${URGENCY_BADGE[c.urgency]}`}>
                    {t.urgencies[c.urgency] ?? URGENCY_LABELS[c.urgency]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${STATUS_BADGE[c.status]}`}>
                    {t.statuses[c.status] ?? STATUS_LABELS[c.status]}
                  </span>
                  <span className={`ml-auto text-[11px] ${c.sla.isBreached ? "font-medium text-red-400" : "text-civic-muted"}`}>
                    {c.sla.isBreached ? t.worker.overdue : t.worker.hoursLeft(c.sla.hoursRemaining)}
                  </span>
                </div>
                <div className="flex gap-3">
                  {c.beforePhotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.beforePhotoUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-civic-border" />
                  )}
                  <div className="min-w-0">
                    <h3
                      dir={isRtl ? "rtl" : "ltr"}
                      className={`truncate font-semibold text-slate-50 ${isRtl ? "urdu text-right text-base" : "text-sm"}`}
                    >
                      {getComplaintTitle(c, lang)}
                    </h3>
                    <p className="text-xs text-civic-muted">{t.departments[c.department] ?? DEPARTMENT_LABELS[c.department]} · {c.category}</p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-civic-muted">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {c.location.sector} · {c.location.landmark}
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = claimComplaint(c.id, "worker-sajid", "Sajid");
                  if (updated) onUpdateComplaint(updated);
                }}
                className="min-h-[40px] rounded-xl bg-civic-accent px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-civic-accent-strong active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100"
              >
                {t.worker.claimTicket}
              </button>
            </li>
          ))}
        </ul>
      )}
      <ComplaintDetailModal
        complaint={selected}
        viewerId="worker-sajid"
        viewerName="Sajid"
        onClose={() => setSelectedId(null)}
        onUpdateComplaint={onUpdateComplaint}
      />
    </>
  );
}
