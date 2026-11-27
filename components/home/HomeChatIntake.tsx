"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, LocateFixed, MapPin, Mic, Plus, Send, Trash2, X } from "lucide-react";
import type { Complaint, Department, GeoLocation, Urgency } from "@/lib/types";
import OfflineBadge from "@/components/common/OfflineBadge";
import { useLanguage } from "@/components/common/LanguageProvider";
import WaveformVisualizer from "@/components/audio/WaveformVisualizer";
import DuplicateCard from "@/components/home/DuplicateCard";
import { categoryInfo } from "@/lib/categories";
import { base64ToBlob, compressImage, type CompressedImage } from "@/lib/image";
import { addImpactConfirmation, getComplaints, useComplaints } from "@/lib/data/storage";
import {
  SECTOR_CENTRES,
  findDuplicateComplaint,
  getCurrentGpsPosition,
  resolveComplaintLocation,
  type DuplicateMatch,
  type GpsReading,
} from "@/lib/utils";

// INTEGRATOR NOTE: local mirror of AudioAnalysisResponse (lib/ai/schemas.ts) + route flags,
// kept local so this client component doesn't import zod schemas.
interface AnalyzeAudioResult {
  urduTranscript: string;
  englishSummary: string;
  romanSummary?: string;
  title: string;
  titleUrdu: string;
  titleRoman?: string;
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
  /** Pre-filled text from Groups "Convert to Ticket" (never auto-submitted). */
  initialDraft?: { text: string; nonce: number } | null;
  onComplaintCreated?: (complaint: Complaint) => void;
  /** Called with `true` when the API returned a DEMO-FALLBACK mock. */
  onFallbackChange?: (fallback: boolean) => void;
}

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
  location: GeoLocation,
  photoDataUrl?: string,
): Complaint {
  const now = new Date().toISOString();
  // Fixed category table (lib/categories.ts): unknown → "Other"; stock photo per category.
  const info = categoryInfo(r.category);
  return {
    id: `cmp-${Date.now()}`,
    title: r.title,
    titleUrdu: r.titleUrdu,
    titleRoman: r.titleRoman,
    urduTranscript: r.urduTranscript,
    englishSummary: r.englishSummary,
    romanSummary: r.romanSummary,
    beforePhotoUrl: photoDataUrl || info.photo,
    department: r.department,
    category: info.category,
    urgency: r.urgency,
    status: "REPORTED",
    location,
    reporter: { citizenId, citizenName },
    votes: { score: 1, upvotedBy: [citizenId], downvotedBy: [] },
    communityImpact: { affectedCount: 1, verifiedCount: 0, verifiedBy: [], impactConfirmedBy: [] },
    comments: [],
    sla: { hoursRemaining: SLA_HOURS[r.urgency], isBreached: false, escalationLevel: "STANDARD" },
    history: [
      {
        type: "REPORTED",
        status: "REPORTED",
        at: now,
        actorId: citizenId,
        actorName: citizenName,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export default function HomeChatIntake({
  citizenName,
  citizenId = "citizen-tariq",
  sector = "F-10",
  city = "Islamabad",
  initialDraft,
  onComplaintCreated,
  onFallbackChange,
}: HomeChatIntakeProps) {
  const urduName =
    citizenName === "Ayesha"
      ? "عائشہ بہن"
      : citizenName === "Tariq"
        ? "طارق بھائی"
        : "شہری";
  const { complaints } = useComplaints();
  const { lang, t, isRtl } = useLanguage();
  const [text, setText] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState<CompressedImage | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeAudioResult | null>(null);
  const [created, setCreated] = useState<Complaint | null>(null);
  const [pendingComplaint, setPendingComplaint] = useState<Complaint | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [impactSubmitted, setImpactSubmitted] = useState(false);
  const [locationChip, setLocationChip] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [manualGps, setManualGps] = useState<GpsReading | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const lastDraftNonceRef = useRef<number | null>(null);
  // Keep latest text/photo in refs so async rec.onstop always sees current values.
  const textRef = useRef(text);
  textRef.current = text;
  const photoRef = useRef(attachedPhoto);
  photoRef.current = attachedPhoto;

  // Apply pre-filled draft from Groups "Convert to Ticket" without auto-submitting (AC-9.5).
  useEffect(() => {
    if (initialDraft && initialDraft.nonce !== lastDraftNonceRef.current) {
      lastDraftNonceRef.current = initialDraft.nonce;
      setText(initialDraft.text);
      setResult(null);
      setCreated(null);
      setPendingComplaint(null);
      setDuplicateMatch(null);
      setImpactSubmitted(false);
      setLocationChip("");
      setError(null);
    }
  }, [initialDraft]);

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
    setCreated(null);
    setPendingComplaint(null);
    setDuplicateMatch(null);
    setImpactSubmitted(false);
    setLocationChip("");
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
      const effectiveHomeSector = selectedSector || sector;
      if (effectiveHomeSector) fd.append("sectorHint", effectiveHomeSector);

      // AC-11.3: request GPS in parallel with the AI triage call (or reuse manual GPS).
      const gpsPromise = manualGps ? Promise.resolve(manualGps) : getCurrentGpsPosition();
      const [res, gps] = await Promise.all([
        fetch("/api/analyze-audio", { method: "POST", body: fd }),
        gpsPromise,
      ]);
      const data = (await res.json()) as AnalyzeAudioResult;
      const isFallback = Boolean(data.isOfflineFallback);
      setResult(data);
      onFallbackChange?.(isFallback);

      const { location, chipLabel } = resolveComplaintLocation({
        gps: selectedSector ? null : gps,
        aiLandmark: data.landmark,
        typedText: note,
        aiSector: selectedSector || data.sector,
        homeSector: effectiveHomeSector,
        city,
      });
      setLocationChip(chipLabel);

      const complaint = toComplaint(data, citizenId, citizenName, location, photo?.dataUrl);
      const dup = findDuplicateComplaint(getComplaints(), {
        department: complaint.department,
        category: complaint.category,
        location: complaint.location,
      });

      // Always show Draft Preview first — citizen explicitly clicks "Create Ticket" to publish.
      setPendingComplaint(complaint);
      if (dup) {
        setDuplicateMatch(dup);
      }
      setText("");
      setAttachedPhoto(null);
    } catch {
      setError("Could not reach Awaaz AI. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleImpactMeToo() {
    if (!liveDuplicateComplaint) return;
    const updated = addImpactConfirmation(liveDuplicateComplaint.id, citizenId, citizenName);
    if (updated) {
      setDuplicateMatch((prev) => (prev ? { ...prev, complaint: updated } : null));
    }
    setImpactSubmitted(true);
    setPendingComplaint(null);
  }

  function handleDiscardDraft() {
    setResult(null);
    setPendingComplaint(null);
    setDuplicateMatch(null);
    setImpactSubmitted(false);
    setLocationChip("");
    setError(null);
  }

  async function handleUseGps() {
    setGpsLoading(true);
    setError(null);
    const gps = await getCurrentGpsPosition();
    setGpsLoading(false);
    if (gps) {
      setManualGps(gps);
      setSelectedSector("");
      setShowLocationPicker(false);
    } else {
      setError("GPS unavailable — pick a sector manually instead.");
    }
  }

  function handleDraftSectorChange(newSector: string) {
    setPendingComplaint((prev) => {
      if (!prev) return prev;
      const coords = SECTOR_CENTRES[newSector] ?? prev.location;
      return {
        ...prev,
        location: {
          ...prev.location,
          sector: newSector,
          lat: coords.lat,
          lng: coords.lng,
          landmark: prev.location.landmark || `${newSector} sector`,
          source: "SECTOR_CENTRE",
        },
      };
    });
    setLocationChip(`📍 ${newSector}`);
  }

  function handleDraftLandmarkChange(newLandmark: string) {
    setPendingComplaint((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        location: {
          ...prev.location,
          landmark: newLandmark,
        },
      };
    });
  }

  function handleSubmitSeparate() {
    if (!pendingComplaint) return;
    setCreated(pendingComplaint);
    onComplaintCreated?.(pendingComplaint);
    setPendingComplaint(null);
    setDuplicateMatch(null);
    setImpactSubmitted(false);
  }

  function stopRecording() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
  }

  function cancelRecording() {
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
    chunksRef.current = [];
    setRecordingStream(null);
    setRecording(false);
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
  const activeComplaint = created ?? pendingComplaint;
  const liveDuplicateComplaint = duplicateMatch
    ? (complaints.find((c) => c.id === duplicateMatch.complaint.id) ?? duplicateMatch.complaint)
    : null;

  return (
    <section className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-4 text-center">
        {!result && !loading && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Awaaz"
              className="h-20 w-20 rounded-2xl object-cover ring-1 ring-civic-border shadow-lg"
            />
            <p
              dir={isRtl ? "rtl" : "ltr"}
              lang={isRtl ? "ur" : "en"}
              className={`text-slate-50 ${isRtl ? "urdu text-xl" : "text-lg font-semibold"}`}
            >
              {t.home.greeting(isRtl ? urduName : citizenName)}
            </p>
          </>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-civic-muted" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t.home.analyzingPrompt}
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
                {t.departments[result.department] ?? DEPT_LABEL[result.department] ?? result.department}
              </span>
              <span
                data-testid="triage-urgency"
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${URGENCY_STYLE[result.urgency] ?? URGENCY_STYLE.MEDIUM}`}
              >
                {lang === "en" ? result.urgency : (t.urgencies[result.urgency] ?? result.urgency)}
              </span>
              {locationChip && (
                <span
                  data-testid="triage-location-chip"
                  className="rounded-full border border-civic-border bg-civic-surface px-2.5 py-0.5 text-[11px] font-medium text-slate-200"
                >
                  {locationChip}
                </span>
              )}
              <OfflineBadge visible={isFallback} />
            </div>
            <h3
              dir={isRtl ? "rtl" : "ltr"}
              lang={isRtl ? "ur" : "en"}
              className={`font-semibold text-slate-50 ${isRtl ? "urdu text-right text-lg leading-relaxed" : "text-base"}`}
            >
              {lang === "ur"
                ? result.titleUrdu || result.title
                : lang === "roman"
                  ? result.titleRoman || result.title
                  : result.title}
            </h3>
            <p
              dir={isRtl ? "rtl" : "ltr"}
              lang={isRtl ? "ur" : "en"}
              className={`mt-2 leading-relaxed text-civic-muted ${
                isRtl ? "urdu text-right text-base text-slate-100" : "text-sm"
              }`}
            >
              {lang === "ur"
                ? result.urduTranscript || result.englishSummary
                : lang === "roman"
                  ? result.romanSummary || result.englishSummary
                  : result.englishSummary}
            </p>
            {activeComplaint?.beforePhotoUrl.startsWith("data:") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeComplaint.beforePhotoUrl}
                alt={`Attached photo: ${result.title}`}
                data-testid="triage-photo"
                className="mt-3 aspect-video w-full rounded-xl border border-civic-border object-cover"
              />
            )}
            <p className="mt-3 flex items-center gap-1 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
              {activeComplaint?.location.landmark ?? result.landmark}
              {activeComplaint?.location.sector ? ` · ${activeComplaint.location.sector}` : ""}
            </p>

            {pendingComplaint && !duplicateMatch && (
              <div className="mt-3 space-y-2 border-t border-civic-border pt-3">
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Ticket sector"
                    value={pendingComplaint.location.sector}
                    onChange={(e) => handleDraftSectorChange(e.target.value)}
                    className="rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent"
                  >
                    {Object.keys(SECTOR_CENTRES).map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    aria-label="Landmark"
                    value={pendingComplaint.location.landmark}
                    onChange={(e) => handleDraftLandmarkChange(e.target.value)}
                    placeholder="Landmark / street"
                    className="min-w-0 flex-1 rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-civic-muted focus:outline-none focus:ring-2 focus:ring-civic-accent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitSeparate}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-civic-accent px-3 py-2 text-xs font-semibold text-civic-bg transition hover:bg-civic-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Create Ticket
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    aria-label="Discard draft"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs font-medium text-slate-300 transition hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Discard
                  </button>
                </div>
              </div>
            )}

            {created ? (
              <p className="mt-2 text-xs text-emerald-300">✓ Filed — pin added to the map.</p>
            ) : impactSubmitted ? (
              <p className="mt-2 text-xs text-emerald-300">✓ Impact added to existing ticket.</p>
            ) : duplicateMatch ? (
              <p className="mt-2 text-xs text-amber-300">⚠ Possible duplicate nearby — review below.</p>
            ) : null}
          </article>
        )}

        {liveDuplicateComplaint && duplicateMatch && !loading && (
          <DuplicateCard
            complaint={liveDuplicateComplaint}
            distanceMeters={duplicateMatch.distanceMeters}
            citizenId={citizenId}
            impactSubmitted={impactSubmitted}
            onImpactMeToo={handleImpactMeToo}
            onSubmitSeparate={handleSubmitSeparate}
          />
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

        {showLocationPicker && !recording && (
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-civic-border bg-civic-raised p-2">
            <select
              aria-label="Choose sector"
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                if (e.target.value) setManualGps(null);
              }}
              className="min-w-0 flex-1 rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent"
            >
              <option value="">Location: Auto-detect</option>
              {Object.keys(SECTOR_CENTRES).map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleUseGps}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:text-civic-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent disabled:opacity-50"
            >
              {gpsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {manualGps ? "GPS locked" : "Use GPS"}
            </button>
            <button
              type="button"
              onClick={() => setShowLocationPicker(false)}
              aria-label="Close location picker"
              className="flex h-7 w-7 items-center justify-center rounded-full text-civic-muted hover:bg-civic-surface hover:text-slate-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {recording && recordingStream ? (
          <WaveformVisualizer
            stream={recordingStream}
            onStop={stopRecording}
            onCancel={cancelRecording}
            onAutoStop={stopRecording}
          />
        ) : (
          <div className="flex items-center gap-1.5 rounded-full border border-civic-border bg-civic-raised px-2 py-1.5">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={loading}
              aria-label="Attach photo"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-civic-muted transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent disabled:opacity-50"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setShowLocationPicker((v) => !v)}
              disabled={loading}
              aria-label="Set location"
              aria-pressed={showLocationPicker}
              className={`flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent disabled:opacity-50 ${
                selectedSector || manualGps
                  ? "bg-civic-accent/15 text-civic-accent"
                  : "text-civic-muted hover:text-slate-100"
              }`}
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {(selectedSector || manualGps) && (
                <span>{selectedSector || "GPS"}</span>
              )}
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
              dir={isRtl ? "rtl" : "ltr"}
              placeholder={t.home.placeholder}
              className={`min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-civic-muted focus:outline-none ${isRtl ? "urdu text-right" : ""}`}
            />
            {canSubmit ? (
              <button
                type="submit"
                aria-label={t.home.sendComplaint}
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
                aria-label={t.home.startVoice}
                aria-pressed={false}
                className="flex h-10 w-10 shrink-0 animate-soft-pulse items-center justify-center rounded-full bg-civic-accent text-civic-bg transition hover:bg-civic-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 disabled:opacity-50"
              >
                <Mic className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
