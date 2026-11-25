// Hydration-safe localStorage persistence for complaints.
//
// Rules:
// - Never touch `window`/`localStorage` at module scope or during render.
//   Components read data through `useComplaints()`, which only reads inside useEffect,
//   so the server render and the first client render both see `[]` (no hydration mismatch).
// - Every write dispatches a window event so all mounted `useComplaints()` hooks re-sync.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import seedData from "./seedComplaints.json";
import type { Complaint, ComplaintComment, VoteDirection } from "@/lib/types";

export const STORAGE_KEY = "awaaz.complaints.v2";
const CHANGE_EVENT = "awaaz:complaints-changed";

const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

// Keeps in-memory state if localStorage hits QuotaExceededError (AC-7.4).
let inMemoryFallback: Complaint[] | null = null;

function isQuotaExceeded(err: unknown): boolean {
  if (err instanceof DOMException) {
    return err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED";
  }
  return err instanceof Error && /quota/i.test(`${err.name} ${err.message}`);
}

/** Fresh deep copy of the seed so callers can never mutate the imported JSON. */
function seedCopy(): Complaint[] {
  return JSON.parse(JSON.stringify(seedData)) as Complaint[];
}

function writeRaw(list: Complaint[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    inMemoryFallback = null;
  } catch (err) {
    // Quota exceeded / private mode: keep the app running in memory and warn the user (AC-7.4).
    inMemoryFallback = list;
    if (isQuotaExceeded(err)) {
      toast.error("Storage is full — use Reset System Data in the header", {
        id: "storage-quota-full",
      });
    }
    console.warn("[storage] Failed to write complaints to localStorage", err);
  }
}

function write(list: Complaint[]): void {
  writeRaw(list);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Old local data (pre-T3.1) stored AI confidence on a 0–100 scale; confidence is always 0.0–1.0 now. */
function normalizeStored(c: Complaint): Complaint {
  const v = c.aiVerification;
  if (!v || typeof v.confidence !== "number" || v.confidence <= 1) return c;
  return { ...c, aiVerification: { ...v, confidence: v.confidence / 100 } };
}

/** Seeds localStorage on first run (or if the stored value is corrupt). Browser only. */
function readOrSeed(): Complaint[] {
  if (inMemoryFallback !== null) return inMemoryFallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return (parsed as Complaint[]).map(normalizeStored);
    }
  } catch {
    // fall through to reseed
  }
  const seeded = seedCopy();
  writeRaw(seeded);
  return seeded;
}

const nowIso = () => new Date().toISOString();

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------------
// CRUD helpers (call from event handlers or effects only, never during render)
// ---------------------------------------------------------------------------

/** All complaints. Returns `[]` on the server. Seeds localStorage on first call. */
export function getComplaints(): Complaint[] {
  if (!isBrowser()) return [];
  return readOrSeed();
}

/** Adds a new complaint to the top of the list. */
export function saveComplaint(complaint: Complaint): Complaint {
  if (!isBrowser()) return complaint;
  const list = readOrSeed().filter((c) => c.id !== complaint.id);
  write([complaint, ...list]);
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
  const list = readOrSeed();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const current = list[index];
  const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
  const updated: Complaint = { ...next, id: current.id, updatedAt: nowIso() };
  list[index] = updated;
  write(list);
  return updated;
}

/** Restores the original 12 seed complaints. */
export function resetToSeed(): Complaint[] {
  inMemoryFallback = null;
  const seeded = seedCopy();
  if (isBrowser()) write(seeded);
  return seeded;
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
export function confirmFix(id: string, profileId: string): Complaint | null {
  if (!isBrowser()) return null;
  const current = readOrSeed().find((c) => c.id === id);
  if (!current) return null;
  if (
    current.status !== "PENDING_COMMUNITY_VERIFICATION" ||
    current.communityImpact.verifiedBy.includes(profileId)
  ) {
    return current;
  }
  return updateComplaint(id, (c) => ({
    ...c,
    status: "RESOLVED",
    communityImpact: {
      ...c.communityImpact,
      verifiedCount: c.communityImpact.verifiedCount + 1,
      verifiedBy: [...c.communityImpact.verifiedBy, profileId],
    },
  }));
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Hydration-safe subscription to stored complaints.
 * Renders `[]` with `hydrated: false` on the server and first client paint,
 * then loads (and seeds, on first run) from localStorage inside useEffect.
 */
export function useComplaints(): { complaints: Complaint[]; hydrated: boolean } {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setComplaints(getComplaints());
    const onStorage = (e: StorageEvent) => {
      // Other browser tabs; `key === null` means localStorage.clear()
      if (e.key === STORAGE_KEY || e.key === null) sync();
    };

    sync();
    setHydrated(true);
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { complaints, hydrated };
}
