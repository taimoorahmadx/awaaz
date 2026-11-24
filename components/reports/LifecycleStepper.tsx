"use client";

import type { TicketStatus } from "@/lib/types";

const STEPS: { status: TicketStatus; label: string }[] = [
  { status: "REPORTED", label: "Reported" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "PENDING_COMMUNITY_VERIFICATION", label: "Pending Sign-off" },
  { status: "RESOLVED", label: "Resolved" },
];

/** Visual stepper: Reported → In Progress → Pending Sign-off → Resolved. */
export default function LifecycleStepper({ status }: { status: TicketStatus }) {
  const current = STEPS.findIndex((s) => s.status === status);
  const resolved = status === "RESOLVED";

  return (
    <ol className="flex items-start" aria-label="Ticket lifecycle">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const color = resolved ? "bg-green-500 border-green-500" : done ? "bg-amber-400 border-amber-400" : "bg-transparent border-slate-600";
        return (
          <li key={step.status} className="flex flex-1 flex-col items-center text-center" aria-current={i === current ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done ? (resolved ? "bg-green-500" : "bg-amber-400") : "bg-slate-700"}`} />
              <span className={`h-3 w-3 shrink-0 rounded-full border-2 ${color}`} aria-hidden="true" />
              <span
                className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "opacity-0" : i < current ? (resolved ? "bg-green-500" : "bg-amber-400") : "bg-slate-700"}`}
              />
            </div>
            <span className={`mt-1 text-[10px] leading-tight ${done ? "font-semibold text-slate-100" : "text-slate-500"}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
