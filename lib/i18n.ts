import { categoryInfo } from "@/lib/categories";
import type { Complaint, Department, IssueCategory, TicketStatus, Urgency } from "@/lib/types";

export type Language = "en" | "ur" | "roman";

export const LANGUAGE_OPTIONS: { id: Language; label: string; nativeLabel: string }[] = [
  { id: "en", label: "EN", nativeLabel: "English" },
  { id: "ur", label: "اردو", nativeLabel: "اردو" },
  { id: "roman", label: "Roman", nativeLabel: "Roman Urdu" },
];

export interface Translations {
  appName: string;
  offlineBadge: string;
  allSectors: string;
  switchRoleAria: (name: string, label: string) => string;
  switchDemoRole: string;
  resetSystemData: string;
  resetSuccess: string;
  languageLabel: string;
  nav: {
    explore: string;
    map: string;
    home: string;
    reports: string;
    groups: string;
  };
  departments: Record<Department, string>;
  urgencies: Record<Urgency, string>;
  statuses: Record<TicketStatus, string>;
  categories: Record<IssueCategory, string>;
  home: {
    greeting: (name: string) => string;
    subtitle: string;
    micPrompt: string;
    recordingPrompt: string;
    analyzingPrompt: string;
    placeholder: string;
    sendComplaint: string;
    attachPhoto: string;
    removePhoto: string;
    startVoice: string;
    stopVoice: string;
    duplicateDetected: string;
    impactsMeToo: string;
    submitSeparate: string;
    ticketFiled: string;
    viewInReports: string;
    reportAnother: string;
    locationLabel: string;
    chatSubtitle: string;
    generateTicket: string;
    updateTicket: string;
    generatingTicket: string;
    thinkingReply: string;
    draftBadge: string;
    editDetails: string;
    doneEditing: string;
    approveSubmit: string;
    discardDraft: string;
    clearChat: string;
    titleLabel: string;
    descriptionLabel: string;
    categoryLabel: string;
    departmentLabel: string;
    urgencyLabel: string;
    sectorLabel: string;
    landmarkLabel: string;
    replacePhoto: string;
    removeAttachedPhoto: string;
    addPhoto: string;
    voiceNoteBadge: string;
    editTip: string;
  };
  feed: {
    title: string;
    all: string;
    mySector: string;
    critical: string;
    resolved: string;
    empty: string;
    confirmFix: string;
    confirmed: string;
    impactsMeToo: string;
    impacted: string;
    viewDetails: string;
    aiVerified: string;
    comments: string;
    addComment: string;
    postComment: string;
  };
  map: {
    legendTitle: string;
    openDetails: string;
    reportedBy: string;
  };
  groups: {
    title: string;
    subtitle: string;
    members: string;
    officialNotice: string;
    convertToTicket: string;
    messagePlaceholder: string;
    send: string;
    back: string;
  };
  reports: {
    title: string;
    subtitle: string;
    empty: string;
    lifecycle: string;
  };
  worker: {
    queueTab: string;
    homeTab: string;
    profileTab: string;
    claimTicket: string;
    claimed: string;
    uploadAfter: string;
    verifyFix: string;
    verifying: string;
    aiVerified: string;
    aiRejected: string;
    openInMaps: string;
    noAssigned: string;
    noQueue: string;
    allDepts: string;
    noDeptQueue: string;
    overdue: string;
    hoursLeft: (h: number) => string;
    activeJobs: (n: number) => string;
    awaitingSignOff: (n: number) => string;
    unclaim: string;
    before: string;
    after: string;
    noPhotoAttached: string;
    uploadFix: string;
    changePhoto: string;
    fixNotePlaceholder: string;
    markFixed: string;
    verifyFixBtn: string;
    onDuty: string;
    aiApproval: string;
    resolvedCount: string;
    totalAssigned: string;
    currentWorkload: string;
    pendingSignOff: string;
    assignmentDetails: string;
    department: string;
    assignedZone: string;
    shiftHours: string;
  };
  mayor: {
    scorecardTab: string;
    contractorsTab: string;
    alertsTab: string;
    cityScore: string;
    freezePayout: string;
    unfreezePayout: string;
    broadcastTitle: string;
    broadcastPlaceholder: string;
    sendBroadcast: string;
    broadcastSent: string;
    mapTab: string;
    homeTab: string;
    deptsTab: string;
    totalFiled: string;
    verifiedFixed: string;
    inProgress: string;
    criticalOpen: string;
    execKpis: string;
    sectorScorecard: string;
    heatmapBtn: string;
    contractorAuditBtn: string;
    deptLeaderboard: string;
    complaintsCount: string;
    resolvedLabel: string;
    onTimeRate: string;
    broadcastSub: string;
    noticeTitle: string;
    advisoryMsg: string;
    latestAlert: string;
    criticalEscalations: (n: number) => string;
    noCritical: string;
    dispatchCrew: string;
    dispatchActive: string;
    contractorAuditTitle: string;
    avgIntegrity: string;
    flaggedIncidents: string;
    protectedFunds: string;
    payoutsFrozen: string;
    registeredContractors: (n: number) => string;
    verifiedResolution: string;
    flagged: string;
    flaggedAuditHeading: string;
    noFlaggedIncidents: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: "Awaaz",
    offlineBadge: "Offline Mode",
    allSectors: "All Sectors",
    switchRoleAria: (name, label) => `Switch role (current: ${name}, ${label})`,
    switchDemoRole: "Switch demo role",
    resetSystemData: "Reset System Data",
    resetSuccess: "System data reset to defaults",
    languageLabel: "Language",
    nav: {
      explore: "Explore",
      map: "Map",
      home: "Home",
      reports: "My Reports",
      groups: "Groups",
    },
    departments: {
      CDA_SANITATION: "CDA Sanitation",
      CDA_ROADS: "CDA Roads",
      IESCO: "IESCO",
      WASA: "WASA",
      SNGPL: "SNGPL",
    },
    urgencies: {
      CRITICAL: "Critical",
      HIGH: "High",
      MEDIUM: "Medium",
      LOW: "Low",
    },
    statuses: {
      REPORTED: "Reported",
      IN_PROGRESS: "In Progress",
      PENDING_COMMUNITY_VERIFICATION: "Pending Sign-off",
      RESOLVED: "Resolved",
    },
    categories: {
      "Open Manhole": "Open Manhole",
      "Garbage Heap": "Garbage Heap",
      "Broken Streetlight": "Broken Streetlight",
      Pothole: "Pothole",
      "Sewage Leak": "Sewage Leak",
      "Live Wire": "Live Wire",
      "Water Outage": "Water Outage",
      "Low Gas Pressure": "Low Gas Pressure",
      Other: "Other",
    },
    home: {
      greeting: (name) => `Raise your voice, ${name}.`,
      subtitle: "Tap the mic to report in Urdu, or type your civic issue below.",
      micPrompt: "Tap to speak",
      recordingPrompt: "Listening… tap to stop",
      analyzingPrompt: "Analyzing your report…",
      placeholder: "Describe your issue",
      sendComplaint: "Send complaint",
      attachPhoto: "Attach photo",
      removePhoto: "Remove photo",
      startVoice: "Record Urdu voice note",
      stopVoice: "Stop voice recording",
      duplicateDetected: "Similar issue already reported nearby",
      impactsMeToo: "+1 Impacts Me Too",
      submitSeparate: "Submit as Separate Ticket",
      ticketFiled: "Ticket filed & pinned on map",
      viewInReports: "View in My Reports",
      reportAnother: "Report another issue",
      locationLabel: "Location",
      chatSubtitle: "Chat with Awaaz AI, attach a photo, or send an Urdu voice note. Tap Generate Ticket when ready.",
      generateTicket: "Generate Ticket",
      updateTicket: "Update Ticket from Chat",
      generatingTicket: "Preparing ticket preview…",
      thinkingReply: "Awaaz AI is replying…",
      draftBadge: "Draft Preview — Review & Edit",
      editDetails: "Edit Details",
      doneEditing: "Done Editing",
      approveSubmit: "Approve & Submit Ticket",
      discardDraft: "Discard",
      clearChat: "Clear chat",
      titleLabel: "Title",
      descriptionLabel: "Description",
      categoryLabel: "Category",
      departmentLabel: "Department",
      urgencyLabel: "Urgency",
      sectorLabel: "Sector",
      landmarkLabel: "Landmark / street",
      replacePhoto: "Replace photo",
      removeAttachedPhoto: "Remove photo",
      addPhoto: "Add photo",
      voiceNoteBadge: "Voice note",
      editTip: "You can edit fields above or keep chatting below, then approve to publish.",
    },
    feed: {
      title: "Community Feed",
      all: "All",
      mySector: "My Sector",
      critical: "Critical",
      resolved: "Resolved",
      empty: "No complaints match this filter.",
      confirmFix: "Confirm Fix",
      confirmed: "Confirmed",
      impactsMeToo: "+1 Impacts Me Too",
      impacted: "Impacted",
      viewDetails: "Details",
      aiVerified: "AI Verified",
      comments: "Comments",
      addComment: "Add a comment…",
      postComment: "Post",
    },
    map: {
      legendTitle: "Hazard Map",
      openDetails: "Open Details",
      reportedBy: "Reported by",
    },
    groups: {
      title: "Community Channels",
      subtitle: "Neighborhood updates & civic coordination",
      members: "members",
      officialNotice: "Official broadcasts only — citizens cannot post here.",
      convertToTicket: "Convert to Ticket",
      messagePlaceholder: "Write a message to this group…",
      send: "Send",
      back: "All Groups",
    },
    reports: {
      title: "My Reports",
      subtitle: "Track your submitted civic tickets",
      empty: "You haven't filed any complaints yet.",
      lifecycle: "Lifecycle History",
    },
    worker: {
      queueTab: "Queue",
      homeTab: "Home",
      profileTab: "Profile",
      claimTicket: "Claim Ticket",
      claimed: "Claimed",
      uploadAfter: "Upload After Photo",
      verifyFix: "Verify Fix with AI",
      verifying: "Verifying…",
      aiVerified: "AI Verified",
      aiRejected: "AI Rejected",
      openInMaps: "Open in Google Maps",
      noAssigned: "No claimed tickets assigned to you. Claim one from the Queue.",
      noQueue: "No open tickets. Nice work.",
      allDepts: "All",
      noDeptQueue: "No open tickets for this department.",
      overdue: "Overdue",
      hoursLeft: (h) => `${h}h left`,
      activeJobs: (n) => `My Active Jobs (${n} In Progress)`,
      awaitingSignOff: (n) => `${n} Awaiting Sign-off`,
      unclaim: "Unclaim",
      before: "Before",
      after: "After",
      noPhotoAttached: "No photo attached",
      uploadFix: "Upload Fix",
      changePhoto: "Change photo",
      fixNotePlaceholder: "Optional fix note (e.g. leak sealed, supply restored)",
      markFixed: "Mark Fixed & Request Sign-off",
      verifyFixBtn: "Verify Fix",
      onDuty: "On Duty",
      aiApproval: "AI approval",
      resolvedCount: "Resolved",
      totalAssigned: "Total assigned",
      currentWorkload: "Current Workload",
      pendingSignOff: "Pending Sign-off",
      assignmentDetails: "Assignment Details",
      department: "Department:",
      assignedZone: "Assigned Zone:",
      shiftHours: "Shift Hours:",
    },
    mayor: {
      scorecardTab: "Scorecard",
      contractorsTab: "Contrs",
      alertsTab: "Alerts",
      cityScore: "Islamabad Civic Health Score",
      freezePayout: "Freeze Payout",
      unfreezePayout: "Unfreeze Payout",
      broadcastTitle: "Broadcast Emergency Notice",
      broadcastPlaceholder: "Write official instructions for residents...",
      sendBroadcast: "Broadcast Emergency Notice",
      broadcastSent: "Emergency notice broadcast to Municipal Alerts",
      mapTab: "Map",
      homeTab: "Home",
      deptsTab: "Depts",
      totalFiled: "Total Filed",
      verifiedFixed: "Verified Fixed",
      inProgress: "In Progress",
      criticalOpen: "Critical Open",
      execKpis: "Executive KPI Summary",
      sectorScorecard: "Sector Civic Health Scorecard",
      heatmapBtn: "🗺️ View Problem Heatmap",
      contractorAuditBtn: "🛡️ Contractor Audit",
      deptLeaderboard: "Municipal Agency Leaderboard (Live)",
      complaintsCount: "Complaints",
      resolvedLabel: "Resolved",
      onTimeRate: "On-Time Rate",
      broadcastSub: "Posts an official alert to 📢 Municipal Alerts and pins the banner across all channels",
      noticeTitle: "Notice Title",
      advisoryMsg: "Advisory Message",
      latestAlert: "Latest Official Alert",
      criticalEscalations: (n) => `Critical Escalations (${n} Requiring Action)`,
      noCritical: "No critical or overdue tickets open right now.",
      dispatchCrew: "🚀 Dispatch Rapid Crew",
      dispatchActive: "✓ Priority Dispatch Active",
      contractorAuditTitle: "Contractor Integrity & Anti-Ghosting Audit",
      avgIntegrity: "Avg Fix Integrity",
      flaggedIncidents: "Flagged Incidents",
      protectedFunds: "Protected",
      payoutsFrozen: "Payouts Frozen",
      registeredContractors: (n) => `Registered Contractors (${n})`,
      verifiedResolution: "Verified Resolution:",
      flagged: "Flagged:",
      flaggedAuditHeading: "Flagged Audit Incidents",
      noFlaggedIncidents: "No AI-rejected incidents flagged right now.",
    },
  },

  ur: {
    appName: "آواز",
    offlineBadge: "آف لائن موڈ",
    allSectors: "تمام سیکٹرز",
    switchRoleAria: (name, label) => `کردار تبدیل کریں (موجودہ: ${name}، ${label})`,
    switchDemoRole: "ڈیمو کردار تبدیل کریں",
    resetSystemData: "سسٹم ڈیٹا ری سیٹ کریں",
    resetSuccess: "سسٹم ڈیٹا اصل حالت پر بحال ہو گیا",
    languageLabel: "زبان",
    nav: {
      explore: "فیڈ",
      map: "نقشہ",
      home: "ہوم",
      reports: "میری رپورٹس",
      groups: "گروپس",
    },
    departments: {
      CDA_SANITATION: "سی ڈی اے صفائی",
      CDA_ROADS: "سی ڈی اے سڑکیں",
      IESCO: "آئیسکو",
      WASA: "واسا",
      SNGPL: "ایس این جی پی ایل",
    },
    urgencies: {
      CRITICAL: "انتہائی ہنگامی",
      HIGH: "فوری",
      MEDIUM: "درمیانہ",
      LOW: "کم",
    },
    statuses: {
      REPORTED: "رپورٹ شدہ",
      IN_PROGRESS: "کام جاری ہے",
      PENDING_COMMUNITY_VERIFICATION: "عوامی تصدیق باقی",
      RESOLVED: "حل شدہ",
    },
    categories: {
      "Open Manhole": "کھلا مین ہول",
      "Garbage Heap": "کچرے کا ڈھیر",
      "Broken Streetlight": "اسٹریٹ لائٹ خراب",
      Pothole: "سڑک پر گڑھا",
      "Sewage Leak": "سیوریج لیک",
      "Live Wire": "لٹکتی بجلی کی تار",
      "Water Outage": "پانی کی بندش",
      "Low Gas Pressure": "گیس کا پریشر کم",
      Other: "دیگر مسئلہ",
    },
    home: {
      greeting: (name) => `${name}، اپنی آواز اٹھائیں۔`,
      subtitle: "اردو میں بولنے کے لیے مائیک دبائیں یا نیچے اپنا مسئلہ لکھیں۔",
      micPrompt: "بولنے کے لیے دبائیں",
      recordingPrompt: "سن رہے ہیں… روکنے کے لیے دبائیں",
      analyzingPrompt: "رپورٹ کا جائزہ لیا جا رہا ہے…",
      placeholder: "اپنا مسئلہ بیان کریں",
      sendComplaint: "شکایت بھیجیں",
      attachPhoto: "تصویر لگائیں",
      removePhoto: "تصویر ہٹائیں",
      startVoice: "آواز ریکارڈ کریں",
      stopVoice: "ریکارڈنگ بند کریں",
      duplicateDetected: "قریب ہی ایسا ہی مسئلہ پہلے سے رپورٹ ہے",
      impactsMeToo: "+1 مجھے بھی متاثر کر رہا ہے",
      submitSeparate: "الگ شکایت کے طور پر جمع کریں",
      ticketFiled: "شکایت درج ہو گئی اور نقشے پر لگ گئی",
      viewInReports: "میری رپورٹس دیکھیں",
      reportAnother: "ایک اور مسئلہ رپورٹ کریں",
      locationLabel: "مقام",
      chatSubtitle: "آواز AI سے بات کریں، تصویر لگائیں یا اردو وائس نوٹ بھیجیں۔ تیار ہونے پر ٹکٹ بنائیں دبائیں۔",
      generateTicket: "ٹکٹ بنائیں",
      updateTicket: "چیٹ سے ٹکٹ اپڈیٹ کریں",
      generatingTicket: "ٹکٹ کا جائزہ تیار ہو رہا ہے…",
      thinkingReply: "آواز AI جواب دے رہا ہے…",
      draftBadge: "ڈرافٹ جائزہ — ترمیم اور منظوری",
      editDetails: "تفصیلات بدلیں",
      doneEditing: "ترمیم مکمل",
      approveSubmit: "منظور کریں اور ٹکٹ جمع کریں",
      discardDraft: "مسترد کریں",
      clearChat: "چیٹ صاف کریں",
      titleLabel: "عنوان",
      descriptionLabel: "تفصیل",
      categoryLabel: "زمرہ",
      departmentLabel: "محکمہ",
      urgencyLabel: "اہمیت",
      sectorLabel: "سیکٹر",
      landmarkLabel: "قریبی مقام / گلی",
      replacePhoto: "تصویر بدلیں",
      removeAttachedPhoto: "تصویر ہٹائیں",
      addPhoto: "تصویر لگائیں",
      voiceNoteBadge: "وائس نوٹ",
      editTip: "آپ اوپر تفصیلات بدل سکتے ہیں یا نیچے مزید بات کر کے منظور کریں۔",
    },
    feed: {
      title: "عوامی فیڈ",
      all: "سب",
      mySector: "میرا سیکٹر",
      critical: "ہنگامی",
      resolved: "حل شدہ",
      empty: "اس فلٹر کے مطابق کوئی شکایت نہیں ملی۔",
      confirmFix: "+1 مرمت کی تصدیق کریں",
      confirmed: "تصدیق شدہ",
      impactsMeToo: "+1 مجھے بھی متاثر کر رہا ہے",
      impacted: "متاثرہ",
      viewDetails: "تفصیلات",
      aiVerified: "AI سے تصدیق شدہ",
      comments: "تبصرے",
      addComment: "تبصرہ لکھیں…",
      postComment: "بھیجیں",
    },
    map: {
      legendTitle: "مسائل کا نقشہ",
      openDetails: "تفصیلات کھولیں",
      reportedBy: "رپورٹر",
    },
    groups: {
      title: "کمیونٹی چینلز",
      subtitle: "علاقائی اپڈیٹس اور شہری رابطہ",
      members: "اراکین",
      officialNotice: "صرف سرکاری اعلانات — شہری یہاں پیغام نہیں بھیج سکتے۔",
      convertToTicket: "ٹکٹ میں تبدیل کریں",
      messagePlaceholder: "اس گروپ میں پیغام لکھیں…",
      send: "بھیجیں",
      back: "تمام گروپس",
    },
    reports: {
      title: "میری رپورٹس",
      subtitle: "اپنی درج شدہ شکایات کا حال دیکھیں",
      empty: "آپ نے ابھی تک کوئی شکایت درج نہیں کرائی۔",
      lifecycle: "ٹکٹ کی تاریخ",
    },
    worker: {
      queueTab: "قطار",
      homeTab: "ہوم",
      profileTab: "پروفائل",
      claimTicket: "ٹکٹ لیں",
      claimed: "حاصل شدہ",
      uploadAfter: "مرمت کے بعد کی تصویر لگائیں",
      verifyFix: "AI سے تصدیق کروائیں",
      verifying: "تصدیق ہو رہی ہے…",
      aiVerified: "AI سے تصدیق شدہ",
      aiRejected: "AI نے مسترد کر دیا",
      openInMaps: "گوگل میپس میں کھولیں",
      noAssigned: "ابھی کوئی فعال ٹکٹ نہیں لیا گیا۔ قطار ٹیب سے ٹکٹ لیں۔",
      noQueue: "قطار میں کوئی کھلا ٹکٹ موجود نہیں۔ شاباش!",
      allDepts: "تمام",
      noDeptQueue: "اس محکمے کے لیے کوئی کھلا ٹکٹ نہیں۔",
      overdue: "تاخیر شدہ",
      hoursLeft: (h) => `${h} گھنٹے باقی`,
      activeJobs: (n) => `میرے فعال کام (${n} جاری)`,
      awaitingSignOff: (n) => `${n} شہری تصدیق کے منتظر`,
      unclaim: "واپس کریں",
      before: "پہلے",
      after: "بعد میں",
      noPhotoAttached: "کوئی تصویر منسلک نہیں",
      uploadFix: "مرمت کی تصویر",
      changePhoto: "تصویر بدلیں",
      fixNotePlaceholder: "اختیاری نوٹ (مثلاً گیس لیک بند کر دی گئی)",
      markFixed: "مرمت مکمل کریں اور تصدیق مانگیں",
      verifyFixBtn: "مرمت کی تصدیق کریں",
      onDuty: "ڈیوٹی پر",
      aiApproval: "AI منظوری",
      resolvedCount: "حل شدہ",
      totalAssigned: "کل تفویض",
      currentWorkload: "موجودہ کام",
      pendingSignOff: "تصدیق کے منتظر",
      assignmentDetails: "تعیناتی کی تفصیلات",
      department: "محکمہ:",
      assignedZone: "علاقہ:",
      shiftHours: "شفٹ اوقات:",
    },
    mayor: {
      scorecardTab: "اسکور کارڈ",
      contractorsTab: "ٹھیکیدار",
      alertsTab: "اعلانات",
      cityScore: "اسلام آباد شہری صحت اسکور",
      freezePayout: "ادائیگی روکیں",
      unfreezePayout: "ادائیگی بحال کریں",
      broadcastTitle: "ہنگامی اعلان نشر کریں",
      broadcastPlaceholder: "شہریوں کے لیے سرکاری ہدایات لکھیں...",
      sendBroadcast: "ہنگامی اعلان بھیجیں",
      broadcastSent: "ہنگامی اعلان میونسپل الرٹس میں بھیج دیا گیا",
      mapTab: "نقشہ",
      homeTab: "ہوم",
      deptsTab: "محکمے",
      totalFiled: "کل شکایات",
      verifiedFixed: "تصدیق شدہ حل",
      inProgress: "کام جاری",
      criticalOpen: "انتہائی فوری",
      execKpis: "ایگزیکٹو خلاصہ",
      sectorScorecard: "سیکٹر شہری صحت اسکور کارڈ",
      heatmapBtn: "🗺️ مسائل کا نقشہ دیکھیں",
      contractorAuditBtn: "🛡️ ٹھیکیدار آڈٹ",
      deptLeaderboard: "میونسپل محکموں کی کارکردگی (لائیو)",
      complaintsCount: "شکایات",
      resolvedLabel: "حل شدہ",
      onTimeRate: "برقت شرح",
      broadcastSub: "تمام چینلز اور 📢 میونسپل الرٹس میں سرکاری اعلان شائع کرتا ہے",
      noticeTitle: "اعلان کا عنوان",
      advisoryMsg: "ہدایتی پیغام",
      latestAlert: "تازہ ترین سرکاری اعلان",
      criticalEscalations: (n) => `فوری توجہ طلب معاملات (${n})`,
      noCritical: "اس وقت کوئی انتہائی فوری یا تاخیر شدہ شکایت کھلی نہیں۔",
      dispatchCrew: "🚀 فوری ٹیم روانہ کریں",
      dispatchActive: "✓ فوری ٹیم روانہ کر دی گئی",
      contractorAuditTitle: "ٹھیکیدار آڈٹ اور نگرانی",
      avgIntegrity: "اوسط درستگی",
      flaggedIncidents: "نشان زدہ واقعات",
      protectedFunds: "محفوظ رقم",
      payoutsFrozen: "منجمد ادائیگیاں",
      registeredContractors: (n) => `رجسٹرڈ ٹھیکیدار (${n})`,
      verifiedResolution: "تصدیق شدہ حل:",
      flagged: "نشان زدہ:",
      flaggedAuditHeading: "نشان زدہ آڈٹ واقعات",
      noFlaggedIncidents: "اس وقت AI کی مسترد کردہ کوئی شکایت نہیں۔",
    },
  },

  roman: {
    appName: "Awaaz",
    offlineBadge: "Offline Mode",
    allSectors: "Tamam Sectors",
    switchRoleAria: (name, label) => `Role tabdeel karein (mojooda: ${name}, ${label})`,
    switchDemoRole: "Demo role tabdeel karein",
    resetSystemData: "System Data Reset Karein",
    resetSuccess: "System data wapas default par aa gaya",
    languageLabel: "Zaban",
    nav: {
      explore: "Explore",
      map: "Naqsha",
      home: "Home",
      reports: "Meri Reports",
      groups: "Groups",
    },
    departments: {
      CDA_SANITATION: "CDA Safai",
      CDA_ROADS: "CDA Sarkein",
      IESCO: "IESCO",
      WASA: "WASA",
      SNGPL: "SNGPL",
    },
    urgencies: {
      CRITICAL: "Intehai Hangami",
      HIGH: "Fauri",
      MEDIUM: "Darmiyana",
      LOW: "Kam",
    },
    statuses: {
      REPORTED: "Report Shuda",
      IN_PROGRESS: "Kaam Jari Hai",
      PENDING_COMMUNITY_VERIFICATION: "Awami Tasdeeq Baqi",
      RESOLVED: "Hal Shuda",
    },
    categories: {
      "Open Manhole": "Khula Manhole",
      "Garbage Heap": "Kachray ka Dher",
      "Broken Streetlight": "Streetlight Kharab",
      Pothole: "Sarak par Garha",
      "Sewage Leak": "Sewage Leak",
      "Live Wire": "Latakti Bijli ki Taar",
      "Water Outage": "Pani ki Bandish",
      "Low Gas Pressure": "Gas ka Pressure Kam",
      Other: "Deegar Masla",
    },
    home: {
      greeting: (name) => `Apni awaaz uthayein, ${name}.`,
      subtitle: "Urdu mein bolne ke liye mic dabayein ya neeche apna masla likhein.",
      micPrompt: "Bolne ke liye dabayein",
      recordingPrompt: "Sun rahe hain… rokne ke liye dabayein",
      analyzingPrompt: "Report ka jaiza liya ja raha hai…",
      placeholder: "Apna masla likhein",
      sendComplaint: "Shikayat bhejein",
      attachPhoto: "Tasveer lagayein",
      removePhoto: "Tasveer hatayein",
      startVoice: "Awaaz record karein",
      stopVoice: "Recording band karein",
      duplicateDetected: "Qareeb hi aisa masla pehle se report hai",
      impactsMeToo: "+1 Mujhe bhi asar ho raha hai",
      submitSeparate: "Alag Ticket ke Taur par Bhejein",
      ticketFiled: "Ticket darj ho gaya aur naqshay par lag gaya",
      viewInReports: "Meri Reports Dekhein",
      reportAnother: "Ek aur masla report karein",
      locationLabel: "Maqam",
      chatSubtitle: "Awaaz AI se baat karein, tasveer lagayein ya Urdu voice note bhejein. Tayyar hone par Ticket Banayein dabayein.",
      generateTicket: "Ticket Banayein",
      updateTicket: "Chat se Ticket Update Karein",
      generatingTicket: "Ticket preview tayyar ho raha hai…",
      thinkingReply: "Awaaz AI jawab de raha hai…",
      draftBadge: "Draft Preview — Edit & Approve",
      editDetails: "Tafseelat Badlein",
      doneEditing: "Edit Mukammal",
      approveSubmit: "Manzoor Karein aur Ticket Bhejein",
      discardDraft: "Chhor Dein",
      clearChat: "Chat saaf karein",
      titleLabel: "Unwan",
      descriptionLabel: "Tafseel",
      categoryLabel: "Zimra",
      departmentLabel: "Mehkma",
      urgencyLabel: "Ahmiyat",
      sectorLabel: "Sector",
      landmarkLabel: "Qareebi maqam / gali",
      replacePhoto: "Tasveer badlein",
      removeAttachedPhoto: "Tasveer hatayein",
      addPhoto: "Tasveer lagayein",
      voiceNoteBadge: "Voice note",
      editTip: "Aap upar tafseelat badal sakte hain ya neeche mazeed baat kar ke manzoor karein.",
    },
    feed: {
      title: "Awami Feed",
      all: "Sab",
      mySector: "Mera Sector",
      critical: "Hangami",
      resolved: "Hal Shuda",
      empty: "Is filter ke mutabiq koi shikayat nahi mili.",
      confirmFix: "+1 Murammat ki Tasdeeq",
      confirmed: "Tasdeeq Shuda",
      impactsMeToo: "+1 Mujhe bhi asar ho raha hai",
      impacted: "Mutasira",
      viewDetails: "Tafseelat",
      aiVerified: "AI se Tasdeeq Shuda",
      comments: "Tabsaray",
      addComment: "Tabsara likhein…",
      postComment: "Bhejein",
    },
    map: {
      legendTitle: "Masail ka Naqsha",
      openDetails: "Tafseelat Kholein",
      reportedBy: "Reporter",
    },
    groups: {
      title: "Community Channels",
      subtitle: "Ilaqai updates aur shehri rabta",
      members: "arakeen",
      officialNotice: "Sirf sarkari elanaat — shehri yahan message nahi bhej sakte.",
      convertToTicket: "Ticket mein Tabdeel Karein",
      messagePlaceholder: "Is group mein message likhein…",
      send: "Bhejein",
      back: "Tamam Groups",
    },
    reports: {
      title: "Meri Reports",
      subtitle: "Apni darj shuda shikayat ka haal dekhein",
      empty: "Aap ne abhi tak koi shikayat darj nahi karwayi.",
      lifecycle: "Ticket ki Tareekh",
    },
    worker: {
      queueTab: "Qataar",
      homeTab: "Home",
      profileTab: "Profile",
      claimTicket: "Ticket Lein",
      claimed: "Hasil Shuda",
      uploadAfter: "Baad ki Tasveer Lagayein",
      verifyFix: "AI se Tasdeeq Karwayein",
      verifying: "Tasdeeq ho rahi hai…",
      aiVerified: "AI se Tasdeeq Shuda",
      aiRejected: "AI ne Mustarad kar diya",
      openInMaps: "Google Maps mein Kholein",
      noAssigned: "Abhi koi active ticket nahi liya gaya. Qataar tab se ticket lein.",
      noQueue: "Qataar mein koi khula ticket mojood nahi.",
      allDepts: "Tamam",
      noDeptQueue: "Is mehkme ke liye koi khula ticket nahi.",
      overdue: "Waqt guzar gaya",
      hoursLeft: (h) => `${h}h baqi`,
      activeJobs: (n) => `Mere Active Kaam (${n} Jari)`,
      awaitingSignOff: (n) => `${n} Tasdeeq ke Muntazir`,
      unclaim: "Wapis Karein",
      before: "Pehle",
      after: "Baad mein",
      noPhotoAttached: "Koi tasveer nahi",
      uploadFix: "Fix Tasveer",
      changePhoto: "Tasveer badlein",
      fixNotePlaceholder: "Ikhtiyari note (maslan leak band kar di)",
      markFixed: "Fix Mukammal Karein",
      verifyFixBtn: "Fix Tasdeeq Karein",
      onDuty: "Duty Par",
      aiApproval: "AI manzoori",
      resolvedCount: "Hal shuda",
      totalAssigned: "Kul kaam",
      currentWorkload: "Mojooda Kaam",
      pendingSignOff: "Tasdeeq Baqi",
      assignmentDetails: "Tafseelat",
      department: "Mehkma:",
      assignedZone: "Ilaqa:",
      shiftHours: "Shift Auqat:",
    },
    mayor: {
      scorecardTab: "Scorecard",
      contractorsTab: "Thekedaar",
      alertsTab: "Elanaat",
      cityScore: "Islamabad Shehri Sehat Score",
      freezePayout: "Adaigi Rokein",
      unfreezePayout: "Adaigi Bahal Karein",
      broadcastTitle: "Hangami Elan Bhejein",
      broadcastPlaceholder: "Shehriyon ke liye sarkari hadayat likhein...",
      sendBroadcast: "Hangami Elan Bhejein",
      broadcastSent: "Elan Municipal Alerts mein bhej diya gaya",
      mapTab: "Naqsha",
      homeTab: "Home",
      deptsTab: "Mehkme",
      totalFiled: "Kul Shikayaat",
      verifiedFixed: "Tasdeeq Shuda Hal",
      inProgress: "Kaam Jari",
      criticalOpen: "Fauri Masail",
      execKpis: "Executive Khulasa",
      sectorScorecard: "Sector Shehri Sehat Scorecard",
      heatmapBtn: "🗺️ Masail ka Naqsha Dekhein",
      contractorAuditBtn: "🛡️ Thekedaar Audit",
      deptLeaderboard: "Mehkmon ki Karkardagi (Live)",
      complaintsCount: "Shikayaat",
      resolvedLabel: "Hal Shuda",
      onTimeRate: "Waqt par Sharah",
      broadcastSub: "Tamam channels aur 📢 Municipal Alerts mein sarkari elan shaya karta hai",
      noticeTitle: "Elan ka Unwaan",
      advisoryMsg: "Hadayati Paigham",
      latestAlert: "Taza Tareen Sarkari Elan",
      criticalEscalations: (n) => `Fauri Tawajjo Talab (${n})`,
      noCritical: "Is waqt koi fauri ya overdue shikayat nahi.",
      dispatchCrew: "🚀 Fauri Team Bhejein",
      dispatchActive: "✓ Fauri Team Rawana Hai",
      contractorAuditTitle: "Thekedaar Audit aur Nigrani",
      avgIntegrity: "Ausat Durustgi",
      flaggedIncidents: "Flagged Waqiaat",
      protectedFunds: "Mehfooz Raqam",
      payoutsFrozen: "Ruki Adaigiyan",
      registeredContractors: (n) => `Registered Thekedaar (${n})`,
      verifiedResolution: "Tasdeeq Shuda Hal:",
      flagged: "Flagged:",
      flaggedAuditHeading: "Flagged Audit Waqiaat",
      noFlaggedIncidents: "Is waqt koi AI-rejected waqia nahi.",
    },
  },
};

export function getComplaintTitle(c: Pick<Complaint, "title" | "titleUrdu" | "titleRoman" | "category">, lang: Language): string {
  if (lang === "ur") return c.titleUrdu || c.title;
  if (lang === "roman") return c.titleRoman || categoryInfo(c.category).titleRoman || c.title;
  return c.title;
}

export function getComplaintSummary(
  c: Pick<Complaint, "englishSummary" | "urduTranscript" | "romanSummary">,
  lang: Language,
): string {
  if (lang === "ur") return c.urduTranscript || c.englishSummary;
  if (lang === "roman") return c.romanSummary || c.englishSummary;
  return c.englishSummary;
}

