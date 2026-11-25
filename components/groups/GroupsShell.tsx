"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Droplets, Hash, Lock, Megaphone, Store, Zap, type LucideIcon } from "lucide-react";
import ComplaintDetailModal from "@/components/feed/ComplaintDetailModal";
import { useComplaints, useGroupMessages, useGroups } from "@/lib/data/storage";
import { timeAgo } from "@/lib/labels";
import type { CivicGroup, CivicGroupType, Complaint, GroupMessage } from "@/lib/types";
import GroupChatView from "./GroupChatView";

interface GroupsShellProps {
  viewerId: string;
  viewerName: string;
  viewerLabel: string;
  onConvertToTicket: (text: string) => void;
  onUpdateComplaint: (complaint: Complaint) => void;
}

const SECTION_ORDER: { type: CivicGroupType; label: string }[] = [
  { type: "LOCALITY", label: "Locality" },
  { type: "MARKET", label: "Market" },
  { type: "CIVIC_TOPIC", label: "Civic Interest" },
  { type: "OFFICIAL_BROADCAST", label: "Official Broadcast" },
];

function channelIcon(group: CivicGroup): LucideIcon {
  if (group.type === "OFFICIAL_BROADCAST") return Megaphone;
  if (group.type === "MARKET") return Store;
  if (group.id.includes("water")) return Droplets;
  if (group.id.includes("iesco")) return Zap;
  return Hash;
}

/** Groups tab — 5 neighborhood channels grouped by type, live text chat, and complaint embeds. */
export default function GroupsShell({
  viewerId,
  viewerName,
  viewerLabel,
  onConvertToTicket,
  onUpdateComplaint,
}: GroupsShellProps) {
  const { groups, hydrated: groupsHydrated } = useGroups();
  const { messages } = useGroupMessages();
  const { complaints } = useComplaints();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [detailComplaintId, setDetailComplaintId] = useState<string | null>(null);

  const complaintsById = useMemo(
    () => new Map(complaints.map((c) => [c.id, c])),
    [complaints],
  );

  const messagesByGroup = useMemo(() => {
    const map = new Map<string, GroupMessage[]>();
    for (const msg of messages) {
      const list = map.get(msg.groupId);
      if (list) list.push(msg);
      else map.set(msg.groupId, [msg]);
    }
    return map;
  }, [messages]);

  const latestBroadcast = useMemo(() => {
    const officialIds = new Set(groups.filter((g) => g.isOfficial).map((g) => g.id));
    const broadcasts = messages.filter((m) => m.isOfficialAlert || officialIds.has(m.groupId));
    return broadcasts.length > 0 ? broadcasts[broadcasts.length - 1] : undefined;
  }, [groups, messages]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const detailComplaint = detailComplaintId ? (complaintsById.get(detailComplaintId) ?? null) : null;

  return (
    <>
      {selectedGroup ? (
        <GroupChatView
          group={selectedGroup}
          messages={messagesByGroup.get(selectedGroup.id) ?? []}
          latestBroadcast={latestBroadcast}
          complaintsById={complaintsById}
          viewerId={viewerId}
          viewerName={viewerName}
          viewerLabel={viewerLabel}
          onBack={() => setSelectedGroupId(null)}
          onOpenComplaint={(c) => setDetailComplaintId(c.id)}
          onConvertToTicket={onConvertToTicket}
        />
      ) : (
        <section className="flex flex-1 flex-col gap-4 px-4 py-4" data-testid="groups-channel-list">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-50">Neighborhood Groups</h2>
              <p className="text-xs text-civic-muted">Local channels & municipal advisories</p>
            </div>
            <span className="urdu text-sm text-civic-muted" lang="ur">
              گروپس
            </span>
          </div>

          {!groupsHydrated ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl border border-civic-border bg-civic-raised/60"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {SECTION_ORDER.map(({ type, label }) => {
                const sectionGroups = groups.filter((g) => g.type === type);
                if (sectionGroups.length === 0) return null;
                return (
                  <div key={type} className="flex flex-col gap-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-civic-muted">
                      {label}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {sectionGroups.map((group) => {
                        const Icon = channelIcon(group);
                        const groupMsgs = messagesByGroup.get(group.id) ?? [];
                        const lastMsg = groupMsgs[groupMsgs.length - 1];
                        return (
                          <li key={group.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedGroupId(group.id)}
                              data-testid="group-channel-card"
                              data-group-id={group.id}
                              className="flex w-full items-center gap-3 rounded-xl border border-civic-border bg-civic-raised px-3 py-3 text-left transition hover:border-civic-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
                            >
                              <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                  group.isOfficial
                                    ? "bg-amber-500/15 text-amber-300"
                                    : "bg-civic-surface text-civic-accent"
                                }`}
                              >
                                <Icon className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-sm font-medium text-slate-100">
                                    {group.name}
                                  </p>
                                  {group.isOfficial && (
                                    <Lock
                                      className="h-3 w-3 shrink-0 text-amber-300"
                                      aria-label="Read-only channel"
                                    />
                                  )}
                                </div>
                                <p className="truncate text-xs text-civic-muted">
                                  {lastMsg
                                    ? `${lastMsg.senderName}: ${lastMsg.text}`
                                    : group.description}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-0.5">
                                <span className="text-[10px] text-civic-muted">
                                  {lastMsg ? timeAgo(lastMsg.createdAt) : `${group.memberCount} members`}
                                </span>
                                <ChevronRight
                                  className="h-4 w-4 text-civic-muted"
                                  aria-hidden="true"
                                />
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <ComplaintDetailModal
        complaint={detailComplaint}
        viewerId={viewerId}
        viewerName={viewerName}
        onClose={() => setDetailComplaintId(null)}
        onUpdateComplaint={onUpdateComplaint}
      />
    </>
  );
}
