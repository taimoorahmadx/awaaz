"use client";

import { useState } from "react";
import type { Complaint } from "@/lib/types";
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

const card = "rounded-xl border border-civic-border bg-civic-surface p-3";
const sectionTitle = "mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400";

/** Mayor / Commissioner portal with 5 executive tabs (MAYOR_PORTAL_ASCII.md). */
export default function MayorPortalView({
  complaints = [],
  onUpdateComplaint,
}: MayorPortalViewProps) {
  const [tab, setTab] = useState<MayorTab>("home");

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as MayorTab)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <TabsContent value="map" className="mt-0 flex min-h-0 flex-1 flex-col">
          <MapView
            viewerId="admin-nasir"
            viewerName="Comm. Nasir"
            onUpdateComplaint={onUpdateComplaint}
          />
        </TabsContent>
        <TabsContent value="alerts" className="mt-0">
          <MayorAlertsTab complaints={complaints} />
        </TabsContent>
        <TabsContent value="home" className="mt-0">
          <HomeTab complaints={complaints} onNav={setTab} />
        </TabsContent>
        <TabsContent value="depts" className="mt-0">
          <DeptsTab />
        </TabsContent>
        <TabsContent value="contractors" className="mt-0">
          <MayorContractorsTab complaints={complaints} />
        </TabsContent>
      </div>

      <nav
        aria-label="Mayor portal sections"
        className="sticky bottom-0 z-20 border-t border-civic-border bg-civic-surface"
      >
        <TabsList className="grid h-auto w-full grid-cols-5 rounded-none bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="flex flex-col items-center rounded-none py-2 text-[10px] font-medium text-slate-400 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-amber-400 data-[state=active]:shadow-none"
            >
              <span className="text-lg" aria-hidden="true">
                {t.icon}
              </span>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </nav>
    </Tabs>
  );
}

function HomeTab({ complaints, onNav }: { complaints: Complaint[]; onNav: (t: MayorTab) => void }) {
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
    { icon: "📥", value: total, label: "Total Filed", sub: "Across 4 Islamabad Sectors" },
    { icon: "🟢", value: resolved, label: "Verified Fixed", sub: "Citizen + AI Verified" },
    { icon: "🟡", value: inProgress, label: "In Progress", sub: "Field Teams Active" },
    { icon: "🔴", value: critical, label: "Critical Open", sub: "Immediate Action Req" },
  ];

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className={`${card} ${cityColors.border}`} data-testid="city-health-card">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-400">Islamabad Civic Health Score</p>
          <span
            data-testid="city-health-grade"
            className={`rounded-full border px-2 py-0.5 text-xs font-bold ${cityColors.badge}`}
          >
            Grade {cityHealth.grade}
          </span>
        </div>
        <p data-testid="city-health-score" className={`mt-1 text-3xl font-bold ${cityColors.text}`}>
          {cityHealth.score}
          <span className="text-base text-slate-400">/100</span>
        </p>
        <p className="mt-1 text-xs text-slate-300">
          Today&apos;s Operations: {resolved} of {total} Complaints Resolved ({pct}%)
        </p>
      </div>

      <div>
        <h2 className={sectionTitle}>Executive KPI Summary</h2>
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((k) => (
            <div key={k.label} className={card} data-testid={`mayor-kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <p className="text-xl font-bold text-slate-100">
                {k.icon} {k.value}
              </p>
              <p className="text-xs font-semibold text-slate-200">{k.label}</p>
              <p className="text-[10px] text-slate-400">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={card} data-testid="sector-health-scorecard">
        <h2 className={sectionTitle}>Sector Civic Health Scorecard</h2>
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
          🗺️ View Problem Heatmap
        </button>
        <button
          type="button"
          onClick={() => onNav("contractors")}
          className="rounded-lg border border-civic-border bg-civic-surface py-2 text-xs font-semibold text-slate-100"
        >
          🛡️ Contractor Audit
        </button>
      </div>
    </div>
  );
}

function DeptsTab() {
  const depts = [
    { rank: "🥇", name: "⚡ IESCO (Power & Streetlights)", total: 42, resolved: 40, pct: "95.2", time: "42 mins", sla: "97%", status: "🟢 Exceptional Performance" },
    { rank: "🥈", name: "🕳️ CDA Sanitation & Sewerage", total: 58, resolved: 51, pct: "87.9", time: "1h 45m", sla: "89%", status: "🟢 Solid Operation (1 Escalation Open)" },
    { rank: "⚠️", name: "💧 WASA (Water Supply & Drainage)", total: 32, resolved: 24, pct: "75.0", time: "3h 10m", sla: "74%", status: "🟡 Warning: Tanker/Drainage response lagging" },
    { rank: "⚠️", name: "🔥 SNGPL (Gas Supply & Pressure)", total: 16, resolved: 11, pct: "68.7", time: "4h 30m", sla: "68%", status: "🟡 Low winter pressure spikes" },
  ];
  return (
    <div className="flex flex-col gap-3 p-3">
      <h2 className={sectionTitle}>Municipal Agency Leaderboard (Today)</h2>
      {depts.map((d, i) => (
        <div key={d.name} className={card}>
          <div className="flex justify-between text-sm font-semibold text-slate-100">
            <span>{i + 1}. {d.name}</span>
            <span>#{i + 1} {d.rank}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-300">
            <span>Complaints: {d.total}</span>
            <span>Resolved: {d.resolved} ({d.pct}%)</span>
            <span>Avg. Fix Time: {d.time}</span>
            <span>On-Time Rate: {d.sla}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{d.status}</p>
        </div>
      ))}
    </div>
  );
}
