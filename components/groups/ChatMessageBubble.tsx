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

const HAS_URDU_RE = /[\u0600-\u06FF]/;

/** WhatsApp-style group message bubble with proper Urdu line-height and unobtrusive ticket action. */
export default function ChatMessageBubble({
  message,
  isOwn,
  attachedComplaint,
  onOpenComplaint,
  onConvertToTicket,
}: ChatMessageBubbleProps) {
  const isOfficial = Boolean(message.isOfficialAlert);
  const isUrdu = HAS_URDU_RE.test(message.text);
  const showConvert = !isOfficial && !attachedComplaint;

  return (
    <article
      data-testid="group-message"
      data-message-id={message.id}
      className={cn(
        "flex flex-col rounded-2xl border px-3 py-2",
        attachedComplaint ? "w-full" : "max-w-[85%]",
        isOfficial
          ? "w-full max-w-full border-amber-500/40 bg-amber-500/10"
          : isOwn
            ? "self-end rounded-tr-sm border-civic-accent/40 bg-civic-accent/15"
            : "self-start rounded-tl-sm border-civic-border bg-civic-raised",
      )}
    >
      {(!isOwn || isOfficial) && (
        <header className="mb-1 flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-slate-100">{message.senderName}</span>
          {isOfficial ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              <Megaphone className="h-3 w-3" aria-hidden="true" />
              Official Alert
            </span>
          ) : (
            message.senderRole && (
              <span className="truncate text-civic-muted">· {message.senderRole}</span>
            )
          )}
        </header>
      )}

      <p
        dir={isUrdu ? "rtl" : "auto"}
        className={cn(
          "whitespace-pre-wrap break-words text-sm text-slate-100",
          isUrdu ? "urdu py-0.5 leading-[2.1]" : "leading-relaxed",
        )}
      >
        {message.text}
      </p>

      {attachedComplaint && (
        <ComplaintCardEmbed complaint={attachedComplaint} onOpenDetail={onOpenComplaint} />
      )}

      <footer className="mt-1 flex items-center justify-end gap-2">
        {showConvert && (
          <button
            type="button"
            onClick={() => onConvertToTicket(message.text)}
            data-testid="convert-to-ticket-btn"
            title="Convert to Ticket"
            aria-label="Convert to Ticket"
            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-civic-muted transition hover:bg-civic-surface hover:text-civic-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
          >
            <span>Ticket</span>
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
        <time dateTime={message.createdAt} className="text-[10px] text-civic-muted">
          {timeAgo(message.createdAt)}
        </time>
      </footer>
    </article>
  );
}
