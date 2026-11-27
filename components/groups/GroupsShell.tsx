"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Droplets, Hash, Lock, Megaphone, Pin, Store, Zap, type LucideIcon } from "lucide-react";
import ComplaintDetailModal from "@/components/feed/ComplaintDetailModal";
import { useComplaints, useGroupMessages, useGroups } from "@/lib/data/storage";
import { timeAgo } from "@/lib/labels";
import type { CivicGroup, Complaint, GroupMessage } from "@/lib/types";
import { useLanguage } from "@/components/common/LanguageProvider";
import GroupChatView from "./GroupChatView";

interface GroupsShellProps {
  viewerId: string;
  viewerName: string;
  viewerLabel: string;
  onConvertToTicket: (text: string) => void;
  onUpdateComplaint: (complaint: Complaint) => void;
}

function channelIcon(group: CivicGroup): LucideIcon {
  if (group.type === "OFFICIAL_BROADCAST") return Megaphone;
  if (group.type === "MARKET") return Store;
  if (group.id.includes("water")) return Droplets;
  if (group.id.includes("iesco")) return Zap;
  return Hash;
}

/** Groups tab — WhatsApp-style flat channel list sorted by latest activity (official alerts pinned). */
export default function GroupsShell({
  viewerId,
  viewerName,
  viewerLabel,
  onConvertToTicket,
  onUpdateComplaint,
}: GroupsShellProps) {
  const { t } = useLanguage();
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

  const sortedGroups = useMemo(() => {
    const lastTs = (groupId: string) => {
      const list = messagesByGroup.get(groupId);
      return list && list.length > 0 ? list[list.length - 1].createdAt : "";
    };
    return [...groups].sort((a, b) => {
      if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
      return lastTs(b.id).localeCompare(lastTs(a.id));
    });
  }, [groups, messagesByGroup]);

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
        <section className="flex flex-1 flex-col" data-testid="groups-channel-list">
          <h2 className="px-4 pb-2 pt-3 text-base font-semibold text-slate-50">{t.groups.title}</h2>

          {!groupsHydrated ? (
            <div className="flex flex-col gap-2 px-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl border border-civic-border bg-civic-raised/60"
                />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-civic-border/60 border-t border-civic-border/60">
              {sortedGroups.map((group) => {
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
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-civic-raised/60 active:bg-civic-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-civic-accent"
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          group.isOfficial
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-civic-raised text-civic-accent"
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
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
                          <span className="flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-civic-muted">
                            {group.isOfficial && <Pin className="h-2.5 w-2.5 text-amber-300/80" aria-hidden="true" />}
                            {lastMsg ? timeAgo(lastMsg.createdAt) : `${group.memberCount} members`}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-civic-muted">
                          {lastMsg
                            ? `${lastMsg.senderName}: ${lastMsg.text}`
                            : group.description}
                        </p>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-civic-muted/70"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
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
