"use client";

import { useState } from "react";
import { Megaphone, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addGroupMessage, useGroupMessages } from "@/lib/data/storage";
import { DEPARTMENT_LABELS, STATUS_LABELS, timeAgo } from "@/lib/labels";
import type { Complaint } from "@/lib/types";

interface MayorAlertsTabProps {
  complaints: Complaint[];
}

const DEFAULT_TITLE = "Emergency Civic Advisory";
const DEFAULT_BODY =
  "Monsoon safety notice: Keep clear of open manholes and low-hanging power lines. CDA Sanitation & IESCO rapid teams are active in F-10, F-6, and G-9.";

const MUNICIPAL_ALERTS_GROUP_ID = "grp-municipal-alerts";

/** Mayor Alerts tab: live critical escalations + editable Emergency Broadcast to Municipal Alerts (AC-10.4). */
export default function MayorAlertsTab({ complaints }: MayorAlertsTabProps) {
  const { messages } = useGroupMessages();
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [escalatedIds, setEscalatedIds] = useState<string[]>([]);

  const criticalOpen = complaints.filter(
    (c) => c.status !== "RESOLVED" && (c.urgency === "CRITICAL" || c.sla.isBreached),
  );

  const officialAlerts = messages.filter(
    (m) => m.groupId === MUNICIPAL_ALERTS_GROUP_ID || m.isOfficialAlert,
  );
  const latestAlert =
    officialAlerts.length > 0 ? officialAlerts[officialAlerts.length - 1] : null;

  function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    const trimmedBody = body.trim();
    const trimmedTitle = title.trim();
    if (!trimmedBody) {
      toast.error("Please enter a notice message before broadcasting.");
      return;
    }

    const fullText = trimmedTitle ? `${trimmedTitle}: ${trimmedBody}` : trimmedBody;
    const posted = addGroupMessage({
      groupId: MUNICIPAL_ALERTS_GROUP_ID,
      senderId: "admin-nasir",
      senderName: "Comm. Nasir",
      senderRole: "Mayor / Commissioner",
      text: fullText,
      isOfficialAlert: true,
    });

    if (posted) {
      toast.success("Emergency notice broadcast to Municipal Alerts");
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <section aria-labelledby="mayor-broadcast-heading">
        <h2
          id="mayor-broadcast-heading"
          className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
        >
          Public Emergency Broadcast
        </h2>
        <form
          onSubmit={handleBroadcast}
          data-testid="emergency-broadcast-form"
          className="flex flex-col gap-2.5 rounded-xl border border-amber-400/40 bg-civic-surface p-3"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-amber-300">Broadcast Emergency Notice</p>
              <p className="text-[11px] text-slate-400">
                Posts an official alert to 📢 Municipal Alerts and pins the banner across all channels
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="broadcast-title" className="text-[11px] font-medium text-slate-300">
              Notice Title
            </label>
            <Input
              id="broadcast-title"
              data-testid="broadcast-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Emergency Civic Advisory"
              className="bg-civic-raised text-sm text-slate-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="broadcast-message" className="text-[11px] font-medium text-slate-300">
              Advisory Message
            </label>
            <Textarea
              id="broadcast-message"
              data-testid="broadcast-message-input"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write official instructions for residents..."
              className="bg-civic-raised text-sm text-slate-100"
            />
          </div>

          <Button
            type="submit"
            data-testid="broadcast-submit-btn"
            disabled={!body.trim()}
            className="w-full gap-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Broadcast Emergency Notice
          </Button>

          {latestAlert && (
            <div
              data-testid="latest-broadcast-preview"
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px]"
            >
              <div className="flex items-center justify-between font-semibold text-amber-300">
                <span>Latest Official Alert</span>
                <time dateTime={latestAlert.createdAt} className="font-normal text-amber-200/80">
                  {timeAgo(latestAlert.createdAt)}
                </time>
              </div>
              <p className="mt-0.5 text-slate-200">{latestAlert.text}</p>
            </div>
          )}
        </form>
      </section>

      <section aria-labelledby="mayor-escalations-heading" className="flex flex-col gap-2">
        <h2
          id="mayor-escalations-heading"
          className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"
        >
          Critical Escalations ({criticalOpen.length} Requiring Action)
        </h2>

        {criticalOpen.length === 0 ? (
          <div className="rounded-xl border border-civic-border bg-civic-surface p-3 text-xs text-slate-400">
            No critical or overdue tickets open right now.
          </div>
        ) : (
          criticalOpen.map((c) => {
            const escalated = escalatedIds.includes(c.id);
            return (
              <div
                key={c.id}
                className="rounded-xl border border-red-500/50 bg-civic-surface p-3"
              >
                <p className="flex items-center gap-1 text-[11px] font-bold text-red-400">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {c.sla.isBreached ? "OVERDUE" : "CRITICAL"} · {c.id.toUpperCase()} ·{" "}
                  {DEPARTMENT_LABELS[c.department]} ({c.location.sector})
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{c.title}</p>
                <p className="text-[11px] text-slate-400">
                  {c.location.landmark} · {STATUS_LABELS[c.status]}
                  {c.assignedTo ? ` · Assigned: ${c.assignedTo.workerName}` : ""}
                </p>
                <button
                  type="button"
                  disabled={escalated}
                  onClick={() => {
                    setEscalatedIds((prev) => [...prev, c.id]);
                    toast.success(`Priority crew dispatched for ${c.id.toUpperCase()}`);
                  }}
                  className={`mt-2 w-full rounded-lg py-1.5 text-xs font-bold transition ${
                    escalated
                      ? "bg-slate-700 text-slate-300"
                      : "bg-red-600 text-white hover:bg-red-500"
                  }`}
                >
                  {escalated ? "✓ Priority Dispatch Active" : "🚀 Dispatch Rapid Crew"}
                </button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

