# Progress Log: Awaaz (آواز)

## Current State
- **Mode:** Phase 2 — building the full civic platform capabilities.
- **Branch:** `phase2-overnight` (all work happens here; `master` untouched; nothing is pushed).
- **Last Completed:** `T4.1` — built Groups Tab (5 channels grouped by type, seeded messages, text composer, live complaint embeds opening Detail Modal, read-only Municipal Alerts + top banner, Convert to Ticket draft flow, and header Reset System Data).
- **Next Task:** `T4.2` — Location Resolution (GPS → Landmark → Sector) + Proximity Duplicate Detection.

---

## Sprint Status
- Sprint 1 (Scaffold, Map, Seed Data, Feed): `[x]` Completed
- Sprint 2 (Core AI Endpoints & Basic Portals): `[x]` Completed
- Sprint 3 (Test harness, shadcn foundation, fixes, golden path hardening): `[x]` Completed (T3.0, T3.0b, T3.1, T3.2, T3.3, T3.4 done)
- Sprint 4 (Groups, Location + Duplicates, Mayor desk, Civic Health, Worker route): `[ ]` In progress (next `T4.1`)
- Sprint 5 (PWA, final verification): `[ ]` Planned — T5.1 evals parked (see Parking Lot)

---

## Open Decisions (awaiting user — do NOT guess these)
| ID | Decision | Affects | Until decided |
| :-- | :-- | :-- | :-- |
| D2 | Live Gemini testing — the user will test live AI personally when awake | Latency measurement, D7 | Never call the Gemini API. Build live paths; verify via fallbacks with `AI_FORCE_FALLBACK=1`. |
| D3 | Shared backend (multi-device live demo) | Persistence layer | Parked — see Parking Lot. Stay on `localStorage`. |
| D4 | Evaluation suite | T5.1 | Parked — see Parking Lot. Don't create `evals/`. |
| D5 | Demo length and presentation format (to be announced) | Demo script in `brief.md` | Brief's demo script is provisional. Don't write a new one. |
| D7 | AI timeout value — set with the user after live latency is measured | `AI_TIMEOUT_MS` default | Stays 5000ms (env-configurable). |

## Parking Lot (later, not overnight)
- **Evaluation suite (D4).** A scorecard for the AI itself: a set of real inputs with known correct answers (e.g. ~20 Urdu voice notes labelled with category/department/urgency, plus Before/After photo pairs including fake "fixes" that must be rejected), run through the real routes, reporting accuracy such as "department correct 18/20 = 90%". Needs real Urdu recordings and more photo pairs from the user (only 3 "after" photos exist today), and live Gemini calls. Would live in `evals/cases.json` + `evals/run-evals.ts` + `npm run eval` (needs `tsx`).
- **Shared backend (D3).** Today each browser has its own `localStorage`, so a citizen's phone and the worker's laptop can't see each other's tickets. Option: Supabase (hosted Postgres + realtime) behind a storage interface, with API routes for writes, keeping `localStorage` as an offline fallback. ~1 day of work. Payoff: a judge files a ticket on their phone and it appears on the worker screen live. Costs: venue internet dependency, an account/keys, weaker "fully offline" story unless the fallback is kept.

## Decisions Made
- Build all Phase 2 features: Groups, duplicate detection, dynamic Civic Health, interactive Mayor desk, PWA manifest.
- D1 (location source): GPS if allowed (accuracy ≤ 100m, inside Islamabad box) → landmark table match → sector centre. Duplicate check only for GPS/landmark sources. Details in spec AC-11.3.
- Model id: `GEMINI_MODEL` env, default `gemini-3.8-flash`. Gemini 2.0 Flash was shut down June 1, 2026.
- Confidence is 0.0–1.0 everywhere; displayed as `Math.round(c * 100)%`.
- Fallback latency target: <300ms everywhere.
- 5 profiles: Tariq (Citizen/F-10), Ayesha (Citizen/F-6), Anonymous Citizen, Sajid (Worker), Comm. Nasir (Mayor).
- 5 group channels, including `📢 Municipal Alerts` (read-only for citizens, Mayor broadcasts land there).
- Verify-fix fails closed; one name per field (`passed`, `confidence`, `verdict`, `reasoning`, `detectedChanges`, `isOfflineFallback`). Dropped `verified`, `explanation`, `fallback`.
- Photos compressed client-side (≤800px, JPEG 0.7) before `localStorage`; quota errors handled.
- Complaints get a `history` event log and `assignedTo`.
- Duplicate matching: same department + same fixed category, ≤50m. Urgency +1 level at 2 and 4 "+1 Impacts Me Too" confirmations, capped at CRITICAL.
- Civic Health: formula in spec AC-12.1, A–F grades with no plus/minus; seed data gives city 84 (B), F-10 66 (C) → 86 (B) after resolving `cmp-001`.
- Cut: Groups voice notes (recording and playback), bilingual UI toggle. Worker route kept small (mini map + Google Maps link).
- Playwright approved for E2E (`@playwright/test` 1.64.0, Chromium).
- **Playwright Setup:** Playwright installed (exact pin, Chromium 156, headless launch verified, no system deps needed). Playwright VS Code extension installed. Playwright MCP configured and verified.
- **D6 closed: use shadcn/ui.** Initialized shadcn@2.3.0 (New York, Neutral, CSS variables). Keep the current civic dark look by mapping shadcn variables to the `civic-*` palette. `tailwind-merge` pinned to 2.6.1, exact versions, `.npmrc`, dark theme variables.
- `npm audit`: 11 findings, all in existing Next/Tailwind/ESLint tooling, fixes are major upgrades only. Not acting on them now; never `npm audit fix --force`.
- The user is currently working alongside (attended mode): stop after each task for review.
- Overnight: commit per task on `phase2-overnight` with descriptive messages; never push; on block → log here and skip.

## Decisions Made Overnight
- **T3.0:** The 9400%/empty-reasoning assertions live in a separate `test.fixme` test (an inline `test.fixme()` would skip the real sign-off assertions). Un-fixme in T3.1.
- **T3.0:** e2e blocks OpenStreetMap tiles (offline-safe); per-ticket selectors scoped with `data-complaint-id` (seed tickets also show "+1 Confirm Fix"). Playwright runs `next start` on port 3100.
- **T3.0:** Note: code has 4 roles (Tariq, Ayesha, Sajid, Comm. Nasir); docs mention 5 (no Anonymous in code). Not changed.
- **T3.0b:** `next-themes` (pulled in by shadcn's sonner) removed; `components/ui/sonner.tsx` uses a fixed `theme="dark"` (app is dark-only, no theme provider).
- **T3.0b:** shadcn variables live in ONE rule `:root, .dark` in `app/globals.css`, so `.dark` can't drift from `:root`. Chart/sidebar colours picked from the civic palette.
- **T3.0b:** Added `destructive.foreground` token to `tailwind.config.ts` (used by shadcn `button`/`badge`).
- **T3.0b:** Overlay z-index (`z-[1100]`) is checked statically in `e2e/ui-smoke.spec.ts` by reading `components/ui/*`; no screen renders a Dialog yet — first runtime check comes with T3.3 (Detail Modal over Map).
- **T3.0b:** "Before" screenshots skipped (agent terminal hung during the pre-change build). After screenshots reviewed by eye: dark civic look intact on all 7 screens.
- **T3.1:** Category keyword match runs in a fixed priority order (Live Wire → Open Manhole → Sewage Leak → Broken Streetlight → Low Gas Pressure → Garbage Heap → Water Outage → Pothole), so "gutter ka dhakkan" → Open Manhole (not Sewage Leak). Latin keywords must match whole words on both sides ("taar" ≠ "sitaara", "current" ≠ "currently", "wire" ≠ "wireless"; plurals like "lights"/"wires" listed explicitly — T3.1 review fix); Urdu-script keywords are plain substrings. "tar" deliberately excluded (would match "Tariq").
- **T3.1:** "Other" uses `open-manhole.jpg` as its stock photo (the intake's default before T3.1). Default urgencies: Open Manhole/Live Wire CRITICAL; Garbage Heap/Sewage Leak/Water Outage HIGH; Broken Streetlight/Pothole/Low Gas Pressure/Other MEDIUM.
- **T3.1:** verify-fix sets `verdict` from `passed` (a low-confidence "VERIFIED_RESOLVED" is returned as `REJECTED_UNRESOLVED`), so stored records never say "resolved" with `passed: false`. Raw base64 with no image MIME (neither field nor data URL) is never assumed JPEG.
- **T3.1:** The intake does not send `sectorHint` yet (that is T3.2); the route reads it if present. With no hint, the fallback `sector` is `""` and the client keeps today's behaviour (profile home sector).
- **T3.1 (review fix):** Fail-closed vs spec §5.2/§5.3 reconciled: the byte-compare demo fallback (identical/missing After → reject 5%, else pass 90%) runs only when the AI is *not reachable* (no key, `AI_FORCE_FALLBACK=1`, timeout, network error). When Gemini *answered* but the reply is malformed (unparseable JSON, schema mismatch, confidence outside 0–100), or the live path cannot read the Before photo / an image MIME, the route returns a rejecting fallback instead: `passed:false`, `REJECTED_UNRESOLVED`, 0.05, `isOfflineFallback:true`, reasoning "AI verification reply was invalid — please retry." / "The Before/After photos could not be read — please retry.". Reply interpretation moved to `lib/ai/verification.ts` (pure, testable).
- **T3.1 (review fix):** No unit-test framework (no new deps), so pure Node tests run under Playwright: `e2e/ai-contract.spec.ts` covers `normalizeConfidence`, `FixVerificationModelSchema` rejections, malformed-reply → rejection, 94 → 0.94, low-confidence downgrade, demo fallback, keyword whole-word matching. Gap still open: the route's Gemini call itself (no stub) and storage's legacy-confidence normalisation have no automated test.
- **T3.1:** Worker card shows the offline chip under the verify result when `isOfflineFallback` is true (AC-4.7), and a stored rejection re-renders the red "AI Rejected" badge after a remount.
- **T3.2:** `BeforeAfterViewer.tsx` compresses fetched non-data-URL `beforePhotoUrl` stock photos through `lib/image.ts` too, so uploading the exact same stock file as After still yields identical bytes in `buildVerifyFallback` while keeping verify payloads small.
- **T3.2:** `storage.ts` keeps an `inMemoryFallback` list when `localStorage.setItem` throws `QuotaExceededError` and deduplicates the Sonner error toast (`id: "storage-quota-full"`).

## Blocked
- **T5.1** — parked by user (see Parking Lot).

---

## Confirmed Current Behavior
1. **Verify-fix field mismatch:** route returned `{ verified, confidence (0–100), explanation, passed, fallback, isOfflineFallback }` → **9400%** in the badge. → T3.1 ✅ resolved (spec §4.2 shape, 0–1 confidence, stored values > 1 normalized on load)
2. **Verify fallback can't reject:** `MOCK_FIX_VERIFICATION` always `verified: true, 94`. → T3.1 ✅ resolved (identical/missing After photo → rejected 5%, else passed 90%, always `isOfflineFallback: true`)
3. **Audio fallback ignores input:** always "Garbage heap near Jinnah Super Market, F-10, HIGH". → T3.1 ✅ resolved (keyword match via `lib/categories.ts`; audio-only keeps the old mock)
4. **verify-fix ignores image MIME types** (route assumed JPEG). → T3.1 ✅ resolved (uses `beforeMimeType`/`afterMimeType` or the data-URL MIME)
5. **`➕` inactive; analyze-audio ignores `photo`/`sectorHint`.** → T3.2 ✅ resolved (`HomeChatIntake.tsx` compressed JPEG attachment + preview/remove + `photo`/`sectorHint` forwarded by `app/api/analyze-audio/route.ts`)
6. **Raw photos stored in localStorage** (worker After photo stored uncompressed) → quota risk. → T3.2 ✅ resolved (`lib/image.ts` compression on both intake & worker After photo + `QuotaExceededError` Sonner toast & in-memory fallback in `lib/data/storage.ts`)
7. **No waveform / timer.** → T3.2 ✅ resolved (`components/audio/WaveformVisualizer.tsx` live `AnalyserNode` canvas, `m:ss / 0:30` timer, 30s auto-stop, track/AudioContext cleanup)
8. **No detail modal; no history data; no `assignedTo`.** → T3.3 ✅ resolved (`ComplaintDetailModal.tsx`, `ComplaintEvent[]` in `seedComplaints.json` & `storage.ts` v3, `assignedTo` + `claimComplaint` / `confirmFix` / `BeforeAfterViewer` history events)
9. **Favicon 404.** → T3.4 ✅ resolved (`app/icon.jpg` added; verified 200 response and zero 404s/console errors on `/`)
10. **Groups tab is a "Coming soon" shell; Mayor freeze/broadcast inert.** → Groups tab implemented in T4.1 ✅; Mayor freeze/broadcast still pending (T4.3). → T4.1, T4.3
11. **Intake coordinates** = sector centre (`SECTOR_COORDS`) + random jitter in `HomeChatIntake.tsx`. → T4.2 (GPS → landmark → sector)
12. **No automated tests.** → T3.0 ✅ resolved (`e2e/golden-path.spec.ts`)
13. **Favicon 404 re-confirmed** via Playwright MCP (only console error on Home). → T3.4 ✅ resolved (`app/icon.jpg`)
14. **shadcn init leftovers** (tailwind-merge v3, `^` versions, light theme variables, no `dark` class). → T3.0b ✅ resolved

---

## Gotchas Learned
- **Leaflet SSR:** Always dynamic import with `{ ssr: false }`. Never top-level import Leaflet.
- **Leaflet Markers:** `L.divIcon()` with SVG only — never default PNGs.
- **Audio MIME Types:** Chrome = `audio/webm;codecs=opus`, Safari = `audio/mp4`. Read `file.type` dynamically.
- **`@google/genai`:** `import { GoogleGenAI } from "@google/genai"` only in server route handlers.
- **Hydration Safety:** Read `localStorage` only inside `useEffect`; cross-component sync via `awaaz:complaints-changed` events.
- **Offline Assets:** No external image URLs; seed images live in `public/images/hazards/`.
- **Field-name drift** between route, schema, mock, types and components caused the 9400% bug. Keep spec §4 as the single contract.
- **shadcn on Tailwind v3:** use `shadcn@2.3.0` only; `tailwind-merge` must be 2.x; overlays need z-index > Leaflet's ~1000.
- **shadcn 2.3.0 `add`** always shows the React-19 npm prompt (`--yes` doesn't skip it) — choose "Use --legacy-peer-deps".
- **shadcn init wrote oklch values**, which are invalid inside `hsl(var(--x))` (tailwind.config.ts). Use bare HSL triplets `H S% L%`.
- **Playwright wipes `test-results/`** at the start of every run; keep anything you need elsewhere.

---

## How to Run
```bash
npm run dev        # http://localhost:3000 (user runs manually)
npm run build      # must pass
npm run lint       # must pass
npm run test:e2e   # Playwright golden path (after T3.0); uses port 3100 + AI_FORCE_FALLBACK=1
```

---

## Task Log
- **Sprints 1 and 2:** Core scaffold, Leaflet map, seed data, explore feed, AI pipeline, worker portal, and mayor portal shell implemented.
- **Phase 2 Planning:** Context engineering, Groups community chat hub, photo attachment, waveform visualizer, detail modal, proximity duplicate detection, and civic health scorecard.
- **T3.0:** Playwright golden-path smoke test and `AI_FORCE_FALLBACK` flag implemented.
- **T3.0b:** shadcn/ui foundation with civic dark theme, pinned dependencies, and overlay stacking.
- **T3.1:** verify-fix contract harmonized (0-1 confidence, fail closed), input-aware fallbacks, fixed category table (`lib/categories.ts`).
- **T3.2:** Client-side photo compression (`lib/image.ts`), citizen photo attachment + `photo`/`sectorHint` forwarding, live `WaveformVisualizer` (`m:ss / 0:30`, auto-stop, cleanup), worker After photo compression, and `QuotaExceededError` Sonner toast + in-memory fallback.
- **T3.3:** Lifecycle `history` and `assignedTo` on `Complaint`, all 12 seeds updated (`awaaz.complaints.v3`), `claimComplaint` / `confirmFix` / `BeforeAfterViewer` history tracking, `ComplaintDetailModal` (shadcn `Dialog` at `z-[1100]`) wired from Explore cards, Map drawer, and My Reports, plus "+1 Confirm Fix" on Explore cards and modal.
- **T3.4:** Added `app/icon.jpg` (copied from `public/logo.jpg`) so Next.js serves `/icon.jpg`; added E2E check in `e2e/ui-smoke.spec.ts` verifying `/` loads with no 404 responses and no console errors.
- **T4.1:** Implemented Groups Tab (`CivicGroup`, `GroupMessage` in `lib/types.ts`; 5 seeded channels + 34 messages in `lib/data/seedGroups.json`; `awaaz.groups.v1` / `awaaz.messages.v1` + `resetSystemData()` in `lib/data/storage.ts`; `GroupsShell`, `GroupChatView`, `ChatMessageBubble`, `ComplaintCardEmbed`; header "Reset System Data" menu item; "Convert to Ticket" draft pre-fill in `app/page.tsx` + `HomeChatIntake.tsx`; `e2e/groups.spec.ts`). Verified via `npm run build && npm run lint && npm run test:e2e` (19 passed).
