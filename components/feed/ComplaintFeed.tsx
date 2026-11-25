"use client";

import { useMemo, useState } from "react";
import { Newspaper } from "lucide-react";
import type { Complaint, Urgency } from "@/lib/types";
import { useComplaints } from "@/lib/data/storage";
import { computeSectorHealth } from "@/lib/utils";
import ComplaintCard from "./ComplaintCard";
import ComplaintDetailModal from "./ComplaintDetailModal";
import FeedFilters, { type SectorFilter, type SortMode, type UrgencyFilter } from "./FeedFilters";

const URGENCY_RANK: Record<Urgency, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function matchesUrgency(c: Complaint, filter: UrgencyFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "RESOLVED") return c.status === "RESOLVED";
  // Urgency pills show open tickets only, same buckets as the map pin colours.
  return c.status !== "RESOLVED" && c.urgency === filter;
}

const byRecent = (a: Complaint, b: Complaint) => b.createdAt.localeCompare(a.createdAt);

const SORTERS: Record<SortMode, (a: Complaint, b: Complaint) => number> = {
  recent: byRecent,
  top: (a, b) => b.votes.score - a.votes.score || byRecent(a, b),
  // Open tickets first, then by urgency, then newest.
  urgent: (a, b) =>
    Number(a.status === "RESOLVED") - Number(b.status === "RESOLVED") ||
    URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
    byRecent(a, b),
};

interface ComplaintFeedProps {
  viewerId: string;
  viewerName: string;
  /** Viewer's home sector, starred in the filter row */
  homeSector: string;
  onUpdateComplaint: (c: Complaint) => void;
}

/** Explore tab: filterable, sorted list of complaint cards read from localStorage. */
export default function ComplaintFeed({ viewerId, viewerName, homeSector, onUpdateComplaint }: ComplaintFeedProps) {
  const { complaints, hydrated } = useComplaints();
  const [sector, setSector] = useState<SectorFilter>("All");
  const [urgency, setUrgency] = useState<UrgencyFilter>("ALL");
  const [sort, setSort] = useState<SortMode>("recent");
  const [modalId, setModalId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      complaints
        .filter((c) => (sector === "All" || c.location.sector === sector) && matchesUrgency(c, urgency))
        .sort(SORTERS[sort]),
    [complaints, sector, urgency, sort],
  );

  const sectorHealth = useMemo(
    () => (hydrated ? computeSectorHealth(complaints) : []),
    [complaints, hydrated],
  );

  const modalComplaint = modalId ? complaints.find((c) => c.id === modalId) ?? null : null;

  return (
    <section aria-label="Explore complaints" className="flex flex-1 flex-col">
      <FeedFilters
        sector={sector}
        urgency={urgency}
        sort={sort}
        homeSector={homeSector}
        sectorHealth={sectorHealth}
        onSectorChange={setSector}
        onUrgencyChange={setUrgency}
        onSortChange={setSort}
      />

      <p className="px-4 pt-2 text-[11px] text-civic-muted" aria-live="polite">
        {hydrated ? `${visible.length} ${visible.length === 1 ? "complaint" : "complaints"}` : "Loading complaints…"}
      </p>

      {hydrated && visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center text-civic-muted">
          <Newspaper className="h-6 w-6" aria-hidden="true" />
          <p className="text-sm">No complaints match these filters.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 px-3 py-2">
          {visible.map((c) => (
            <li key={c.id}>
              <ComplaintCard
                complaint={c}
                viewerId={viewerId}
                viewerName={viewerName}
                onOpenModal={setModalId}
              />
            </li>
          ))}
        </ul>
      )}

      <ComplaintDetailModal
        complaint={modalComplaint}
        viewerId={viewerId}
        viewerName={viewerName}
        onClose={() => setModalId(null)}
        onUpdateComplaint={onUpdateComplaint}
      />
    </section>
  );
}
