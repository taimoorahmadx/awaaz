import { NextResponse } from "next/server";
import { getGemini, GEMINI_MODEL, withTimeout } from "@/lib/ai/gemini";
import { AUDIO_TRIAGE_PROMPT } from "@/lib/ai/prompts";
import { AudioAnalysisResponseSchema } from "@/lib/ai/schemas";
import { buildAudioFallback } from "@/lib/ai/mocks";

export const runtime = "nodejs";

// INTEGRATOR NOTE (spec §4.1): request = multipart/form-data { audio?: Blob, photo?: Blob, text?: string, sectorHint?: string }.
// Response = AudioAnalysisResponse & { isOfflineFallback: boolean }.

export async function POST(req: Request) {
  let audio: File | null = null;
  let photo: File | null = null;
  let text = "";
  let sectorHint = "";

  // DEMO-FALLBACK: instant, input-aware triage (keyword match on typed text) so the demo never stalls.
  const fallback = (reason: string) => {
    console.warn("[analyze-audio] DEMO-FALLBACK:", reason);
    return NextResponse.json({ ...buildAudioFallback(text, sectorHint), isOfflineFallback: true });
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
  } catch {
    return fallback("invalid form data");
  }

  const ai = getGemini();
  if (!ai) return fallback("Gemini unavailable (missing key or AI_FORCE_FALLBACK=1)");
  if (!audio && !text && !photo) return fallback("no audio, text, or photo provided");

  try {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: AUDIO_TRIAGE_PROMPT },
    ];
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
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts }],
        config: { responseMimeType: "application/json" },
      }),
    );

    const raw = result.text ?? "";
    const parsed = AudioAnalysisResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return fallback(`schema mismatch: ${parsed.error.message}`);
    return NextResponse.json({ ...parsed.data, isOfflineFallback: false });
  } catch (err) {
    return fallback(err instanceof Error ? err.message : String(err));
  }
}
