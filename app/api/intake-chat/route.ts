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
import { buildIntakeChatPrompt, buildIntakeSystemInstruction } from "@/lib/ai/prompts";
import { IntakeChatResponseSchema } from "@/lib/ai/schemas";
import { buildIntakeChatFallback } from "@/lib/ai/mocks";

export const runtime = "nodejs";
export const maxDuration = 60;

interface HistoryTurn {
  role: "user" | "assistant";
  text: string;
  hasPhoto?: boolean;
}

type FallbackKind = "unavailable" | "timeout" | "error";
type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export async function POST(req: Request) {
  let audio: File | null = null;
  let photo: File | null = null;
  let text = "";
  let lang: "en" | "ur" | "roman" = "en";
  let history: HistoryTurn[] = [];

  const fallback = (reason: string, fallbackReason: FallbackKind = "error") => {
    console.warn("[intake-chat] DEMO-FALLBACK:", reason);
    const combinedUserText = [
      ...history.filter((h) => h.role === "user").map((h) => h.text),
      text,
    ]
      .filter(Boolean)
      .join(" ");
    return NextResponse.json({
      ...buildIntakeChatFallback({
        latestText: text,
        combinedText: combinedUserText,
        hasAudio: Boolean(audio),
        hasPhoto: Boolean(photo),
        lang,
      }),
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
    const l = form.get("lang");
    if (l === "ur" || l === "roman" || l === "en") lang = l;
    const rawHistory = form.get("history");
    if (typeof rawHistory === "string" && rawHistory.trim()) {
      const parsed = JSON.parse(rawHistory);
      if (Array.isArray(parsed)) {
        history = parsed.filter(
          (item): item is HistoryTurn =>
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
  if (!audio && !text && !photo) return fallback("empty turn", "error");

  try {
    // Build proper multi-turn contents (user / model), keeping last 8 turns for token efficiency.
    const contents: GeminiContent[] = history
      .slice(-8)
      .filter((h) => h.text.trim().length > 0)
      .map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.text }],
      }));

    const latestParts: GeminiPart[] = [];
    if (text) {
      latestParts.push({ text });
    } else if (photo && !audio) {
      latestParts.push({ text: "I attached this photo of the issue." });
    }

    if (photo) {
      const data = Buffer.from(await photo.arrayBuffer()).toString("base64");
      const mimeType = (photo.type || "image/jpeg").split(";")[0].trim() || "image/jpeg";
      if (mimeType.startsWith("image/")) {
        latestParts.push({ inlineData: { mimeType, data } });
      }
    }

    // Audio turns need JSON so we get both the Urdu transcript and conversational reply.
    if (audio) {
      const data = Buffer.from(await audio.arrayBuffer()).toString("base64");
      const mimeType = (audio.type || "audio/webm").split(";")[0];
      latestParts.unshift({ text: buildIntakeChatPrompt(lang) });
      latestParts.push({ inlineData: { mimeType, data } });
      contents.push({ role: "user", parts: latestParts });

      const result = await withTimeout(
        withTransientRetry(() =>
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
              responseMimeType: "application/json",
              thinkingConfig: { thinkingBudget: 0 },
              maxOutputTokens: 250,
            },
          }),
        ),
        AI_MULTIMODAL_TIMEOUT_MS,
      );

      const raw = result.text ?? "";
      const parsed = IntakeChatResponseSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return fallback(`schema mismatch: ${parsed.error.message}`, "error");
      return NextResponse.json({ ...parsed.data, isOfflineFallback: false });
    }

    // Text / photo turns stream plain conversational text so words appear right away.
    // Wait for the first chunk inside withTimeout so timeouts or empty/failed streams
    // return a proper isOfflineFallback JSON response instead of faking a live stream.
    contents.push({ role: "user", parts: latestParts });
    const streamTimeoutMs = photo ? AI_MULTIMODAL_TIMEOUT_MS : AI_TIMEOUT_MS;
    const stream = await withTimeout(
      withTransientRetry(() =>
        ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction: buildIntakeSystemInstruction(lang),
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens: 150,
          },
        }),
      ),
      streamTimeoutMs,
    );

    const iterator = stream[Symbol.asyncIterator]();
    let firstDelta = "";
    let streamDone = false;
    while (!firstDelta) {
      const next = await withTimeout(iterator.next(), streamTimeoutMs);
      if (next.done) {
        streamDone = true;
        break;
      }
      firstDelta = next.value?.text ?? "";
    }
    if (streamDone && !firstDelta) {
      return fallback("empty stream from Gemini", "error");
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          if (firstDelta) {
            controller.enqueue(encoder.encode(firstDelta));
          }
          while (true) {
            const next = await iterator.next();
            if (next.done) break;
            const delta = next.value?.text ?? "";
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
          controller.close();
        } catch (streamErr) {
          console.warn("[intake-chat] stream error:", streamErr);
          controller.close();
        }
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return fallback(
      err instanceof Error ? err.message : String(err),
      isTimeoutError(err) ? "timeout" : "error",
    );
  }
}
