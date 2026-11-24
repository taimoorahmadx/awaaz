# Spec: Awaaz (آواز)
Source: [docs/brief.md](brief.md). Update this file when behavior changes.

> **Phase 2 Specification.** Builds on the Sprint 1 & 2 prototype for the full platform release. Items that depend on an OPEN decision are marked `(OPEN Dx)` — see `docs/progress.md` → Open Decisions. Do not implement OPEN parts until the decision is recorded.

---

## 1. User Stories and Acceptance Criteria (EARS Syntax)

### US-1 (MUST): Home Tab – Conversational AI Intake with Photo & Waveform
As Tariq (Citizen), I want a conversational intake with real photo attachment (`➕`), live Urdu voice recording with waveform feedback, and text fallback so that reporting a hazard is as fast as sending a WhatsApp voice note.

Acceptance criteria:
- AC-1.1 WHEN the citizen opens the Home tab THE SYSTEM SHALL display a conversational interface with a Awaaz Bot avatar, bilingual greeting ("السلام علیکم طارق بھائی!" — name follows the active profile), and a bottom input bar with an attachment button (`➕`), a text box, and a mic button (`🎙️`).
- AC-1.2 WHEN the citizen taps the mic THE SYSTEM SHALL start `MediaRecorder` with dynamic MIME type (`audio/webm;codecs=opus` on Chrome, `audio/mp4` on Safari) and replace the input bar with a live Web Audio API waveform (canvas, `AnalyserNode`) and an elapsed timer (`0:12 / 0:30`). Recording SHALL auto-stop at 30 seconds. The `AudioContext` and mic tracks SHALL be released on stop and on unmount.
- AC-1.3 WHEN the citizen taps `➕` THE SYSTEM SHALL open a native file picker (`accept="image/jpeg,image/png,image/webp"`, no forced `capture`) and show a thumbnail preview with a remove button. Before preview/storage the photo SHALL be compressed client-side via `lib/image.ts` (longest side ≤ 800px, JPEG quality 0.7, output `image/jpeg` data URL).
- AC-1.4 WHEN input is submitted THE SYSTEM SHALL POST `multipart/form-data` (`audio?`, `photo?` (compressed JPEG), `text?`, `sectorHint` = active profile sector) to `/api/analyze-audio` and show a loading state ("Awaaz AI is triaging your complaint...").
- AC-1.5 WHEN `/api/analyze-audio` responds THE SYSTEM SHALL render an in-thread triage card (Urdu transcript, English summary, department chip, urgency badge, landmark) and create a complaint with: `beforePhotoUrl` = the compressed citizen photo if attached, otherwise the category stock photo from `lib/categories.ts`; coordinates resolved client-side (the AI does not return coordinates — see AC-11.3); a `REPORTED` history event. A pin SHALL appear on the map.
- AC-1.6 IF the AI call exceeds `AI_TIMEOUT_MS`, fails, the key is missing, or `AI_FORCE_FALLBACK=1` THE SYSTEM SHALL return the deterministic fallback (§5.3) in <300ms with `isOfflineFallback: true`, persist the complaint, and show the "Offline Mode (Synced locally)" chip.

### US-2 (MUST): Interactive Leaflet Map & Urgency Pins
Acceptance criteria:
- AC-2.1 WHEN the Map tab loads THE SYSTEM SHALL render a Leaflet map centered on Islamabad (default F-10: `33.6938, 73.0115`) with markers for all stored complaints, imported via `next/dynamic` with `{ ssr: false }`.
- AC-2.2 THE SYSTEM SHALL color-code pins: 🔴 Critical, 🟠 High, 🟡 Medium/Low, 🟢 Resolved, using `L.divIcon()` with inline SVG (no default PNG markers).
- AC-2.3 WHEN a pin is tapped THE SYSTEM SHALL open a bottom drawer with photo, Urdu title, department chip, urgency badge, status pill, vote score, and a "View Full Details" button that opens `ComplaintDetailModal` (US-3).
- AC-2.4 WHEN a new complaint is filed THE SYSTEM SHALL pan the map to it and show a pulsing animation on the new marker.

### US-3 (MUST): Explore Tab – Feed, Votes & Complaint Detail Modal
Acceptance criteria:
- AC-3.1 THE SYSTEM SHALL sort the feed by recency (default), top score, or urgency.
- AC-3.2 Each card SHALL show photo thumbnail, Urdu title, English summary, department chip, urgency badge, status pill, sector tag, time ago, and Upvote (▲) / Downvote (▼) buttons that update `localStorage` immediately.
- AC-3.3 Sector filter (All, F-10, F-6, G-9, I-9) and urgency toggles SHALL filter instantly without network calls. Each sector chip SHALL show that sector's Civic Health grade (US-12).
- AC-3.4 Each card SHALL have an expandable flat comment section (no nesting) persisting to `localStorage`.
- AC-3.5 WHEN a user taps a card (outside its vote/comment/confirm controls) THE SYSTEM SHALL open `ComplaintDetailModal` showing: Before/After photos side-by-side (After only if present), verbatim Urdu transcript + English summary, priority breakdown (severity 1–10, public density risk, reasoning) when present, SLA hours remaining / breached state, AI verification result when present, and a lifecycle timeline rendered from `complaint.history` (newest last, each with actor name and time).
- AC-3.6 The modal SHALL be accessible: `role="dialog"`, `aria-modal="true"`, labelled title, close button with `aria-label`, closes on Escape and on backdrop tap, returns focus to the opener.

### US-4 (MUST): Worker Portal – Queue, Route Card & AI Vision Verification
Acceptance criteria:
- AC-4.1 WHEN the worker role (Sajid) is active THE SYSTEM SHALL display the 3-tab Worker Portal (`Queue`, `Home`, `Profile`).
- AC-4.2 `Queue` SHALL list `REPORTED` complaints sorted by urgency. "Claim Ticket" SHALL set status `IN_PROGRESS`, set `assignedTo = { workerId, workerName }`, append a `CLAIMED` history event, and show the ticket in the worker's `Home` tab.
- AC-4.3 `Home` SHALL list tickets assigned to the active worker that are `IN_PROGRESS`. Each SHALL show a small route card: reused Leaflet mini map centered on the pin, landmark, coordinates, and an "Open in Google Maps" link (`https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`, `target="_blank" rel="noopener noreferrer"`), plus the "Upload After Photo" + "Verify Fix" flow.
- AC-4.4 WHEN the worker selects an After photo THE SYSTEM SHALL compress it via `lib/image.ts`. WHEN "Verify Fix" is tapped THE SYSTEM SHALL POST to `/api/verify-fix` with `complaintId`, `beforePhotoBase64`, `beforeMimeType`, `afterPhotoBase64`, `afterMimeType`, `category` (§4.2).
- AC-4.5 IF the response has `passed: true` THE SYSTEM SHALL show a green "AI Verified (NN%): <reasoning>" badge, store `aiVerification`, store `afterPhotoUrl`, set status `PENDING_COMMUNITY_VERIFICATION`, and append an `AI_VERIFIED` history event.
- AC-4.6 IF the response has `passed: false` THE SYSTEM SHALL show a red "AI Rejected (NN%): <reasoning>" badge, store `aiVerification` (with `passed: false`), keep status `IN_PROGRESS`, and append an `AI_REJECTED` history event.
- AC-4.7 IF the AI is unavailable THE SYSTEM SHALL use the deterministic verification fallback (§5.3) with `isOfflineFallback: true` and show the offline chip.

### US-5 (MUST): Community Sign-Off & "+1 Confirm Fix"
Acceptance criteria:
- AC-5.1 WHILE a ticket is `PENDING_COMMUNITY_VERIFICATION` THE SYSTEM SHALL show an active "+1 Confirm Fix (Verified)" button in My Reports, on the Explore card, and in the Detail Modal.
- AC-5.2 WHEN a citizen taps it THE SYSTEM SHALL set status `RESOLVED`, increment `communityImpact.verifiedCount`, append the citizen to `communityImpact.verifiedBy`, append `COMMUNITY_CONFIRMED` and `RESOLVED` history events, and turn the badge vibrant green immediately.
- AC-5.3 A citizen already in `verifiedBy` SHALL NOT be able to confirm again (button disabled with "You confirmed this fix").

### US-6 (MUST): Profile & Role Switcher
Acceptance criteria:
- AC-6.1 THE SYSTEM SHALL provide a header role switcher with exactly these 5 profiles: **Tariq** (Citizen / F-10), **Ayesha** (Citizen / F-6), **Anonymous Citizen** (no sector), **Sajid** (CDA Field Worker), **Comm. Nasir** (Mayor / City Admin).
- AC-6.2 Switching role SHALL re-render instantly without page reload.
- AC-6.3 THE SYSTEM SHALL show the active sector badge in the header (e.g. `Islamabad (F-10)`).
- AC-6.4 THE SYSTEM SHALL provide a "Reset System Data" action that restores seed complaints, seed groups/messages, and seed contractor statuses in `localStorage`.

### US-7 (MUST): Resilient Offline Mode & Storage Safety
Acceptance criteria:
- AC-7.1 IF any AI call fails (network, timeout > `AI_TIMEOUT_MS`, HTTP 5xx, missing key, unparseable output) or `AI_FORCE_FALLBACK=1` THEN THE SYSTEM SHALL return the deterministic fallback in <300ms and show the "Offline Mode (Synced locally)" chip.
- AC-7.2 All seed hazard photos SHALL load from `public/images/hazards/`.
- AC-7.3 Photos stored in `localStorage` (citizen Before, worker After) SHALL always be compressed via `lib/image.ts` first.
- AC-7.4 IF a `localStorage` write throws `QuotaExceededError` THE SYSTEM SHALL NOT crash; it SHALL show a friendly message ("Storage is full — use Reset System Data in the header") and keep the in-memory state.

### US-8 (MUST): Pre-seeded Dataset
Acceptance criteria:
- AC-8.1 On first load THE SYSTEM SHALL hydrate `localStorage` from `seedComplaints.json` (12 complaints across F-10, F-6, G-9, I-9 covering CDA Sanitation, CDA Roads, IESCO, WASA, SNGPL). Every seed complaint SHALL have a `history` consistent with its status (e.g. a `RESOLVED` seed has REPORTED → CLAIMED → AI_VERIFIED → COMMUNITY_CONFIRMED → RESOLVED events with increasing timestamps).
- AC-8.2 THE SYSTEM SHALL hydrate `seedGroups.json` with **5** channels — `# F-10/2 Residents`, `# F-10 Markaz Traders`, `💧 Water Watch`, `⚡ IESCO Alerts`, `📢 Municipal Alerts` — and 6–10 seeded messages per channel from named neighbours (Roman Urdu / Urdu / English mix), several with `attachedComplaintId` pointing to real seed complaint ids.

### US-9 (MUST): Groups Tab – Hyper-Local Neighborhood Chat
Acceptance criteria:
- AC-9.1 WHEN the user opens the Groups tab THE SYSTEM SHALL list the 5 channels grouped by type: Locality, Market, Civic Interest, Official Broadcast. The "Coming soon" shell SHALL be removed.
- AC-9.2 WHEN the user enters a channel THE SYSTEM SHALL show its message stream (text messages, official alert banners, complaint embeds) and a text composer. Posted messages persist to `localStorage` with the active profile as sender. **No voice notes** (no recording, no playback).
- AC-9.3 `📢 Municipal Alerts` SHALL be read-only for citizens; only the Mayor broadcast (AC-10.4) posts there.
- AC-9.4 Messages with `attachedComplaintId` SHALL render a `ComplaintCardEmbed` with live urgency and status from current complaint state; tapping it opens `ComplaintDetailModal`.
- AC-9.5 Each non-official message SHALL have a "Convert to Ticket" action that switches to the Home tab with the composer pre-filled with the message text (it SHALL NOT auto-submit).

### US-10 (SHOULD): Mayor Portal – Executive Governance & Contractor Audit
Acceptance criteria:
- AC-10.1 WHEN the Mayor role is active THE SYSTEM SHALL render the 5-tab Mayor Portal: `[Map] [Alerts] [Home] [Depts] [Contractors]`.
- AC-10.2 `Home` SHALL show KPIs computed from current complaints (Total Filed, Verified Fixed = `RESOLVED`, In Progress, Critical open) and the citywide Civic Health score + grade (US-12).
- AC-10.3 `Contractors` SHALL list contractors with verified-resolution % and flagged incidents, each with a "Freeze Payout" / "Unfreeze Payout" toggle persisted in `localStorage` (`awaaz.contractors.v1`) and visibly reflected (status pill, color).
- AC-10.4 `Alerts` SHALL provide "Broadcast Emergency Notice" (editable title + message, pre-filled template). Sending SHALL post an official alert message (`isOfficialAlert: true`, sender Comm. Nasir) to `📢 Municipal Alerts`, and every other channel SHALL show the latest broadcast as a banner at the top.

### US-11 (SHOULD): Proximity Duplicate Detection ("+1 Impacts Me Too")
Acceptance criteria:
- AC-11.1 WHEN a complaint is about to be created, IF an existing non-`RESOLVED` complaint has the **same department AND same category** (fixed list, §3 `IssueCategory`) within **50 meters** (Haversine), THE SYSTEM SHALL show an in-chat `DuplicateCard` ("A similar issue was reported ~NN m away…", showing the existing ticket's title, photo, status) instead of creating the ticket immediately.
- AC-11.2 The card SHALL offer: "+1 Impacts Me Too" — no new ticket; existing ticket `communityImpact.affectedCount += 1`, the citizen is appended to `communityImpact.impactConfirmedBy`, an `IMPACT_ADDED` history event is appended; OR "Submit as Separate Ticket" — proceeds with normal creation. A citizen already in `impactConfirmedBy` (or the original reporter) SHALL see "+1" disabled with "You already reported this".
- AC-11.3 Location source (decision D1 = "GPS → landmark → sector centre"). WHEN a complaint is submitted THE SYSTEM SHALL resolve coordinates in this order, recording which one was used in `location.source`:
  1. **GPS** — `navigator.geolocation.getCurrentPosition` (`enableHighAccuracy: true`, `timeout: 5000`, `maximumAge: 60000`), requested at submit time **in parallel** with the `/api/analyze-audio` call (never delays the triage card). Accepted only if `coords.accuracy ≤ 100` m AND inside the Islamabad box (lat 33.50–33.80, lng 72.80–73.30). Permission denied, timeout, low accuracy, or outside the box → step 2.
  2. **LANDMARK** — match the AI's `landmark` text (and the typed text) against `lib/data/landmarks.json` (normalized lowercase substring match on each entry's `aliases`; prefer entries in the same sector; first match wins). Match → that entry's coordinates (no jitter) → done. No match → step 3.
  3. **SECTOR_CENTRE** — the existing `SECTOR_COORDS` + small jitter in `HomeChatIntake.tsx` (moved to `lib/data/landmarks.json` or `lib/categories.ts`-style module), so pins don't stack.
  - `lib/data/landmarks.json` contents for now: the 12 seed complaint landmarks (coordinates taken from the seeds) + the 4 sector centres, each with English, Roman Urdu and (where obvious) Urdu-script aliases. Do not invent coordinates for other places; the user may add more later.
  - Duplicate detection (AC-11.1) SHALL run only when `location.source` is `GPS` or `LANDMARK` (sector centre is too coarse for a 50m check).
  - The triage card SHALL show a small location chip: "📍 GPS", "📍 Landmark: <name>", or "📍 Sector estimate".
- AC-11.4 Urgency boost: WHEN `impactConfirmedBy.length` reaches **2** and again at **4**, THE SYSTEM SHALL raise urgency one level (LOW → MEDIUM → HIGH → CRITICAL), never above CRITICAL and never lowering, and append an `URGENCY_RAISED` history event. (Rationale: original reporter + 2 independent confirmations = 3 people; demoable with Ayesha + Anonymous after Tariq files.)

### US-12 (SHOULD): Dynamic Sector Civic Health Scorecard
Acceptance criteria:
- AC-12.1 Per sector (F-10, F-6, G-9, I-9): `score = clamp(0, 100, round(100 − (openCritical×15 + openHigh×8 + openMedium×3) + resolvedRatio×20))`, where "open" = status ≠ `RESOLVED` and `resolvedRatio = resolved / total` in that sector (0 if total = 0). Grades: **A** ≥ 90, **B** 75–89, **C** 60–74, **D** 45–59, **F** < 45. No plus/minus grades.
- AC-12.2 Citywide score = rounded mean of the 4 sector scores, same grade scale.
- AC-12.3 Expected values with untouched seed data (use as a unit-check): F-10 = 66 (C), F-6 = 84 (B), G-9 = 86 (B), I-9 = 100 (A), citywide = 84 (B). After resolving `cmp-001` (F-10 Critical open manhole) F-10 becomes 86 (B).
- AC-12.4 Scores SHALL recompute live on any complaint change and display in Mayor `Home` and on Explore sector chips.

### US-13 (DEFERRED — decision D4): Multimodal Evaluation Suite
Not in scope for automated builds. The user will handle evals personally. Do not create `evals/`.

### US-14 (SHOULD): PWA Manifest & App Icon
Acceptance criteria:
- AC-14.1 THE SYSTEM SHALL serve a valid web app manifest (name "Awaaz", short name "Awaaz", `display: "standalone"`, theme/background colors from the civic palette, icons 192px and 512px).
- AC-14.2 THE SYSTEM SHALL serve an app icon/favicon derived from `public/logo.jpg` so the browser console shows no favicon 404.

---

## 2. Screens & Navigation Matrix

| Screen / Tab | Purpose | Key Elements | Empty / Loading / Error States |
| :--- | :--- | :--- | :--- |
| **Tab 1: Explore** | Public feed | Sector chips with Civic Health grade, urgency filters, cards, votes, flat comments, "+1 Confirm Fix" when pending, card tap → Detail Modal | **Empty:** "No complaints found."<br>**Loading:** Card skeletons. |
| **Tab 2: Map** | Spatial view | Leaflet map, SVG urgency pins, drawer with "View Full Details", auto-pan to new reports | **Empty:** Islamabad center.<br>**Loading:** Map skeleton. |
| **Tab 3: Home (Center)** | AI intake | Bot avatar, `➕` photo (compressed), text box, mic with waveform + 0:30 timer, triage card, DuplicateCard (US-11) | **Empty:** Greeting.<br>**Loading:** "Awaaz AI is triaging…".<br>**Error:** Mic permission message; offline chip on fallback; storage-full message. |
| **Tab 4: My Reports** | Personal tracking | Citizen's tickets, lifecycle stepper, Before/After, AI result, "+1 Confirm Fix" | **Empty:** "You haven't filed any reports yet." |
| **Tab 5: Groups** | Neighborhood chat | 5 channels, text chat, official banners, complaint embeds, "Convert to Ticket". No voice notes. | **Empty:** "No messages yet in this group." |
| **Worker Portal (3 tabs)** | Field work | Queue (claim), Home (assigned tickets + route card + Before/After verify), Profile | **Empty:** "No pending dispatches."<br>**Loading:** "Gemini Vision comparing…".<br>**Error:** Red rejection badge. |
| **Mayor Portal (5 tabs)** | Executive desk | Map, Alerts (overdue + broadcast), Home (live KPIs + Civic Health), Depts (SLA leaderboard), Contractors (payout freeze) | **Empty:** "No civic data." |
| **Complaint Detail Modal** | Audit view | Before/After, transcript, priority, SLA, AI result, history timeline, "+1 Confirm Fix" when pending | Accessible dialog (AC-3.6). |
| **App Header** | Identity | Role switcher (5 profiles), sector badge, offline chip, "Reset System Data" | Sticky. |

UI reference mockups: `docs/ui_design/CITIZEN_PORTAL_ASCII.md`, `WORKER_PORTAL_ASCII.md`, `MAYOR_PORTAL_ASCII.md`. Where a mockup conflicts with this spec (e.g. voice notes in Groups), this spec wins.

---

## 3. Data Model (`lib/types.ts`) — target state after Sprint 3–4

Fields marked `// NEW` don't exist yet; the task that adds them is noted.

```typescript
export type City = "Islamabad" | "Karachi" | "Lahore";
export type Urgency = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Department = "CDA_SANITATION" | "CDA_ROADS" | "IESCO" | "WASA" | "SNGPL";
export type TicketStatus = "REPORTED" | "IN_PROGRESS" | "PENDING_COMMUNITY_VERIFICATION" | "RESOLVED";

// T3.1: closed list (remove the `(string & {})` escape hatch). Source of truth: lib/categories.ts
export type IssueCategory =
  | "Open Manhole" | "Garbage Heap" | "Broken Streetlight" | "Pothole"
  | "Sewage Leak" | "Live Wire" | "Water Outage" | "Low Gas Pressure" | "Other";

export interface GeoLocation {
  lat: number; lng: number; city: City | string; sector: "F-10" | "F-6" | "G-9" | "I-9" | string; landmark: string;
  source?: "GPS" | "LANDMARK" | "SECTOR_CENTRE";   // NEW (T4.2, AC-11.3). Seeds: "LANDMARK"
}

export interface Landmark {                       // NEW (T4.2) — lib/data/landmarks.json
  id: string;
  name: string;
  sector: string;
  lat: number;
  lng: number;
  aliases: string[];  // English, Roman Urdu, Urdu script; matched lowercase
}

export interface AIVerificationResult {
  passed: boolean;
  confidence: number;          // ALWAYS 0.0–1.0. Display: Math.round(confidence * 100) + "%"
  verdict: "VERIFIED_RESOLVED" | "REJECTED_UNRESOLVED";
  reasoning: string;
  detectedChanges: string[];
  verifiedAt: string;          // ISO
  isOfflineFallback?: boolean; // true when produced by the DEMO-FALLBACK
}

export type ComplaintEventType =                  // NEW (T3.3)
  | "REPORTED" | "CLAIMED" | "AI_VERIFIED" | "AI_REJECTED"
  | "COMMUNITY_CONFIRMED" | "RESOLVED" | "IMPACT_ADDED" | "URGENCY_RAISED";

export interface ComplaintEvent {                 // NEW (T3.3)
  type: ComplaintEventType;
  status: TicketStatus;   // ticket status right after this event
  at: string;             // ISO
  actorId: string;
  actorName: string;
  note?: string;          // e.g. "Urgency HIGH → CRITICAL", AI reasoning excerpt
}

export interface ComplaintComment { id: string; authorId: string; authorName: string; text: string; createdAt: string; }

export interface Complaint {
  id: string;
  title: string;
  titleUrdu: string;
  urduTranscript: string;
  englishSummary: string;
  beforePhotoUrl: string;   // /images/hazards/... or compressed JPEG data URI
  afterPhotoUrl?: string;   // compressed JPEG data URI
  department: Department;
  category: IssueCategory;
  urgency: Urgency;
  status: TicketStatus;
  location: GeoLocation;
  reporter: { citizenId: string; citizenName: string };
  assignedTo?: { workerId: string; workerName: string };     // NEW (T3.3, set on claim)
  votes: { score: number; upvotedBy: string[]; downvotedBy: string[] };
  communityImpact: {
    affectedCount: number;        // estimated people affected (seeds use hundreds)
    verifiedCount: number;
    verifiedBy: string[];         // "+1 Confirm Fix" citizens
    impactConfirmedBy: string[];  // NEW (T4.2) "+1 Impacts Me Too" citizens (default [])
  };
  comments: ComplaintComment[];
  priorityBreakdown?: { issueSeverity: number; publicDensityRisk: "HIGH" | "MEDIUM" | "LOW"; reasoning: string };
  sla: { hoursRemaining: number; isBreached: boolean; escalationLevel: "STANDARD" | "WARNING" | "ESCALATED_TO_COMMISSIONER" };
  aiVerification?: AIVerificationResult;
  history: ComplaintEvent[];      // NEW (T3.3). Missing on old data → treat as [] and synthesize a REPORTED event from createdAt
  createdAt: string;
  updatedAt: string;
}

export interface CivicGroup {                     // NEW (T4.1)
  id: string;
  name: string;
  type: "LOCALITY" | "MARKET" | "CIVIC_TOPIC" | "OFFICIAL_BROADCAST";
  sector?: string;
  description: string;
  memberCount: number;
  isOfficial?: boolean;  // true only for 📢 Municipal Alerts (read-only for citizens)
}

export interface GroupMessage {                   // NEW (T4.1) — no audio fields (voice notes cut)
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  text: string;
  attachedComplaintId?: string;
  isOfficialAlert?: boolean;
  createdAt: string;
}

export interface Contractor {                     // NEW (T4.3)
  id: string;
  name: string;
  department: Department;
  verifiedResolutionPct: number;  // 0–100 (display value, not an AI confidence)
  flaggedIncidents: number;
  payoutStatus: "ACTIVE" | "FROZEN";
}

export interface CitizenProfile { id: string; name: string; role: "CITIZEN" | "WORKER" | "ADMIN"; city: string; sector: string; occupation: string; avatar: string; }

export interface SectorHealth {                   // NEW (T4.4)
  sector: string;
  score: number;  // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  totalComplaints: number;
  openCritical: number;
  resolvedComplaints: number;
}
```

`localStorage` keys: `awaaz.complaints.v3` (bumped from v2 in T3.3 so seeds with `history` load), `awaaz.groups.v1`, `awaaz.messages.v1`, `awaaz.contractors.v1`.

---

## 4. API Contracts

One name per field. No `verified`, no `explanation`, no `fallback` (use `isOfflineFallback`). Confidence is always 0.0–1.0.

### 4.1 `POST /api/analyze-audio`
- **Request:** `multipart/form-data`
  - `audio?`: audio blob (webm or mp4) — MIME read from the blob
  - `photo?`: compressed JPEG image — forwarded to Gemini as `inlineData` with its MIME
  - `text?`: typed note
  - `sectorHint?`: e.g. `"F-10"` (active profile sector)
  - At least one of `audio` / `text` required, otherwise fallback.
- **Response:** `200 OK`
```json
{
  "urduTranscript": "ایف ٹین مرکز میں روڈ کے کارنر پر گٹر کا ڈھکن ٹوٹا ہوا ہے، پانی نکل رہا ہے۔",
  "englishSummary": "Broken manhole cover on road corner in F-10 Markaz with overflowing sewage water.",
  "title": "Open Manhole on Commercial Corner",
  "titleUrdu": "مرکزی روڈ پر گٹر کا کھلا ڈھکن",
  "category": "Open Manhole",
  "department": "CDA_SANITATION",
  "urgency": "CRITICAL",
  "landmark": "Near Commercial Corner, F-10 Markaz",
  "sector": "F-10",
  "priorityBreakdown": { "issueSeverity": 9, "publicDensityRisk": "HIGH", "reasoning": "Uncovered cavity on a high-traffic intersection." },
  "isOfflineFallback": false
}
```
- `category` ∈ the fixed `IssueCategory` list (unknown → `"Other"`). `priorityBreakdown` optional. No `coordinates` field — location is resolved client-side.

### 4.2 `POST /api/verify-fix`
- **Request:** `application/json`
```json
{
  "complaintId": "cmp-001",
  "beforePhotoBase64": "<raw base64 or data URL>",
  "beforeMimeType": "image/jpeg",
  "afterPhotoBase64": "<raw base64 or data URL>",
  "afterMimeType": "image/jpeg",
  "category": "Open Manhole"
}
```
The route SHALL use `beforeMimeType` / `afterMimeType` (or the data-URL MIME) — never assume JPEG.

- **Response:** `200 OK`
```json
{
  "passed": true,
  "confidence": 0.92,
  "verdict": "VERIFIED_RESOLVED",
  "reasoning": "The open manhole has been sealed with a new iron cover. Background curb geometry confirms the same location.",
  "detectedChanges": ["Open cavity replaced with solid manhole cover", "Sewage overflow cleared"],
  "timestamp": "2026-11-24T00:00:00Z",
  "complaintId": "cmp-001",
  "isOfflineFallback": false
}
```
- Rejection: same shape with `passed: false`, `verdict: "REJECTED_UNRESOLVED"`.
- **Pass rule (server-side, single place):** `passed = model.verdict === "VERIFIED_RESOLVED" && confidence >= 0.60`. Clients trust `passed`; they never recompute it.

---

## 5. AI Behavior Specification

### 5.1 Model & runtime
- **Model:** `process.env.GEMINI_MODEL`, default `gemini-3.8-flash` (GA since Sept 2026). Gemini 2.0 Flash was shut down June 1, 2026 — never use `gemini-2.0-*` / `gemini-2.5-*` ids.
- **Timeout:** `process.env.AI_TIMEOUT_MS`, default `5000`. Default stays until real latency is measured (OPEN D7).
- **Force fallback:** `AI_FORCE_FALLBACK=1` makes `getGemini()` return `null` so every route uses its fallback. Used by Playwright and whenever live calls aren't approved (OPEN D2).
- Requests use `responseMimeType: "application/json"`; output is validated with Zod.

### 5.2 Validation (fail closed)
- Audio: `category` → `z.enum(CATEGORIES).catch("Other")`; `department`/`urgency` enums as today; `priorityBreakdown` optional.
- Verification: `verdict` required enum, `reasoning` required non-empty string, `confidence` required number, `detectedChanges` array (may default to `[]`). **No defaults/catches that produce a pass.** If the model returns confidence on a 0–100 scale (value > 1 and ≤ 100) the route divides by 100 once, in one helper; anything else invalid → fallback.
- Any parse failure → the deterministic fallback with `isOfflineFallback: true`.

### 5.3 Deterministic fallbacks (`lib/ai/mocks.ts`, `// DEMO-FALLBACK`, <300ms)
Confirmed baseline behavior: the audio fallback always returns the same "Garbage heap near Jinnah Super Market, F-10, HIGH" ticket regardless of input; the verify fallback always returns `verified: true, confidence: 94` (0–100 scale) and can never reject. Target behavior:
- **Audio fallback with text:** keyword-match the typed text against `lib/categories.ts` keywords (English, Roman Urdu, Urdu script; case-insensitive) → category → department, default urgency, English/Urdu title from the table. `urduTranscript` and `englishSummary` = the typed text. `sector` = `sectorHint`. No match → `"Other"`.
- **Audio fallback, audio only (no text):** the existing default mock (Garbage Heap) — deterministic.
- **Verify fallback:** IF the after image data is byte-identical to the before image, or the after image is missing/unreadable → `passed: false`, `verdict: "REJECTED_UNRESOLVED"`, `confidence: 0.05`, reasoning "The After photo is identical to the Before photo — no repair is visible." ELSE → `passed: true`, `verdict: "VERIFIED_RESOLVED"`, `confidence: 0.9`, reasoning prefixed "Offline demo verification:". Always `isOfflineFallback: true`.

### 5.4 Prompts (`lib/ai/prompts.ts`)
- Triage prompt lists the fixed categories with their departments and asks for the §4.1 shape (no coordinates).
- Verification prompt: Image 1 = BEFORE, Image 2 = AFTER; check that the hazard is physically fixed AND the background matches the same location; return `{ verdict, confidence (0.0–1.0), reasoning (1–2 sentences, English), detectedChanges[] }`.

---

## 6. Non-Functional Requirements
- **Mobile viewport:** 375–430px container centered on desktop.
- **Latency:** fallbacks <300ms. Live AI latency target to be set after measurement (D7).
- **Security:** `GEMINI_API_KEY` server-side only (`.env.local`), never in client bundles or logs.
- **Offline:** all hazard assets bundled locally; app fully usable with AI unavailable.
- **Storage:** all stored photos compressed (AC-7.3); quota errors handled (AC-7.4).
- **Build quality:** `npm run build`, `npm run lint`, `npm run test:e2e` pass with 0 errors.
- **Accessibility:** interactive elements are buttons/links with accessible names; modal per AC-3.6; color is never the only status signal (badges carry text).
