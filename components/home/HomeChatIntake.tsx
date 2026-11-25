"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MapPin, Mic, Plus, Send, X } from "lucide-react";
import type { Complaint, Department, Urgency } from "@/lib/types";
import OfflineBadge from "@/components/common/OfflineBadge";
import WaveformVisualizer from "@/components/audio/WaveformVisualizer";
import { categoryInfo } from "@/lib/categories";
import { base64ToBlob, compressImage, type CompressedImage } from "@/lib/image";

// INTEGRATOR NOTE: local mirror of AudioAnalysisResponse (lib/ai/schemas.ts) + route flags,
// kept local so this client component doesn't import zod schemas.
interface AnalyzeAudioResult {
  urduTranscript: string;
  englishSummary: string;
  title: string;
  titleUrdu: string;
  category: string;
  department: Department;
  urgency: Urgency;
  landmark: string;
  sector: string;
  isOfflineFallback?: boolean;
}

interface HomeChatIntakeProps {
  citizenName: string;
  /** e.g. "citizen-tariq" */
  citizenId?: string;
  /** Citizen's home sector, e.g. "F-10". New pin is placed near it. */
  sector?: string;
  city?: string;
  onComplaintCreated?: (complaint: Complaint) => void;
  /** Called with `true` when the API returned a DEMO-FALLBACK mock. */
  onFallbackChange?: (fallback: boolean) => void;
}

// Approximate sector centres (Islamabad) — matches seed conventions.
const SECTOR_COORDS: Record<string, { lat: number; lng: number }> = {
  "F-10": { lat: 33.695, lng: 73.013 },
  "F-6": { lat: 33.727, lng: 73.075 },
  "G-9": { lat: 33.687, lng: 73.03 },
  "I-9": { lat: 33.655, lng: 73.06 },
};

const SLA_HOURS: Record<Urgency, number> = { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 };

const URGENCY_STYLE: Record<Urgency, string> = {
  CRITICAL: "bg-red-500/15 text-red-300 border-red-500/40",
  HIGH: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  MEDIUM: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  LOW: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

const DEPT_LABEL: Record<Department, string> = {
  CDA_SANITATION: "CDA Sanitation",
  CDA_ROADS: "CDA Roads",
  IESCO: "IESCO",
  WASA: "WASA",
  SNGPL: "SNGPL",
};

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  // Chrome: webm/opus, Safari: mp4 (see AGENTS.md).
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

function toComplaint(
  r: AnalyzeAudioResult,
  citizenId: string,
  citizenName: string,
  homeSector: string,
  city: string,
  photoDataUrl?: string,
): Complaint {
  const sector = r.sector && SECTOR_COORDS[r.sector] ? r.sector : homeSector;
  const base = SECTOR_COORDS[sector] ?? SECTOR_COORDS["F-10"];
  const jitter = () => (Math.random() - 0.5) * 0.006;
  const now = new Date().toISOString();
  // Fixed category table (lib/categories.ts): unknown → "Other"; stock photo per category.
  const info = categoryInfo(r.category);
  return {
    id: `cmp-${Date.now()}`,
    title: r.title,
    titleUrdu: r.titleUrdu,
    urduTranscript: r.urduTranscript,
    englishSummary: r.englishSummary,
    beforePhotoUrl: photoDataUrl || info.photo,
    department: r.department,
    category: info.category,
    urgency: r.urgency,
    status: "REPORTED",
    location: {
      lat: base.lat + jitter(),
      lng: base.lng + jitter(),
      city,
      sector,
      landmark: r.landmark || `${sector} sector`,
    },
    reporter: { citizenId, citizenName },
    votes: { score: 1, upvotedBy: [citizenId], downvotedBy: [] },
    communityImpact: { affectedCount: 1, verifiedCount: 0, verifiedBy: [] },
    comments: [],
    sla: { hoursRemaining: SLA_HOURS[r.urgency], isBreached: false, escalationLevel: "STANDARD" },
    createdAt: now,
    updatedAt: now,
  };
}

export default function HomeChatIntake({
  citizenName,
  citizenId = "citizen-tariq",
  sector = "F-10",
  city = "Islamabad",
  onComplaintCreated,
  onFallbackChange,
}: HomeChatIntakeProps) {
  const urduName = citizenName === "Ayesha" ? "عائشہ بہن" : "طارق بھائی";
  const [text, setText] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState<CompressedImage | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeAudioResult | null>(null);
  const [created, setCreated] = useState<Complaint | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  // Keep latest text/photo in refs so async rec.onstop always sees current values.
  const textRef = useRef(text);
  textRef.current = text;
  const photoRef = useRef(attachedPhoto);
  photoRef.current = attachedPhoto;

  // Stop recorder and mic tracks on unmount.
  useEffect(() => {
    return () => {
      const rec = recorderRef.current;
      if (rec) {
        rec.onstop = null;
        if (rec.state !== "inactive") {
          try {
            rec.stop();
          } catch {
            // ignore
          }
        }
        rec.stream.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
      }
    };
  }, []);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImage(file);
      setAttachedPhoto(compressed);
    } catch {
      setError("Could not process attached photo. Please choose a JPEG, PNG, or WebP image.");
    }
  }

  async function submit(audio: Blob | null, note: string, photo: CompressedImage | null = attachedPhoto) {
    if (!audio && !note.trim() && !photo) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      if (audio) {
        const ext = audio.type.includes("mp4") ? "mp4" : "webm";
        fd.append("audio", audio, `note.${ext}`);
      }
      if (photo) {
        fd.append("photo", base64ToBlob(photo.base64, photo.mimeType), "photo.jpg");
      }
      if (note.trim()) fd.append("text", note.trim());
      if (sector) fd.append("sectorHint", sector);

      const res = await fetch("/api/analyze-audio", { method: "POST", body: fd });
      const data = (await res.json()) as AnalyzeAudioResult;
      const isFallback = Boolean(data.isOfflineFallback);
      setResult(data);
      onFallbackChange?.(isFallback);
      const complaint = toComplaint(data, citizenId, citizenName, sector, city, photo?.dataUrl);
      setCreated(complaint);
      onComplaintCreated?.(complaint);
      setText("");
      setAttachedPhoto(null);
    } catch {
      setError("Could not reach Awaaz AI. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function stopRecording() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
  }

  async function startRecording() {
    if (recording) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
        setRecordingStream(null);
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || "audio/webm" });
        void submit(blob, textRef.current, photoRef.current);
      };
      recorderRef.current = rec;
      rec.start();
      setRecordingStream(stream);
      setRecording(true);
    } catch {
      setError("Microphone unavailable — type your complaint instead.");
    }
  }

  const isFallback = Boolean(result?.isOfflineFallback);
  const canSubmit = Boolean((text.trim() || attachedPhoto) && !recording);

  return (
    <section className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        {!result && !loading && (
          <>
            <span className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-civic-raised text-civic-accent ring-1 ring-civic-border">
              <Bot className="h-8 w-8" aria-hidden="true" />
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">Awaaz</span>
            </span>
            <p className="urdu text-xl text-slate-50" lang="ur">
              السلام علیکم {urduName}! 👋
            </p>
            <p className="text-sm text-civic-muted">How can I help you today?</p>
          </>
        )}

        {recording && (
          <div className="flex items-center gap-2 text-sm text-red-300" role="status">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            Recording… tap ■ to stop
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-civic-muted" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Awaaz AI is triaging your complaint…
          </div>
        )}

        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        {result && !loading && (
          <article
            data-testid="triage-card"
            data-complaint-id={created?.id}
            className="w-full max-w-md rounded-2xl border border-civic-border bg-civic-raised p-4 text-left"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                data-testid="triage-department"
                className="rounded-full border border-civic-accent/40 bg-civic-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-civic-accent"
              >
                {DEPT_LABEL[result.department] ?? result.department}
              </span>
              <span
                data-testid="triage-urgency"
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${URGENCY_STYLE[result.urgency] ?? URGENCY_STYLE.MEDIUM}`}
              >
                {result.urgency}
              </span>
              <OfflineBadge visible={isFallback} />
            </div>
            <h3 className="text-base font-semibold text-slate-50">{result.title}</h3>
            <p className="urdu mt-2 text-right text-lg leading-relaxed text-slate-100" lang="ur" dir="rtl">
              {result.urduTranscript}
            </p>
            <p className="mt-2 text-sm text-civic-muted">{result.englishSummary}</p>
            {created?.beforePhotoUrl.startsWith("data:") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={created.beforePhotoUrl}
                alt={`Attached photo: ${result.title}`}
                data-testid="triage-photo"
                className="mt-3 aspect-video w-full rounded-xl border border-civic-border object-cover"
              />
            )}
            <p className="mt-3 flex items-center gap-1 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
              {created?.location.landmark ?? result.landmark}
              {created ? ` · ${created.location.sector}` : ""}
            </p>
            <p className="mt-2 text-xs text-emerald-300">✓ Filed — pin added to the map.</p>
          </article>
        )}
      </div>

      <form
        className="sticky bottom-16 border-t border-civic-border bg-civic-surface/95 px-3 pb-3 pt-2 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(null, text, attachedPhoto);
        }}
      >
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoSelect}
          className="sr-only"
          data-testid="intake-photo-input"
          aria-label="Choose hazard photo"
        />

        {attachedPhoto && !recording && (
          <div
            data-testid="intake-photo-preview"
            className="mb-2 flex items-center gap-2 rounded-xl border border-civic-border bg-civic-raised p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachedPhoto.dataUrl}
              alt="Attached hazard preview"
              className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-civic-border"
            />
            <span className="min-w-0 flex-1 truncate text-xs text-slate-200">Photo attached (compressed JPEG)</span>
            <button
              type="button"
              onClick={() => setAttachedPhoto(null)}
              aria-label="Remove attached photo"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-civic-muted transition hover:bg-civic-surface hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {recording && recordingStream ? (
          <WaveformVisualizer stream={recordingStream} onStop={stopRecording} onAutoStop={stopRecording} />
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-civic-border bg-civic-raised px-2 py-1.5">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={loading}
              aria-label="Attach photo"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-civic-muted transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent disabled:opacity-50"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
            <label htmlFor="intake-text" className="sr-only">
              Describe issue in Urdu or English
            </label>
            <input
              id="intake-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              placeholder="Describe issue in Urdu or English..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-civic-muted focus:outline-none"
            />
            {canSubmit ? (
              <button
                type="submit"
                aria-label="Send complaint"
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-civic-accent text-civic-bg transition hover:bg-civic-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 disabled:opacity-50"
              >
                <Send className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={loading}
                aria-label="Record Urdu voice note"
                aria-pressed={false}
                className="flex h-10 w-10 shrink-0 animate-soft-pulse items-center justify-center rounded-full bg-civic-accent text-civic-bg transition hover:bg-civic-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 disabled:opacity-50"
              >
                <Mic className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <p className="mt-1.5 text-center text-[11px] text-civic-muted">
          Tap ➕ for photo · Tap 🎙️ for Urdu audio
        </p>
      </form>
    </section>
  );
}
