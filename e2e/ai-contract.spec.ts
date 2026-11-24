import { test, expect } from "@playwright/test";
import { normalizeConfidence, FixVerificationModelSchema } from "@/lib/ai/schemas";
import { interpretVerificationReply } from "@/lib/ai/verification";
import { buildVerifyFallback, INVALID_REPLY_REASONING, IDENTICAL_PHOTO_REASONING } from "@/lib/ai/mocks";
import { matchCategory } from "@/lib/categories";

// Pure Node tests (no browser, no Gemini): the fail-closed branches of the live verify-fix path,
// which the browser e2e cannot reach under AI_FORCE_FALLBACK=1, plus the keyword matcher.

test.describe("AI contract (no live calls)", () => {
  test("normalizeConfidence: 0–1 passes, 1<c≤100 divided once, else invalid", () => {
    expect(normalizeConfidence(0)).toBe(0);
    expect(normalizeConfidence(0.94)).toBe(0.94);
    expect(normalizeConfidence(1)).toBe(1);
    expect(normalizeConfidence(94)).toBeCloseTo(0.94);
    expect(normalizeConfidence(100)).toBe(1);
    expect(normalizeConfidence(150)).toBeNull();
    expect(normalizeConfidence(-0.1)).toBeNull();
    expect(normalizeConfidence(Number.NaN)).toBeNull();
  });

  test("FixVerificationModelSchema rejects missing verdict / empty reasoning / missing confidence", () => {
    const ok = { verdict: "VERIFIED_RESOLVED", reasoning: "Manhole cover installed.", confidence: 0.9 };
    expect(FixVerificationModelSchema.safeParse(ok).success).toBe(true);
    expect(FixVerificationModelSchema.safeParse({ ...ok, verdict: undefined }).success).toBe(false);
    expect(FixVerificationModelSchema.safeParse({ ...ok, verdict: "MAYBE" }).success).toBe(false);
    expect(FixVerificationModelSchema.safeParse({ ...ok, reasoning: "   " }).success).toBe(false);
    expect(FixVerificationModelSchema.safeParse({ ...ok, confidence: undefined }).success).toBe(false);
    expect(FixVerificationModelSchema.safeParse({ ...ok, confidence: "0.9" }).success).toBe(false);
  });

  test("malformed model replies are rejections, never passes", () => {
    const malformed = [
      "not json",
      "",
      undefined,
      JSON.stringify({ verdict: "REJECTED_UNRESOLVED", reasoning: "", confidence: 0.97 }),
      JSON.stringify({ reasoning: "Looks fixed", confidence: 0.97 }),
      JSON.stringify({ verdict: "VERIFIED_RESOLVED", reasoning: "Looks fixed", confidence: 150 }),
    ];
    for (const text of malformed) {
      const { response, failure } = interpretVerificationReply(text, "c-1");
      expect(failure, String(text)).not.toBeNull();
      expect(response.passed).toBe(false);
      expect(response.verdict).toBe("REJECTED_UNRESOLVED");
      expect(response.isOfflineFallback).toBe(true);
      expect(response.reasoning).toBe(INVALID_REPLY_REASONING);
      expect(response.confidence).toBeLessThanOrEqual(1);
    }
  });

  test("valid replies: 0–100 normalised, low-confidence resolved is not a pass", () => {
    const pct = interpretVerificationReply(
      JSON.stringify({ verdict: "VERIFIED_RESOLVED", reasoning: "Cover installed.", confidence: 94 }),
      "c-1",
    ).response;
    expect(pct).toMatchObject({ passed: true, verdict: "VERIFIED_RESOLVED", isOfflineFallback: false, complaintId: "c-1" });
    expect(pct.confidence).toBeCloseTo(0.94);
    expect(pct.detectedChanges).toEqual([]);

    const low = interpretVerificationReply(
      JSON.stringify({ verdict: "VERIFIED_RESOLVED", reasoning: "Unclear.", confidence: 0.4 }),
      "c-1",
    ).response;
    expect(low).toMatchObject({ passed: false, verdict: "REJECTED_UNRESOLVED", confidence: 0.4 });
  });

  test("demo fallback: identical/missing After rejects, different After passes", () => {
    const a = Buffer.from([1, 2, 3]);
    const b = Buffer.from([1, 2, 4]);
    expect(buildVerifyFallback("c", a, Buffer.from(a))).toMatchObject({ passed: false, reasoning: IDENTICAL_PHOTO_REASONING });
    expect(buildVerifyFallback("c", a, null).passed).toBe(false);
    expect(buildVerifyFallback("c", a, b)).toMatchObject({ passed: true, confidence: 0.9, isOfflineFallback: true });
  });

  test("keyword matcher uses whole words", () => {
    expect(matchCategory("F-10 Markaz mein gutter ka dhakkan toota hua hai").category).toBe("Open Manhole");
    expect(matchCategory("street light kharab hai F-6").department).toBe("IESCO");
    expect(matchCategory("pani currently nahi aa raha").category).toBe("Water Outage");
    expect(matchCategory("wireless router").category).toBe("Other");
    expect(matchCategory("lightning storm").category).toBe("Other");
    expect(matchCategory("the street lights are off").category).toBe("Broken Streetlight");
    expect(matchCategory("bijli ki taar gir gayi").category).toBe("Live Wire");
    expect(matchCategory("sitaara market").category).toBe("Other");
  });
});
