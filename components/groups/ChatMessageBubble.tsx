"use client";

import { ArrowUpRight, Megaphone } from "lucide-react";
import type { Complaint, GroupMessage } from "@/lib/types";
import { timeAgo } from "@/lib/labels";
import { cn } from "@/lib/utils";
import ComplaintCardEmbed from "./ComplaintCardEmbed";

interface ChatMessageBubbleProps {
  message: GroupMessage;
  isOwn: boolean;
  attachedComplaint?: Complaint;
  onOpenComplaint: (complaint: Complaint) => void;
  onConvertToTicket: (text: string) => void;
}

/** Text-only group message bubble with optional live complaint embed and Convert to Ticket action. */
export default function ChatMessageBubble({
  message,
  isOwn,
  attachedComplaint,
  onOpenComplaint,
  onConvertToTicket,
}: ChatMessageBubbleProps) {
  const isOfficial = Boolean(message.isOfficialAlert);

  return (
    <article
      data-testid="group-message"
      data-message-id={message.id}
      className={cn(
        "rounded-2xl border px-3.5 py-2.5",
        isOfficial
          ? "border-amber-500/40 bg-amber-500/10"
          : isOwn
            ? "border-civic-accent/40 bg-civic-accent/10"
            : "border-civic-border bg-civic-raised",
      )}
    >
      <header className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="font-semibold text-slate-100">{message.senderName}</span>
        {isOfficial ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            <Megaphone className="h-3 w-3" aria-hidden="true" />
            Official Alert
          </span>
        ) : (
          message.senderRole && (
            <span className="text-civic-muted">· {message.senderRole}</span>
          )
        )}
        <time dateTime={message.createdAt} className="ml-auto text-[10px] text-civic-muted">
          {timeAgo(message.createdAt)}
        </time>
      </header>

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-100">
        {message.text}
      </p>

      {attachedComplaint && (
        <ComplaintCardEmbed complaint={attachedComplaint} onOpenDetail={onOpenComplaint} />
      )}

      {!isOfficial && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => onConvertToTicket(message.text)}
            data-testid="convert-to-ticket-btn"
            className="inline-flex items-center gap-1 rounded-full border border-civic-border bg-civic-surface px-2.5 py-1 text-[11px] font-medium text-civic-accent transition hover:border-civic-accent/60 hover:bg-civic-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
          >
            Convert to Ticket
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}

