// Hydration-safe localStorage persistence for complaints, groups, and messages.
//
// Rules:
// - Never touch `window`/`localStorage` at module scope or during render.
//   Components read data through hooks (`useComplaints`, `useGroups`, `useGroupMessages`),
//   which only read inside useEffect so SSR and first client paint match (no hydration mismatch).
// - Every write dispatches a window event so all mounted hooks re-sync.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import seedData from "./seedComplaints.json";
import seedGroupsData from "./seedGroups.json";
import type {
  CivicGroup,
  Complaint,
  ComplaintComment,
  ComplaintEvent,
  GroupMessage,
  VoteDirection,
} from "@/lib/types";

export const STORAGE_KEY = "awaaz.complaints.v3";
export const GROUPS_STORAGE_KEY = "awaaz.groups.v1";
export const MESSAGES_STORAGE_KEY = "awaaz.messages.v1";
export const CONTRACTORS_STORAGE_KEY = "awaaz.contractors.v1";

const CHANGE_EVENT = "awaaz:complaints-changed";
const GROUPS_CHANGE_EVENT = "awaaz:groups-changed";
const MESSAGES_CHANGE_EVENT = "awaaz:messages-changed";

const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function isQuotaExceeded(err: unknown): boolean {
  if (err instanceof DOMException) {
    return err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED";
  }
  return err instanceof Error && /quota/i.test(`${err.name} ${err.message}`);
}

interface StoreSlot<T> {
  key: string;
  event: string;
  label: string;
  memoryFallback: T[] | null;
  getSeed: () => T[];
  normalize?: (item: T) => T;
}

function writeRawToSlot<T>(slot: StoreSlot<T>, list: T[]): void {
  try {
    window.localStorage.setItem(slot.key, JSON.stringify(list));
    slot.memoryFallback = null;
  } catch (err) {
    // Quota exceeded / private mode: keep the app running in memory and warn the user (AC-7.4).
    slot.memoryFallback = list;
    if (isQuotaExceeded(err)) {
      toast.error("Storage is full — use Reset System Data in the header", {
        id: "storage-quota-full",
      });
    }
    console.warn(`[storage] Failed to write ${slot.label} to localStorage`, err);
  }
}

function writeToSlot<T>(slot: StoreSlot<T>, list: T[]): void {
  writeRawToSlot(slot, list);
  window.dispatchEvent(new Event(slot.event));
}

function readOrSeedSlot<T>(slot: StoreSlot<T>): T[] {
  if (slot.memoryFallback !== null) return slot.memoryFallback;
  try {
    const raw = window.localStorage.getItem(slot.key);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const items = parsed as T[];
        return slot.normalize ? items.map(slot.normalize) : items;
      }
    }
  } catch {
    // fall through to reseed
  }
  const seeded = slot.getSeed();
  writeRawToSlot(slot, seeded);
  return seeded;
}

function resetSlot<T>(slot: StoreSlot<T>): T[] {
  slot.memoryFallback = null;
  const seeded = slot.getSeed();
  if (isBrowser()) writeToSlot(slot, seeded);
  return seeded;
}

/** Old local data (pre-T3.1) stored AI confidence on a 0–100 scale; confidence is always 0.0–1.0 now.
 *  T3.3: also normalises missing `history` and `communityImpact.impactConfirmedBy`. */
function normalizeStoredComplaint(c: Complaint): Complaint {
  let out = c;
  const v = c.aiVerification;
  if (v && typeof v.confidence === "number" && v.confidence > 1) {
    out = { ...out, aiVerification: { ...v, confidence: v.confidence / 100 } };
  }
  if (!Array.isArray(out.history) || out.history.length === 0) {
    const reported: ComplaintEvent = {
      type: "REPORTED",
      status: "REPORTED",
      at: out.createdAt,
      actorId: out.reporter.citizenId,
      actorName: out.reporter.citizenName,
    };
    out = { ...out, history: [reported] };
  }
  if (!Array.isArray(out.communityImpact.impactConfirmedBy)) {
    out = {
      ...out,
      communityImpact: { ...out.communityImpact, impactConfirmedBy: [] },
    };
  }
  return out;
}

const complaintSlot: StoreSlot<Complaint> = {
  key: STORAGE_KEY,
  event: CHANGE_EVENT,
  label: "complaints",
  memoryFallback: null,
  getSeed: () => JSON.parse(JSON.stringify(seedData)) as Complaint[],
  normalize: normalizeStoredComplaint,
};

const groupSlot: StoreSlot<CivicGroup> = {
  key: GROUPS_STORAGE_KEY,
  event: GROUPS_CHANGE_EVENT,
  label: "groups",
  memoryFallback: null,
  getSeed: () => JSON.parse(JSON.stringify(seedGroupsData.groups)) as CivicGroup[],
};

const messageSlot: StoreSlot<GroupMessage> = {
  key: MESSAGES_STORAGE_KEY,
  event: MESSAGES_CHANGE_EVENT,
  label: "group messages",
  memoryFallback: null,
  getSeed: () => JSON.parse(JSON.stringify(seedGroupsData.messages)) as GroupMessage[],
};

const nowIso = () => new Date().toISOString();

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------------
// Complaint CRUD helpers (call from event handlers or effects only, never during render)
// ---------------------------------------------------------------------------

/** All complaints. Returns `[]` on the server. Seeds localStorage on first call. */
export function getComplaints(): Complaint[] {
  if (!isBrowser()) return [];
  return readOrSeedSlot(complaintSlot);
}

/** Adds a new complaint to the top of the list. */
export function saveComplaint(complaint: Complaint): Complaint {
  if (!isBrowser()) return complaint;
  const list = readOrSeedSlot(complaintSlot).filter((c) => c.id !== complaint.id);
  writeToSlot(complaintSlot, [complaint, ...list]);
  return complaint;
}

/**
 * Patches a complaint by id (shallow merge, or an updater function for nested changes).
 * Bumps `updatedAt`. Returns the updated complaint, or `null` if not found.
 */
export function updateComplaint(
  id: string,
  patch: Partial<Complaint> | ((current: Complaint) => Complaint),
): Complaint | null {
  if (!isBrowser()) return null;
  const list = readOrSeedSlot(complaintSlot);
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const current = list[index];
  const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
  const updated: Complaint = { ...next, id: current.id, updatedAt: nowIso() };
  list[index] = updated;
  writeToSlot(complaintSlot, list);
  return updated;
}

/** Restores the original 12 seed complaints. */
export function resetToSeed(): Complaint[] {
  return resetSlot(complaintSlot);
}

/**
 * Reddit-style vote toggle for one profile:
 * same direction again removes the vote, opposite direction switches it.
 */
export function castVote(id: string, profileId: string, direction: VoteDirection): Complaint | null {
  return updateComplaint(id, (c) => {
    const wasUp = c.votes.upvotedBy.includes(profileId);
    const wasDown = c.votes.downvotedBy.includes(profileId);
    const upvotedBy = c.votes.upvotedBy.filter((p) => p !== profileId);
    const downvotedBy = c.votes.downvotedBy.filter((p) => p !== profileId);

    // Undo any previous vote from this profile, then apply the new one (unless toggling off).
    let score = c.votes.score - (wasUp ? 1 : 0) + (wasDown ? 1 : 0);
    if (direction === "up" && !wasUp) {
      upvotedBy.push(profileId);
      score += 1;
    } else if (direction === "down" && !wasDown) {
      downvotedBy.push(profileId);
      score -= 1;
    }
    return { ...c, votes: { score, upvotedBy, downvotedBy } };
  });
}

/** Appends a flat comment (no threading). Empty text is ignored and returns `null`. */
export function addComment(
  id: string,
  comment: Pick<ComplaintComment, "authorId" | "authorName" | "text">,
): Complaint | null {
  const text = comment.text.trim();
  if (!text) return null;
  const newComment: ComplaintComment = {
    id: makeId("cmt"),
    authorId: comment.authorId,
    authorName: comment.authorName,
    text,
    createdAt: nowIso(),
  };
  return updateComplaint(id, (c) => ({ ...c, comments: [...c.comments, newComment] }));
}

/**
 * Citizen "+1 Confirm Fix". Only valid while PENDING_COMMUNITY_VERIFICATION and once per profile.
 * A single confirmation moves the ticket to RESOLVED.
 * Returns the (possibly unchanged) complaint, or `null` if not found.
 */
export function confirmFix(id: string, profileId: string, profileName: string = "Citizen"): Complaint | null {
  if (!isBrowser()) return null;
  const current = readOrSeedSlot(complaintSlot).find((c) => c.id === id);
  if (!current) return null;
  if (
    current.status !== "PENDING_COMMUNITY_VERIFICATION" ||
    current.communityImpact.verifiedBy.includes(profileId)
  ) {
    return current;
  }
  const now = nowIso();
  const confirmedEvent: ComplaintEvent = {
    type: "COMMUNITY_CONFIRMED",
    status: "PENDING_COMMUNITY_VERIFICATION",
    at: now,
    actorId: profileId,
    actorName: profileName,
  };
  const resolvedEvent: ComplaintEvent = {
    type: "RESOLVED",
    status: "RESOLVED",
    at: now,
    actorId: profileId,
    actorName: profileName,
  };
  return updateComplaint(id, (c) => ({
    ...c,
    status: "RESOLVED",
    communityImpact: {
      ...c.communityImpact,
      verifiedCount: c.communityImpact.verifiedCount + 1,
      verifiedBy: [...c.communityImpact.verifiedBy, profileId],
    },
    history: [...(c.history ?? []), confirmedEvent, resolvedEvent],
  }));
}

/**
 * Worker claims a ticket: sets status to IN_PROGRESS, records assignedTo, appends CLAIMED history.
 */
export function claimComplaint(
  id: string,
  workerId: string,
  workerName: string,
): Complaint | null {
  if (!isBrowser()) return null;
  const now = nowIso();
  const event: ComplaintEvent = {
    type: "CLAIMED",
    status: "IN_PROGRESS",
    at: now,
    actorId: workerId,
    actorName: workerName,
  };
  return updateComplaint(id, (c) => ({
    ...c,
    status: "IN_PROGRESS",
    assignedTo: { workerId, workerName },
    history: [...(c.history ?? []), event],
  }));
}

// ---------------------------------------------------------------------------
// Groups & Messages CRUD helpers (T4.1)
// ---------------------------------------------------------------------------

/** All civic group channels. Returns `[]` on the server. */
export function getGroups(): CivicGroup[] {
  if (!isBrowser()) return [];
  return readOrSeedSlot(groupSlot);
}

/** All group messages (optionally filtered by groupId), oldest first. */
export function getGroupMessages(groupId?: string): GroupMessage[] {
  if (!isBrowser()) return [];
  const list = readOrSeedSlot(messageSlot);
  const filtered = groupId ? list.filter((m) => m.groupId === groupId) : list;
  return [...filtered].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Appends a text message to a group channel.
 * Official broadcast channels only accept messages marked `isOfficialAlert: true` (AC-9.3).
 */
export function addGroupMessage(
  input: Omit<GroupMessage, "id" | "createdAt">,
): GroupMessage | null {
  if (!isBrowser()) return null;
  const text = input.text.trim();
  if (!text) return null;

  const groups = readOrSeedSlot(groupSlot);
  const group = groups.find((g) => g.id === input.groupId);
  if (!group) return null;
  if (group.isOfficial && !input.isOfficialAlert) return null;

  const message: GroupMessage = {
    ...input,
    id: makeId("msg"),
    text,
    createdAt: nowIso(),
  };
  const list = readOrSeedSlot(messageSlot);
  writeToSlot(messageSlot, [...list, message]);
  return message;
}

/** Restores seed complaints, seed groups/messages, and clears stored contractor overrides (AC-6.4). */
export function resetSystemData(): void {
  resetSlot(complaintSlot);
  resetSlot(groupSlot);
  resetSlot(messageSlot);
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(CONTRACTORS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------

function useStoredList<T>(
  slotKey: string,
  changeEvent: string,
  read: () => T[],
): { items: T[]; hydrated: boolean } {
  const [items, setItems] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setItems(read());
    const onStorage = (e: StorageEvent) => {
      // Other browser tabs; `key === null` means localStorage.clear()
      if (e.key === slotKey || e.key === null) sync();
    };

    sync();
    setHydrated(true);
    window.addEventListener(changeEvent, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(changeEvent, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [slotKey, changeEvent, read]);

  return { items, hydrated };
}

/**
 * Hydration-safe subscription to stored complaints.
 * Renders `[]` with `hydrated: false` on the server and first client paint,
 * then loads (and seeds, on first run) from localStorage inside useEffect.
 */
export function useComplaints(): { complaints: Complaint[]; hydrated: boolean } {
  const { items, hydrated } = useStoredList(STORAGE_KEY, CHANGE_EVENT, getComplaints);
  return { complaints: items, hydrated };
}

/** Hydration-safe subscription to civic group channels. */
export function useGroups(): { groups: CivicGroup[]; hydrated: boolean } {
  const { items, hydrated } = useStoredList(GROUPS_STORAGE_KEY, GROUPS_CHANGE_EVENT, getGroups);
  return { groups: items, hydrated };
}

/** Hydration-safe subscription to group messages (sorted oldest-first). */
export function useGroupMessages(): { messages: GroupMessage[]; hydrated: boolean } {
  const { items, hydrated } = useStoredList(
    MESSAGES_STORAGE_KEY,
    MESSAGES_CHANGE_EVENT,
    getGroupMessages,
  );
  return { messages: items, hydrated };
}
