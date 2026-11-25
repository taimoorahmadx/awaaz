"use client";

import type { SectorHealth, Urgency } from "@/lib/types";
import { RESOLVED_HEX, URGENCY_HEX } from "@/lib/labels";
import { gradeColorClasses } from "@/lib/utils";

export const SECTOR_OPTIONS = ["All", "F-10", "F-6", "G-9", "I-9"] as const;
export type SectorFilter = (typeof SECTOR_OPTIONS)[number];

/** Urgency buckets match the map pins: open tickets by urgency, resolved ones grouped on their own. */
export type UrgencyFilter = "ALL" | Urgency | "RESOLVED";
const URGENCY_OPTIONS: { value: UrgencyFilter; label: string; color?: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CRITICAL", label: "Critical", color: URGENCY_HEX.CRITICAL },
  { value: "HIGH", label: "High", color: URGENCY_HEX.HIGH },
  { value: "MEDIUM", label: "Medium", color: URGENCY_HEX.MEDIUM },
  { value: "LOW", label: "Low", color: URGENCY_HEX.LOW },
  { value: "RESOLVED", label: "Resolved", color: RESOLVED_HEX },
];

export type SortMode = "recent" | "top" | "urgent";
const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Newest" },
  { value: "top", label: "Top" },
  { value: "urgent", label: "Urgent" },
];

interface FeedFiltersProps {
  sector: SectorFilter;
  urgency: UrgencyFilter;
  sort: SortMode;
  /** Viewer's home sector, starred in the pill row */
  homeSector: string;
  sectorHealth?: SectorHealth[];
  onSectorChange: (sector: SectorFilter) => void;
  onUrgencyChange: (urgency: UrgencyFilter) => void;
  onSortChange: (sort: SortMode) => void;
}

const pillClass = (active: boolean) =>
  `inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent ${
    active
      ? "bg-civic-accent/20 text-civic-accent ring-civic-accent/60"
      : "bg-civic-raised text-slate-300 ring-civic-border hover:text-slate-100"
  }`;

/** Sticky sector + urgency pill rows with a compact sort toggle. Filtering is purely client-side. */
export default function FeedFilters({
  sector,
  urgency,
  sort,
  homeSector,
  sectorHealth = [],
  onSectorChange,
  onUrgencyChange,
  onSortChange,
}: FeedFiltersProps) {
  const healthBySector = new Map(sectorHealth.map((h) => [h.sector, h]));

  return (
    <div className="sticky top-14 z-30 flex flex-col gap-2 border-b border-civic-border bg-civic-bg/95 px-3 py-2 backdrop-blur">
      <div role="group" aria-label="Filter by sector" className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {SECTOR_OPTIONS.map((s) => {
          const health = s === "All" ? undefined : healthBySector.get(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={sector === s}
              aria-label={health ? `${s} (Civic Health Grade ${health.grade}, ${health.score}/100)` : s}
              onClick={() => onSectorChange(s)}
              className={pillClass(sector === s)}
            >
              {s === homeSector && (
                <span aria-label="Your sector" className="text-[10px]">
                  ★
                </span>
              )}
              <span>{s}</span>
              {health && (
                <span
                  data-testid={`sector-chip-grade-${s}`}
                  className={`rounded-full border px-1.5 text-[10px] font-bold leading-4 ${gradeColorClasses(health.grade).badge}`}
                >
                  {health.grade}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="group" aria-label="Filter by urgency" className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {URGENCY_OPTIONS.map(({ value, label, color }) => (
          <button
            key={value}
            type="button"
            aria-pressed={urgency === value}
            onClick={() => onUrgencyChange(value)}
            className={pillClass(urgency === value)}
          >
            {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />}
            {label}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Sort feed" className="flex items-center gap-1 self-end text-[11px]">
        <span className="mr-1 text-civic-muted">Sort:</span>
        {SORT_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={sort === value}
            onClick={() => onSortChange(value)}
            className={`rounded-md px-2 py-0.5 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent ${
              sort === value ? "bg-civic-raised text-slate-50" : "text-civic-muted hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
