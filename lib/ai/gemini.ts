import "server-only";
import { GoogleGenAI } from "@google/genai";

// Server-side only. Never import this file from components/ or any client code.
// gemini-2.0-flash was retired (API 404); use the model the API recommends.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
// Configurable via AI_TIMEOUT_MS (ms). Defaults allow slow multimodal turns on Vercel/local without tripping fallback early.
const parsedTimeout = Number(process.env.AI_TIMEOUT_MS);
export const AI_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 25000;
export const AI_MULTIMODAL_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 45000;

let client: GoogleGenAI | null = null;

/** Returns a lazily-initialised Gemini client, or null if GEMINI_API_KEY is missing or AI_FORCE_FALLBACK=1. */
export function getGemini(): GoogleGenAI | null {
  // AI_FORCE_FALLBACK=1 forces every AI route onto its DEMO-FALLBACK (tests, offline demos).
  if (process.env.AI_FORCE_FALLBACK === "1") return null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

/** Rejects if `promise` does not settle within `ms`. Routes catch this and use the DEMO-FALLBACK. */
export function withTimeout<T>(promise: Promise<T>, ms: number = AI_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function isTimeoutError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("Gemini timeout after ");
}

function isTransientGeminiError(err: unknown): boolean {
  if (isTimeoutError(err)) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(429|502|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg);
}

/** Retries once after a brief delay on fast transient network/429/503 errors (never on timeouts). */
export async function withTransientRetry<T>(fn: () => Promise<T>, delayMs = 500): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isTransientGeminiError(err)) throw err;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fn();
  }
}
