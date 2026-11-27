"use client";

import { ArrowUpDown, Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { SectorHealth, Urgency } from "@/lib/types";
import { RESOLVED_HEX, URGENCY_HEX } from "@/lib/labels";
import { cn, gradeColorClasses } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  /** Viewer's home sector, starred in the sector list */
  homeSector: string;
  sectorHealth?: SectorHealth[];
  /** Compact count text displayed on the left of the toolbar */
  countText?: string;
  onSectorChange: (sector: SectorFilter) => void;
  onUrgencyChange: (urgency: UrgencyFilter) => void;
  onSortChange: (sort: SortMode) => void;
}

const chipClass = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent",
    active
      ? "bg-civic-accent/20 text-civic-accent ring-civic-accent/60"
      : "bg-civic-raised text-slate-300 ring-civic-border hover:text-slate-100",
  );

/** Compact Explore toolbar with Sort dropdown + bottom-sheet Filter drawer. */
export default function FeedFilters({
  sector,
  urgency,
  sort,
  homeSector,
  sectorHealth = [],
  countText,
  onSectorChange,
  onUrgencyChange,
  onSortChange,
}: FeedFiltersProps) {
  const healthBySector = new Map(sectorHealth.map((h) => [h.sector, h]));
  const activeCount = Number(sector !== "All") + Number(urgency !== "ALL");
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Newest";
  const currentUrgencyOption = URGENCY_OPTIONS.find((o) => o.value === urgency);

  const clearAll = () => {
    onSectorChange("All");
    onUrgencyChange("ALL");
  };

  return (
    <div className="flex flex-col gap-2 border-b border-civic-border bg-civic-bg px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-civic-muted" aria-live="polite">
          {countText ?? ""}
        </p>

        <div className="flex items-center gap-1.5">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Sort feed"
                data-testid="sort-menu-trigger"
                className="inline-flex items-center gap-1 rounded-full border border-civic-border bg-civic-raised px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-civic-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
              >
                <ArrowUpDown className="h-3 w-3 text-civic-muted" aria-hidden="true" />
                <span>{currentSortLabel}</span>
                <ChevronDown className="h-3 w-3 text-civic-muted" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 border-civic-border bg-civic-surface text-slate-100">
              {SORT_OPTIONS.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => onSortChange(value)}
                  className="flex cursor-pointer items-center justify-between text-xs focus:bg-civic-raised focus:text-slate-50"
                >
                  <span>{label}</span>
                  {sort === value && <Check className="h-3.5 w-3.5 text-civic-accent" aria-hidden="true" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filters bottom sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                data-testid="open-filters-button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent",
                  activeCount > 0
                    ? "border-civic-accent/60 bg-civic-accent/15 text-civic-accent"
                    : "border-civic-border bg-civic-raised text-slate-200 hover:border-civic-accent/60",
                )}
              >
                <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
                <span>Filters</span>
                {activeCount > 0 && (
                  <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-civic-accent px-1 text-[10px] font-bold text-emerald-950">
                    {activeCount}
                  </span>
                )}
              </button>
            </SheetTrigger>

            <SheetContent
              side="bottom"
              className="mx-auto max-w-md rounded-t-2xl border-civic-border bg-civic-surface px-4 pb-6 pt-4 text-slate-100"
            >
              <SheetHeader className="flex-row items-center justify-between space-y-0 pb-3 text-left">
                <SheetTitle className="text-sm font-semibold text-slate-100">Filter Complaints</SheetTitle>
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mr-7 text-xs font-medium text-civic-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
                  >
                    Clear all
                  </button>
                )}
              </SheetHeader>

              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-civic-muted">
                    Sector
                  </p>
                  <div role="group" aria-label="Filter by sector" className="flex flex-wrap gap-2">
                    {SECTOR_OPTIONS.map((s) => {
                      const health = s === "All" ? undefined : healthBySector.get(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={sector === s}
                          aria-label={health ? `${s} (Civic Health Grade ${health.grade}, ${health.score}/100)` : s}
                          onClick={() => onSectorChange(s)}
                          className={chipClass(sector === s)}
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
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-civic-muted">
                    Urgency &amp; Status
                  </p>
                  <div role="group" aria-label="Filter by urgency" className="flex flex-wrap gap-2">
                    {URGENCY_OPTIONS.map(({ value, label, color }) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={urgency === value}
                        onClick={() => onUrgencyChange(value)}
                        className={chipClass(urgency === value)}
                      >
                        {color && (
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                        )}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <SheetClose asChild>
                  <button
                    type="button"
                    className="mt-1 w-full rounded-xl bg-civic-accent py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
                  >
                    Done
                  </button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filter summary chips (only rendered when a filter is applied) */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {sector !== "All" && (
            <button
              type="button"
              onClick={() => onSectorChange("All")}
              className="inline-flex items-center gap-1 rounded-full bg-civic-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-civic-accent ring-1 ring-civic-accent/40 hover:bg-civic-accent/25"
            >
              <span>{sector}</span>
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove sector filter</span>
            </button>
          )}
          {urgency !== "ALL" && currentUrgencyOption && (
            <button
              type="button"
              onClick={() => onUrgencyChange("ALL")}
              className="inline-flex items-center gap-1 rounded-full bg-civic-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-civic-accent ring-1 ring-civic-accent/40 hover:bg-civic-accent/25"
            >
              {currentUrgencyOption.color && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: currentUrgencyOption.color }}
                  aria-hidden="true"
                />
              )}
              <span>{currentUrgencyOption.label}</span>
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove urgency filter</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
