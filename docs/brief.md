# Brief: Awaaz (آواز)

## One-liner
Everyday citizens across Pakistani cities (piloted in Islamabad, architected nationwide) suffering from unaddressed neighborhood problems — open manholes, live wires, waterlogging, uncollected garbage, broken streetlights, and low gas pressure — can report any issue via a 15-second natural Urdu voice note and photo, which an AI engine routes to the correct municipal authority, verifies contractor fixes with computer vision, prevents fraud via community sign-off, and holds municipal departments publicly accountable.

## User
**Tariq (52, shopkeeper & resident in F-10 Markaz, Islamabad)** — walks daily through his commercial market and neighborhood, regularly dodging uncovered manholes, leaking sewage, foul garbage heaps, and dangling wires. He lacks the technical patience and English literacy to navigate rigid multi-step government portals like the Pakistan Citizen Portal (PCP), and has grown cynical after watching previous complaints get falsely marked "Resolved" without anyone fixing them.

## Problem
- **What they do today:** Citizens either suffer in silence, vent into the void on Twitter/WhatsApp groups (ignored due to zero institutional reach), or attempt the Pakistan Citizen Portal.
- **What it costs them:** Physical danger (pedestrians and children falling into open manholes during monsoon downpours, electrocution from sagging 220V wires), severe daily disruption and health risks (road waterlogging, stinking trash piles breeding dengue/malaria, crater potholes), and total erosion of trust in local governance.
- **Why existing tools fail:**
  1. *High Friction:* Apps demand formal English text, mandatory CNIC identity hurdles, and manual department dropdowns that citizens do not know.
  2. *The Ghost Closure Loop:* Bureaucrats and contractors unilaterally mark tickets as "Resolved" to hit performance KPIs with zero physical verification.
  3. *Zero Transparency:* No public visibility into contractor track records or neighborhood-level civic health.

## Magic Moment (The 1-2 Wow Combo — 30 seconds)
1. **Urdu Live Voice + Photo Intake (15s):** Tariq taps the mic and speaks naturally in Urdu while snapping a photo: *"F-10 markaz mein road ke corner pe gutter ka dhakkan toota hua hai, paani nikal raha hai aur raat ko haadsa ho sakta hai."* In seconds, Gemini (`gemini-3.5-flash`) processes the audio directly, categorizes it to **CDA Sanitation**, flags urgency as **Critical Hazard**, extracts landmark context, and places a pulsating marker directly on the neighborhood map.
2. **AI Anti-Ghosting Vision Proof (15s):** Field contractor uploads an "After" photo of the repair. Gemini Vision executes an on-screen Before-vs-After verification, confirms the hazard is resolved, rejects fraudulent uploads, and transitions the ticket to "Pending Community Sign-off."

## Golden Path (Pitch & Demo Script — PROVISIONAL)
> **Provisional (OPEN decision D5).** This 4-minute script outlines the pitch and demo walkthrough. It is kept as a reference for the story order.

**[0:00 – 1:00 | Problem & The Hook (1 min)]**
- Introduce Tariq in F-10 facing an open manhole. Contrast with the failure of Pakistan Citizen Portal (high friction, ghost closures).
- Live Urdu Voice + Photo Ingestion: Tap mic, speak live Urdu with waveform feedback, attach photo. In <3s, Gemini extracts Urdu transcript, English summary, department (CDA Sanitation), urgency (Critical), and auto-pins on Leaflet map.

**[1:00 – 2:00 | Spatial Feed & AI Proximity Duplicate Detection (1 min)]**
- Show the auto-pinned map and Explore feed with 12 pre-seeded Islamabad complaints.
- Show Proximity Duplicate Detection: A simulated nearby report within 50m surfaces an in-thread prompt: "+1 Impacts Me Too" (merging & boosting urgency score) vs "Submit as Separate Ticket".
- Open Complaint Detail Modal: inspect full audit trail, SLA countdown, and priority breakdown.

**[2:00 – 2:45 | Field Worker Dispatch & Gemini Vision Verification (45 sec)]**
- Switch role to Field Worker (Sajid) via header.
- View prioritized dispatch queue. Worker claims the Critical F-10 ticket, views route map, and uploads "After" repair photo.
- Gemini Vision executes side-by-side Before/After verification, confirms physical fix, logs detected changes, and awards green AI Verified badge.

**[2:45 – 3:15 | Citizen Sign-off & Hyper-Local Community Hub (30 sec)]**
- Switch back to Citizen (Tariq). Ticket is now "Pending Community Sign-off".
- Tariq taps "Confirm Fix". Ticket turns vibrant green (`RESOLVED`). Ghost closure prevented!
- Switch to Groups Tab: Show active hyper-local sector channels (`# F-10/2 Residents`, `💧 Water Watch`) with seeded neighbour conversations, embedded interactive cards, and 1-tap "Convert Message to Ticket".

**[3:15 – 3:30 | Mayor Executive Governance & Civic Health (15 sec)]**
- Switch to Mayor role (Comm. Nasir).
- Show Islamabad Civic Health Score computed live across sectors (seed data: city 84 / B; F-10 66 / C, rising to 86 / B once the F-10 manhole is resolved).
- Open Contractors Audit tab: demonstrate 1-tap "Freeze Contractor Payout" for flagged fraudulent work.

**[3:30 – 4:00 | Judges Q&A (30 sec)]**
- Highlight offline resilience: deterministic fallback in <300ms with honest "Offline Mode (Synced locally)" badge.
- Point to the automated Playwright golden-path test. (AI evaluation suite deferred — D4.)

---

## Scope Matrix (Phase 2 Platform Scope)

### ✅ MUST (Core Platform & Golden Path)
- Mobile-first PWA shell (`max-w-md mx-auto`) with 5-tab bottom navigation (`Explore`, `Map`, `Home`, `My Reports`, `Groups`).
- **Home Tab (Conversational Intake):**
  - Live Urdu mic capture with Web Audio API dynamic waveform visualizer and 30s timer.
  - Real camera/file photo attachment (`➕`) passed directly into ticket.
  - Text input fallback.
  - Instant Gemini structured auto-triage card in-thread with map pin.
- **Map Tab:** Interactive Leaflet map centered on Islamabad (F-10) with color-coded SVG pins (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Resolved) and slide-over drawer on pin click.
- **Explore Tab (Feed):** Pre-seeded Islamabad complaints, sector/urgency filters, Reddit-style Upvote/Downvote counters, and flat comments.
- **Complaint Detail Modal:** Full audit trail, Before/After slider/viewer, priority breakdown, and SLA hours.
- **My Reports Tab:** Personal report lifecycle stepper (`Reported → In Progress → Pending Sign-off → Resolved`) and "Confirm Fix" / "Not Fixed" sign-off.
- **Groups Tab (Hyper-Local Chat Hub):**
  - Active channels categorized by locality (`# F-10/2 Residents`), market (`# F-10 Markaz Traders`), civic interest (`💧 Water Watch`, `⚡ IESCO Alerts`), and official broadcast.
  - Text chat with seeded neighbour conversations (no voice notes).
  - Interactive complaint card embed in chat stream.
  - 1-tap "Convert Message to Ticket" pre-filling the intake.
- **Worker Portal:**
  - Tab 1 Queue (open complaints prioritized by urgency with 1-tap claim).
  - Tab 2 Home (operational cockpit with claimed job and route navigation).
  - Tab 3 Profile (98% AI fix accuracy rating, impact metrics, verified work ledger).
  - Before/After Gemini Vision verification with verified badge.
- **Mayor Portal:**
  - Executive KPI summary and Islamabad Civic Health Index.
  - Interactive contractor audit with 1-tap "Freeze Contractor Payout" toggle.
  - Emergency Civic Broadcast trigger.
- **Role Switcher, Language Switcher & Header:** 1-click role switcher (Tariq F-10, Ayesha F-6, Anonymous, Worker Sajid, Mayor Comm. Nasir), trilingual UI switcher (`EN`, `اردو`, `Roman`), offline status chip, and "Reset System Data".
- **Offline Resilience:** Deterministic `// DEMO-FALLBACK` in all API routes returning in <300ms + authentic "Offline Mode (Synced locally)" status chip.
- **Pre-seeded Dataset:** 12 realistic Islamabad complaints + 5 civic groups loaded locally.

### ⚠️ SHOULD (Winning Differentiators)
- **Proximity AI Duplicate Detection:** Haversine 50m check prompting "+1 Impacts Me Too" (merging & boosting urgency score) vs "Submit as Separate Ticket".
- **Dynamic Sector Civic Health Scorecard:** Live 0–100 score + letter grade (A–F) per sector computed from open vs resolved ratios and resolution SLA.
- **PWA Manifest:** `app/manifest.ts` with "Add to Home Screen" support, plus app icon / favicon fix.

### ⏸️ DEFERRED / OPEN
- **Multimodal Evaluation Suite** — deferred; the user will build it (D4).
- **Shared backend for multi-device demo** — open (D3).

### 💡 COULD (If Time Permits)
- Contractor Performance Leaderboard (% of fixes verified vs flagged).

### ❌ WON'T (Out of Scope)
- Live NADRA CNIC database verification (clean 1-click profiles used).
- Live Meta WhatsApp Business Cloud API approval pipeline (native Groups tab provides built-in community chat).
- Real digital escrow or banking disbursements (simulated via Mayor freeze toggle).
- Non-municipal legal issues (land grabbing, police FIRs, court disputes).
- Remote cloud database dependencies (100% reliable local storage persistence).

---

## Success Metrics
- **Filing Time:** 15 minutes of bureaucratic forms → **15 seconds** of natural Urdu voice + photo.
- **Ghost Closures:** Reduced by **85%** via AI Vision Before/After verification + mandatory citizen sign-off.
- **Routing Accuracy:** Automatic routing jumps from **40%** to **95%** across city departments (CDA, IESCO, WASA, SNGPL).
- **Duplicate Suppression:** Proximity detection aggregates redundant reports into verified community urgency metrics.

## Constraints & Environment
- **Framework:** Next.js 15 (App Router), TypeScript (strict), Tailwind CSS v3.4, Lucide icons.
- **Geo:** Vanilla `leaflet` wrapped in `useRef`, dynamically imported with `{ ssr: false }`. `L.divIcon()` with SVG templates.
- **AI:** Google Gemini via `@google/genai` (model from `GEMINI_MODEL`, default `gemini-3.5-flash`), server-side route handlers only.
- **Persistence:** Browser `localStorage` + seeded JSON. Zero database infrastructure overhead.
- **Offline:** 100% of hazard images stored locally in `public/images/hazards/`. Deterministic API fallbacks.
- **Target Device:** Mobile viewport (375px–430px) primary, desktop responsive.
