import { Droplets, Hash, Lock, Zap, type LucideIcon } from "lucide-react";

const CHANNELS: { id: string; name: string; description: string; members: number; icon: LucideIcon }[] = [
  { id: "f10-2", name: "F-10/2 Residents", description: "Street-level updates for F-10/2", members: 214, icon: Hash },
  { id: "f6-3", name: "F-6/3 Neighbours", description: "Supermarket area & Margalla Rd", members: 158, icon: Hash },
  { id: "water", name: "Water Watch", description: "WASA supply cuts & leaks", members: 392, icon: Droplets },
  { id: "iesco", name: "IESCO Alerts", description: "Load-shedding & loose wires", members: 547, icon: Zap },
];

/** Groups tab — static channel list shell. Live chat is deferred (TD-1). */
export default function GroupsShell() {
  return (
    <section className="flex flex-1 flex-col gap-3 px-4 py-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-slate-50">Community Channels</h2>
        <span className="urdu text-sm text-civic-muted" lang="ur">
          گروپس
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {CHANNELS.map(({ id, name, description, members, icon: Icon }) => (
          <li
            key={id}
            className="flex items-center gap-3 rounded-xl border border-civic-border bg-civic-raised px-3 py-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-civic-surface text-civic-accent">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">{name}</p>
              <p className="truncate text-xs text-civic-muted">{description}</p>
            </div>
            <span className="shrink-0 text-[11px] text-civic-muted">{members} members</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-civic-border px-3 py-3 text-center text-xs text-civic-muted">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        Live chat & 1-tap “Convert to Ticket” coming soon
      </p>
    </section>
  );
}
