# Tasks: Awaaz (آواز)

Legend: `[ ]` todo | `[~]` in progress | `[x]` done | `BLOCKED` = needs an OPEN decision from `docs/progress.md` — skip it.

Order: T3.0 → T3.0b → T3.1 → T3.2 → T3.3 → T3.4 → T4.1 → T4.2 → T4.3 → T4.4 → T4.5 → T5.2 → T5.3 (T5.1 parked).

Every task's gate: `npm run build && npm run lint && npm run test:e2e` all pass, `docs/progress.md` updated, committed on the current branch (see AGENTS.md → Git rules). Extend `e2e/` whenever a task adds user-visible behavior. All tests run with `AI_FORCE_FALLBACK=1` — no live Gemini calls (OPEN D2).

---

## Sprint 1: Scaffold, Data & Foundation (Completed ✅)
- [x] **T1.1** Project scaffold & mobile shell
- [x] **T1.2** Seed data, types & localStorage storage
- [x] **T1.3** Leaflet map tab
- [x] **T1.4** Explore feed & flat comments

## Sprint 2: Core AI Endpoints & Basic Portals (Completed ✅)
- [x] **T2.1** AI infrastructure (`lib/ai/*`)
- [x] **T2.2** `/api/analyze-audio`
- [x] **T2.3** `/api/verify-fix`
- [x] **T2.4** Home intake UI
- [x] **T2.5** Worker portal
- [x] **T2.6** My Reports + "+1 Confirm Fix"
- [x] **T2.7** Mayor portal shell
- [x] **T2.8** Golden path smoke check (manual)

---

## Sprint 3: Test Harness, Fixes & Golden Path Hardening

- [x] **T3.0: Playwright Golden-Path Smoke Test + Force-Fallback Flag**
  - Prerequisite: verified. `@playwright/test` 1.64.0 is in devDependencies (exact pin) and Chromium 156 is installed in `~/.cache/ms-playwright`; a headless launch was verified. No system deps needed. Do not reinstall. Never use `sudo`.
  - `lib/ai/gemini.ts`: `getGemini()` returns `null` when `process.env.AI_FORCE_FALLBACK === "1"`. Make `AI_TIMEOUT_MS` read `process.env.AI_TIMEOUT_MS` (default 5000).
  - `playwright.config.ts`: Chromium only, viewport 390×844, `testDir: "e2e"`, `webServer: { command: "npm run start -- -p 3100", port: 3100, env: { AI_FORCE_FALLBACK: "1" }, reuseExistingServer: false }` (requires a prior `npm run build`, which the gate runs first). Port 3100 avoids clashing with the user's dev server on 3000. Chromium launch args `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` (for mic tests in T3.2).
  - `package.json`: add `"test:e2e": "playwright test"`. Add `test-results/`, `playwright-report/`, `blob-report/` to `.gitignore` (`.playwright-mcp/` is already ignored).
  - The Playwright VS Code extension is installed; it will pick up `playwright.config.ts` automatically.
  - `e2e/golden-path.spec.ts` (fresh `localStorage` per test): as Tariq type "F-10 Markaz mein gutter ka dhakkan toota hua hai" → submit → triage card shows a department and urgency → Map tab marker count increases by 1 → switch to Sajid → claim the new ticket → upload `public/images/hazards/open-manhole-after.jpg` → Verify Fix → "AI Verified" badge visible, no "9400%" (assert the percentage is ≤ 100) → switch to Tariq → My Reports → "+1 Confirm Fix" → status shows Resolved.
  - Add `data-testid` attributes where selectors would otherwise be brittle. Don't change behavior in this task beyond the env flags.
  - **Note:** the current verify response field mismatch (see T3.1) may make the badge text or percentage wrong. If so, write the test against the spec'd behavior, mark that assertion `test.fixme` with a comment pointing to T3.1, and un-fixme it in T3.1.
  - **Files:** `lib/ai/gemini.ts`, `playwright.config.ts`, `e2e/golden-path.spec.ts`, `package.json`, `.gitignore`, components needing `data-testid`.

- [x] **T3.0b: shadcn/ui Foundation (fix init leftovers, theme, components)**
  - Confirmed state (after running `npx shadcn@2.3.0 init` — New York, Neutral, CSS variables, `--legacy-peer-deps`):
    - Created `components.json` (`style: new-york`, `baseColor: neutral`, `cssVariables: true`, `ui: @/components/ui`, `iconLibrary: lucide`) and `lib/utils.ts` with `cn()`.
    - `tailwind.config.ts`: added `darkMode: ["class"]`, shadcn colour tokens (`background`, `primary`, …), `borderRadius`, `plugins: [require("tailwindcss-animate")]`. The `civic-*` colours, `fontFamily` (inter/urdu), `soft-pulse` and `sheet-up` keyframes/animations are preserved.
    - `app/globals.css`: added `:root` (light Neutral) and `.dark` (dark Neutral) variables plus `* { @apply border-border }` and `body { @apply bg-background text-foreground }`. `<html>` has no `dark` class.
    - `package.json`: added `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `tailwind-merge ^3.7.0`, `tailwindcss-animate ^1.0.7`, and changed `lucide-react` from `1.55.0` to `^1.55.0`. No `.npmrc`.
    - Checked live via Playwright MCP on Home at 390px: body background is still `#070b12` (civic dark), header dark. Other tabs and border colours not yet checked.
  - Fix dependencies:
    - Create `.npmrc` with `save-exact=true` and `legacy-peer-deps=true`.
    - `npm install tailwind-merge@2.6.1` (v3 only supports Tailwind 4).
    - Pin exact: `class-variance-authority` 0.7.1, `clsx` 2.1.1, `tailwindcss-animate` 1.0.7, `lucide-react` 1.55.0 (remove every `^`/`~` from `package.json`, keep the lock file in sync).
  - Theme (keep the current look — user decision):
    - In `app/globals.css`, set the `:root` shadcn variables to HSL equivalents of the civic palette: `--background` ← `#070b12` (civic.bg), `--card`/`--popover` ← `#0f1622` (civic.surface), `--secondary`/`--muted`/`--accent` ← `#162030` (civic.raised), `--border`/`--input` ← `#223047` (civic.border), `--muted-foreground` ← `#8a9ab3` (civic.muted), `--primary`/`--ring` ← `#10b981` (civic.accent), `--foreground` ← the current body text colour (`rgb(241,245,249)`), `--primary-foreground` ← a dark colour with enough contrast on `#10b981`, `--destructive` ← a red that's readable on dark. Make `.dark` identical to `:root` (the app is dark-only).
    - Add `className="dark"` to `<html>` in `app/layout.tsx` so `dark:` variants and shadcn defaults behave.
    - Don't change any existing component's classes in this task.
  - Add components: `npx shadcn@2.3.0 add dialog sheet tabs dropdown-menu switch sonner button badge input textarea` (non-interactive; answer overwrite prompts with no, use `--yes` if supported). If the registry download fails, log T3.0b as BLOCKED with the error, revert this task's changes to `components/ui/`, and continue — later tasks fall back to hand-crafted Tailwind.
  - Overlay stacking: give Dialog/Sheet overlay + content, DropdownMenu content, and the Sonner toaster a z-index above Leaflet (≥ `z-[1100]`). Mount `<Toaster />` once in `app/layout.tsx`.
  - Don't migrate existing screens here. Later tasks use the primitives in files they already touch (T3.2 storage-full toast → sonner, T3.3 modal → dialog, T4.3 payout toggle → switch, Worker/Mayor tabs → tabs when touched, map drawer → sheet only if T3.3 touches it).
  - Verify:
    - Gate passes (`npm run build && npm run lint && npm run test:e2e`).
    - `grep` shows no `^` or `~` in `package.json` dependency versions; `node -p "require('./node_modules/tailwind-merge/package.json').version"` = 2.6.1.
    - Visual: Playwright screenshots at 390×844 of every citizen tab, Worker portal and Mayor portal, before and after the theme change (save to `test-results/screens/`). Background, cards, borders and text must look the same. Computed `body` background must be `rgb(7, 11, 18)`.
    - A temporary e2e (delete before committing, or keep as `e2e/ui-smoke.spec.ts` if useful) that opens a shadcn Dialog over the Map tab confirms it renders above the map.
  - **Files:** `.npmrc`, `package.json`, `package-lock.json`, `app/globals.css`, `app/layout.tsx`, `components/ui/*`, `tailwind.config.ts` (only if needed), `e2e/*`.

- [x] **T3.1: Harmonize Verify-Fix Contract, Confidence 0–1, Honest Fallbacks, Fixed Categories**
  - Confirmed baseline state:
    - `lib/ai/schemas.ts` `FixVerificationResponseSchema` = `{ verified, confidence 0–100 .catch(0), explanation }`; `lib/ai/prompts.ts` asks the model for that shape.
    - `lib/ai/mocks.ts` `MOCK_FIX_VERIFICATION` = `{ verified: true, confidence: 94, explanation }` — always passes, can never reject.
    - `app/api/verify-fix/route.ts` returns `{ ...data, passed, complaintId, fallback, isOfflineFallback }`, `PASS_CONFIDENCE = 60`, ignores `beforeMimeType`/`afterMimeType` and labels raw base64 as `image/jpeg`.
    - `components/worker/BeforeAfterViewer.tsx` expects `{ passed, confidence 0–1, verdict, reasoning, detectedChanges, timestamp }` → `reasoning`/`verdict` are undefined and confidence 94 renders as 9400%. `components/reports/MyReportsView.tsx` line ~73 also renders `confidence * 100`.
    - `MOCK_AUDIO_ANALYSIS` always returns the same Garbage Heap / F-10 / HIGH ticket regardless of input. `analyze-audio` returns both `fallback` and `isOfflineFallback`; `HomeChatIntake.tsx` reads both.
  - Implement spec §4.2 contract exactly (no `verified`, `explanation`, `fallback`). Server-side pass rule from §4.2. Fail-closed Zod per §5.2 (one helper normalizes a 0–100 confidence to 0–1).
  - Route uses `beforeMimeType`/`afterMimeType` (or data-URL MIME).
  - Create `lib/categories.ts`: the 9 fixed categories, each with `department`, default `urgency`, `title`, `titleUrdu`, stock photo path (existing files in `public/images/hazards/`; "Other" uses whatever the intake uses as its default today), and keywords (English, Roman Urdu, Urdu script). Departments must match the seeds: Open Manhole/Garbage Heap → CDA_SANITATION, Pothole → CDA_ROADS, Broken Streetlight/Live Wire → IESCO, Sewage Leak/Water Outage → WASA, Low Gas Pressure → SNGPL, Other → CDA_SANITATION. Close the `IssueCategory` type (spec §3). Replace the intake's existing category regex/stock-photo logic with this table.
  - Fallbacks per spec §5.3 (keyword audio fallback; deterministic verify fallback that rejects identical before/after). Remove the `fallback` field from both routes and from client reads.
  - Prompts per spec §5.4.
  - `BeforeAfterViewer.tsx`: on `passed: false` store `aiVerification` with `passed: false` and show the red rejection badge (AC-4.6). Store `isOfflineFallback` in `aiVerification`.
  - `lib/data/storage.ts`: on load, normalize any stored `aiVerification.confidence > 1` by dividing by 100 (old local data).
  - All confidence displays use `Math.round(confidence * 100)%`.
  - e2e: un-fixme T3.0 assertions; add a rejection test (upload the complaint's own Before photo as After → "AI Rejected" badge, status stays In Progress); add a fallback-category test (type "street light kharab hai F-6" → triage card department IESCO).
  - **Files:** `app/api/verify-fix/route.ts`, `app/api/analyze-audio/route.ts`, `lib/ai/schemas.ts`, `lib/ai/mocks.ts`, `lib/ai/prompts.ts`, `lib/categories.ts`, `lib/types.ts`, `lib/data/storage.ts`, `components/worker/BeforeAfterViewer.tsx`, `components/reports/MyReportsView.tsx`, `components/home/HomeChatIntake.tsx`, `e2e/*`.

- [x] **T3.2: Citizen Photo Attachment, Photo Compression & Waveform Visualizer**
  - `lib/image.ts`: `compressImage(file: File): Promise<{ dataUrl: string; mimeType: "image/jpeg"; base64: string }>` — longest side ≤ 800px, JPEG quality 0.7, via canvas.
  - `HomeChatIntake.tsx`: `➕` opens `<input type="file" accept="image/jpeg,image/png,image/webp">` (no `capture`); compressed thumbnail preview + remove button; send compressed JPEG as `photo` and active profile sector as `sectorHint` (AC-1.3, AC-1.4). New complaint `beforePhotoUrl` = compressed data URL, else category stock photo (AC-1.5).
  - `app/api/analyze-audio/route.ts`: read `photo` and `sectorHint`; forward photo as `inlineData` with its MIME.
  - `BeforeAfterViewer.tsx`: compress the worker's After photo through `lib/image.ts` before sending/storing (AC-4.4, AC-7.3).
  - `lib/data/storage.ts`: catch `QuotaExceededError` on writes and surface the AC-7.4 message as a Sonner toast (don't crash; keep in-memory state).
  - `components/audio/WaveformVisualizer.tsx`: canvas waveform from an `AnalyserNode` on the recording stream; elapsed timer `m:ss / 0:30`; auto-stop at 30s; release `AudioContext` + tracks on stop/unmount (AC-1.2).
  - e2e: attach `public/images/hazards/pothole.jpg` with typed text → created complaint image `src` starts with `data:image/jpeg`; mic test with fake media stream → waveform canvas visible, timer advances, stop works.
  - **Files:** `lib/image.ts`, `components/home/HomeChatIntake.tsx`, `components/audio/WaveformVisualizer.tsx`, `app/api/analyze-audio/route.ts`, `components/worker/BeforeAfterViewer.tsx`, `lib/data/storage.ts`, `e2e/*`.

- [x] **T3.3: Lifecycle History, Assignment & Complaint Detail Modal**
  - Add `ComplaintEvent`, `history`, `assignedTo` to `lib/types.ts` (spec §3).
  - Add realistic `history` to all 12 seeds in `lib/data/seedComplaints.json`, consistent with each status and `createdAt` (AC-8.1). Bump `STORAGE_KEY` to `awaaz.complaints.v3`. On load, missing `history` → synthesize one `REPORTED` event from `createdAt`.
  - Every status change appends an event: create (`REPORTED`), claim (`CLAIMED` + set `assignedTo`), AI pass/reject (`AI_VERIFIED`/`AI_REJECTED`), "+1 Confirm Fix" (`COMMUNITY_CONFIRMED` + `RESOLVED`). Prefer doing this in `storage.ts` helpers so components can't forget.
  - `components/feed/ComplaintDetailModal.tsx` per AC-3.5, AC-3.6, AC-5.1, built on the shadcn `Dialog` from `components/ui/dialog.tsx` (it covers AC-3.6 focus/Escape/backdrop behaviour; still verify it). Must open above the Leaflet map. Open from: Explore card tap (vote/comment/confirm controls must `stopPropagation`), Map drawer "View Full Details", My Reports item.
  - Ensure "+1 Confirm Fix" appears on Explore cards and in the modal for pending tickets (AC-5.1) and is disabled for citizens who already confirmed (AC-5.3).
  - e2e: tap a seed card → modal opens with timeline entries → Escape closes; golden-path test asserts the timeline shows Reported → Claimed → AI Verified → Resolved at the end.
  - **Files:** `lib/types.ts`, `lib/data/seedComplaints.json`, `lib/data/storage.ts`, `components/feed/ComplaintDetailModal.tsx`, `components/feed/ComplaintCard.tsx`, `components/map/MapDrawer.tsx`, `components/reports/MyReportsView.tsx`, worker components that claim/verify, `e2e/*`.

- [x] **T3.4: App Icon / Favicon**
  - Add `app/icon.jpg` (copy of `public/logo.jpg`) so Next emits the icon link (AC-14.2). If `sharp` is already present in `node_modules` (Next ships it), a one-off script may produce `app/icon.png` instead; don't add dependencies.
  - e2e: load `/` → no console errors and no 404 responses.
  - **Files:** `app/icon.*`, `e2e/*`.

---

## Sprint 4: Phase 2 Capabilities

- [x] **T4.1: Groups Tab – Neighborhood Chat Hub (text only)**
  - `lib/data/seedGroups.json`: 5 channels + 6–10 seeded messages each (AC-8.2). Use real seed complaint ids for embeds.
  - Types `CivicGroup`, `GroupMessage` (spec §3, no audio fields). Storage helpers in `lib/data/storage.ts` (keys `awaaz.groups.v1`, `awaaz.messages.v1`), hydration-safe, included in "Reset System Data" (AC-6.4 — verify the reset action exists in the header; add it if missing).
  - `GroupsShell.tsx` (channel list by type, remove "Coming soon"), `GroupChatView.tsx` (stream + composer), `ChatMessageBubble.tsx` ("Convert to Ticket"), `ComplaintCardEmbed.tsx` (live status, opens Detail Modal).
  - `📢 Municipal Alerts` read-only for citizens (AC-9.3). Latest official broadcast shown as a banner atop other channels (AC-10.4).
  - "Convert to Ticket" → Home tab with composer pre-filled, no auto-submit (AC-9.5). Requires a small way to pass a draft from Groups to Home (lift state in `app/page.tsx`).
  - No voice notes.
  - e2e: Groups → `# F-10/2 Residents` → post a message → it persists after reload → "Convert to Ticket" → Home composer contains the text.
  - **Files:** `lib/data/seedGroups.json`, `lib/types.ts`, `lib/data/storage.ts`, `components/groups/*`, `app/page.tsx`, `components/home/HomeChatIntake.tsx`, `e2e/*`.

- [x] **T4.2: Location Resolution (GPS → Landmark → Sector) + Proximity Duplicate Detection**
  - Decision D1: GPS if allowed, otherwise landmark, otherwise sector centre. Implement AC-11.3 exactly: `location.source`, `Landmark` type, `lib/data/landmarks.json` (12 seed landmarks with seed coordinates + 4 sector centres, aliases in English / Roman Urdu / Urdu; no invented coordinates), GPS requested in parallel with the AI call, accuracy ≤ 100m and Islamabad-box checks, location chip on the triage card. Seeds get `source: "LANDMARK"`.
  - Current coordinates come from `SECTOR_COORDS` + `jitter()` in `HomeChatIntake.tsx` — this becomes step 3 only.
  - Haversine in `lib/utils.ts`; match rule AC-11.1 (same department + same category, non-resolved, ≤ 50m, only when source is GPS or LANDMARK); `DuplicateCard.tsx` in the Home chat stream with "+1 Impacts Me Too" / "Submit as Separate Ticket" (AC-11.2); `impactConfirmedBy` field (default `[]`, normalize on load); urgency boost at 2 and 4 confirmations (AC-11.4); history events.
  - e2e (use Playwright `context.grantPermissions(["geolocation"])` + `context.setGeolocation`):
    - GPS granted at `cmp-001`'s coordinates, type an open-manhole report → DuplicateCard appears → "+1 Impacts Me Too" as Ayesha → no new ticket, `cmp-001` impact count +1; repeat as Anonymous → urgency stays CRITICAL (already max) and a second case on a HIGH seed shows HIGH → CRITICAL after 2 confirmations.
    - GPS denied, type "F-10 Markaz petrol pump ke paas gutter khula hai" → chip shows "Landmark" → DuplicateCard for `cmp-001`.
    - GPS denied, no landmark match → chip "Sector estimate" → no DuplicateCard.
  - **Files:** `lib/data/landmarks.json`, `lib/utils.ts`, `lib/types.ts`, `lib/data/seedComplaints.json`, `lib/data/storage.ts`, `components/home/HomeChatIntake.tsx`, `components/home/DuplicateCard.tsx`, `e2e/*`.

- [x] **T4.3: Interactive Mayor Desk – Payout Freeze & Emergency Broadcast**
  - Move the contractor list currently hard-coded in `MayorPortalView.tsx` into seed data (`Contractor` type, spec §3) persisted at `awaaz.contractors.v1`; "Freeze Payout"/"Unfreeze Payout" toggle using the shadcn `Switch` (with a visible text label and status pill) (AC-10.3); included in Reset. Mayor tabs may move to shadcn `Tabs` while this file is being edited.
  - "Broadcast Emergency Notice" form (editable, pre-filled) posting an official alert to `📢 Municipal Alerts` (AC-10.4). Depends on T4.1 storage; if T4.1 is blocked, do the freeze toggle only and log the rest.
  - e2e: Mayor → Contractors → freeze → reload → still frozen; Mayor → Alerts → broadcast → switch to Tariq → Groups → Municipal Alerts shows it and another channel shows the banner.
  - **Files:** `components/mayor/MayorPortalView.tsx` (split into sub-components if it gets large), `lib/data/*`, `lib/types.ts`, `e2e/*`.

- [x] **T4.4: Dynamic Civic Health Scorecard**
  - `computeSectorHealth(complaints)` and `computeCityHealth(...)` in `lib/utils.ts` per AC-12.1/12.2. Add a quick self-check: a tiny script or e2e assertion that seed data yields the AC-12.3 values (F-10 66 C, F-6 84 B, G-9 86 B, I-9 100 A, city 84 B).
  - Show in Mayor `Home` (with live KPIs, AC-10.2) and on Explore sector chips (AC-3.3). Recompute on every complaint change.
  - e2e: Mayor Home shows city 84 / B on seed data; resolve `cmp-001` via the worker + confirm flow (or storage helper in test setup) → F-10 shows 86 / B.
  - **Files:** `lib/utils.ts`, `components/mayor/MayorPortalView.tsx`, `components/feed/FeedFilters.tsx`, `e2e/*`.

- [ ] **T4.5: Worker Home Route Card (small)**
  - Worker `Home` tab per AC-4.3: tickets where `assignedTo.workerId` = active worker and status `IN_PROGRESS`; mini Leaflet map (reuse `LeafletMap` via `next/dynamic`, `ssr: false`), landmark, coordinates, "Open in Google Maps" link, and the Before/After verify flow. No distance calc, no turn-by-turn.
  - Golden-path e2e should now go through this tab after claiming.
  - **Files:** `components/worker/WorkerHome.tsx`, `components/worker/WorkerPortalView.tsx`, `e2e/*`.

---

## Sprint 5: Polish & Verification

- [ ] **T5.1: Evaluation Suite — PARKED (D4).** Later, with the user. Do not build. Description in `docs/progress.md` → Parking Lot.

- [ ] **T5.2: PWA Manifest**
  - `app/manifest.ts` (Next metadata route) per AC-14.1 using icons derived from `public/logo.jpg` (192, 512). No service worker.
  - e2e: `GET /manifest.webmanifest` returns 200 with `display: "standalone"`.
  - **Files:** `app/manifest.ts`, `public/icons/*`, `e2e/*`.

- [ ] **T5.3: Final Verification Pass**
  - Full gate: `npm run build && npm run lint && npm run test:e2e`.
  - Check mobile layout at 375px and 430px with Playwright screenshots of every tab and portal; save to `test-results/screens/` (gitignored) and fix any overflow/clipping found.
  - Write a short "Morning checklist" section in `docs/progress.md`: what was built, what's blocked, what the user should click through manually (including a real mic test, which automation can't do with real speech).
  - Demo script: OPEN D5 — don't write one.
