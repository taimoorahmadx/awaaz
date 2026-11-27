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
import {
  GROQ_TEXT_MODEL,
  GROQ_VISION_MODEL,
  groqChatCompletion,
  groqTranscribeAudio,
  hasGroq,
  type GroqContentPart,
  type GroqMessage,
} from "@/lib/ai/groq";
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

  if (!audio && !text && !photo) return fallback("empty turn", "error");

  const useGroq = hasGroq();
  const ai = useGroq ? null : getGemini();
  if (!useGroq && !ai) return fallback("AI unavailable (missing key or AI_FORCE_FALLBACK=1)", "unavailable");

  try {
    let photoBase64 = "";
    let photoMimeType = "image/jpeg";
    if (photo) {
      photoBase64 = Buffer.from(await photo.arrayBuffer()).toString("base64");
      const rawMime = (photo.type || "image/jpeg").split(";")[0].trim() || "image/jpeg";
      photoMimeType = rawMime.startsWith("image/") ? rawMime : "";
    }

    if (useGroq) {
      const t0 = Date.now();
      let userTranscript = text;
      if (audio) {
        const spoken = await groqTranscribeAudio(audio);
        userTranscript = text ? `${spoken}\n${text}` : spoken;
      }
      if (!userTranscript && !photoBase64) {
        return fallback("empty audio transcript", "error");
      }

      const groqMessages: GroqMessage[] = [
        { role: "system", content: buildIntakeSystemInstruction(lang) },
        ...history
          .slice(-8)
          .filter((h) => h.text.trim().length > 0)
          .map((h) => ({ role: h.role, content: h.text })),
      ];

      const userText = userTranscript || "I attached this photo of the issue.";
      if (photoBase64 && photoMimeType) {
        const parts: GroqContentPart[] = [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: `data:${photoMimeType};base64,${photoBase64}` } },
        ];
        groqMessages.push({ role: "user", content: parts });
      } else {
        groqMessages.push({ role: "user", content: userText });
      }

      const reply = await groqChatCompletion({
        messages: groqMessages,
        model: photoBase64 && photoMimeType ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL,
        maxTokens: 160,
        timeoutMs: 15_000,
      });

      console.info(`[intake-chat] groq reply in ${Date.now() - t0}ms`);
      return NextResponse.json({
        userTranscript,
        reply,
        readyToGenerate: true,
        isOfflineFallback: false,
      });
    }

    if (!ai) return fallback("Gemini unavailable", "unavailable");

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

    if (photoBase64 && photoMimeType) {
      latestParts.push({ inlineData: { mimeType: photoMimeType, data: photoBase64 } });
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

    // Text / photo turns use non-streaming generateContent so neither local dev nor Vercel
    // stalls on SSE chunk buffering. HomeChatIntake handles JSON replies natively.
    contents.push({ role: "user", parts: latestParts });
    const turnTimeoutMs = photo ? AI_MULTIMODAL_TIMEOUT_MS : AI_TIMEOUT_MS;
    const t0 = Date.now();
    const result = await withTimeout(
      withTransientRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction: buildIntakeSystemInstruction(lang),
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens: 150,
          },
        }),
      ),
      turnTimeoutMs,
    );

    const reply = (result.text ?? "").trim();
    if (!reply) {
      return fallback("empty reply from Gemini", "error");
    }
    console.info(`[intake-chat] live reply in ${Date.now() - t0}ms`);
    return NextResponse.json({
      userTranscript: text,
      reply,
      readyToGenerate: true,
      isOfflineFallback: false,
    });
  } catch (err) {
    return fallback(
      err instanceof Error ? err.message : String(err),
      isTimeoutError(err) ? "timeout" : "error",
    );
  }
}
