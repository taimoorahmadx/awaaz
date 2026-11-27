import { NextResponse } from "next/server";
import {
  AI_MULTIMODAL_TIMEOUT_MS,
  GEMINI_MODEL,
  getGemini,
  withTimeout,
  withTransientRetry,
} from "@/lib/ai/gemini";
import { GROQ_VISION_MODEL, groqChatCompletion, hasGroq, type GroqContentPart } from "@/lib/ai/groq";
import { buildVerificationPrompt } from "@/lib/ai/prompts";
import { buildVerifyFallback, buildVerifyRejection, UNREADABLE_PHOTO_REASONING } from "@/lib/ai/mocks";
import { interpretVerificationReply } from "@/lib/ai/verification";

export const runtime = "nodejs";
export const maxDuration = 60;

// INTEGRATOR NOTE (spec §4.2): request = JSON { complaintId, beforePhotoBase64, beforeMimeType,
// afterPhotoBase64, afterMimeType, category }. Images may be raw base64 (MIME from the *MimeType
// field) or data URLs (MIME from the URL). The MIME is never assumed.
// Response = { passed, confidence (0.0–1.0), verdict, reasoning, detectedChanges, timestamp,
// complaintId, isOfflineFallback }.

// The pass rule (`passed` decided server-side only) lives in lib/ai/verification.ts.

interface ParsedImage {
  /** e.g. "image/png"; null when neither the data URL nor the MIME field names an image type. */
  mimeType: string | null;
  data: string;
  bytes: Buffer;
}

/** Splits a data URL or raw base64 string into MIME + base64 + bytes. Unreadable input → null. */
function parseImage(input: unknown, mimeHint: unknown): ParsedImage | null {
  if (typeof input !== "string" || !input) return null;
  const m = /^data:([^;,]+);base64,([\s\S]+)$/.exec(input);
  const rawMime = m ? m[1] : typeof mimeHint === "string" ? mimeHint : "";
  const data = (m ? m[2] : input).replace(/\s/g, "");
  if (!data || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
  const bytes = Buffer.from(data, "base64");
  if (bytes.length === 0) return null;
  const mimeType = rawMime.split(";")[0].trim().toLowerCase();
  return { mimeType: mimeType.startsWith("image/") ? mimeType : null, data, bytes };
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // fall through with empty body → fallback (rejects: no After photo)
  }
  const complaintId = typeof body.complaintId === "string" ? body.complaintId : "";
  const category = typeof body.category === "string" && body.category ? body.category : "civic issue";
  const summary = typeof body.summary === "string" ? body.summary : "";
  const hasBeforeInput = typeof body.beforePhotoBase64 === "string" && body.beforePhotoBase64.trim().length > 0;
  // Parsed BEFORE the AI check, so the fallback can always compare the two photos when both exist.
  const before = hasBeforeInput ? parseImage(body.beforePhotoBase64, body.beforeMimeType) : null;
  const after = parseImage(body.afterPhotoBase64, body.afterMimeType);

  // DEMO-FALLBACK: deterministic, input-aware (rejects identical/missing After photo), <300ms.
  // Only for "AI not reachable" cases: no key, AI_FORCE_FALLBACK=1, timeout, network error.
  const fallback = (reason: string) => {
    console.warn("[verify-fix] DEMO-FALLBACK:", reason);
    return NextResponse.json(buildVerifyFallback(complaintId, before?.bytes ?? null, after?.bytes ?? null));
  };
  // FAIL-CLOSED rejection: the live path cannot be trusted (unreadable photos). Never a pass.
  const reject = (reason: string) => {
    console.warn("[verify-fix] FAIL-CLOSED rejection:", reason);
    return NextResponse.json(buildVerifyRejection(complaintId, UNREADABLE_PHOTO_REASONING));
  };

  const useGroq = hasGroq();
  const ai = useGroq ? null : getGemini();
  if (!useGroq && !ai) return fallback("AI unavailable (missing key or AI_FORCE_FALLBACK=1)");
  if (!after) return fallback("missing or unreadable After image");
  if (hasBeforeInput && !before) return reject("unreadable Before image");
  if (!after.mimeType || (before && !before.mimeType)) return reject("missing image MIME type");

  if (useGroq) {
    try {
      const t0 = Date.now();
      const groqParts: GroqContentPart[] = before
        ? [
            { type: "text", text: buildVerificationPrompt(category, { hasBefore: true }) },
            { type: "text", text: "Image 1 (BEFORE):" },
            { type: "image_url", image_url: { url: `data:${before.mimeType!};base64,${before.data}` } },
            { type: "text", text: "Image 2 (AFTER):" },
            { type: "image_url", image_url: { url: `data:${after.mimeType};base64,${after.data}` } },
          ]
        : [
            { type: "text", text: buildVerificationPrompt(category, { hasBefore: false, summary }) },
            { type: "text", text: "Image (AFTER):" },
            { type: "image_url", image_url: { url: `data:${after.mimeType};base64,${after.data}` } },
          ];

      const raw = await groqChatCompletion({
        messages: [{ role: "user", content: groqParts }],
        model: GROQ_VISION_MODEL,
        jsonMode: true,
        maxTokens: 350,
        timeoutMs: 20_000,
      });

      const { response, failure } = interpretVerificationReply(raw, complaintId);
      if (failure) console.warn("[verify-fix] FAIL-CLOSED rejection:", failure);
      console.info(`[verify-fix] groq vision in ${Date.now() - t0}ms`);
      return NextResponse.json(response);
    } catch (err) {
      return fallback(err instanceof Error ? err.message : String(err));
    }
  }

  if (!ai) return fallback("Gemini unavailable");

  const parts = before
    ? [
        { text: buildVerificationPrompt(category, { hasBefore: true }) },
        { text: "Image 1 (BEFORE):" },
        { inlineData: { mimeType: before.mimeType!, data: before.data } },
        { text: "Image 2 (AFTER):" },
        { inlineData: { mimeType: after.mimeType, data: after.data } },
      ]
    : [
        { text: buildVerificationPrompt(category, { hasBefore: false, summary }) },
        { text: "Image (AFTER):" },
        { inlineData: { mimeType: after.mimeType, data: after.data } },
      ];

  try {
    const result = await withTimeout(
      withTransientRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            {
              role: "user",
              parts,
            },
          ],
          config: { responseMimeType: "application/json" },
        }),
      ),
      AI_MULTIMODAL_TIMEOUT_MS,
    );

    // Fail closed: malformed reply → rejecting fallback (passed: false), never a pass.
    const { response, failure } = interpretVerificationReply(result.text, complaintId);
    if (failure) console.warn("[verify-fix] FAIL-CLOSED rejection:", failure);
    return NextResponse.json(response);
  } catch (err) {
    return fallback(err instanceof Error ? err.message : String(err));
  }
}
