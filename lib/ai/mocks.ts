import { matchCategory } from "@/lib/categories";
import type { AudioAnalysisResponse, FixVerificationResponse, IntakeChatResponse } from "./schemas";

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

export function buildIntakeChatFallback({
  latestText,
  combinedText,
  hasAudio,
  hasPhoto,
  lang,
}: {
  latestText: string;
  combinedText: string;
  hasAudio: boolean;
  hasPhoto: boolean;
  lang: "en" | "ur" | "roman";
  sectorHint?: string;
}): IntakeChatResponse {
  const userTranscript =
    latestText.trim() ||
    (hasAudio ? MOCK_AUDIO_ANALYSIS.urduTranscript : hasPhoto ? "[Photo attached]" : "");

  const fullText = [combinedText, userTranscript].filter(Boolean).join(" ");
  const sectorMatch = /\b([EFGHI]-\d{1,2})\b/i.exec(fullText);
  const hasLocationDetail = Boolean(
    sectorMatch ||
      /\b(street|st|road|markaz|market|masjid|mosque|school|park|near|gali)\b/i.test(fullText),
  );

  if (lang === "ur") {
    if (hasPhoto && !latestText.trim() && !hasAudio) {
      return {
        userTranscript,
        reply: "تصویر موصول ہو گئی ہے! کوئی اور تفصیل شامل کرنی ہو تو بتائیں، ورنہ ٹکٹ بنائیں۔",
        readyToGenerate: true,
      };
    }
    if (!hasLocationDetail) {
      return {
        userTranscript,
        reply: "جی سمجھ گیا۔ یہ مسئلہ اسلام آباد کے کس سیکٹر یا قریبی جگہ پر ہے؟",
        readyToGenerate: false,
      };
    }
    return {
      userTranscript,
      reply: "نوٹ کر لیا ہے۔ اگر تصویر یا مزید تفصیل شامل کرنی ہو تو بھیج دیں، ورنہ ٹکٹ بنائیں۔",
      readyToGenerate: true,
    };
  }

  if (lang === "roman") {
    if (hasPhoto && !latestText.trim() && !hasAudio) {
      return {
        userTranscript,
        reply: "Tasveer mil gayi hai! Mazeed kuch batana ho to likh dein, warna Ticket Banayein daba dein.",
        readyToGenerate: true,
      };
    }
    if (!hasLocationDetail) {
      return {
        userTranscript,
        reply: "Ji samajh gaya. Yeh masla Islamabad ke kis sector ya qareebi jagah par hai?",
        readyToGenerate: false,
      };
    }
    return {
      userTranscript,
      reply: "Note kar liya hai. Tasveer ya mazeed tafseel deni ho to bata dein, warna Ticket Banayein.",
      readyToGenerate: true,
    };
  }

  if (hasPhoto && !latestText.trim() && !hasAudio) {
    return {
      userTranscript,
      reply: "Got the photo! Add any extra details if you'd like, or tap Generate Ticket whenever you're ready.",
      readyToGenerate: true,
    };
  }

  if (!hasLocationDetail) {
    return {
      userTranscript,
      reply: "Got it. Which sector or nearby landmark in Islamabad is this at?",
      readyToGenerate: false,
    };
  }

  return {
    userTranscript,
    reply: "Noted! Feel free to add a photo or more details, or tap Generate Ticket when ready.",
    readyToGenerate: true,
  };
}

/**
 * DEMO-FALLBACK (spec §5.3): triage built from the citizen's own words.
 * With text → keyword match against lib/categories.ts (no match → "Other"), transcript and
 * summary = the typed text, sector = sectorHint. Without text → the fixed audio mock above.
 */
export function buildAudioFallback(text: string, sectorHint: string): AudioAnalysisResponse {
  if (!text) return MOCK_AUDIO_ANALYSIS;
  const info = matchCategory(text);
  const sectorMatch = /\b([EFGHI]-\d{1,2})\b/i.exec(text);
  const isTreeOrRoadBlock =
    info.category === "Other" &&
    (/\b(tree|trees|darakht|darakt|branch|branches|blocked|block)\b/i.test(text) || text.includes("درخت"));

  return {
    urduTranscript: text,
    englishSummary: text,
    romanSummary: text,
    title: isTreeOrRoadBlock ? "Fallen tree / road obstruction" : info.title,
    titleUrdu: isTreeOrRoadBlock ? "سڑک پر گرا ہوا درخت / رکاوٹ" : info.titleUrdu,
    titleRoman: isTreeOrRoadBlock ? "Sarak par gira hua darakht / rukawat" : info.titleRoman,
    category: info.category,
    department: isTreeOrRoadBlock ? "CDA_ROADS" : info.department,
    urgency: isTreeOrRoadBlock ? "HIGH" : info.urgency,
    landmark: "",
    sector: sectorMatch ? sectorMatch[1].toUpperCase() : sectorHint,
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
