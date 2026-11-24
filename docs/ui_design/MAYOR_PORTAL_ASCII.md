# Mayor Portal (آوازِ ناظم / ایڈمن) - ASCII Wireframes & Layout Specs

This document defines the layout, screen hierarchy, and governance workflow for the **Mayor & Chief Municipal Commissioner Portal** in Awaaz. This portal provides executive city oversight, live spatial heatmaps, emergency escalations, department performance tracking, and anti-ghosting contractor audits.

---

## 1. Global Mayor Shell Anatomy (Mobile Viewport: 390px - 430px)

```text
+-------------------------------------------------------------+
| [Logo: آواز] Mayor Portal   Islamabad         [🏛️ Comm. Nasir ▾]    | <- Mayor Header (h-14)
+-------------------------------------------------------------+
|                                                             |
|                                                             |
|                     ACTIVE MAYOR SCREEN                     |
|                                                             |
|          (Map  |  Alerts  |  Home  |  Depts  |  Contractors)|
|                                                             |
|                                                             |
+-------------------------------------------------------------+
| [ 🗺️ Map ]  [ 🚨 Alerts ]  ★[ 🏛️ Home ]★  [ 🏢 Depts ]  [ 🛡️ Contrs ] | <- Symmetrical 5 Tabs
+-------------------------------------------------------------+
```

---

## 2. Tab 1: Map (Citywide Visual Heatmap & Hotspot Clusters)
*Visual spatial intelligence: color-coded heatmap showing civic health and problem clusters across the city.*

```text
+-------------------------------------------------------------+
| آواز (Mayor Portal)   Islamabad          [🏛️ Comm. Nasir ▾]     |
+-------------------------------------------------------------+
| [ 🔍 Search Street / Area... ]      [ Layer: Heatmap / Pins ]|
| Heatmap: 🟢 Healthy (80-100)  🟡 Moderate (60-79)  🔴 Hotspot|
+-------------------------------------------------------------+
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
| ~ ~ ~ [🟢 F-6 Area: 94%] ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~|
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ | <- Interactive City
| ~ ~ ~ [🟢 F-10 Area: 86%] ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |    Heatmap Canvas
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ [🔴 HOTSPOT: G-9 (62%)] ~ ~ ~ |
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
+-------------------------------------------------------------+
| ▲ TAP ON HOTSPOT (G-9 Karachi Company Cluster):             |
| +---------------------------------------------------------+ |
| | 🔴 Severe Problem Cluster: 7 Unresolved Complaints       | |
| | Issues: 4 Trash Heaps, 2 Water Leaks, 1 Dark Streetlight| |
| |                                                         | |
| | [ ⚡ DISPATCH EMERGENCY CLEANUP SQUAD ] [ ℹ️ View List ] | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
|★[ 🗺️ Map ]★ [ 🚨 Alerts ]   [ 🏛️ Home ]   [ 🏢 Depts ]  [ 🛡️ Contrs ] |
+-------------------------------------------------------------+
```

---

## 3. Tab 2: Alerts (Critical Escalations & Broadcast Desk)
*Emergency command: manage overdue critical hazards (>2h) and broadcast emergency alerts to citizens.*

```text
+-------------------------------------------------------------+
| آواز (Mayor Portal)   Islamabad          [🏛️ Comm. Nasir ▾]     |
+-------------------------------------------------------------+
| CRITICAL ESCALATIONS (4 OVERDUE HAZARDS REQUIRING ACTION):   |
+-------------------------------------------------------------+
| +---------------------------------------------------------+ |
| | 🔴 OVERDUE: TICKET #ISB-1042 • CDA Sewerage (F-10/2)    | |
| | 🕳️ Open Manhole on Main Double Road (Reported 45m ago)  | |
| | Assigned: Sajid Khan (Field Worker) • In Progress       | |
| | [ 📞 Call Field Supervisor ]      [ 🚀 Priority Escalate]| |
| +---------------------------------------------------------+ |
|                                                             |
| +---------------------------------------------------------+ |
| | 🔴 OVERDUE: TICKET #ISB-1033 • IESCO Power (I-9 Industrial| |
| | ⚡ High-Tension Wire Dangling Near School Gate           | |
| | Overdue by: 1h 20m • Risk: Extreme Danger               | |
| | [ 🚨 Dispatch Rapid Emergency Crew Immediately ]        | |
| +---------------------------------------------------------+ |
|                                                             |
| PUBLIC EMERGENCY BROADCAST:                                 |
| +---------------------------------------------------------+ |
| | 📢 BROADCAST EMERGENCY CIVIC NOTICE TO ALL CITIZENS     | |
| | (Sends push alert to Citizen Portal & Group Channels)   | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
| [ 🗺️ Map ] ★[ 🚨 Alerts ]★  [ 🏛️ Home ]   [ 🏢 Depts ]  [ 🛡️ Contrs ] |
+-------------------------------------------------------------+
```

---

## 4. Tab 3: Home (The Executive Command Center - Center Hero)
*The Mayor's morning dashboard: citywide health score, daily KPIs, and operations pulse.*

```text
+-------------------------------------------------------------+
| آواز (Mayor Portal)   Islamabad          [🏛️ Comm. Nasir ▾]     |
+-------------------------------------------------------------+
| ISLAMABAD CIVIC HEALTH SCORE: 🟢 86/100 (Grade B+)          |
| Today's Operations: 126 of 148 Complaints Resolved (85.1%)  |
+-------------------------------------------------------------+
| EXECUTIVE KPI SUMMARY (PAST 24 HOURS):                      |
| +-----------------------------+---------------------------+ |
| | 📥 148 Total Filed          | 🟢 126 Verified Fixed     | |
| | (+18% vs Yesterday)         | (Citizen + AI Verified)   | |
| +-----------------------------+---------------------------+ |
| | 🟡 18 In Progress           | 🔴 4 Critical Escalations | |
| | (Field Teams Active)        | (Overdue >2h • Action Req)| |
| +-----------------------------+---------------------------+ |
|                                                             |
| QUICK CITY HEALTH METRICS:                                  |
| • Sanitation & Cleanliness:   88% [===================---]  |
| • Streetlights & Power:       94% [=====================--]  |
| • Water & Sewage:             72% [===============-------]  |
| • Roads & Infrastructure:     68% [==============--------]  |
|                                                             |
| QUICK SHORTCUTS:                                            |
| [ 🗺️ View Problem Heatmap ]      [ 🛡️ Review Contractor Audit ]|
+-------------------------------------------------------------+
| [ 🗺️ Map ]  [ 🚨 Alerts ]  ★[ 🏛️ Home ]★  [ 🏢 Depts ]  [ 🛡️ Contrs ] |
+-------------------------------------------------------------+
```

---

## 5. Tab 4: Depts (Department Performance & SLA Leaderboard)
*Compares municipal agency response times, holdouts, and resolution efficiency.*

```text
+-------------------------------------------------------------+
| آواز (Mayor Portal)   Islamabad          [🏛️ Comm. Nasir ▾]     |
+-------------------------------------------------------------+
| Timeframe: [★ Today ]  [ This Week ]  [ This Month ]        |
+-------------------------------------------------------------+
| MUNICIPAL AGENCY LEADERBOARD (Ranked by SLA & Verification):|
|                                                             |
| 1. ⚡ IESCO (Power & Streetlights)             [ Rank #1 🥇 ]|
| +---------------------------------------------------------+ |
| | Complaints: 42             | Resolved: 40 (95.2%)       | |
| | Avg. Fix Time: 42 mins     | SLA Compliance: 97%        | |
| | Status: 🟢 Exceptional Performance                      | |
| +---------------------------------------------------------+ |
|                                                             |
| 2. 🕳️ CDA Sanitation & Sewerage                [ Rank #2 🥈 ]|
| +---------------------------------------------------------+ |
| | Complaints: 58             | Resolved: 51 (87.9%)       | |
| | Avg. Fix Time: 1h 45m      | SLA Compliance: 89%        | |
| | Status: 🟢 Solid Operation (1 Escalation Open)          | |
| +---------------------------------------------------------+ |
|                                                             |
| 3. 💧 WASA (Water Supply & Drainage)          [ Rank #3 ⚠️ ]|
| +---------------------------------------------------------+ |
| | Complaints: 32             | Resolved: 24 (75.0%)       | |
| | Avg. Fix Time: 3h 10m      | SLA Compliance: 74%        | |
| | Status: 🟡 Warning: Tanker/Drainage response lagging    | |
| | [ ⚡ Issue Performance Notice to WASA Director ]        | |
| +---------------------------------------------------------+ |
|                                                             |
| 4. 🔥 SNGPL (Gas Supply & Pressure)           [ Rank #4 ⚠️ ]|
| +---------------------------------------------------------+ |
| | Complaints: 16             | Resolved: 11 (68.7%)       | |
| | Avg. Fix Time: 4h 30m      | Low winter pressure spikes | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
| [ 🗺️ Map ]  [ 🚨 Alerts ]   [ 🏛️ Home ]  ★[ 🏢 Depts ]★ [ 🛡️ Contrs ] |
+-------------------------------------------------------------+
```

---

## 6. Tab 5: Contractors (Anti-Ghosting & Fraud Prevention Ledger)
*Guarantees accountability: catches fake repairs rejected by AI Vision and citizens, and protects taxpayer payouts.*

```text
+-------------------------------------------------------------+
| آواز (Mayor Portal)   Islamabad          [🏛️ Comm. Nasir ▾]     |
+-------------------------------------------------------------+
| CONTRACTOR INTEGRITY & ANTI-GHOSTING AUDIT:                 |
| +-----------------------------+---------------------------+ |
| | 🛡️ 95.8% Fix Integrity      | 🚫 6 Fake Claims Blocked  | |
| | (Confirmed by AI + Citizens)| (Saved from Payouts)      | |
| +-----------------------------+---------------------------+ |
| | 💰 ₨ 240,000 Protected      | ⚠️ 1 Contractor Under Audit| |
| | (Taxpayer Funds Preserved)  | (Apex Road Infrastructure)| |
| +-----------------------------+---------------------------+ |
|                                                             |
| FLAGGED AUDIT INCIDENTS (REQUIRING MAYOR ACTION):           |
| +---------------------------------------------------------+ |
| | 🚨 CONTRACTOR FRAUD FLAGGED • #ISB-1028                 | |
| | Contractor: Apex Infra Ltd • Pothole Patching (Zone-1)  | |
| |                                                         | |
| | 🤖 AI Vision Verdict: ❌ REJECTED (Confidence: 34%)     | |
| | Reason: "Pothole still visible. Photo taken from angle  | |
| | without new asphalt cover. Landmark curb does not match"| |
| |                                                         | |
| | 👤 Citizen Sign-Off: ❌ Disapproved by Tariq           | |
| | Tariq: "Pothole is still there, worker only took photo" | |
| |                                                         | |
| | Mayor Executive Action:                                 | |
| | [ 🛑 FREEZE CONTRACTOR PAYOUT ]   [ 📝 ISSUE PENALTY ]  | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
| [ 🗺️ Map ]  [ 🚨 Alerts ]   [ 🏛️ Home ]   [ 🏢 Depts ] ★[ 🛡️ Contrs ]★|
+-------------------------------------------------------------+
```

---

## 7. Key Implementation Rules for AI Agents

1. **Role Context**: Activated when selecting `City Dashboard / Mayor (Comm. Nasir)` in the global top header role dropdown.
2. **Tab Sequence & Hierarchy**:
   - `Tab 1: [ 🗺️ Map ]` — Situational awareness (Spatial citywide problem heatmap).
   - `Tab 2: [ 🚨 Alerts ]` — Immediate tactical action (Critical overdue escalations & emergency broadcasts).
   - `Tab 3: ★ [ 🏛️ Home ] ★` — Strategic command center (Macro city pulse & 24h executive KPIs).
   - `Tab 4: [ 🏢 Depts ]` — Institutional management (Agency performance leaderboard & SLAs).
   - `Tab 5: [ 🛡️ Contrs ]` — Public integrity oversight (Contractor anti-ghosting ledger & payout freeze).
3. **Heatmap View**: Uses dynamic Leaflet overlay to show citywide issue density clusters without requiring manual sector-by-sector lists.
4. **Anti-Ghosting Fraud Showcase**: The `Contractors` tab pulls tickets where `aiVerification.passed === false` or `status === "IN_PROGRESS"` with worker rejected attempts, demonstrating the anti-corruption mechanism to judges.
5. **Executive Authority**: Simulated actions ("Freeze Payout", "Issue Penalty", "Broadcast Alert") showcase municipal command and executive accountability.
