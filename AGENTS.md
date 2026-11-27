# AGENTS.md: Awaaz (آواز)

## What this is
Civic tech hazard reporting platform for Pakistani cities (piloted in Islamabad). Mobile-first Next.js PWA with live Urdu voice intake, Leaflet map, AI vision verification, and offline resilience.

**Phase 2.** Sprints 1–2 are done. Sprints 3–5 add the full feature set: Groups, duplicate detection, dynamic Civic Health scorecard, interactive Mayor desk, PWA manifest. Quality matters: every task ships with a passing build, lint, and golden-path smoke test.

Source of truth, in order: this file → `docs/progress.md` (current state, open decisions) → `docs/tasks.md` (what to build) → `docs/spec.md` (acceptance criteria, data model, API contracts) → `docs/plan.md` (architecture) → `docs/brief.md` (product story).

---

## Golden path (must always work — this is the demo)
1. **Citizen Ingestion:** Tap mic (or type) → AI returns structured ticket (transcript, department, urgency) → pin appears on Leaflet map.
2. **Worker AI Verification:** Worker claims ticket → uploads "After" repair photo → Gemini Vision Before/After comparison → green "AI Verified" badge → status `PENDING_COMMUNITY_VERIFICATION`.
3. **Citizen Sign-Off:** Citizen taps "+1 Confirm Fix" → ticket turns vibrant green → `RESOLVED`.

The Playwright smoke test (`e2e/golden-path.spec.ts`, task T3.0) encodes this flow. It must pass after every task.

---

## Scope

### ✅ BUILD (Sprints 3–5, see `docs/tasks.md`)
- Verify-fix contract fix + confidence display fix + honest fallbacks (T3.1)
- Citizen photo attachment with client-side compression + waveform visualizer (T3.2)
- Complaint Detail Modal with lifecycle history (T3.3)
- Favicon / app icon (T3.4)
- Groups tab: channels, seeded conversations, text posts, complaint embeds, "Convert to Ticket", Mayor broadcasts land in `📢 Municipal Alerts` (T4.1)
- Location resolution (GPS → landmark → sector centre) + proximity duplicate detection ("+1 Impacts Me Too") (T4.2)
- Interactive Mayor desk: contractor payout freeze + emergency broadcast (T4.3)
- Dynamic sector Civic Health scorecard (T4.4)
- Small worker route card: reused mini map + "Open in Google Maps" link (T4.5)
- PWA manifest (T5.2)

### ❌ DO NOT BUILD
- Voice notes in Groups (no recording, no playback). Text only.
- Bilingual UI toggle (Urdu/English UI switch).
- Reddit-style nested comment threads (comments stay flat).
- Evaluation suite (`evals/`) — parked for later (see `docs/progress.md` → Parking Lot).
- A remote database / shared backend — parked for later (see `docs/progress.md` → Parking Lot).
- Any UI library other than shadcn/ui (no MUI, Chakra, daisyUI, Headless UI, etc.).
- A big-bang rewrite of existing screens into shadcn. Swap to shadcn parts only inside files a task already touches.

---

## Stack (do not change without asking)
- **Framework:** Next.js 15 (App Router), TypeScript (strict), Tailwind CSS v3.4, Lucide icons.
- **UI Components:** shadcn/ui **2.3.0** (the last line supporting Tailwind v3), New York style, CSS variables, components in `components/ui/`, `cn()` in `lib/utils.ts`. Add components only with `npx shadcn@2.3.0 add <name>` — never `shadcn@latest` (it targets Tailwind v4). shadcn's colour variables are mapped to the `civic-*` dark palette (T3.0b); the app must keep its current dark look. Allowed set: dialog, sheet, tabs, dropdown-menu, switch, sonner, button, badge, input, textarea. Ask before adding others.
- **Geo:** Vanilla `leaflet` wrapped in `useRef`, dynamically imported with `{ ssr: false }`. No `react-leaflet` (React 19 peer conflict).
- **AI:** Google Gemini via `@google/genai`, server-side route handlers only. Model id comes from `process.env.GEMINI_MODEL`, default `gemini-3.8-flash` (in `lib/ai/gemini.ts`). Gemini 2.0 Flash was shut down on June 1, 2026 — never switch back to `gemini-2.0-*` or `gemini-2.5-*` model ids.
- **Validation:** Zod.
- **Persistence:** Browser `localStorage` + seeded JSON. No remote DB.
- **E2E tests:** Playwright (`@playwright/test` 1.64.0, Chromium only) — installed, Chromium launch verified.
- **Package Manager:** `npm`. Exact versions only (`.npmrc`: `save-exact=true`, `legacy-peer-deps=true` for React 19 peer warnings from shadcn deps). No new dependencies beyond Playwright and what `shadcn add` pulls in (Radix packages, `sonner`) without asking.
- **Known audit warnings:** `npm audit` reports 11 issues, all in existing Next/Tailwind/ESLint tooling; every fix is a major upgrade (Next 16, Tailwind 4). Never run `npm audit fix --force`.

---

## Commands
- `npm run dev` — local dev server (user runs this manually; agents never start it except via Playwright's `webServer`)
- `npm run build` — must pass before declaring any task done
- `npm run lint` — must pass before declaring any task done
- `npm run test:e2e` — Playwright golden-path smoke test (added in T3.0); must pass before declaring any task done

---

## Project map
```
app/                          # Next.js pages and layouts (mobile-first container)
app/api/analyze-audio/        # Server route: Urdu audio/text/photo → structured ticket
app/api/verify-fix/           # Server route: Before/After vision verification
components/
  ui/                         # shadcn/ui primitives (generated by `npx shadcn@2.3.0 add`, editable)
  audio/                      # WaveformVisualizer (T3.2)
  common/                     # AppHeader (includes role switcher), BottomNav, OfflineBadge, ComingSoon
  feed/                       # ComplaintCard, ComplaintFeed, FeedFilters, CommentSection, ComplaintDetailModal (T3.3)
  groups/                     # GroupsShell, GroupChatView, ChatMessageBubble, ComplaintCardEmbed (T4.1)
  home/                       # HomeChatIntake, DuplicateCard (T4.2)
  map/                        # MapView, LeafletMap, MapDrawer
  worker/                     # WorkerPortalView, WorkerQueue, BeforeAfterViewer, WorkerProfile, WorkerHome (T4.5)
  mayor/                      # MayorPortalView
  reports/                    # MyReportsView, LifecycleStepper
lib/ai/                       # gemini.ts, mocks.ts, prompts.ts, schemas.ts
lib/data/                     # seedComplaints.json, seedGroups.json (T4.1), storage.ts
lib/categories.ts             # Fixed category → department/urgency/photo table (T3.1)
lib/image.ts                  # Client-side photo compression (T3.2)
lib/utils.ts                  # cn() (shadcn), Haversine (T4.2), civic health calculator (T4.4)
components.json               # shadcn config (style new-york, baseColor neutral, cssVariables)
lib/types.ts                  # Shared TypeScript interfaces
lib/labels.ts                 # Badge labels/colors
e2e/                          # Playwright tests (T3.0)
public/images/hazards/        # Local Before/After hazard photos (offline safe)
docs/                         # brief.md, spec.md, plan.md, tasks.md, progress.md, ui_design/
```

---

## How to work
1. Read `docs/progress.md`: current task, open decisions, blocked items.
2. Take the next `[ ]` task from `docs/tasks.md` in order. Skip any task marked BLOCKED.
3. Implement it against its acceptance criteria in `docs/spec.md`.
4. Run the gate: `npm run build && npm run lint && npm run test:e2e`. Extend the e2e test when the task adds user-visible behavior.
5. Update `docs/progress.md` (task log line + any decisions made).
6. Commit (see Git rules). Move to the next task.

### Attended vs unattended runs
When the user is present (attended), stop after each task for review and ask instead of guessing. When the user is asleep (unattended), follow the rules below and never pause to wait for an answer. Optional visual check in attended sessions: the Playwright MCP (orchestrator chat only) can open `localhost:3000` and inspect screens.

### Unattended (overnight) run rules
- If a task needs a decision listed as OPEN in `docs/progress.md`, skip that task (or the part that needs the decision) and log it under "Blocked".
- If the gate fails twice on the same task with the same approach: diagnose the root cause, try one fundamentally different approach; if that also fails, revert that task's uncommitted changes (`git checkout -- <files>` for files you changed in that task only), log it under "Blocked" with the root cause, and move on.
- For small choices (naming, layout, copy, default values) pick a reasonable option and record it under "Decisions made overnight" in `docs/progress.md`. Do not invent product scope.
- Never make live Gemini API calls. Build the live code paths, but verify only through the fallbacks: run all tests with `AI_FORCE_FALLBACK=1` (see T3.0/T3.1). The user tests live AI when awake.
- Never edit `.env.local` and never print its values.

### Git rules
- Work normally on the current branch (e.g. `master` / `main`). Do not create or switch to feature/task branches unless explicitly asked. Never push. Never force anything, never rewrite history.
- Commit on the go: commit after each completed task or whenever there is a clean, verified checkpoint (more commits are fine for large tasks). Stage specific files, not `git add -A`.
- Commit message format: `type(scope): summary (T3.1)` + a short body listing what changed and how it was verified. Types: `feat`, `fix`, `test`, `docs`, `chore`.

---

## AI feature rules
- All Gemini calls run server-side in `app/api/`. Never expose `GEMINI_API_KEY` to client code.
- Structured outputs validated with Zod. Never parse raw model prose with regex.
- **Fail closed.** A malformed or missing AI field must never turn into a pass. No `.default(true)` / `.catch(<high confidence>)` on verification fields. An unparseable verification reply → the deterministic fallback, flagged `isOfflineFallback: true`.
- **Confidence is always 0.0–1.0** in every schema, prompt, mock, stored record and API response. Display it as `Math.round(confidence * 100) + "%"`. Never store or return 0–100.
- Every AI endpoint has a `// DEMO-FALLBACK` returning in <300ms on timeout, offline, missing key, or `AI_FORCE_FALLBACK=1`.
- Timeout is `AI_TIMEOUT_MS` (env-configurable, default 5000ms). Do not change the default until latency is measured (decision D7).
- Fallbacks must be honest: every fallback response carries `isOfflineFallback: true` and the UI shows the "Offline Mode (Synced locally)" chip.
- Use `import { GoogleGenAI } from "@google/genai"` — server-side only.

---

## Gotchas (do not repeat these mistakes)
- **Leaflet SSR crash:** Always `next/dynamic(() => import('./LeafletMap'), { ssr: false })`. Never import Leaflet at top-level in a page or layout.
- **Leaflet marker 404s:** Never use Leaflet's default PNG markers. Always `L.divIcon()` with inline SVG.
- **Audio MIME types:** Chrome = `audio/webm;codecs=opus`, Safari = `audio/mp4`. Pass `file.type` dynamically to Gemini `inlineData`, never hardcode.
- **Image MIME types:** Send the real image MIME type to Gemini (`beforeMimeType` / `afterMimeType`); don't assume JPEG.
- **localStorage quota (~5MB total):** Never store a raw camera photo. Always compress through `lib/image.ts` first (max 800px longest side, JPEG quality 0.7). Catch `QuotaExceededError` and show a friendly error instead of crashing.
- **Offline images:** All seed hazard photos live in `public/images/hazards/`. No external image URLs.
- **localStorage hydration:** Don't read `localStorage` during SSR. Gate it in `useEffect`.
- **Leaflet vs overlays:** Leaflet panes/controls use z-index up to ~1000. shadcn Dialog/Sheet/DropdownMenu/Sonner overlays and content must render above the map (e.g. `z-[1100]` on overlay + content). Check by opening a dialog over the Map tab.
- **tailwind-merge must be 2.x** (`2.6.1`). v3 only works with Tailwind 4 and mis-merges classes on v3. shadcn init installed 3.7.0 — fixed in T3.0b.
- **shadcn base styles:** `globals.css` sets `body { bg-background text-foreground }` and `* { border-border }`. Those variables must hold civic palette values, or the app turns light / borders turn grey.
- **Field names drift:** Client components, route handlers, Zod schemas, mocks and `lib/types.ts` must use the exact same field names (see `docs/spec.md` §4). This drift caused the 9400% bug.

---

## Definition of done (per task)
`npm run build` + `npm run lint` + `npm run test:e2e` pass → golden path still works → `docs/progress.md` updated → committed on the current branch.
