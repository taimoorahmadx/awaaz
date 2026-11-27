"use client";

import { BadgeCheck, Building2, Clock, HardHat, MapPin } from "lucide-react";
import { useComplaints } from "@/lib/data/storage";
import { useLanguage } from "@/components/common/LanguageProvider";

/** Worker profile view with approval rate, live workload counts, and assignment details. */
export default function WorkerProfile() {
  const { t } = useLanguage();
  const { complaints, hydrated } = useComplaints();

  const assigned = hydrated
    ? complaints.filter((c) => c.assignedTo?.workerId === "worker-sajid")
    : [];
  const activeCount = assigned.filter((c) => c.status === "IN_PROGRESS").length;
  const pendingSignOffCount = assigned.filter(
    (c) => c.status === "PENDING_COMMUNITY_VERIFICATION",
  ).length;
  const resolvedCount = assigned.filter((c) => c.status === "RESOLVED").length;
  const aiChecked = assigned.filter((c) => c.aiVerification !== undefined);
  const aiPassed = aiChecked.filter((c) => c.aiVerification?.passed === true).length;
  const approvalRate = aiChecked.length > 0 ? `${Math.round((aiPassed / aiChecked.length) * 100)}%` : "—";

  const stats = [
    { label: t.worker.aiApproval, value: approvalRate },
    { label: t.worker.resolvedCount, value: String(resolvedCount) },
    { label: t.worker.totalAssigned, value: String(assigned.length) },
  ];

  return (
    <section className="flex flex-col gap-5 p-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-civic-raised text-civic-accent ring-1 ring-civic-border">
          <HardHat className="h-8 w-8" aria-hidden="true" />
        </span>
        <div>
          <h2 className="flex items-center justify-center gap-1.5 text-lg font-semibold text-slate-50">
            Sajid <BadgeCheck className="h-4 w-4 text-civic-accent" aria-label="Verified worker" />
          </h2>
          <p className="text-sm text-civic-muted">{t.departments.CDA_SANITATION} · Sector F-10, Islamabad</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            {t.worker.onDuty}
          </span>
        </div>
      </div>

      <dl className="grid w-full grid-cols-3 gap-2 text-center">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-civic-raised p-3 ring-1 ring-civic-border">
            <dt className="text-[11px] text-civic-muted">{s.label}</dt>
            <dd className="mt-0.5 text-lg font-semibold text-slate-50">{s.value}</dd>
          </div>
        ))}
      </dl>

      {/* Live session workload */}
      <div className="rounded-2xl border border-civic-border bg-civic-surface p-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-civic-muted">
          {t.worker.currentWorkload}
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-civic-raised px-3 py-2.5 ring-1 ring-civic-border">
            <p className="text-[11px] text-civic-muted">{t.statuses.IN_PROGRESS}</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-50">{activeCount}</p>
          </div>
          <div className="rounded-xl bg-civic-raised px-3 py-2.5 ring-1 ring-civic-border">
            <p className="text-[11px] text-civic-muted">{t.worker.pendingSignOff}</p>
            <p className="mt-0.5 text-lg font-semibold text-civic-accent">{pendingSignOffCount}</p>
          </div>
        </div>
      </div>

      {/* Assignment details */}
      <div className="rounded-2xl border border-civic-border bg-civic-surface p-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-civic-muted">
          {t.worker.assignmentDetails}
        </h3>
        <ul className="flex flex-col gap-2.5 text-xs text-slate-200">
          <li className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 shrink-0 text-civic-accent" aria-hidden="true" />
            <span className="text-civic-muted">{t.worker.department}</span>
            <span className="ml-auto font-medium text-slate-100">{t.departments.CDA_SANITATION}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-civic-accent" aria-hidden="true" />
            <span className="text-civic-muted">{t.worker.assignedZone}</span>
            <span className="ml-auto font-medium text-slate-100">Sector F-10, Islamabad</span>
          </li>
          <li className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-civic-accent" aria-hidden="true" />
            <span className="text-civic-muted">{t.worker.shiftHours}</span>
            <span className="ml-auto font-medium text-slate-100">08:00 – 16:00</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
