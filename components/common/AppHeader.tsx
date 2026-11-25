"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Landmark, MapPin, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { resetSystemData } from "@/lib/data/storage";
import OfflineBadge from "./OfflineBadge";

export type RoleId = "tariq" | "ayesha" | "anonymous" | "worker" | "mayor";

export interface RoleProfile {
  id: RoleId;
  name: string;
  label: string;
  kind: "citizen" | "worker" | "mayor";
  /** Sector shown in the header badge, e.g. "F-10" */
  sector: string;
  emoji: string;
  /** Id used in stored data (votes, comments, reporter), e.g. "citizen-tariq" */
  profileId: string;
}

export const ROLES: RoleProfile[] = [
  { id: "tariq", name: "Tariq", label: "Citizen · F-10", kind: "citizen", sector: "F-10", emoji: "👤", profileId: "citizen-tariq" },
  { id: "ayesha", name: "Ayesha", label: "Citizen · F-6", kind: "citizen", sector: "F-6", emoji: "👤", profileId: "citizen-ayesha" },
  { id: "anonymous", name: "Anonymous Citizen", label: "Citizen · No sector", kind: "citizen", sector: "", emoji: "🕶️", profileId: "citizen-anonymous" },
  { id: "worker", name: "Sajid", label: "CDA Worker", kind: "worker", sector: "F-10", emoji: "👷", profileId: "worker-sajid" },
  { id: "mayor", name: "Comm. Nasir", label: "Mayor", kind: "mayor", sector: "All Sectors", emoji: "🏛️", profileId: "admin-nasir" },
];

interface AppHeaderProps {
  role: RoleProfile;
  onRoleChange: (id: RoleId) => void;
  /** True when the last AI API call returned a DEMO-FALLBACK mock (`isOfflineFallback: true`). */
  offline?: boolean;
  onResetData?: () => void;
}

export default function AppHeader({ role, onRoleChange, offline = false, onResetData }: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-civic-border bg-civic-surface/90 px-3 backdrop-blur">
      {/* Branding */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-civic-accent/15 text-civic-accent ring-1 ring-civic-accent/40">
          <Landmark className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-50">Awaaz</p>
          <p className="urdu -mt-1 text-[11px] text-civic-muted" lang="ur">
            آواز
          </p>
        </div>
      </div>

      <OfflineBadge visible={offline} className="shrink-0" />

      {/* Subtle sector badge */}
      <span className="flex min-w-0 items-center gap-1 rounded-full border border-civic-border bg-civic-raised px-2 py-0.5 text-[11px] text-civic-muted">
        <MapPin className="h-3 w-3 shrink-0 text-civic-accent" aria-hidden="true" />
        <span className="truncate">{role.sector ? `Islamabad (${role.sector})` : "Islamabad"}</span>
      </span>

      {/* Role switcher */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Switch role (current: ${role.name}, ${role.label})`}
          className="flex items-center gap-1 rounded-full border border-civic-border bg-civic-raised px-2.5 py-1 text-xs font-medium text-slate-100 transition hover:border-civic-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
        >
          <span aria-hidden="true">{role.emoji}</span>
          <span className="max-w-[5.5rem] truncate">{role.name}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {open && (
          <div
            role="menu"
            aria-label="Demo roles"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-civic-border bg-civic-raised shadow-xl shadow-black/60"
          >
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-civic-muted">
              Switch demo role
            </p>
            {ROLES.map((r) => {
              const active = r.id === role.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onRoleChange(r.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-civic-surface focus-visible:bg-civic-surface focus-visible:outline-none ${active ? "text-civic-accent" : "text-slate-100"
                    }`}
                >
                  <span aria-hidden="true">{r.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-medium">{r.name}</span>
                    <span className="block text-[11px] text-civic-muted">{r.label}</span>
                  </span>
                  {active && <Check className="h-4 w-4" aria-hidden="true" />}
                </button>
              );
            })}
            <div className="my-1 border-t border-civic-border" />
            <button
              type="button"
              role="menuitem"
              data-testid="reset-system-data"
              onClick={() => {
                resetSystemData();
                onResetData?.();
                setOpen(false);
                toast.success("System data reset to defaults");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-amber-300 transition hover:bg-civic-surface focus-visible:bg-civic-surface focus-visible:outline-none"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset System Data</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
