# Awaaz (آواز) — Pitch Deck Content

Edit any slide below, then tell me to sync it into `pitch-deck.html`.

---

## Slide 1 — Cover
- **Title:** Awaaz آواز
- **Subtitle:** AI Civic Governance Platform
- **Tag:** Track 5 – Urdu & Regional Tech
- **Visual:** the awaaz logo


---

## Slide 2 — The Problem
- **Kicker:** 01 • The Problem
- **Cards (Photo + Stat + Source):**
  1. **27** — *Open Manhole Deaths (2025)* (`public/images/hazards/open-manhole.jpg`): Karachi alone — including 22+ children. — *Source: The Express Tribune (2025)*
  2. **35** — *Monsoon Electrocutions* (`public/images/hazards/live-wire.jpg`): Killed in one Karachi monsoon (19 utility failures). — *Source: NEPRA / The Express Tribune*
  3. **30–40%** — *Uncollected Urban Waste* (`public/images/hazards/garbage-heap.jpg`): Left on streets, choking drains & worsening floods. — *Source: SSWMB / The Express Tribune*

---

## Slide 3 — Why Current Systems Fail
- **Headline:** 02 • Why Current Systems Fail
- **Cards:**
  1. **~99%** — *"Resolved" on Paper (Pakistan Citizen Portal)*: 6M+ complaints logged, long English forms, and tickets marked “closed” with zero visual proof. — *Source: Pakistan Citizen Portal Reports*
  2. **0 Tracking** — *Random WhatsApp Groups*: Citizens have nowhere to raise their voice — reports get buried in chats with no GPS pins, no duplicate merging, and no follow-up.
  3. **Sifarish** — *Connections Over Urgency*: Repairs get prioritized by who you know instead of hazard severity — leaving ordinary citizens unheard.

---

## Slide 4 — Awaaz App (Demo Launchpad)
- **Headline:** 03 • Awaaz App
- **Subtitle:** One AI-powered civic loop connecting three portals:
  1. **Citizen** — Urdu voice intake & sign-off
  2. **Field Worker** — AI Before/After repair proof
  3. **Mayor Desk** — Civic Health & payout freezes
- **Visual:** `images/app-home.jpg` (live chatbot UI)
- **Live Link & QR:** `https://try-awaaz.vercel.app/` (`images/qrcode_try-awaaz.vercel.app.png`)

---

## Slide 5 — System Architecture
- **Headline:** 04 • System Architecture
- **Diagram:**
  - **Client Layer (Next.js 15 PWA):** Citizen • Worker • Mayor | Trilingual UI (EN / اردو / Roman) | Leaflet Map (SSR-off) | MediaRecorder & Image Compressor | 50m Duplicate Detection
  - **Client Persistence:** Browser `localStorage` + Seeded Islamabad JSON (Event-synced across all 3 portals)
  - **Server Layer (Route Handlers):** `POST /api/intake-chat`, `POST /api/analyze-audio`, `POST /api/verify-fix` → Zod Fail-Closed Validation + `<300ms` Offline Fallback
  - **External Services:** **Groq** (`whisper-large-v3`, `gpt-oss-120b`, `qwen3.8-27b`) + **OpenStreetMap Tile Server**

---

## Slide 6 — Nationwide Scale
- **Headline:** 05 • Nationwide Scale
- **Subtitle:** From Islamabad pilot to every city in Pakistan.
- **Rollout:**
  - **Now:** Islamabad Pilot — CDA, IESCO, WASA, SNGPL
  - **Next:** Provincial Capitals & Metros
  - **Scale:** Every Municipal Body
- **Visual:** `images/pakistan-map.jpg` (dark-mode Pakistan network map)

