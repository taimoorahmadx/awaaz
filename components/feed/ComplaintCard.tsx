"use client";

import { useState } from "react";
import { Building2, ChevronDown, MapPin, MessageCircle } from "lucide-react";
import type { Complaint } from "@/lib/types";
import { castVote, confirmFix } from "@/lib/data/storage";
import {
  DEPARTMENT_LABELS,
  STATUS_BADGE,
  STATUS_LABELS,
  URGENCY_BADGE,
  URGENCY_HEX,
  URGENCY_LABELS,
  timeAgo,
} from "@/lib/labels";
import { useLanguage } from "@/components/common/LanguageProvider";
import { getComplaintSummary, getComplaintTitle } from "@/lib/i18n";
import CommentSection from "./CommentSection";

interface ComplaintCardProps {
  complaint: Complaint;
  viewerId: string;
  viewerName: string;
  onOpenModal: (id: string) => void;
}

/** One Explore feed card: badges, Urdu + English text, photo, vote bar and expandable flat comments. */
export default function ComplaintCard({ complaint, viewerId, viewerName, onOpenModal }: ComplaintCardProps) {
  const { lang, t, isRtl } = useLanguage();
  const [showComments, setShowComments] = useState(false);
  const { votes } = complaint;
  const upvoted = votes.upvotedBy.includes(viewerId);
  const downvoted = votes.downvotedBy.includes(viewerId);
  const commentsId = `comments-${complaint.id}`;

  const photo =
    complaint.afterPhotoUrl && complaint.status === "RESOLVED" ? complaint.afterPhotoUrl : complaint.beforePhotoUrl;

  const voteBtn = (active: boolean, activeClass: string) =>
    `flex h-8 w-8 items-center justify-center rounded-full text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent ${
      active ? activeClass : "text-civic-muted hover:bg-civic-surface hover:text-slate-100"
    }`;

  const isPendingVerification = complaint.status === "PENDING_COMMUNITY_VERIFICATION";
  const alreadyConfirmed = complaint.communityImpact.verifiedBy.includes(viewerId);

  return (
    <article
      aria-labelledby={`title-${complaint.id}`}
      className="rounded-2xl border border-civic-border bg-civic-raised p-3 shadow-lg shadow-black/30 cursor-pointer"
      onClick={() => onOpenModal(complaint.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenModal(complaint.id); } }}
    >
      {/* Badge row */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${URGENCY_BADGE[complaint.urgency]}`}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: URGENCY_HEX[complaint.urgency] }}
            aria-hidden="true"
          />
          {t.urgencies[complaint.urgency] ?? URGENCY_LABELS[complaint.urgency]}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-civic-surface px-2 py-0.5 text-slate-200 ring-1 ring-civic-border">
          <Building2 className="h-3 w-3" aria-hidden="true" />
          {t.departments[complaint.department] ?? DEPARTMENT_LABELS[complaint.department]}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-civic-muted">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {complaint.location.sector} ·{" "}
          <time dateTime={complaint.createdAt}>{timeAgo(complaint.createdAt)}</time>
        </span>
      </div>

      {/* Title & summary in active language only */}
      <h3
        id={`title-${complaint.id}`}
        dir={isRtl ? "rtl" : "ltr"}
        lang={isRtl ? "ur" : "en"}
        className={`mt-2 font-semibold text-slate-50 ${isRtl ? "urdu text-right text-base leading-relaxed" : "text-sm"}`}
      >
        {getComplaintTitle(complaint, lang)}
      </h3>
      <p
        dir={isRtl ? "rtl" : "ltr"}
        lang={isRtl ? "ur" : "en"}
        className={`mt-1 leading-relaxed text-slate-300 ${isRtl ? "urdu text-right text-sm" : "text-xs"}`}
      >
        {getComplaintSummary(complaint, lang)}
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element -- local offline SVG, no optimisation needed */}
      <img
        src={photo}
        alt={`Photo of ${complaint.category.toLowerCase()} at ${complaint.location.landmark}`}
        loading="lazy"
        className="mt-2 aspect-video w-full rounded-xl border border-civic-border bg-civic-surface object-cover"
      />

      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ${STATUS_BADGE[complaint.status]}`}>
          {t.statuses[complaint.status] ?? STATUS_LABELS[complaint.status]}
        </span>
        <span className="truncate text-civic-muted">{complaint.location.landmark}</span>
      </div>

      {/* Interaction bar */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Vote on this complaint"
          className="flex items-center rounded-full bg-civic-surface ring-1 ring-civic-border"
        >
          <button
            type="button"
            aria-label="Upvote"
            aria-pressed={upvoted}
            onClick={(e) => { e.stopPropagation(); castVote(complaint.id, viewerId, "up"); }}
            className={voteBtn(upvoted, "bg-civic-accent/20 text-civic-accent")}
          >
            <span aria-hidden="true">▲</span>
          </button>
          <span
            className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-slate-100"
            aria-live="polite"
            aria-label={`Score ${votes.score}`}
          >
            {votes.score}
          </span>
          <button
            type="button"
            aria-label="Downvote"
            aria-pressed={downvoted}
            onClick={(e) => { e.stopPropagation(); castVote(complaint.id, viewerId, "down"); }}
            className={voteBtn(downvoted, "bg-red-500/20 text-red-300")}
          >
            <span aria-hidden="true">▼</span>
          </button>
        </div>

        <button
          type="button"
          aria-expanded={showComments}
          aria-controls={commentsId}
          onClick={(e) => { e.stopPropagation(); setShowComments((v) => !v); }}
          className="inline-flex items-center gap-1.5 rounded-full bg-civic-surface px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-civic-border transition hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {complaint.comments.length} {complaint.comments.length === 1 ? "Comment" : "Comments"}
          <ChevronDown className={`h-3.5 w-3.5 transition ${showComments ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {/* +1 Confirm Fix on explore cards */}
      {isPendingVerification && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (!alreadyConfirmed) confirmFix(complaint.id, viewerId, viewerName); }}
          disabled={alreadyConfirmed}
          className={`mt-2 w-full rounded-lg py-1.5 text-xs font-bold transition ${
            alreadyConfirmed
              ? "bg-civic-surface text-civic-muted cursor-default"
              : "bg-green-500 text-white hover:bg-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
          }`}
        >
          {alreadyConfirmed ? `✓ ${t.feed.confirmed}` : t.feed.confirmFix}
        </button>
      )}

      <div id={commentsId} hidden={!showComments}>
        {showComments && (
          <CommentSection
            complaintId={complaint.id}
            comments={complaint.comments}
            viewerId={viewerId}
            viewerName={viewerName}
          />
        )}
      </div>
    </article>
  );
}
