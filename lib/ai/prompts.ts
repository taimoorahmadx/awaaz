// Gemini prompts (model id from GEMINI_MODEL, see lib/ai/gemini.ts).
// Output shapes must match lib/ai/schemas.ts and docs/spec.md §4 / §5.4.

import { CATEGORIES, CATEGORY_TABLE } from "@/lib/categories";

const CATEGORY_LINES = CATEGORIES.map((c) => `   - "${c}" → ${CATEGORY_TABLE[c].department}`).join("\n");

export const AUDIO_TRIAGE_PROMPT = `You are the civic complaint triage officer for Islamabad, Pakistan.
The attached audio is a citizen speaking in Urdu (possibly mixed with English or Punjabi) about a civic problem.
An optional typed note may also be provided.

Tasks:
1. Transcribe the speech verbatim in Urdu script (urduTranscript). If there is no audio, use the typed note.
2. Write a 1–2 sentence English summary (englishSummary).
3. Write a short English title (title, max 8 words) and its Urdu equivalent (titleUrdu).
4. Pick exactly one category from this fixed list and route it to the department shown:
${CATEGORY_LINES}
   Use "Other" if nothing fits. Never invent a new category.
5. Set department to the department of the chosen category.
6. Set urgency: CRITICAL (immediate danger to life, e.g. live wire, gas leak, open manhole), HIGH (health hazard or many affected), MEDIUM (significant inconvenience), LOW (minor).
7. Extract the landmark mentioned (e.g. "near Jinnah Super Market") and the Islamabad sector (e.g. "F-10", "G-9"). Use "" if not mentioned. Do not return coordinates.
8. Optionally add priorityBreakdown: issueSeverity (integer 1–10), publicDensityRisk, and a one-sentence reasoning.

Respond ONLY with JSON matching:
{"urduTranscript": string, "englishSummary": string, "title": string, "titleUrdu": string,
 "category": ${CATEGORIES.map((c) => `"${c}"`).join("|")},
 "department": "CDA_SANITATION"|"CDA_ROADS"|"IESCO"|"WASA"|"SNGPL",
 "urgency": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", "landmark": string, "sector": string,
 "priorityBreakdown"?: {"issueSeverity": number, "publicDensityRisk": "HIGH"|"MEDIUM"|"LOW", "reasoning": string}}`;

export function buildVerificationPrompt(category: string): string {
  return `You are an impartial civic works inspector in Islamabad, Pakistan.
You are given two photos. Image 1 is BEFORE (the reported "${category}" problem). Image 2 is AFTER (the worker's claimed repair).

Check two things:
1. The "${category}" hazard is physically fixed in the AFTER photo.
2. The background (buildings, curbs, roads, poles) matches, so both photos show the same location.
Reject if the locations differ, the problem is still visible, the AFTER photo is unrelated, or it is the same photo as BEFORE.

Respond ONLY with JSON matching:
{"verdict": "VERIFIED_RESOLVED"|"REJECTED_UNRESOLVED",
 "confidence": number (0.0–1.0, your confidence in the verdict),
 "reasoning": string (1–2 sentences, English),
 "detectedChanges": string[] (short phrases describing visible changes)}`;
}
