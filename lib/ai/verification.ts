import { FixVerificationModelSchema, normalizeConfidence, type FixVerificationResponse } from "./schemas";
import { buildVerifyRejection, INVALID_REPLY_REASONING } from "./mocks";

/** Pass rule — the only place `passed` is decided (spec §4.2). Clients never recompute it. */
export const PASS_CONFIDENCE = 0.6;

/**
 * Turns the raw Gemini verification reply text into the §4.2 response. FAIL CLOSED: unparseable
 * JSON, a schema mismatch or an invalid confidence → a rejecting fallback (passed: false,
 * isOfflineFallback: true), never a pass. Pure function, so it is testable without Gemini.
 */
export function interpretVerificationReply(
  text: string | undefined,
  complaintId: string,
): { response: FixVerificationResponse; failure: string | null } {
  const reject = (failure: string) => ({ response: buildVerifyRejection(complaintId, INVALID_REPLY_REASONING), failure });

  let json: unknown;
  try {
    json = JSON.parse(text ?? "");
  } catch {
    return reject("unparseable model output");
  }
  const parsed = FixVerificationModelSchema.safeParse(json);
  if (!parsed.success) return reject(`schema mismatch: ${parsed.error.message}`);
  const confidence = normalizeConfidence(parsed.data.confidence);
  if (confidence === null) return reject(`invalid confidence: ${parsed.data.confidence}`);

  const passed = parsed.data.verdict === "VERIFIED_RESOLVED" && confidence >= PASS_CONFIDENCE;
  return {
    response: {
      passed,
      confidence,
      // A low-confidence "resolved" is not a pass, so the verdict follows `passed` (spec §4.2 rejection shape).
      verdict: passed ? "VERIFIED_RESOLVED" : "REJECTED_UNRESOLVED",
      reasoning: parsed.data.reasoning,
      detectedChanges: parsed.data.detectedChanges,
      timestamp: new Date().toISOString(),
      complaintId,
      isOfflineFallback: false,
    },
    failure: null,
  };
}
