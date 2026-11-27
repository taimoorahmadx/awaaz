import { matchCategory } from "@/lib/categories";
import type { AudioAnalysisResponse, FixVerificationResponse } from "./schemas";

// DEMO-FALLBACK: deterministic triage result for audio-only input when Gemini is unavailable.
export const MOCK_AUDIO_ANALYSIS: AudioAnalysisResponse = {
  urduTranscript:
    "جناح سپر مارکیٹ کے پاس ایف ٹین میں تین دن سے کچرے کا بڑا ڈھیر پڑا ہے، بدبو بہت زیادہ ہے اور بچے بیمار ہو رہے ہیں۔ براہ کرم جلدی صاف کروائیں۔",
  englishSummary:
    "A large garbage heap has been lying near Jinnah Super Market in F-10 for three days, causing a strong smell and making children sick.",
  romanSummary:
    "Jinnah Super Market F-10 ke paas teen din se kachray ka bara dher para hai, badboo bohat zyada hai aur bachay bimar ho rahe hain.",
  title: "Garbage heap near Jinnah Super Market",
  titleUrdu: "جناح سپر مارکیٹ کے پاس کچرے کا ڈھیر",
  titleRoman: "Jinnah Super Market ke paas kachray ka dher",
  category: "Garbage Heap",
  department: "CDA_SANITATION",
  urgency: "HIGH",
  landmark: "Near Jinnah Super Market",
  sector: "F-10",
};

/**
 * DEMO-FALLBACK (spec §5.3): triage built from the citizen's own words.
 * With text → keyword match against lib/categories.ts (no match → "Other"), transcript and
 * summary = the typed text, sector = sectorHint. Without text → the fixed audio mock above.
 */
export function buildAudioFallback(text: string, sectorHint: string): AudioAnalysisResponse {
  if (!text) return MOCK_AUDIO_ANALYSIS;
  const info = matchCategory(text);
  return {
    urduTranscript: text,
    englishSummary: text,
    romanSummary: text,
    title: info.title,
    titleUrdu: info.titleUrdu,
    titleRoman: info.titleRoman,
    category: info.category,
    department: info.department,
    urgency: info.urgency,
    landmark: "",
    sector: sectorHint,
  };
}

export const IDENTICAL_PHOTO_REASONING = "The After photo is identical to the Before photo — no repair is visible.";
export const INVALID_REPLY_REASONING = "AI verification reply was invalid — please retry.";
export const UNREADABLE_PHOTO_REASONING = "The Before/After photos could not be read — please retry.";

/**
 * FAIL-CLOSED fallback: used when the live AI path cannot be trusted (malformed model reply, or
 * photos the route cannot read/send). Always a rejection, never a pass. Always isOfflineFallback.
 */
export function buildVerifyRejection(complaintId: string, reasoning: string): FixVerificationResponse {
  return {
    passed: false,
    confidence: 0.05,
    verdict: "REJECTED_UNRESOLVED",
    reasoning,
    detectedChanges: [],
    timestamp: new Date().toISOString(),
    complaintId,
    isOfflineFallback: true,
  };
}

/**
 * DEMO-FALLBACK (spec §5.3): deterministic verification. Rejects when the After image is missing,
 * unreadable, or byte-identical to the Before image; otherwise passes. Always isOfflineFallback.
 */
export function buildVerifyFallback(
  complaintId: string,
  before: Buffer | null,
  after: Buffer | null,
): FixVerificationResponse {
  const timestamp = new Date().toISOString();
  const rejected = !after || after.length === 0 || (before !== null && before.equals(after));
  if (rejected) {
    return {
      passed: false,
      confidence: 0.05,
      verdict: "REJECTED_UNRESOLVED",
      reasoning: IDENTICAL_PHOTO_REASONING,
      detectedChanges: [],
      timestamp,
      complaintId,
      isOfflineFallback: true,
    };
  }
  return {
    passed: true,
    confidence: 0.9,
    verdict: "VERIFIED_RESOLVED",
    reasoning: "Offline demo verification: the After photo differs from the Before photo (no AI vision check was run).",
    detectedChanges: [],
    timestamp,
    complaintId,
    isOfflineFallback: true,
  };
}
