"use client";

import { useState } from "react";
import type { Complaint, Department } from "@/lib/types";
import { DEPARTMENT_LABELS } from "@/lib/labels";
import { useLanguage } from "@/components/common/LanguageProvider";
import { computeCityHealth, computeSectorHealth, gradeColorClasses } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MapView from "@/components/map/MapView";
import MayorAlertsTab from "./MayorAlertsTab";
import MayorContractorsTab from "./MayorContractorsTab";

type MayorTab = "map" | "alerts" | "home" | "depts" | "contractors";

const TABS: { id: MayorTab; icon: string; label: string }[] = [
  { id: "map", icon: "🗺️", label: "Map" },
  { id: "alerts", icon: "🚨", label: "Alerts" },
  { id: "home", icon: "🏛️", label: "Home" },
  { id: "depts", icon: "🏢", label: "Depts" },
  { id: "contractors", icon: "🛡️", label: "Contrs" },
];

interface MayorPortalViewProps {
  complaints?: Complaint[];
  onUpdateComplaint?: (c: Complaint) => void;
}

const card = "rounded-2xl border border-civic-border bg-civic-raised/85 p-3.5";
const sectionTitle = "mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400";

/** Mayor / Commissioner portal with 5 executive tabs (MAYOR_PORTAL_ASCII.md). */
export default function MayorPortalView({
  complaints = [],
  onUpdateComplaint,
}: MayorPortalViewProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<MayorTab>("home");

  const localizedTabs: { id: MayorTab; icon: string; label: string }[] = [
    { id: "map", icon: "🗺️", label: t.mayor.mapTab },
    { id: "alerts", icon: "🚨", label: t.mayor.alertsTab },
    { id: "home", icon: "🏛️", label: t.mayor.homeTab },
    { id: "depts", icon: "🏢", label: t.mayor.deptsTab },
    { id: "contractors", icon: "🛡️", label: t.mayor.contractorsTab },
  ];

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as MayorTab)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
        <TabsContent value="map" className="mt-0 flex min-h-0 flex-1 flex-col">
          <MapView
            viewerId="admin-nasir"
            viewerName="Comm. Nasir"
            onUpdateComplaint={onUpdateComplaint}
          />
        </TabsContent>
        <TabsContent value="alerts" className="mt-0">
          <MayorAlertsTab complaints={complaints} onUpdateComplaint={onUpdateComplaint} />
        </TabsContent>
        <TabsContent value="home" className="mt-0">
          <HomeTab complaints={complaints} onNav={setTab} />
        </TabsContent>
        <TabsContent value="depts" className="mt-0">
          <DeptsTab complaints={complaints} />
        </TabsContent>
        <TabsContent value="contractors" className="mt-0">
          <MayorContractorsTab complaints={complaints} onUpdateComplaint={onUpdateComplaint} />
        </TabsContent>
      </div>

      <nav
        aria-label="Mayor portal sections"
        className="sticky bottom-0 z-50 h-16 border-t border-civic-border bg-civic-surface/95 shadow-[0_-4px_20px_rgba(0,0,0,0.35)] backdrop-blur"
      >
        <TabsList className="grid h-full w-full grid-cols-5 rounded-none bg-transparent p-0">
          {localizedTabs.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className="flex h-full flex-col items-center justify-center gap-0.5 rounded-none text-[11px] font-medium text-civic-muted shadow-none transition hover:text-slate-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-civic-accent data-[state=active]:bg-transparent data-[state=active]:text-amber-400 data-[state=active]:shadow-none"
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </nav>
    </Tabs>
  );
}

function HomeTab({ complaints, onNav }: { complaints: Complaint[]; onNav: (t: MayorTab) => void }) {
  const { t } = useLanguage();
  const sectorHealth = computeSectorHealth(complaints);
  const cityHealth = computeCityHealth(sectorHealth);
  const cityColors = gradeColorClasses(cityHealth.grade);

  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
  const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const critical = complaints.filter(
    (c) => c.urgency === "CRITICAL" && c.status !== "RESOLVED",
  ).length;
  const pct = total ? ((resolved / total) * 100).toFixed(1) : "0.0";

  const kpis = [
    { icon: "📥", value: total, label: t.mayor.totalFiled, sub: `Across ${sectorHealth.length} Islamabad Sectors` },
    { icon: "🟢", value: resolved, label: t.mayor.verifiedFixed, sub: "Citizen + AI Verified" },
    { icon: "🟡", value: inProgress, label: t.mayor.inProgress, sub: "Field Teams Active" },
    { icon: "🔴", value: critical, label: t.mayor.criticalOpen, sub: "Immediate Action Req" },
  ];

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className={`${card} ${cityColors.border}`} data-testid="city-health-card">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-400">{t.mayor.cityScore}</p>
          <span
            data-testid="city-health-grade"
            className={`rounded-full border px-2 py-0.5 text-xs font-bold ${cityColors.badge}`}
          >
            Grade {cityHealth.grade}
          </span>
        </div>
        <p data-testid="city-health-score" className={`mt-1 text-3xl font-bold tabular-nums ${cityColors.text}`}>
          {cityHealth.score}
          <span className="text-base text-slate-400">/100</span>
        </p>
        <p className="mt-1 text-xs tabular-nums text-slate-300">
          Today&apos;s Operations: {resolved} of {total} Complaints Resolved ({pct}%)
        </p>
      </div>

      <div>
        <h2 className={sectionTitle}>{t.mayor.execKpis}</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {kpis.map((k) => (
            <div key={k.label} className={card} data-testid={`mayor-kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <p className="text-xl font-bold tabular-nums text-slate-100">
                {k.icon} {k.value}
              </p>
              <p className="text-xs font-semibold text-slate-200">{k.label}</p>
              <p className="text-[11px] text-slate-400">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={card} data-testid="sector-health-scorecard">
        <h2 className={sectionTitle}>{t.mayor.sectorScorecard}</h2>
        <ul className="flex flex-col gap-2.5">
          {sectorHealth.map((s) => {
            const colors = gradeColorClasses(s.grade);
            return (
              <li key={s.sector} data-testid={`sector-health-${s.sector}`}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{s.sector}</span>
                    <span
                      className={`rounded-full border px-1.5 py-0.2 text-[10px] font-bold ${colors.badge}`}
                    >
                      Grade {s.grade}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-200">{s.score}/100</span>
                </div>
                <div
                  className="mt-1 h-1.5 rounded-full bg-slate-700"
                  role="progressbar"
                  aria-valuenow={s.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${s.sector} Civic Health`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${colors.bar}`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {s.resolvedComplaints}/{s.totalComplaints} resolved · {s.openCritical} critical open
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onNav("map")}
          className="rounded-lg border border-civic-border bg-civic-surface py-2 text-xs font-semibold text-slate-100"
        >
          {t.mayor.heatmapBtn}
        </button>
        <button
          type="button"
          onClick={() => onNav("contractors")}
          className="rounded-lg border border-civic-border bg-civic-surface py-2 text-xs font-semibold text-slate-100"
        >
          {t.mayor.contractorAuditBtn}
        </button>
      </div>
    </div>
  );
}

const ALL_DEPTS: { id: Department; icon: string }[] = [
  { id: "IESCO", icon: "⚡" },
  { id: "CDA_SANITATION", icon: "🕳️" },
  { id: "CDA_ROADS", icon: "🛣️" },
  { id: "WASA", icon: "💧" },
  { id: "SNGPL", icon: "🔥" },
];

function DeptsTab({ complaints }: { complaints: Complaint[] }) {
  const { t } = useLanguage();
  const depts = ALL_DEPTS.map(({ id, icon }) => {
    const list = complaints.filter((c) => c.department === id);
    const total = list.length;
    const resolved = list.filter((c) => c.status === "RESOLVED").length;
    const inProgress = list.filter((c) => c.status === "IN_PROGRESS").length;
    const overdue = list.filter((c) => c.status !== "RESOLVED" && c.sla.isBreached).length;
    const pctNum = total ? (resolved / total) * 100 : 0;
    const onTimeRate = total ? `${Math.round(((total - overdue) / total) * 100)}%` : "—";
    const status =
      total === 0
        ? "⚪ No open tickets"
        : overdue > 0
          ? `🟡 ${overdue} overdue · ${inProgress} in progress`
          : pctNum >= 75
            ? "🟢 Strong resolution rate"
            : `🟡 ${inProgress} in progress · ${total - resolved} open`;

    return {
      id,
      name: `${icon} ${t.departments[id] ?? DEPARTMENT_LABELS[id]}`,
      total,
      resolved,
      pctNum,
      pct: pctNum.toFixed(1),
      onTimeRate,
      status,
    };
  }).sort((a, b) => b.pctNum - a.pctNum || b.total - a.total);

  return (
    <div className="flex flex-col gap-3 p-3">
      <h2 className={sectionTitle}>{t.mayor.deptLeaderboard}</h2>
      {depts.map((d, i) => (
        <div key={d.id} className={card}>
          <div className="flex justify-between text-sm font-semibold text-slate-100">
            <span>{i + 1}. {d.name}</span>
            <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-300">
            <span>{t.mayor.complaintsCount}: {d.total}</span>
            <span>{t.mayor.resolvedLabel}: {d.resolved} ({d.pct}%)</span>
            <span>{t.mayor.onTimeRate}: {d.onTimeRate}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{d.status}</p>
        </div>
      ))}
    </div>
  );
}
