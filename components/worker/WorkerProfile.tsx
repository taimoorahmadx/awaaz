import { BadgeCheck, HardHat } from "lucide-react";

/** Static worker profile card for the demo. */
export default function WorkerProfile() {
  const stats = [
    { label: "AI accuracy", value: "98%" },
    { label: "Tickets closed", value: "142" },
    { label: "Avg. fix time", value: "6h" },
  ];
  return (
    <section className="flex flex-col items-center gap-4 p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-civic-raised text-civic-accent ring-1 ring-civic-border">
        <HardHat className="h-8 w-8" aria-hidden="true" />
      </span>
      <div>
        <h2 className="flex items-center justify-center gap-1 text-lg font-semibold text-slate-50">
          Sajid <BadgeCheck className="h-4 w-4 text-civic-accent" aria-label="Verified worker" />
        </h2>
        <p className="text-sm text-civic-muted">CDA Sanitation · Sector F-10, Islamabad</p>
      </div>
      <dl className="grid w-full grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-civic-raised p-3 ring-1 ring-civic-border">
            <dt className="text-[11px] text-civic-muted">{s.label}</dt>
            <dd className="text-lg font-semibold text-slate-50">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
