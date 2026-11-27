import { NextResponse } from "next/server";
import {
  AI_MULTIMODAL_TIMEOUT_MS,
  AI_TIMEOUT_MS,
  GEMINI_MODEL,
  getGemini,
  isTimeoutError,
  withTimeout,
  withTransientRetry,
} from "@/lib/ai/gemini";
import { AUDIO_TRIAGE_PROMPT } from "@/lib/ai/prompts";
import { AudioAnalysisResponseSchema } from "@/lib/ai/schemas";
import { buildAudioFallback } from "@/lib/ai/mocks";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ConversationTurn {
  role: "user" | "assistant";
  text: string;
}

type FallbackKind = "unavailable" | "timeout" | "error";

// INTEGRATOR NOTE (spec §4.1): request = multipart/form-data { audio?: Blob, photo?: Blob, text?: string, conversation?: string, sectorHint?: string }.
// Response = AudioAnalysisResponse & { isOfflineFallback: boolean }.

export async function POST(req: Request) {
  let audio: File | null = null;
  let photo: File | null = null;
  let text = "";
  let sectorHint = "";
  let conversation: ConversationTurn[] = [];

  // DEMO-FALLBACK: instant, input-aware triage (keyword match on typed text / conversation) so the demo never stalls.
  const fallback = (reason: string, fallbackReason: FallbackKind = "error") => {
    console.warn("[analyze-audio] DEMO-FALLBACK:", reason);
    const citizenHistoryText = conversation
      .filter((t) => t.role === "user")
      .map((t) => t.text)
      .filter(Boolean)
      .join(" ");
    const combinedText = [citizenHistoryText, text].filter(Boolean).join(" ").trim();
    return NextResponse.json({
      ...buildAudioFallback(combinedText, sectorHint),
      isOfflineFallback: true,
      fallbackReason,
    });
  };

  try {
    const form = await req.formData();
    const a = form.get("audio");
    if (a && typeof a !== "string" && a.size > 0) audio = a as File;
    const p = form.get("photo");
    if (p && typeof p !== "string" && p.size > 0) photo = p as File;
    const t = form.get("text");
    if (typeof t === "string") text = t.trim();
    const s = form.get("sectorHint");
    if (typeof s === "string") sectorHint = s.trim();
    const c = form.get("conversation");
    if (typeof c === "string" && c.trim()) {
      const parsed = JSON.parse(c);
      if (Array.isArray(parsed)) {
        conversation = parsed.filter(
          (item): item is ConversationTurn =>
            Boolean(item) &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.text === "string",
        );
      }
    }
  } catch {
    return fallback("invalid form data");
  }

  const ai = getGemini();
  if (!ai) return fallback("Gemini unavailable (missing key or AI_FORCE_FALLBACK=1)", "unavailable");
  if (!audio && !text && !photo && conversation.length === 0) return fallback("no audio, text, or photo provided", "error");

  try {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: AUDIO_TRIAGE_PROMPT },
    ];
    if (conversation.length > 0) {
      const transcript = conversation
        .map((m) => `${m.role === "user" ? "Citizen" : "Awaaz AI"}: ${m.text}`)
        .join("\n");
      parts.push({
        text: `Full intake conversation (prioritize the citizen's latest corrections, location updates, and details):\n${transcript}`,
      });
    }
    if (text) parts.push({ text: `Citizen typed note: ${text}` });
    if (sectorHint) parts.push({ text: `Citizen's home sector (hint only): ${sectorHint}` });
    if (audio) {
      const data = Buffer.from(await audio.arrayBuffer()).toString("base64");
      // MIME passed dynamically from the uploaded blob (webm on Chrome, mp4 on Safari).
      const mimeType = (audio.type || "audio/webm").split(";")[0];
      parts.push({ inlineData: { mimeType, data } });
    }
    if (photo) {
      const data = Buffer.from(await photo.arrayBuffer()).toString("base64");
      const mimeType = (photo.type || "image/jpeg").split(";")[0].trim() || "image/jpeg";
      if (mimeType.startsWith("image/")) {
        parts.push({ inlineData: { mimeType, data } });
      }
    }

    const result = await withTimeout(
      withTransientRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [{ role: "user", parts }],
          config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens: 600,
          },
        }),
      ),
      audio || photo ? AI_MULTIMODAL_TIMEOUT_MS : AI_TIMEOUT_MS,
    );

    const raw = result.text ?? "";
    const parsed = AudioAnalysisResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return fallback(`schema mismatch: ${parsed.error.message}`, "error");
    return NextResponse.json({ ...parsed.data, isOfflineFallback: false });
  } catch (err) {
    return fallback(
      err instanceof Error ? err.message : String(err),
      isTimeoutError(err) ? "timeout" : "error",
    );
  }
}
