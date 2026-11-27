// Fixed civic issue categories (spec §3 IssueCategory). Single source of truth for
// category → department / default urgency / titles / stock photo / fallback keywords.
// Safe to import from both client components and server routes (no server-only deps).

import type { Department, IssueCategory, Urgency } from "@/lib/types";

export interface CategoryInfo {
  category: IssueCategory;
  department: Department;
  urgency: Urgency;
  title: string;
  titleUrdu: string;
  titleRoman: string;
  /** Local stock photo under public/images/hazards/ (offline safe). */
  photo: string;
  /** Lowercase keywords: English, Roman Urdu, Urdu script. Used by the DEMO-FALLBACK triage. */
  keywords: string[];
}

export const CATEGORIES = [
  "Open Manhole",
  "Garbage Heap",
  "Broken Streetlight",
  "Pothole",
  "Sewage Leak",
  "Live Wire",
  "Water Outage",
  "Low Gas Pressure",
  "Other",
] as const satisfies readonly IssueCategory[];

export const CATEGORY_TABLE: Record<IssueCategory, CategoryInfo> = {
  "Open Manhole": {
    category: "Open Manhole",
    department: "CDA_SANITATION",
    urgency: "CRITICAL",
    title: "Open manhole reported",
    titleUrdu: "کھلا مین ہول",
    titleRoman: "Khula manhole report hua hai",
    photo: "/images/hazards/open-manhole.jpg",
    keywords: ["manhole", "manholes", "man hole", "dhakkan", "dhakan", "dhakna", "open gutter", "gutter khula", "مین ہول", "ڈھکن"],
  },
  "Garbage Heap": {
    category: "Garbage Heap",
    department: "CDA_SANITATION",
    urgency: "HIGH",
    title: "Garbage heap reported",
    titleUrdu: "کچرے کا ڈھیر",
    titleRoman: "Kachray ka dher report hua hai",
    photo: "/images/hazards/garbage-heap.jpg",
    keywords: ["garbage", "trash", "rubbish", "waste", "wastes", "kachra", "kachre", "koora", "kooda", "kuda", "کچرا", "کچرے", "کوڑا"],
  },
  "Broken Streetlight": {
    category: "Broken Streetlight",
    department: "IESCO",
    urgency: "MEDIUM",
    title: "Broken streetlight reported",
    titleUrdu: "اسٹریٹ لائٹ خراب",
    titleRoman: "Streetlight kharab report hui hai",
    photo: "/images/hazards/broken-streetlight.jpg",
    keywords: ["street light", "street lights", "streetlight", "streetlights", "street lamp", "street lamps", "lamp", "lamps", "light", "lights", "batti", "bulb", "bulbs", "لائٹ", "بتی"],
  },
  Pothole: {
    category: "Pothole",
    department: "CDA_ROADS",
    urgency: "MEDIUM",
    title: "Pothole reported",
    titleUrdu: "سڑک پر گڑھا",
    titleRoman: "Sarak par garha report hua hai",
    photo: "/images/hazards/pothole.jpg",
    keywords: ["pothole", "potholes", "pot hole", "khadda", "khada", "gadha", "garha", "broken road", "damaged road", "tooti sarak", "گڑھا", "کھڈا"],
  },
  "Sewage Leak": {
    category: "Sewage Leak",
    department: "WASA",
    urgency: "HIGH",
    title: "Sewage leak reported",
    titleUrdu: "سیوریج لیک",
    titleRoman: "Sewage leak report hua hai",
    photo: "/images/hazards/sewage-leak.jpg",
    keywords: ["sewage", "sewer", "sewers", "drain", "drains", "gutter", "gutters", "nala", "naala", "ubal", "overflow", "ganda pani", "سیوریج", "گٹر", "نالہ"],
  },
  "Live Wire": {
    category: "Live Wire",
    department: "IESCO",
    urgency: "CRITICAL",
    title: "Live wire hazard reported",
    titleUrdu: "لٹکتی بجلی کی تار",
    titleRoman: "Latakti bijli ki taar report hui hai",
    photo: "/images/hazards/live-wire.jpg",
    keywords: ["live wire", "live wires", "wire", "wires", "taar", "taaren", "current", "spark", "sparks", "sparking", "تار", "کرنٹ"],
  },
  "Water Outage": {
    category: "Water Outage",
    department: "WASA",
    urgency: "HIGH",
    title: "Water outage reported",
    titleUrdu: "پانی کی بندش",
    titleRoman: "Pani ki bandish report hui hai",
    photo: "/images/hazards/water-outage.jpg",
    keywords: ["water", "pani", "paani", "pipe", "pipes", "پانی"],
  },
  "Low Gas Pressure": {
    category: "Low Gas Pressure",
    department: "SNGPL",
    urgency: "MEDIUM",
    title: "Low gas pressure reported",
    titleUrdu: "گیس کا پریشر کم",
    titleRoman: "Gas ka pressure kam report hua hai",
    photo: "/images/hazards/low-gas-pressure.jpg",
    keywords: ["gas", "sui gas", "گیس"],
  },
  Other: {
    category: "Other",
    department: "CDA_SANITATION",
    urgency: "MEDIUM",
    title: "Civic issue reported",
    titleUrdu: "شہری مسئلہ",
    titleRoman: "Shehri masla report hua hai",
    // Same default the intake used before T3.1.
    photo: "/images/hazards/open-manhole.jpg",
    keywords: [],
  },
};

/**
 * Keyword match order: the more specific / more dangerous categories are checked first, so
 * "gutter ka dhakkan" → Open Manhole (not Sewage Leak) and "light ki taar" → Live Wire.
 */
const MATCH_ORDER: IssueCategory[] = [
  "Live Wire",
  "Open Manhole",
  "Sewage Leak",
  "Broken Streetlight",
  "Low Gas Pressure",
  "Garbage Heap",
  "Water Outage",
  "Pothole",
];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Latin keywords must match a whole word on both sides ("taar" must not match "sitaara", "current"
 * must not match "currently", "wire" must not match "wireless"); plurals are listed explicitly.
 * Urdu script is a plain substring.
 */
function hasKeyword(text: string, keyword: string): boolean {
  if (/[a-z]/.test(keyword)) return new RegExp(`(^|[^a-z])${escapeRegex(keyword)}(?![a-z])`).test(text);
  return text.includes(keyword);
}

/** Case-insensitive keyword match of free text against the fixed table. No match → "Other". */
export function matchCategory(text: string): CategoryInfo {
  const lower = text.toLowerCase();
  for (const cat of MATCH_ORDER) {
    const info = CATEGORY_TABLE[cat];
    if (info.keywords.some((k) => hasKeyword(lower, k))) return info;
  }
  return CATEGORY_TABLE.Other;
}

export function isCategory(value: unknown): value is IssueCategory {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

/** Category info for any (possibly legacy / unknown) stored category string. */
export function categoryInfo(category: string): CategoryInfo {
  return isCategory(category) ? CATEGORY_TABLE[category] : CATEGORY_TABLE.Other;
}
