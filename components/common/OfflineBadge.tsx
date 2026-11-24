"use client";
import { WifiOff } from "lucide-react";

interface OfflineBadgeProps {
  visible: boolean;
  className?: string;
}

/** Small chip shown when the AI route returned a DEMO-FALLBACK mock (`isOfflineFallback: true`). */
export default function OfflineBadge({ visible, className = "" }: OfflineBadgeProps) {
  if (!visible) return null;
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 ${className}`}
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
      Offline Mode (Synced locally)
    </span>
  );
}
