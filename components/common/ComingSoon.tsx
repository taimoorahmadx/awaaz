import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

/** Placeholder shell for tabs/portals that are wired in a later task. */
export default function ComingSoon({ icon: Icon, title, description, badge = "Coming soon" }: ComingSoonProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-civic-raised text-civic-accent ring-1 ring-civic-border">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
      <p className="text-sm text-civic-muted">{description}</p>
      <span className="rounded-full border border-civic-border px-3 py-1 text-[11px] uppercase tracking-wider text-civic-muted">
        {badge}
      </span>
    </section>
  );
}
