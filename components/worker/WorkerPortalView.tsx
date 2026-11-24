"use client";

import { useState } from "react";
import { ClipboardList, Home, User } from "lucide-react";
import type { Complaint } from "@/lib/types";
import { STATUS_BADGE, STATUS_LABELS, URGENCY_BADGE, URGENCY_LABELS } from "@/lib/labels";
import WorkerQueue from "./WorkerQueue";
import BeforeAfterViewer from "./BeforeAfterViewer";
import WorkerProfile from "./WorkerProfile";

type WorkerTab = "queue" | "home" | "profile";

interface WorkerPortalViewProps {
  complaints: Complaint[];
  onUpdateComplaint: (complaint: Complaint) => void;
}

const TABS: { id: WorkerTab; label: string; icon: typeof Home }[] = [
  { id: "queue", label: "Queue", icon: ClipboardList },
  { id: "home", label: "Home", icon: Home },
  { id: "profile", label: "Profile", icon: User },
];

/** Worker portal: Queue (claim) → Home (upload fix + AI verify) → Profile. */
export default function WorkerPortalView({ complaints, onUpdateComplaint }: WorkerPortalViewProps) {
  const [tab, setTab] = useState<WorkerTab>("queue");

  // Claimed work: in progress, plus tickets awaiting community sign-off.
  const myWork = complaints.filter((c) => c.status === "IN_PROGRESS" || c.status === "PENDING_COMMUNITY_VERIFICATION");

  function handleUpdate(c: Complaint) {
    onUpdateComplaint(c);
    if (c.status === "IN_PROGRESS") setTab("home");
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === "queue" && <WorkerQueue complaints={complaints} onUpdateComplaint={handleUpdate} />}
        {tab === "home" && (
          <section className="flex flex-col gap-3 p-4">
            {myWork.length === 0 && (
              <p className="py-12 text-center text-sm text-civic-muted">No claimed tickets. Claim one from the Queue.</p>
            )}
            {myWork.map((c) => (
              <article
                key={c.id}
                data-testid="worker-ticket"
                data-complaint-id={c.id}
                className="flex flex-col gap-3 rounded-2xl bg-civic-raised p-3 ring-1 ring-civic-border">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${URGENCY_BADGE[c.urgency]}`}>
                    {URGENCY_LABELS[c.urgency]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${STATUS_BADGE[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-50">{c.title}</h3>
                  <p className="text-xs text-civic-muted">{c.location.landmark}</p>
                </div>
                <BeforeAfterViewer complaint={c} onUpdateComplaint={onUpdateComplaint} />
              </article>
            ))}
          </section>
        )}
        {tab === "profile" && <WorkerProfile />}
      </main>

      <nav
        aria-label="Worker navigation"
        className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t border-civic-border bg-civic-bg/95 backdrop-blur"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
              tab === id ? "text-civic-accent" : "text-civic-muted"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
            {id === "home" && myWork.length > 0 && <span className="sr-only">({myWork.length})</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
