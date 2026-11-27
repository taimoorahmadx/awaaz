"use client";

import { useState } from "react";
import { ClipboardList, Home, User } from "lucide-react";
import { toast } from "sonner";
import type { Complaint } from "@/lib/types";
import { useLanguage } from "@/components/common/LanguageProvider";
import WorkerQueue from "./WorkerQueue";
import WorkerHome from "./WorkerHome";
import WorkerProfile from "./WorkerProfile";

type WorkerTab = "queue" | "home" | "profile";

interface WorkerPortalViewProps {
  complaints: Complaint[];
  workerId?: string;
  onUpdateComplaint: (complaint: Complaint) => void;
}

/** Worker portal: Queue (claim) → Home (route card + upload fix + AI verify) → Profile. */
export default function WorkerPortalView({
  complaints,
  workerId = "worker-sajid",
  onUpdateComplaint,
}: WorkerPortalViewProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<WorkerTab>("queue");

  const TABS: { id: WorkerTab; label: string; icon: typeof Home }[] = [
    { id: "queue", label: t.worker.queueTab, icon: ClipboardList },
    { id: "home", label: t.worker.homeTab, icon: Home },
    { id: "profile", label: t.worker.profileTab, icon: User },
  ];

  const activeWorkCount = complaints.filter(
    (c) => c.assignedTo?.workerId === workerId && c.status === "IN_PROGRESS",
  ).length;

  function handleUpdate(c: Complaint) {
    onUpdateComplaint(c);
    if (c.status === "IN_PROGRESS") {
      toast.success("Ticket claimed — added to Home", {
        action: { label: "View", onClick: () => setTab("home") },
      });
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === "queue" && <WorkerQueue complaints={complaints} onUpdateComplaint={handleUpdate} />}
        {tab === "home" && (
          <WorkerHome
            complaints={complaints}
            workerId={workerId}
            onUpdateComplaint={onUpdateComplaint}
          />
        )}
        {tab === "profile" && <WorkerProfile />}
      </main>

      <nav
        aria-label="Worker navigation"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-16 max-w-md border-t border-civic-border bg-civic-surface/95 shadow-[0_-4px_20px_rgba(0,0,0,0.35)] backdrop-blur"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-civic-accent ${
              tab === id ? "text-civic-accent" : "text-civic-muted hover:text-slate-200"
            }`}
          >
            <span className="relative">
              <Icon className="h-5 w-5" aria-hidden="true" />
              {id === "home" && activeWorkCount > 0 && (
                <span className="absolute -right-2.5 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-civic-accent px-1 text-[10px] font-bold tabular-nums text-slate-950">
                  {activeWorkCount}
                </span>
              )}
            </span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
