"use client";

import { useId, useState, type FormEvent } from "react";
import { SendHorizontal } from "lucide-react";
import type { ComplaintComment } from "@/lib/types";
import { addComment } from "@/lib/data/storage";
import { timeAgo } from "@/lib/labels";

interface CommentSectionProps {
  complaintId: string;
  comments: ComplaintComment[];
  viewerId: string;
  viewerName: string;
}

/** Flat Facebook/Instagram-style comment list + input. No nested threads. */
export default function CommentSection({ complaintId, comments, viewerId, viewerName }: CommentSectionProps) {
  const [text, setText] = useState("");
  const inputId = useId();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // addComment trims and ignores empty text; the storage event re-renders the feed.
    if (addComment(complaintId, { authorId: viewerId, authorName: viewerName, text })) setText("");
  };

  return (
    <div className="mt-3 border-t border-civic-border pt-3">
      {comments.length === 0 ? (
        <p className="text-xs text-civic-muted">No comments yet. Be the first to add one.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Comments">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2 text-xs">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-civic-surface text-[10px] font-semibold text-slate-300 ring-1 ring-civic-border"
                aria-hidden="true"
              >
                {c.authorName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 rounded-lg bg-civic-surface px-2.5 py-1.5">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold text-slate-100">{c.authorName}</span>
                  <time dateTime={c.createdAt} className="shrink-0 text-[10px] text-civic-muted">
                    {timeAgo(c.createdAt)}
                  </time>
                </p>
                {/* dir="auto" so Urdu comments render right-to-left */}
                <p dir="auto" className="break-words text-slate-300">
                  {c.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-3 flex items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          Add a comment as {viewerName}
        </label>
        <input
          id={inputId}
          type="text"
          dir="auto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          maxLength={500}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-civic-border bg-civic-surface px-3 py-1.5 text-xs text-slate-100 placeholder:text-civic-muted focus:border-civic-accent focus:outline-none focus:ring-1 focus:ring-civic-accent"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Post comment"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-civic-accent text-civic-bg transition hover:bg-civic-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent focus-visible:ring-offset-2 focus-visible:ring-offset-civic-raised disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
