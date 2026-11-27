import "server-only";

// Server-side only. Never import this file from components/ or any client code.
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL ?? "openai/gpt-oss-120b";
export const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL ?? "qwen/qwen3.8-27b";
export const GROQ_WHISPER_MODEL = process.env.GROQ_WHISPER_MODEL ?? "whisper-large-v3";

const TEXT_MODEL_CANDIDATES = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "qwen/qwen3.8-27b",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-20b",
];

const VISION_MODEL_CANDIDATES = [
  "qwen/qwen3.8-27b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
];

const WHISPER_MODEL_CANDIDATES = ["whisper-large-v3", "whisper-large-v3-turbo"];

export type GroqContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string | GroqContentPart[];
}

interface CachedModels {
  key: string;
  ids: string[];
  fetchedAt: number;
}

let modelCache: CachedModels | null = null;
const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;

/** True when GROQ_API_KEY is configured and AI_FORCE_FALLBACK=1 is not set. */
export function hasGroq(): boolean {
  if (process.env.AI_FORCE_FALLBACK === "1") return false;
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

/** Fetches and caches the list of model IDs enabled for this GROQ_API_KEY. */
async function getAvailableModelIds(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (modelCache && modelCache.key === apiKey && now - modelCache.fetchedAt < MODEL_CACHE_TTL_MS) {
    return modelCache.ids;
  }

  const res = await fetch(`${GROQ_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    return [];
  }
  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  const ids = (json.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
  if (ids.length > 0) {
    modelCache = { key: apiKey, ids, fetchedAt: now };
    console.info("[groq] available models:", ids.join(", "));
  }
  return ids;
}

function isChatModel(id: string): boolean {
  return !/whisper|guard|tts|orpheus|safeguard/i.test(id);
}

function isVisionModel(id: string): boolean {
  return /qwen3|vl|vision|scout|maverick/i.test(id) && isChatModel(id);
}

async function resolveCandidates(
  apiKey: string,
  envOverride: string | undefined,
  preferred: string[],
  matcher: (id: string) => boolean,
): Promise<string[]> {
  const available = await getAvailableModelIds(apiKey).catch(() => [] as string[]);
  const base = envOverride ? [envOverride, ...preferred] : [...preferred];

  if (available.length === 0) {
    return Array.from(new Set(base));
  }

  const availableSet = new Set(available);
  const picked = base.filter((id) => availableSet.has(id));
  const extra = available.filter((id) => matcher(id) && !picked.includes(id));
  const combined = [...picked, ...extra];
  return combined.length > 0 ? combined : Array.from(new Set(base));
}

function cleanModelOutput(raw: string): string {
  // Strip <think>...</think> blocks from reasoning models and optional ```json fences.
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(withoutThink);
  return (fenced ? fenced[1] : withoutThink).trim();
}

function hasImageParts(messages: GroqMessage[]): boolean {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((part) => part.type === "image_url"),
  );
}

/** Calls Groq OpenAI-compatible chat completions API with auto-model discovery and JSON mode. */
export async function groqChatCompletion(params: {
  messages: GroqMessage[];
  model?: string;
  jsonMode?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("GROQ_API_KEY missing");

  const { messages, jsonMode = false, maxTokens = 512, timeoutMs = 15_000 } = params;
  const needsVision = hasImageParts(messages);

  const candidates = needsVision
    ? await resolveCandidates(
        apiKey,
        process.env.GROQ_VISION_MODEL,
        VISION_MODEL_CANDIDATES,
        isVisionModel,
      )
    : await resolveCandidates(
        apiKey,
        process.env.GROQ_TEXT_MODEL,
        TEXT_MODEL_CANDIDATES,
        isChatModel,
      );

  let lastError: Error | null = null;
  for (const model of candidates) {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.2,
      max_tokens: Math.max(maxTokens, 512),
    };
    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      lastError = new Error(`Groq ${res.status} (${model}): ${errText.slice(0, 300)}`);
      // Retry next model candidate if this model is unavailable or unsupported.
      if (res.status === 404 || res.status === 400) {
        modelCache = null;
        continue;
      }
      throw lastError;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = cleanModelOutput(data.choices?.[0]?.message?.content ?? "");
    if (!content) {
      lastError = new Error(`Empty reply from Groq (${model})`);
      continue;
    }
    return content;
  }

  throw lastError ?? new Error("No available Groq chat model");
}

/** Transcribes an uploaded audio File (webm, mp4, etc.) via Groq Whisper. */
export async function groqTranscribeAudio(file: File, timeoutMs = 15_000): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("GROQ_API_KEY missing");

  const candidates = await resolveCandidates(
    apiKey,
    process.env.GROQ_WHISPER_MODEL,
    WHISPER_MODEL_CANDIDATES,
    (id) => /whisper/i.test(id),
  );

  let lastError: Error | null = null;
  for (const model of candidates) {
    const form = new FormData();
    form.append("file", file, file.name || "audio.webm");
    form.append("model", model);
    form.append("response_format", "json");

    const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      lastError = new Error(`Groq Whisper ${res.status} (${model}): ${errText.slice(0, 300)}`);
      if (res.status === 404 || res.status === 400) {
        modelCache = null;
        continue;
      }
      throw lastError;
    }

    const data = (await res.json()) as { text?: string };
    return data.text?.trim() ?? "";
  }

  throw lastError ?? new Error("No available Groq Whisper model");
}
