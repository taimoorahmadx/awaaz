// Display labels + colours shared by the map, feed and reports UIs.
import type { Complaint, Department, TicketStatus, Urgency } from "@/lib/types";

export const DEPARTMENT_LABELS: Record<Department, string> = {
  CDA_SANITATION: "CDA Sanitation",
  CDA_ROADS: "CDA Roads",
  IESCO: "IESCO",
  WASA: "WASA",
  SNGPL: "SNGPL",
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  REPORTED: "Reported",
  IN_PROGRESS: "In Progress",
  PENDING_COMMUNITY_VERIFICATION: "Pending Sign-off",
  RESOLVED: "Resolved",
};

/** Hex colours used for map pins (Leaflet divIcons need raw values, not Tailwind classes). */
export const URGENCY_HEX: Record<Urgency, string> = {
  CRITICAL: "#ef4444", // red-500
  HIGH: "#f97316", // orange-500
  MEDIUM: "#eab308", // yellow-500
  LOW: "#38bdf8", // sky-400
};
export const RESOLVED_HEX = "#22c55e"; // green-500

/** Resolved tickets are always green; everything else is coloured by urgency. */
export function complaintColor(c: Pick<Complaint, "status" | "urgency">): string {
  return c.status === "RESOLVED" ? RESOLVED_HEX : URGENCY_HEX[c.urgency];
}

/** Tailwind classes for urgency badges. */
export const URGENCY_BADGE: Record<Urgency, string> = {
  CRITICAL: "bg-red-500/15 text-red-300 ring-red-500/40",
  HIGH: "bg-orange-500/15 text-orange-300 ring-orange-500/40",
  MEDIUM: "bg-yellow-500/15 text-yellow-200 ring-yellow-500/40",
  LOW: "bg-sky-500/15 text-sky-300 ring-sky-500/40",
};

/** Short relative time, e.g. "5m ago", "3h ago", "2d ago". Call after hydration only (uses Date.now). */
export function timeAgo(iso: string, now = Date.now()): string {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (!Number.isFinite(mins) || mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Tailwind classes for status pills. */
export const STATUS_BADGE: Record<TicketStatus, string> = {
  REPORTED: "bg-slate-500/15 text-slate-200 ring-slate-400/40",
  IN_PROGRESS: "bg-blue-500/15 text-blue-300 ring-blue-500/40",
  PENDING_COMMUNITY_VERIFICATION: "bg-violet-500/15 text-violet-300 ring-violet-500/40",
  RESOLVED: "bg-green-500/15 text-green-300 ring-green-500/40",
};
