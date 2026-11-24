"use client";

import { useState } from "react";
import type { Complaint } from "@/lib/types";
import MapView from "@/components/map/MapView";

type MayorTab = "map" | "alerts" | "home" | "depts" | "contractors";

const TABS: { id: MayorTab; icon: string; label: string }[] = [
  { id: "map", icon: "🗺️", label: "Map" },
  { id: "alerts", icon: "🚨", label: "Alerts" },
  { id: "home", icon: "🏛️", label: "Home" },
  { id: "depts", icon: "🏢", label: "Depts" },
  { id: "contractors", icon: "🛡️", label: "Contrs" },
];

interface MayorPortalViewProps {
  /** Optional: used only to derive headline counts. Falls back to static demo numbers. */
  complaints?: Complaint[];
}

const card = "rounded-xl border border-civic-border bg-civic-surface p-3";
const sectionTitle = "mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400";

/** Mayor / Commissioner portal: static executive shell with 5 internal tabs (MAYOR_PORTAL_ASCII.md). */
export default function MayorPortalView({ complaints = [] }: MayorPortalViewProps) {
  const [tab, setTab] = useState<MayorTab>("home");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {tab === "map" && <MapView />}
        {tab === "alerts" && <AlertsTab />}
        {tab === "home" && <HomeTab complaints={complaints} onNav={setTab} />}
        {tab === "depts" && <DeptsTab />}
        {tab === "contractors" && <ContractorsTab />}
      </div>

      <nav aria-label="Mayor portal sections" className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-civic-border bg-civic-surface">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={`flex flex-col items-center py-2 text-[10px] font-medium ${tab === t.id ? "text-amber-400" : "text-slate-400"}`}
          >
            <span className="text-lg" aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function HomeTab({ complaints, onNav }: { complaints: Complaint[]; onNav: (t: MayorTab) => void }) {
  // Derive from live array when available, else static demo numbers.
  const total = complaints.length || 148;
  const resolved = complaints.length ? complaints.filter((c) => c.status === "RESOLVED").length : 126;
  const inProgress = complaints.length ? complaints.filter((c) => c.status === "IN_PROGRESS").length : 18;
  const critical = complaints.length ? complaints.filter((c) => c.urgency === "CRITICAL" && c.status !== "RESOLVED").length : 4;
  const pct = total ? ((resolved / total) * 100).toFixed(1) : "0";

  const kpis = [
    { icon: "📥", value: total, label: "Total Filed", sub: "+18% vs Yesterday" },
    { icon: "🟢", value: resolved, label: "Verified Fixed", sub: "Citizen + AI Verified" },
    { icon: "🟡", value: inProgress, label: "In Progress", sub: "Field Teams Active" },
    { icon: "🔴", value: critical, label: "Critical Escalations", sub: "Overdue >2h • Action Req" },
  ];
  const metrics = [
    { label: "Sanitation & Cleanliness", pct: 88 },
    { label: "Streetlights & Power", pct: 94 },
    { label: "Water & Sewage", pct: 72 },
    { label: "Roads & Infrastructure", pct: 68 },
  ];

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className={`${card} border-green-500/40`}>
        <p className="text-xs text-slate-400">Islamabad Civic Health Score</p>
        <p className="text-3xl font-bold text-green-400">86<span className="text-base text-slate-400">/100</span> <span className="text-sm text-slate-300">Grade B+</span></p>
        <p className="text-xs text-slate-300">Today&apos;s Operations: {resolved} of {total} Complaints Resolved ({pct}%)</p>
      </div>

      <div>
        <h2 className={sectionTitle}>Executive KPI Summary (Past 24 Hours)</h2>
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((k) => (
            <div key={k.label} className={card}>
              <p className="text-xl font-bold text-slate-100">{k.icon} {k.value}</p>
              <p className="text-xs font-semibold text-slate-200">{k.label}</p>
              <p className="text-[10px] text-slate-400">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <h2 className={sectionTitle}>Quick City Health Metrics</h2>
        <ul className="flex flex-col gap-2">
          {metrics.map((m) => (
            <li key={m.label}>
              <div className="flex justify-between text-xs text-slate-300"><span>{m.label}</span><span>{m.pct}%</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-700" role="progressbar" aria-valuenow={m.pct} aria-valuemin={0} aria-valuemax={100} aria-label={m.label}>
                <div className={`h-full rounded-full ${m.pct >= 80 ? "bg-green-500" : m.pct >= 70 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${m.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onNav("map")} className="rounded-lg border border-civic-border bg-civic-surface py-2 text-xs font-semibold text-slate-100">🗺️ View Problem Heatmap</button>
        <button type="button" onClick={() => onNav("contractors")} className="rounded-lg border border-civic-border bg-civic-surface py-2 text-xs font-semibold text-slate-100">🛡️ Contractor Audit</button>
      </div>
    </div>
  );
}

function AlertsTab() {
  const alerts = [
    { id: "ISB-1042", dept: "CDA Sewerage (F-10/2)", title: "🕳️ Open Manhole on Main Double Road", meta: "Reported 45m ago • Assigned: Sajid Khan • In Progress", action: "🚀 Priority Escalate" },
    { id: "ISB-1033", dept: "IESCO Power (I-9 Industrial)", title: "⚡ High-Tension Wire Dangling Near School Gate", meta: "Overdue by: 1h 20m • Risk: Extreme Danger", action: "🚨 Dispatch Rapid Emergency Crew" },
  ];
  return (
    <div className="flex flex-col gap-3 p-3">
      <h2 className={sectionTitle}>Critical Escalations (4 Overdue Hazards)</h2>
      {alerts.map((a) => (
        <div key={a.id} className={`${card} border-red-500/50`}>
          <p className="text-[11px] font-bold text-red-400">🔴 OVERDUE: #{a.id} • {a.dept}</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{a.title}</p>
          <p className="text-[11px] text-slate-400">{a.meta}</p>
          <button type="button" className="mt-2 w-full rounded-lg bg-red-600 py-1.5 text-xs font-bold text-white">{a.action}</button>
        </div>
      ))}
      <h2 className={sectionTitle}>Public Emergency Broadcast</h2>
      <button type="button" className={`${card} border-amber-400/50 text-left`}>
        <p className="text-sm font-bold text-amber-400">📢 Broadcast Emergency Civic Notice</p>
        <p className="text-[11px] text-slate-400">Sends push alert to Citizen Portal & Group Channels</p>
      </button>
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
            <span>SLA Compliance: {d.sla}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{d.status}</p>
        </div>
      ))}
    </div>
  );
}

function ContractorsTab() {
  // Single static payout toggle (visual only, no persistence).
  const [frozen, setFrozen] = useState(false);
  const kpis = [
    { v: "🛡️ 95.8%", l: "Fix Integrity", s: "Confirmed by AI + Citizens" },
    { v: "🚫 6", l: "Fake Claims Blocked", s: "Saved from Payouts" },
    { v: "💰 ₨ 240,000", l: "Protected", s: "Taxpayer Funds Preserved" },
    { v: "⚠️ 1", l: "Contractor Under Audit", s: "Apex Road Infrastructure" },
  ];
  return (
    <div className="flex flex-col gap-3 p-3">
      <h2 className={sectionTitle}>Contractor Integrity & Anti-Ghosting Audit</h2>
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((k) => (
          <div key={k.l} className={card}>
            <p className="text-base font-bold text-slate-100">{k.v}</p>
            <p className="text-xs font-semibold text-slate-200">{k.l}</p>
            <p className="text-[10px] text-slate-400">{k.s}</p>
          </div>
        ))}
      </div>

      <h2 className={sectionTitle}>Flagged Audit Incidents</h2>
      <div className={`${card} border-red-500/50`}>
        <p className="text-[11px] font-bold text-red-400">🚨 CONTRACTOR FRAUD FLAGGED • #ISB-1028</p>
        <p className="text-xs text-slate-300">Contractor: Apex Infra Ltd • Pothole Patching (Zone-1)</p>
        <p className="mt-2 text-xs text-slate-200">🤖 AI Vision Verdict: <span className="font-bold text-red-400">❌ REJECTED (34%)</span></p>
        <p className="text-[11px] italic text-slate-400">&quot;Pothole still visible. Photo taken from angle without new asphalt cover. Landmark curb does not match.&quot;</p>
        <p className="mt-2 text-xs text-slate-200">👤 Citizen Sign-Off: <span className="font-bold text-red-400">❌ Disapproved by Tariq</span></p>
        <p className="text-[11px] italic text-slate-400">&quot;Pothole is still there, worker only took photo&quot;</p>
        <button
          type="button"
          aria-pressed={frozen}
          onClick={() => setFrozen((f) => !f)}
          className={`mt-3 w-full rounded-lg py-2 text-xs font-bold text-white ${frozen ? "bg-slate-600" : "bg-red-600"}`}
        >
          {frozen ? "🔒 Payout Frozen (tap to release)" : "🛑 Freeze Contractor Payout"}
        </button>
      </div>
    </div>
  );
}
