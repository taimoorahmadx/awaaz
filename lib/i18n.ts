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
      greeting: (name) => `Assalam-o-Alaikum ${name}! 👋`,
      subtitle: "Tap the mic to report in Urdu, or type your civic issue below.",
      micPrompt: "Tap to speak",
      recordingPrompt: "Listening… tap to stop",
      analyzingPrompt: "Analyzing your report…",
      placeholder: "Describe the issue (e.g. F-10 Markaz open manhole)…",
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
      noAssigned: "No active tickets claimed yet. Claim one from the Queue tab.",
      noQueue: "No open tickets in the queue.",
    },
    mayor: {
      scorecardTab: "Scorecard",
      contractorsTab: "Contractors",
      alertsTab: "Alerts",
      cityScore: "Islamabad Civic Health",
      freezePayout: "Freeze Payout",
      unfreezePayout: "Unfreeze Payout",
      broadcastTitle: "Emergency Broadcast",
      broadcastPlaceholder: "Write an official alert for all Islamabad sectors…",
      sendBroadcast: "Send Broadcast",
      broadcastSent: "Broadcast sent to Municipal Alerts",
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
      greeting: (name) => `السلام علیکم ${name}! 👋`,
      subtitle: "اردو میں بولنے کے لیے مائیک دبائیں یا نیچے اپنا مسئلہ لکھیں۔",
      micPrompt: "بولنے کے لیے دبائیں",
      recordingPrompt: "سن رہے ہیں… روکنے کے لیے دبائیں",
      analyzingPrompt: "رپورٹ کا جائزہ لیا جا رہا ہے…",
      placeholder: "اپنا شہری مسئلہ بیان کریں (مثلاً ایف ٹین مرکز میں کھلا مین ہول)…",
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
      noQueue: "قطار میں کوئی کھلا ٹکٹ موجود نہیں۔",
    },
    mayor: {
      scorecardTab: "اسکور کارڈ",
      contractorsTab: "ٹھیکیدار",
      alertsTab: "اعلانات",
      cityScore: "اسلام آباد شہری صحت",
      freezePayout: "ادائیگی روکیں",
      unfreezePayout: "ادائیگی بحال کریں",
      broadcastTitle: "ہنگامی اعلان",
      broadcastPlaceholder: "اسلام آباد کے تمام سیکٹرز کے لیے سرکاری اعلان لکھیں…",
      sendBroadcast: "اعلان بھیجیں",
      broadcastSent: "اعلان میونسپل الرٹس میں بھیج دیا گیا",
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
      greeting: (name) => `Assalam-o-Alaikum ${name}! 👋`,
      subtitle: "Urdu mein bolne ke liye mic dabayein ya neeche apna masla likhein.",
      micPrompt: "Bolne ke liye dabayein",
      recordingPrompt: "Sun rahe hain… rokne ke liye dabayein",
      analyzingPrompt: "Report ka jaiza liya ja raha hai…",
      placeholder: "Apna masla likhein (maslan F-10 Markaz mein khula manhole)…",
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
    },
    mayor: {
      scorecardTab: "Scorecard",
      contractorsTab: "Thekedaar",
      alertsTab: "Elanaat",
      cityScore: "Islamabad Shehri Sehat",
      freezePayout: "Adaigi Rokein",
      unfreezePayout: "Adaigi Bahal Karein",
      broadcastTitle: "Hangami Elan",
      broadcastPlaceholder: "Islamabad ke tamam sectors ke liye sarkari elan likhein…",
      sendBroadcast: "Elan Bhejein",
      broadcastSent: "Elan Municipal Alerts mein bhej diya gaya",
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

