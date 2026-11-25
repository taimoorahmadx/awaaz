"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Lock, Megaphone, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addGroupMessage } from "@/lib/data/storage";
import { timeAgo } from "@/lib/labels";
import type { CivicGroup, Complaint, GroupMessage } from "@/lib/types";
import ChatMessageBubble from "./ChatMessageBubble";

interface GroupChatViewProps {
  group: CivicGroup;
  messages: GroupMessage[];
  latestBroadcast?: GroupMessage;
  complaintsById: Map<string, Complaint>;
  viewerId: string;
  viewerName: string;
  viewerLabel: string;
  onBack: () => void;
  onOpenComplaint: (complaint: Complaint) => void;
  onConvertToTicket: (text: string) => void;
}

/** Channel message stream + text-only composer (or read-only notice for Municipal Alerts). */
export default function GroupChatView({
  group,
  messages,
  latestBroadcast,
  complaintsById,
  viewerId,
  viewerName,
  viewerLabel,
  onBack,
  onOpenComplaint,
  onConvertToTicket,
}: GroupChatViewProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (group.isOfficial) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    const added = addGroupMessage({
      groupId: group.id,
      senderId: viewerId,
      senderName: viewerName,
      senderRole: viewerLabel,
      text: trimmed,
    });
    if (added) setDraft("");
  }

  return (
    <section className="flex flex-1 flex-col" data-testid="group-chat-view">
      {/* Channel header */}
      <header className="sticky top-14 z-30 flex items-center gap-2.5 border-b border-civic-border bg-civic-surface/95 px-3 py-2.5 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to channels"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-civic-border bg-civic-raised text-slate-200 transition hover:border-civic-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-slate-50">{group.name}</h2>
          <p className="truncate text-[11px] text-civic-muted">{group.description}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-civic-border bg-civic-raised px-2 py-0.5 text-[11px] text-civic-muted">
          <Users className="h-3 w-3" aria-hidden="true" />
          {group.memberCount}
        </span>
      </header>

      {/* Latest Municipal Alert banner atop non-official channels (AC-10.4) */}
      {!group.isOfficial && latestBroadcast && (
        <aside
          data-testid="official-alert-banner"
          aria-label="Latest municipal alert"
          className="mx-3 mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5"
        >
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              <span>Municipal Alert · {latestBroadcast.senderName}</span>
              <time dateTime={latestBroadcast.createdAt} className="font-normal text-amber-200/80">
                {timeAgo(latestBroadcast.createdAt)}
              </time>
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-100">{latestBroadcast.text}</p>
          </div>
        </aside>
      )}

      {/* Message stream */}
      <div className="flex flex-1 flex-col gap-2.5 px-3 py-3">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-civic-muted">No messages yet in this group.</p>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === viewerId}
              attachedComplaint={
                msg.attachedComplaintId ? complaintsById.get(msg.attachedComplaintId) : undefined
              }
              onOpenComplaint={onOpenComplaint}
              onConvertToTicket={onConvertToTicket}
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Text-only composer or read-only notice */}
      {group.isOfficial ? (
        <div
          data-testid="channel-readonly-notice"
          className="sticky bottom-16 flex items-center justify-center gap-2 border-t border-civic-border bg-civic-surface/95 px-4 py-3 text-xs text-civic-muted backdrop-blur"
        >
          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
          <span>Read-only channel — only official Mayor broadcasts appear here.</span>
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="sticky bottom-16 flex items-center gap-2 border-t border-civic-border bg-civic-surface/95 px-3 py-2.5 backdrop-blur"
        >
          <label htmlFor="group-message-input" className="sr-only">
            Message {group.name}
          </label>
          <Input
            id="group-message-input"
            data-testid="group-message-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message neighbours in Urdu or English..."
            className="h-10 flex-1 rounded-full border-civic-border bg-civic-raised px-4 text-sm text-slate-100 placeholder:text-civic-muted"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim()}
            aria-label="Send message"
            className="h-10 w-10 shrink-0 rounded-full"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      )}
    </section>
  );
}

