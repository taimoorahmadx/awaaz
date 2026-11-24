"use client";

import { ClipboardList, Map, Mic, Newspaper, Users, type LucideIcon } from "lucide-react";

export type CitizenTab = "explore" | "map" | "home" | "reports" | "groups";

const TABS: { id: CitizenTab; label: string; icon: LucideIcon }[] = [
  { id: "explore", label: "Explore", icon: Newspaper },
  { id: "map", label: "Map", icon: Map },
  { id: "home", label: "Home", icon: Mic },
  { id: "reports", label: "My Reports", icon: ClipboardList },
  { id: "groups", label: "Groups", icon: Users },
];

interface BottomNavProps {
  active: CitizenTab;
  onChange: (tab: CitizenTab) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto h-16 max-w-md border-t border-civic-border bg-civic-surface/95 backdrop-blur"
    >
      <ul className="grid h-full grid-cols-5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          const isHome = id === "home";
          return (
            <li key={id} className="flex">
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-civic-accent ${
                  isActive ? "text-civic-accent" : "text-civic-muted hover:text-slate-200"
                }`}
              >
                {isHome ? (
                  // Elevated center Home action
                  <span
                    className={`-mt-6 flex h-12 w-12 items-center justify-center rounded-full border-4 border-civic-surface shadow-lg transition ${
                      isActive
                        ? "bg-civic-accent text-civic-bg shadow-civic-accent/30"
                        : "bg-civic-raised text-civic-accent"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                ) : (
                  <Icon className="h-5 w-5" aria-hidden="true" />
                )}
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
