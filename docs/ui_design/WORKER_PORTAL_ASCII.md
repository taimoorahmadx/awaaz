# Worker Portal (آوازِ فیلڈ ورکر) - ASCII Wireframes & Layout Specs

This document defines the visual layout, screen hierarchy, and interaction flow for the **CDA Field Worker Portal** in Awaaz. This screen forms **Step 2 of the Golden Path**: field worker claims a priority hazard, uploads an "After" repair photo, triggers Gemini Vision verification, and submits for citizen sign-off.

---

## 1. Global Worker Shell Anatomy (Mobile Viewport: 390px - 430px)

```text
+-------------------------------------------------------------+
| [Logo: آواز] Worker Portal [📍 CDA Sanitation] [👷 Sajid ▾]  | <- Worker Header (h-14)
+-------------------------------------------------------------+
|                                                             |
|                                                             |
|                    ACTIVE WORKER SCREEN                     |
|                                                             |
|               (Queue   |   Home   |   Profile)              |
|                                                             |
|                                                             |
+-------------------------------------------------------------+
|     [ 📋 Queue ]          [ 🏠 Home ]        [ 👤 Profile ] | <- Bottom Nav (h-16, fixed)
+-------------------------------------------------------------+
```

---

## 2. Tab 1: Queue (Sector Pool / Open Complaints to Claim)
*Field worker browses unclaimed civic complaints in their assigned sector and claims them without waiting for a supervisor.*

```text
+-------------------------------------------------------------+
| آواز (Worker)       [📍 CDA Sanitation] [👷 Sajid ▾]   |
+-------------------------------------------------------------+
| Sector Pool: F-10 & F-6        | Status: 🟢 On Duty (Online)|
| Open Complaints: 3 Unclaimed in Sector                      |
+-------------------------------------------------------------+
| Filter: [ All (3) ] [ 🔴 Critical (1) ] [ 🟠 High (2) ]     |
+-------------------------------------------------------------+
| +---------------------------------------------------------+ |
| | [🔴 CRITICAL] #ISB-1042 • Sector F-10/2 (Main Double Rd)| |
| |                                                         | |
| | 🕳️ Open Manhole on Main Double Road                     | |
| | مین ڈبل روڈ پر گٹر کا کھلا ڈھکن                           | |
| | Reported by: Tariq (Shopkeeper) • 25 mins ago           | |
| | Distance: ~350m away from your location                 | |
| |                                                         | |
| | [ 📷 View Issue Photo ]         [ 🎧 Citizen Voice 0:14 ]| |
| |                                                         | |
| | +-----------------------------------------------------+ | |
| | |               ⚡ CLAIM THIS JOB                     | | | <- 1-tap claim moves to Home Tab
| | +-----------------------------------------------------+ | |
| +---------------------------------------------------------+ |
|                                                             |
| +---------------------------------------------------------+ |
| | [🟠 HIGH]     #ISB-1039 • Sector F-10/4 (Street 18)     | |
| | 💧 Broken Water Main Leak Flooding Road                 | |
| | Reported: 1h ago • 800m away                            | |
| | [ 📷 View Photo ]               [ ⚡ CLAIM THIS JOB ]   | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
|     [★ Queue ★]             [ 🏠 Home ]          [ 👤 Profile ] |
+-------------------------------------------------------------+
```

---

## 3. Tab 2: Home (The Operational Command Center)
*The worker's active cockpit: map view of assigned route + currently claimed job awaiting repair.*

```text
+-------------------------------------------------------------+
| آواز (Worker)       [📍 CDA Sanitation] [👷 Sajid ▾]   |
+-------------------------------------------------------------+
| My Active Jobs (1 In Progress) | Today's Goal: 4/4 Cleared  |
+-------------------------------------------------------------+
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
| ~ ~ ~ ~ ~ ~ [📍 You (Sajid Truck)] ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~|
| ~ ~ ~ ~ ~ ~ ~ ~ ~ \ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ \ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ | <- Route Map Canvas
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ [🔴 Job #ISB-1042: St 4] ~ ~ ~ ~ ~ ~ ~|    (Navigates to GPS)
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
+-------------------------------------------------------------+
| ACTIVE WORK ORDER:                                          |
| +---------------------------------------------------------+ |
| | [🔴 CRITICAL] #ISB-1042 • Sector F-10/2 (Main Double Rd)| |
| | 🕳️ Open Manhole Cover Replacement                       | |
| | Status: 🟡 In Progress (Claimed by You)                 | |
| | Landmark: Blue Gate, Corner of Street 4                 | |
| |                                                         | |
| | [ 🗺️ Open GPS Directions ]      [ ℹ️ View Original Report]| |
| |                                                         | |
| | +-----------------------------------------------------+ | |
| | |       📷 UPLOAD FIX PROOF & VERIFY REPAIR           | | | <- Opens Fix Proof Screen
| | +-----------------------------------------------------+ | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
|      [ 📋 Queue ]           [★ Home ★]           [ 👤 Profile ] |
+-------------------------------------------------------------+
```

---

## 4. Fix Verification Screen (Launched from Home Tab)
*Field worker uploads the "After" repair photo and runs AI Vision verification to lock the fix.*

### State A: Side-by-Side Photo Comparison & AI Trigger
```text
+-------------------------------------------------------------+
| [← Back to Home]      TICKET #ISB-1042       [ ℹ️ Details ] |
+-------------------------------------------------------------+
| 🕳️ Open Manhole Cover Replacement (Sector F-10/2)           |
| Department: CDA Sewerage & Sanitation                       |
+-------------------------------------------------------------+
|                                                             |
|  BEFORE (Reported Hazard)     |  AFTER (Worker Proof)       |
|  +-------------------------+  |  +------------------------+ |
|  | [📷 Citizen Photo:      |  |  | [📷 Repaired Photo:    | |
|  |  Open Dangerous Hole]   |  |  |  New Sealed Cover]     | |
|  |                         |  |  |                        | |
|  | Landmark: Blue Gate,    |  |  | [ 🔄 Retake ]          | |
|  | Corner of Street 4      |  |  | [ 🔍 Fullscreen ]      | |
|  +-------------------------+  |  +------------------------+ |
|                                                             |
| +---------------------------------------------------------+ |
| |    🤖 RUN AI VISION VERIFICATION (GEMINI 2.0 FLASH)     | | <- Worker Triggers AI
| +---------------------------------------------------------+ |
| *Runs server-side computer vision comparison against landmark*|
+-------------------------------------------------------------+
```

### State B1: AI Verdict Passed (Golden Path Success)
*Repair verified with high confidence; ready to submit for citizen confirmation.*

```text
+-------------------------------------------------------------+
| [← Back to Home]      TICKET #ISB-1042       [ ℹ️ Details ] |
+-------------------------------------------------------------+
|                                                             |
|  BEFORE vs AFTER COMPARISON:                                |
|  +---------------------------+---------------------------+  |
|  |       BEFORE (Hazard)     |       AFTER (Repaired)    |  |
|  | [ Photo: Open Hole ]      | [ Photo: Sealed Concrete] |  |
|  +---------------------------+---------------------------+  |
|                                                             |
| +---------------------------------------------------------+ |
| |  ✅ AI VERDICT: REPAIR VERIFIED (CONFIDENCE: 94%)       | | <- Vibrant Green Banner
| |                                                         | |
| |  AI Analysis Notes:                                     | |
| |  • New reinforced concrete slab securely covers hole.   | |
| |  • Surrounding asphalt restored cleanly.                | |
| |  • Background landmark (Blue gate & curb) matches.      | |
| +---------------------------------------------------------+ |
|                                                             |
|  Worker Field Notes (Optional):                             |
|  [ Heavy-duty grade 4 cover installed. Curing complete.   ] |
|                                                             |
| +---------------------------------------------------------+ |
| |     🚀 SUBMIT REPAIR FOR CITIZEN SIGN-OFF               | | <- Transitions ticket to
| +---------------------------------------------------------+ |    "Pending Community Sign-off"
|  (Tariq will receive notification to confirm fix)           |
+-------------------------------------------------------------+
```

### State B2: AI Verdict Rejected (Anti-Ghosting Safeguard)
*Simulated edge-case: worker uploads blurry photo or incomplete repair.*

```text
+-------------------------------------------------------------+
| [← Back to Home]      TICKET #ISB-1042       [ ℹ️ Details ] |
+-------------------------------------------------------------+
|                                                             |
| +---------------------------------------------------------+ |
| |  ❌ AI VERDICT: FIX REJECTED (CONFIDENCE: 38%)          | | <- Red Alert Banner
| |                                                         | |
| |  Reason for Rejection:                                  | |
| |  • Hazard still detected: Manhole remains uncovered.    | |
| |  • Background does not match Street 4 landmark.         | |
| |                                                         | |
| |  Action Required: Upload authentic photo of completed   | |
| |  repair showing the sealed cover and surrounding site.  | |
| +---------------------------------------------------------+ |
|                                                             |
| +---------------------------------------------------------+ |
| |            📷 RETAKE / UPLOAD NEW AFTER PHOTO           | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

---

## 5. Tab 3: Profile (Performance, Rewards & Verified Ledger)
*Field worker identity, anti-ghosting accuracy rating, and history of citizen-verified repairs.*

```text
+-------------------------------------------------------------+
| آواز (Worker)       [📍 CDA Sanitation] [👷 Sajid ▾]   |
+-------------------------------------------------------------+
|                                                             |
|  +--------+   Sajid Khan (ساجد خان)                         |
|  | (👷)   |   Senior Field Specialist • CDA Sewerage        |
|  +--------+   Assigned: Sector F-10 & F-6 | Status: 🟢 On Duty|
|                                                             |
|  PERFORMANCE & CIVIC IMPACT:                                |
|  +-----------------------------+--------------------------+ |
|  | ⭐ 98% AI Fix Accuracy      | ❤️ 142 Citizen Thanks    | |
|  | (0 Flagged Ghost Closures)  | (+1 Verified Sign-offs)  | |
|  +-----------------------------+--------------------------+ |
|  | ⚡ 38m Avg. Fix Speed       | 🏆 Rank #2 in Zone-1     | |
|  | (CDA Benchmark: 4h)         | (Islamabad Urban Pilot)  | |
|  +-----------------------------+--------------------------+ |
|                                                             |
|  TODAY'S SHIFT SUMMARY:                                     |
|  [ Progress: 4 of 4 Hazards Cleared Today (100%) ==========]|
|                                                             |
|  RECENT VERIFIED WORK LEDGER:                               |
|  +--------------------------------------------------------+ |
|  | 🕳️ Open Manhole (F-10/2)            • Completed 25m ago | |
|  | [📷 Before/After] Verified by Tariq  • Status: 🟢 Resolved| |
|  +--------------------------------------------------------+ |
|  | 💧 Water Leak (F-10/4)              • Completed 2h ago  | |
|  | [📷 Before/After] Awaiting Sign-off • Status: 🟡 In Sign| |
|  +--------------------------------------------------------+ |
|                                                             |
+-------------------------------------------------------------+
|      [ 📋 Queue ]           [ 🏠 Home ]          [★ Profile ★]|
+-------------------------------------------------------------+
```

---

## 6. Key Implementation Rules for AI Agents

1. **Role Context**: Activated when active profile is switched to `CDA Field Worker (Sajid)` in the global header.
2. **Dispatch Without Middleman**: Open hazards in the worker's sector are listed in `Queue` and can be claimed with 1 tap (`REPORTED` ➔ `IN_PROGRESS`), moving them to `Home`.
3. **Before / After Payload**: Both photos are forwarded to `/api/verify-fix` as base64 data URIs.
4. **Ghost Closure Prevention**: Field worker **cannot** mark ticket `Resolved` directly. Worker submission only moves ticket to `Pending Community Sign-off` (`PENDING_COMMUNITY_VERIFICATION`). Final resolution belongs exclusively to the citizen.
5. **Offline Fallback**: If offline or API fails, deterministic mock returns verified fixture within `<300ms>` with fallback banner.
