"use client";

import { ClipboardList, Map, Newspaper, Plus, Users, type LucideIcon } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export type CitizenTab = "explore" | "map" | "home" | "reports" | "groups";

const TABS: { id: CitizenTab; icon: LucideIcon }[] = [
  { id: "explore", icon: Newspaper },
  { id: "map", icon: Map },
  { id: "home", icon: Plus },
  { id: "reports", icon: ClipboardList },
  { id: "groups", icon: Users },
];

interface BottomNavProps {
  active: CitizenTab;
  onChange: (tab: CitizenTab) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  const { lang, t } = useLanguage();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto h-16 max-w-md border-t border-civic-border bg-civic-surface/95 backdrop-blur"
    >
      <ul className="grid h-full grid-cols-5">
        {TABS.map(({ id, icon: Icon }) => {
          const isActive = id === active;
          const isHome = id === "home";
          const label = t.nav[id];
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
                <span className={lang === "ur" ? "urdu text-[11px]" : ""}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
