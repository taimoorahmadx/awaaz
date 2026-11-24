# Citizen Portal (آواز) - ASCII Wireframes & Layout Specs

This document defines the exact visual layout, component hierarchy, and interaction flow for the **Citizen Portal** in Awaaz. AI coding agents should strictly adhere to this layout structure without inventing unapproved components or navigation paradigms.

---

## 1. Global Shell & Navigation Anatomy (Mobile Viewport: 390px - 430px)

```text
+-------------------------------------------------------------+
| [Logo: آواز] Awaaz             Islamabad (F-10)    [👤 Tariq ▾]  | <- Sticky Header (h-14)
+-------------------------------------------------------------+
|                                                             |
|                                                             |
|                       ACTIVE TAB SCREEN                     |
|                                                             |
|                (Home / Explore / Map / Reports / Groups)    |
|                                                             |
|                                                             |
+-------------------------------------------------------------+
|  [ 📰 ]      [ 🗺️ ]      [ 🎙️/✨ ]      [ 📋 ]      [ 👥 ]  | <- Bottom Nav (h-16, fixed)
| Explore        Map          Home       My Reports    Groups |
+-------------------------------------------------------------+
```

---

## 2. Tab 3: Home (Center Hero - WhatsApp / ChatGPT Style Intake)
*Clean conversational bot interface: unified input bar with attachments, text box, and mic.*

### State A: Idle / Welcoming (Initial View)
```text
+-------------------------------------------------------------+
| آواز (Awaaz)         Islamabad (F-10)     [👤 Tariq ▾]   |
+-------------------------------------------------------------+
| [⚡ Offline: Local Sync Active]                              |
|                                                             |
|                                                             |
|                         +---------+                         |
|                         |  (🤖)   |                         |
|                         |  Awaaz  |                         |
|                         +---------+                         |
|                                                             |
|                 السلام علیکم طارق بھائی! 👋                  |
|               How can I help you today?                     |
|                                                             |
|                                                             |
|                                                             |
|                                                             |
|                                                             |
|                                                             |
|                                                             |
|                                                             |
| +---------------------------------------------------------+ |
| | [ ➕ ]  | Describe issue in Urdu or English...   [ 🎙️ ] | | <- Unified input bar
| +---------------------------------------------------------+ |
|  ( ➕ opens Photo / GPS Pin ) ( 🎙️ tap/hold for Urdu audio )|
+-------------------------------------------------------------+
|  [ 📰 ]      [ 🗺️ ]      [ 🎙️/✨ ]      [ 📋 ]      [ 👥 ]  |
| Explore        Map        ★ Home ★     My Reports    Groups |
+-------------------------------------------------------------+
```

### State B: Active Conversation & Structured AI Triage Result
```text
+-------------------------------------------------------------+
| آواز (Awaaz)         Islamabad (F-10)     [👤 Tariq ▾]   |
+-------------------------------------------------------------+
|                                                             |
| [🤖 Awaaz Bot]:                                             |
| "السلام علیکم! What hazard or issue would you like to report?"|
|                                                             |
|                        [👤 You - Voice Note + Photo]:       |
|                        +----------------------------------+ |
|                        | [ 📷 Attached: broken_cover.jpg ]| |
|                        | ▶ ||||||||||||||||||||||| 0:14 🔊 | |
|                        +----------------------------------+ |
|                                                             |
| [🤖 Awaaz AI - Triage Complete]:                            |
| +---------------------------------------------------------+ |
| | 🎫 TICKET #ISB-1042 CREATED                             | |
| | Urgency: 🔴 CRITICAL        Dept: CDA Sewerage          | |
| | Issue: مین ڈبل روڈ پر گٹر کا کھلا ڈھکن                  | |
| | Location: Street 4, F-10/2 Islamabad (Auto-Pinned 📍)   | |
| |                                                         | |
| | [ 📋 Track in My Reports ➔ ]   [ 🗺️ View on Map ]       | |
| +---------------------------------------------------------+ |
|                                                             |
| +---------------------------------------------------------+ |
| | [ ➕ ]  | Type reply or report another hazard...  [ 🎙️ ] | | <- Unified bar
| +---------------------------------------------------------+ |
| *While recording: bar morphs to [ ❌ ] 🔴 00:14 |||||||| [ 🚀 ]|
+-------------------------------------------------------------+
|  [ 📰 ]      [ 🗺️ ]      [ 🎙️/✨ ]      [ 📋 ]      [ 👥 ]  |
| Explore        Map        ★ Home ★     My Reports    Groups |
+-------------------------------------------------------------+
```

### State C: Duplicate Issue Detected in Chat Stream (AC-11.1)
*Conversational deduplication prompt when filing near an existing complaint.*

```text
+-------------------------------------------------------------+
| آواز (Awaaz)         Islamabad (F-10)     [👤 Tariq ▾]   |
+-------------------------------------------------------------+
|                                                             |
|                        [👤 You - Voice Note]:                |
|                        +----------------------------------+ |
|                        | ▶ ||||||||||||||||||||||| 0:11 🔊 | |
|                        +----------------------------------+ |
|                                                             |
| [🤖 Awaaz AI - Duplicate Detected Nearby]:                  |
| +---------------------------------------------------------+ |
| | ⚠️ SIMILAR COMPLAINT FOUND NEARBY (~25m away):           | |
| | Ticket #ISB-1042: Open Manhole on Main Double Road       | |
| | Reported by Usman (Shopkeeper) • 20 mins ago            | |
| |                                                         | |
| | Would you like to boost this existing ticket's urgency, | |
| | or submit a separate new ticket?                        | |
| |                                                         | |
| | +-----------------------------------------------------+ | |
| | |    ⚡ +1 IMPACTS ME TOO (Boost Ticket Urgency)       | | | <- Merges & boosts score
| | +-----------------------------------------------------+ | |
| | |    📝 Submit as a Separate New Ticket                | | |
| | +-----------------------------------------------------+ | |
| +---------------------------------------------------------+ |
|                                                             |
| +---------------------------------------------------------+ |
| | [ ➕ ]  | Type message in Urdu or English...     [ 🎙️ ] | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
|  [ 📰 ]      [ 🗺️ ]      [ 🎙️/✨ ]      [ 📋 ]      [ 👥 ]  |
| Explore        Map        ★ Home ★     My Reports    Groups |
+-------------------------------------------------------------+
```

---

## 3. Tab 1: Explore (Public Town Square Feed)
*Community verification, upvoting, and neighborhood transparency*

```text
+-------------------------------------------------------------+
| آواز (Awaaz)         Islamabad (F-10)     [👤 Tariq ▾]   |
+-------------------------------------------------------------+
| Sector Filter: [ All ] [★ F-10 ] [ F-6 ] [ G-9 ] [ I-9 ]    | <- Horizontal pill scroll
| Urgency: [ All ] [ 🔴 Critical ] [ 🟠 High ] [ 🟢 Resolved ] |
+-------------------------------------------------------------+
| +---------------------------------------------------------+ |
| | [🔴 CRITICAL]  [CDA Sewerage]   Sector F-10/2 • 15m ago  | |
| |                                                         | |
| | 🕳️ Open Manhole on Main Double Road                     | |
| | مین ڈبل روڈ پر گٹر کا کھلا ڈھکن                           | |
| |                                                         | |
| | [ ▶ Play Urdu Voice Note: 0:14 ────────●───── 🔊 ]      | | <- Audio note player
| |                                                         | |
| | +-----------------------------------------------------+ | |
| | | [ Hazard Photo Thumbnail: Damaged Manhole Cover ]   | | |
| | +-----------------------------------------------------+ | |
| |                                                         | |
| | Status: 🟡 In Progress (CDA Team Dispatched)            | |
| |                                                         | |
| | [ ▲ 42 Upvotes ▼ ]    [ 💬 9 Comments ▾ ]   [ 🔗 Share ]| | <- Interaction bar
| | ────────────────────────────────────────────────────────| |
| | 💬 Comments (Simple flat Facebook/Instagram style):      | |
| |  👤 Ayesha: "Informing CDA hotline as well." • 12m ago   | |
| |  👤 Bilal: "Saw two cars swerve around it earlier." • 5m | |
| |  [ Add a comment...                               ] [➤] | | <- Simple flat input
| +---------------------------------------------------------+ |
|                                                             |
| +---------------------------------------------------------+ |
| | [🟢 RESOLVED]  [IESCO Power]    Sector F-10/4 • 2h ago  | |
| | ⚡ Loose Hanging High-Tension Wire Repaired              | |
| | Status: 🟢 Fixed & Verified by Community (14 confirms)  | |
| | [ ▲ 88 Upvotes ▼ ]   [ 💬 14 Comments ]  [ 📷 View Fix ]| |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
|  [ 📰 ]      [ 🗺️ ]      [ 🎙️/✨ ]      [ 📋 ]      [ 👥 ]  |
|★ Explore ★     Map          Home       My Reports    Groups |
+-------------------------------------------------------------+
```

---

## 4. Tab 2: Map View (Leaflet Spatial Civic Health & Issue Map)
*Interactive map with urgency pins, sector civic health overlays, and slide-up complaint drawer*

```text
+-------------------------------------------------------------+
| آواز (Awaaz)         Islamabad (F-10)     [👤 Tariq ▾]   |
+-------------------------------------------------------------+
| [ 🔍 Search Street / Sector... ]    [ Layer: Density / Pins ]|
| Civic Health: [ F-10: Grade B+ (84/100) ] [ F-6: Grade A ]  |
+-------------------------------------------------------------+
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
| ~ ~ ~ ~ ~ ~ [🔴 F-10/2 Open Manhole] ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~|
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ [🟡 Garbage Dump St 8] ~ ~ ~ ~ ~ ~| <- Interactive Map Canvas
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |    (OpenStreetMap / Leaflet)
| ~ ~ ~ ~ ~ ~ [🟢 Fixed: Repaired Water Pipe] ~ ~ ~ ~ ~ ~ ~ ~ |
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
+-------------------------------------------------------------+
| ▲ SLIDE-UP DRAWER (Selected Pin: F-10/2 Manhole)            |
| +---------------------------------------------------------+ |
| | 🔴 Critical • CDA Sewerage • Reported by Tariq           | |
| | Open Manhole on Main Double Road (St 4)                 | |
| | [ 📷 View Photo ]  [ 🎧 Play Urdu Note ] [ 🚀 Directions ]| |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
|  [ 📰 ]      [ 🗺️ ]      [ 🎙️/✨ ]      [ 📋 ]      [ 👥 ]  |
| Explore       ★ Map ★       Home       My Reports    Groups |
+-------------------------------------------------------------+
```

---

## 5. Tab 4: My Reports (Lifecycle Stepper & Citizen Fix Sign-Off)
*Golden Path Step 3: Citizen verifies fix submitted by municipal worker*

```text
+-------------------------------------------------------------+
| آواز (Awaaz)         Islamabad (F-10)     [👤 Tariq ▾]   |
+-------------------------------------------------------------+
| My Submissions (3 Total • 1 Pending Your Sign-off)          |
+-------------------------------------------------------------+
| +---------------------------------------------------------+ |
| | TICKET #ISB-1042: Open Manhole Cover (F-10/2)           | |
| |                                                         | |
| | LIFECYCLE PROGRESS:                                     | |
| | [✔ Reported] -> [✔ In Progress] -> [🟡 AWAITING YOU] -> [○]|
| |                                                         | |
| | WORKER REPAIR PROOF SUBMITTED:                          | |
| | +---------------------------+-------------------------+ | |
| | |       BEFORE (Reported)   |     AFTER (Worker Fix)  | | |
| | | [ Photo: Dangerous Hole ] | [ Photo: Sealed Concrete]| | |
| | +---------------------------+-------------------------+ | |
| |                                                         | |
| | 🤖 AI Verification Verdict:                             | |
| | [ ✔ AI Confirmed: 94% Confidence - Safe ]               | |
| |                                                         | |
| | CITIZEN SIGN-OFF (CONFIRM THE FIX):                     | |
| | +-----------------------------------------------------+ | |
| | |  ✅ +1 CONFIRM FIX (VERIFIED RESOLVED)               | | | <- Transitions ticket to vibrant green
| | +-----------------------------------------------------+ | |
| | |  ❌ Flag Issue Still Persists                        | | |
| | +-----------------------------------------------------+ | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
|  [ 📰 ]      [ 🗺️ ]      [ 🎙️/✨ ]      [ 📋 ]      [ 👥 ]  |
| Explore        Map          Home     ★ My Reports ★  Groups |
+-------------------------------------------------------------+
```

---

## 6. Tab 5: Groups (گروپس - Hyper-Local Community Civic Hub)
*Local neighborhood discussions & 1-tap "Convert to Ticket"*

```text
+-------------------------------------------------------------+
| آواز (Awaaz)         Islamabad (F-10)     [👤 Tariq ▾]   |
+-------------------------------------------------------------+
| Channels: [ # F-10/2 Residents ★ ] [ 💧 Water Watch ] [ ⚡ IESCO ]|
+-------------------------------------------------------------+
| [Chat Stream - # F-10/2 Residents]                          |
|                                                             |
| [👤 Usman (Neighbor) - 10:42 AM]:                           |
| "Street 18 streetlights have been flickering for 2 nights." |
|                                                             |
| [👤 Ayesha - 11:05 AM]:                                     |
| "Water supply was cut off this morning in block B."         |
| [ 🎧 Urdu Voice Note: 0:09 ]                                |
| [ ⚡ 1-Tap: Convert to Municipal Ticket ]                    | <- 1-tap civic action
|                                                             |
| [🤖 Awaaz Civic Bot - 11:10 AM]:                            |
| "Ticket #ISB-1048 created for WASA Water Supply (Block B)." |
+-------------------------------------------------------------+
| [ 📎 ] [ Type message in Urdu or English...       ] [ 🎙️ ] [ 🚀]|
+-------------------------------------------------------------+
|  [ 📰 ]      [ 🗺️ ]      [ 🎙️/✨ ]      [ 📋 ]      [ 👥 ]  |
| Explore        Map          Home       My Reports   ★ Groups ★|
+-------------------------------------------------------------+
```

---

## Key Design Constraints for AI Agents

1. **Max Viewport Width**: Container must be mobile-first constrained (`max-w-md mx-auto`) with responsive desktop centering.
2. **Bottom Navigation**: Always fixed at the bottom (`z-50`), with 5 tabs. Tab 3 (Home) is elevated/highlighted as the primary action.
3. **Sticky Global Header**: Contains branding, subtle sector badge (`Islamabad (F-10)`), evaluator role switcher (`[👤 Tariq ▾]`), and network/offline sync indicator.
4. **Urgency Color Coding**:
   - 🔴 **Critical**: High-contrast red (`bg-red-500`, `text-red-50`)
   - 🟠 **High**: Amber/Orange (`bg-amber-500`, `text-amber-50`)
   - 🟡 **Medium / In Progress**: Yellow/Slate (`bg-yellow-500`)
   - 🟢 **Resolved**: Emerald green (`bg-emerald-600`, `text-emerald-50`)
