"use client";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  Mic,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Complaint, Department, GeoLocation, IssueCategory, Urgency } from "@/lib/types";
import OfflineBadge from "@/components/common/OfflineBadge";
import { useLanguage } from "@/components/common/LanguageProvider";
import WaveformVisualizer from "@/components/audio/WaveformVisualizer";
import DuplicateCard from "@/components/home/DuplicateCard";
import { CATEGORIES, CATEGORY_TABLE, categoryInfo } from "@/lib/categories";
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

type FallbackReason = "unavailable" | "timeout" | "error";

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
  fallbackReason?: FallbackReason;
}

interface IntakeChatApiResult {
  userTranscript: string;
  reply: string;
  readyToGenerate: boolean;
  isOfflineFallback?: boolean;
  fallbackReason?: FallbackReason;
}

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  photoDataUrl?: string;
  isVoice?: boolean;
  isOfflineFallback?: boolean;
  fallbackReason?: FallbackReason;
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

const DEPARTMENTS: Department[] = ["CDA_SANITATION", "CDA_ROADS", "IESCO", "WASA", "SNGPL"];
const URGENCIES: Urgency[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

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
  const info = categoryInfo(r.category);
  return {
    id: `cmp-${Date.now()}`,
    title: r.title,
    titleUrdu: r.titleUrdu,
    titleRoman: r.titleRoman,
    urduTranscript: r.urduTranscript,
    englishSummary: r.englishSummary,
    romanSummary: r.romanSummary,
    beforePhotoUrl: photoDataUrl ?? "",
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

  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [text, setText] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState<CompressedImage | null>(null);
  const [activePhoto, setActivePhoto] = useState<CompressedImage | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [sendingChat, setSendingChat] = useState(false);
  const [generatingTicket, setGeneratingTicket] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AnalyzeAudioResult | null>(null);
  const [created, setCreated] = useState<Complaint | null>(null);
  const [pendingComplaint, setPendingComplaint] = useState<Complaint | null>(null);
  const [editingDraft, setEditingDraft] = useState(false);
  const [dirtySinceDraft, setDirtySinceDraft] = useState(false);

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
  const draftPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lastDraftNonceRef = useRef<number | null>(null);

  // Keep latest text/photo/messages in refs so async callbacks always see current values.
  const textRef = useRef(text);
  textRef.current = text;
  const photoRef = useRef(attachedPhoto);
  photoRef.current = attachedPhoto;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Apply pre-filled draft from Groups "Convert to Ticket" without auto-submitting (AC-9.5).
  useEffect(() => {
    if (initialDraft && initialDraft.nonce !== lastDraftNonceRef.current) {
      lastDraftNonceRef.current = initialDraft.nonce;
      setMessages([]);
      setText(initialDraft.text);
      setAttachedPhoto(null);
      setActivePhoto(null);
      setResult(null);
      setCreated(null);
      setPendingComplaint(null);
      setEditingDraft(false);
      setDirtySinceDraft(false);
      setDuplicateMatch(null);
      setImpactSubmitted(false);
      setLocationChip("");
      setError(null);
    }
  }, [initialDraft]);

  // Keep latest chat turn / draft card scrolled into view.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sendingChat, generatingTicket, pendingComplaint, created, duplicateMatch]);

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
        rec.stream.getTracks().forEach((tr) => tr.stop());
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

  async function handleDraftPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImage(file);
      setActivePhoto(compressed);
      setPendingComplaint((prev) => (prev ? { ...prev, beforePhotoUrl: compressed.dataUrl } : prev));
    } catch {
      setError("Could not process attached photo. Please choose a JPEG, PNG, or WebP image.");
    }
  }

  function handleRemoveDraftPhoto() {
    setActivePhoto(null);
    setPendingComplaint((prev) => (prev ? { ...prev, beforePhotoUrl: "" } : prev));
  }

  async function sendChatTurn(
    audio: Blob | null,
    note: string,
    photo: CompressedImage | null = attachedPhoto,
  ) {
    if (!audio && !note.trim() && !photo) return;
    const trimmed = note.trim();
    const userTurnId = `turn-u-${Date.now()}`;
    const priorHistory = messagesRef.current.map((m) => ({
      role: m.role,
      text: m.text,
      hasPhoto: Boolean(m.photoDataUrl),
    }));

    const optimisticText =
      trimmed || (audio ? t.home.voiceNoteBadge : photo ? `[${t.home.attachPhoto}]` : "");

    setError(null);
    setSendingChat(true);
    setCreated(null);
    setText("");
    setAttachedPhoto(null);
    if (photo) {
      setActivePhoto(photo);
    }
    if (pendingComplaint) {
      setDirtySinceDraft(true);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: userTurnId,
        role: "user",
        text: optimisticText,
        photoDataUrl: photo?.dataUrl,
        isVoice: Boolean(audio),
      },
    ]);

    try {
      const fd = new FormData();
      if (audio) {
        const ext = audio.type.includes("mp4") ? "mp4" : "webm";
        fd.append("audio", audio, `note.${ext}`);
      }
      if (photo) {
        fd.append("photo", base64ToBlob(photo.base64, photo.mimeType), "photo.jpg");
      }
      if (trimmed) fd.append("text", trimmed);
      fd.append("lang", lang);
      if (priorHistory.length > 0) {
        fd.append("history", JSON.stringify(priorHistory));
      }

      const res = await fetch("/api/intake-chat", { method: "POST", body: fd });
      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("text/plain") && res.body) {
        onFallbackChange?.(false);
        const assistantId = `turn-a-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", text: "", isOfflineFallback: false },
        ]);
        setSendingChat(false);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const snapshot = accumulated;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, text: snapshot } : m)),
          );
        }
        return;
      }

      const data = (await res.json()) as IntakeChatApiResult;
      const isFallback = Boolean(data.isOfflineFallback);
      onFallbackChange?.(isFallback);
      if (isFallback && data.fallbackReason === "timeout" && typeof navigator !== "undefined" && navigator.onLine) {
        toast.warning("Awaaz AI timed out — showing a quick local reply.", { id: "ai-timeout-fallback" });
      }

      const resolvedTranscript = data.userTranscript?.trim() || optimisticText;

      setMessages((prev) => [
        ...prev.map((m) => (m.id === userTurnId ? { ...m, text: resolvedTranscript } : m)),
        {
          id: `turn-a-${Date.now()}`,
          role: "assistant",
          text: data.reply,
          isOfflineFallback: isFallback,
          fallbackReason: data.fallbackReason,
        },
      ]);
    } catch {
      setError("Could not reach Awaaz AI. Please try again.");
    } finally {
      setSendingChat(false);
    }
  }

  async function handleGenerateTicket() {
    if (messages.length === 0 || generatingTicket || sendingChat) return;
    setGeneratingTicket(true);
    setError(null);
    setCreated(null);
    setDuplicateMatch(null);
    setImpactSubmitted(false);

    try {
      const fd = new FormData();
      const conversationPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));
      fd.append("conversation", JSON.stringify(conversationPayload));
      let lastPhotoTurnIdx = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].photoDataUrl) {
          lastPhotoTurnIdx = i;
          break;
        }
      }
      const photoAlreadyDescribedByAi =
        lastPhotoTurnIdx >= 0 &&
        messages
          .slice(lastPhotoTurnIdx + 1)
          .some((m) => m.role === "assistant" && !m.isOfflineFallback && m.text.trim().length > 0);
      if (activePhoto && !photoAlreadyDescribedByAi) {
        fd.append("photo", base64ToBlob(activePhoto.base64, activePhoto.mimeType), "photo.jpg");
      }
      const effectiveHomeSector = selectedSector || sector;
      if (effectiveHomeSector) fd.append("sectorHint", effectiveHomeSector);

      const gpsPromise = manualGps ? Promise.resolve(manualGps) : getCurrentGpsPosition();
      const [res, gps] = await Promise.all([
        fetch("/api/analyze-audio", { method: "POST", body: fd }),
        gpsPromise,
      ]);
      const data = (await res.json()) as AnalyzeAudioResult;
      const isFallback = Boolean(data.isOfflineFallback);
      setResult(data);
      onFallbackChange?.(isFallback);
      if (isFallback && data.fallbackReason === "timeout" && typeof navigator !== "undefined" && navigator.onLine) {
        toast.warning("AI ticket generation timed out — created a local draft you can edit.", {
          id: "ai-timeout-fallback",
        });
      }

      const combinedCitizenText = messages
        .filter((m) => m.role === "user")
        .map((m) => m.text)
        .join(" ");

      const { location, chipLabel } = resolveComplaintLocation({
        gps: selectedSector ? null : gps,
        aiLandmark: data.landmark,
        typedText: combinedCitizenText,
        aiSector: selectedSector || data.sector,
        homeSector: effectiveHomeSector,
        city,
      });
      setLocationChip(chipLabel);

      const draft = toComplaint(data, citizenId, citizenName, location, activePhoto?.dataUrl);
      setPendingComplaint(draft);
      setDirtySinceDraft(false);
      setEditingDraft(false);
    } catch {
      setError("Could not build ticket preview. Please try again.");
    } finally {
      setGeneratingTicket(false);
    }
  }

  function publishComplaint(complaintToSave: Complaint) {
    setCreated(complaintToSave);
    onComplaintCreated?.(complaintToSave);
    setPendingComplaint(null);
    setEditingDraft(false);
    setDuplicateMatch(null);
    setImpactSubmitted(false);
  }

  function handleApproveTicket() {
    if (!pendingComplaint) return;
    const dup = findDuplicateComplaint(getComplaints(), {
      department: pendingComplaint.department,
      category: pendingComplaint.category,
      location: pendingComplaint.location,
    });
    if (dup) {
      setDuplicateMatch(dup);
      return;
    }
    publishComplaint(pendingComplaint);
  }

  function handleImpactMeToo() {
    if (!liveDuplicateComplaint) return;
    const updated = addImpactConfirmation(liveDuplicateComplaint.id, citizenId, citizenName);
    if (updated) {
      setDuplicateMatch((prev) => (prev ? { ...prev, complaint: updated } : null));
    }
    setImpactSubmitted(true);
    setPendingComplaint(null);
    setEditingDraft(false);
  }

  function handleSubmitSeparate() {
    if (!pendingComplaint) return;
    publishComplaint(pendingComplaint);
  }

  function handleDiscardDraft() {
    setPendingComplaint(null);
    setEditingDraft(false);
    setDuplicateMatch(null);
    setImpactSubmitted(false);
    setError(null);
  }

  function handleResetAll() {
    setMessages([]);
    setText("");
    setAttachedPhoto(null);
    setActivePhoto(null);
    setResult(null);
    setCreated(null);
    setPendingComplaint(null);
    setEditingDraft(false);
    setDirtySinceDraft(false);
    setDuplicateMatch(null);
    setImpactSubmitted(false);
    setLocationChip("");
    setError(null);
    onFallbackChange?.(false);
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

  function handleDraftTitleChange(value: string) {
    setPendingComplaint((prev) => {
      if (!prev) return prev;
      if (lang === "ur") return { ...prev, titleUrdu: value };
      if (lang === "roman") return { ...prev, titleRoman: value, title: value };
      return { ...prev, title: value };
    });
  }

  function handleDraftSummaryChange(value: string) {
    setPendingComplaint((prev) => {
      if (!prev) return prev;
      if (lang === "ur") return { ...prev, urduTranscript: value };
      if (lang === "roman") return { ...prev, romanSummary: value, englishSummary: value };
      return { ...prev, englishSummary: value };
    });
  }

  function handleDraftCategoryChange(cat: IssueCategory) {
    const info = CATEGORY_TABLE[cat];
    setPendingComplaint((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        category: cat,
        department: info.department,
        urgency: info.urgency,
      };
    });
  }

  function handleDraftDepartmentChange(dept: Department) {
    setPendingComplaint((prev) => (prev ? { ...prev, department: dept } : prev));
  }

  function handleDraftUrgencyChange(urgency: Urgency) {
    setPendingComplaint((prev) =>
      prev
        ? {
            ...prev,
            urgency,
            sla: { ...prev.sla, hoursRemaining: SLA_HOURS[urgency] },
          }
        : prev,
    );
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
      rec.stream.getTracks().forEach((tr) => tr.stop());
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
        stream.getTracks().forEach((tr) => tr.stop());
        recorderRef.current = null;
        setRecordingStream(null);
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || "audio/webm" });
        void sendChatTurn(blob, textRef.current, photoRef.current);
      };
      recorderRef.current = rec;
      rec.start();
      setRecordingStream(stream);
      setRecording(true);
    } catch {
      setError("Microphone unavailable — type your complaint instead.");
    }
  }

  const isBusy = sendingChat || generatingTicket;
  const isFallback = Boolean(result?.isOfflineFallback);
  const canSubmit = Boolean((text.trim() || attachedPhoto) && !recording && !isBusy);
  const hasUserMessages = messages.some((m) => m.role === "user");
  const activeComplaint = created ?? pendingComplaint;
  const liveDuplicateComplaint = duplicateMatch
    ? (complaints.find((c) => c.id === duplicateMatch.complaint.id) ?? duplicateMatch.complaint)
    : null;

  const activeDraftTitle = activeComplaint
    ? lang === "ur"
      ? activeComplaint.titleUrdu || activeComplaint.title
      : lang === "roman"
        ? activeComplaint.titleRoman || activeComplaint.title
        : activeComplaint.title
    : "";

  const activeDraftSummary = activeComplaint
    ? lang === "ur"
      ? activeComplaint.urduTranscript || activeComplaint.englishSummary
      : lang === "roman"
        ? activeComplaint.romanSummary || activeComplaint.englishSummary
        : activeComplaint.englishSummary
    : "";

  return (
    <section className="flex flex-1 flex-col">
      {/* Hidden input for replacing/adding photo directly inside the Draft Ticket card */}
      <input
        ref={draftPhotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleDraftPhotoSelect}
        className="sr-only"
        aria-label="Replace draft hazard photo"
      />

      <div
        className={`flex flex-1 flex-col gap-3 px-4 py-4 ${
          messages.length === 0 && !activeComplaint && !isBusy ? "items-center justify-center text-center" : ""
        }`}
      >
        {messages.length === 0 && !activeComplaint && !isBusy && (
          <div className="flex max-w-sm flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Awaaz"
              className="h-20 w-20 rounded-2xl object-cover shadow-lg ring-1 ring-civic-border"
            />
            <p
              dir={isRtl ? "rtl" : "ltr"}
              lang={isRtl ? "ur" : "en"}
              className={`text-slate-50 ${isRtl ? "urdu text-xl" : "text-lg font-semibold"}`}
            >
              {t.home.greeting(isRtl ? urduName : citizenName)}
            </p>
            <p
              dir={isRtl ? "rtl" : "ltr"}
              lang={isRtl ? "ur" : "en"}
              className={`text-xs leading-relaxed text-civic-muted ${isRtl ? "urdu text-sm" : ""}`}
            >
              {t.home.chatSubtitle}
            </p>
          </div>
        )}

        {/* Multi-turn conversation thread */}
        {messages.length > 0 && (
          <div className="mx-auto flex w-full max-w-md flex-col gap-2.5" role="log" aria-label="Complaint intake chat">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  data-testid={isUser ? "chat-turn-user" : "chat-turn-assistant"}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? "rounded-br-sm border border-civic-accent/35 bg-civic-accent/15 text-slate-100"
                        : "rounded-bl-sm border border-civic-border bg-civic-raised text-slate-200"
                    }`}
                  >
                    {!isUser && (
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-civic-accent">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        <span>{t.appName} AI</span>
                        <OfflineBadge visible={Boolean(msg.isOfflineFallback)} />
                      </div>
                    )}
                    {isUser && msg.isVoice && (
                      <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-civic-surface/80 px-2 py-0.5 text-[10px] font-medium text-civic-accent">
                        <Mic className="h-2.5 w-2.5" aria-hidden="true" />
                        {t.home.voiceNoteBadge}
                      </span>
                    )}
                    {msg.photoDataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.photoDataUrl}
                        alt="Attached hazard"
                        className="mb-2 max-h-40 w-full rounded-xl border border-civic-border object-cover"
                      />
                    )}
                    <p
                      dir={isRtl ? "rtl" : "ltr"}
                      lang={isRtl ? "ur" : "en"}
                      className={`whitespace-pre-wrap ${isRtl ? "urdu text-right text-base leading-relaxed" : ""}`}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}

            {sendingChat && (
              <div className="flex items-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-civic-border bg-civic-raised px-3.5 py-2 text-xs text-civic-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-civic-accent" aria-hidden="true" />
                  {t.home.thinkingReply}
                </div>
              </div>
            )}
          </div>
        )}

        {generatingTicket && (
          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-2xl border border-civic-border bg-civic-raised px-4 py-3 text-sm text-civic-muted" role="status">
            <Loader2 className="h-4 w-4 animate-spin text-civic-accent" aria-hidden="true" />
            {t.home.generatingTicket}
          </div>
        )}

        {error && (
          <p className="mx-auto w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300" role="alert">
            {error}
          </p>
        )}

        {/* Draft Preview / Published Ticket Card */}
        {activeComplaint && !generatingTicket && (
          <article
            data-testid="triage-card"
            data-complaint-id={created?.id}
            className={`mx-auto w-full max-w-md rounded-2xl border p-4 text-left ${
              created
                ? "border-emerald-500/40 bg-civic-raised"
                : "border-civic-accent/40 bg-civic-raised shadow-lg shadow-black/30"
            }`}
          >
            {/* Draft header bar with Edit button */}
            {pendingComplaint && (
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-civic-border pb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-civic-accent/40 bg-civic-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-civic-accent">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {t.home.draftBadge}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingDraft((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:border-civic-accent/50 hover:text-civic-accent"
                >
                  {editingDraft ? <Check className="h-3 w-3" aria-hidden="true" /> : <Pencil className="h-3 w-3" aria-hidden="true" />}
                  {editingDraft ? t.home.doneEditing : t.home.editDetails}
                </button>
              </div>
            )}

            {/* Badges row */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                data-testid="triage-department"
                className="rounded-full border border-civic-accent/40 bg-civic-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-civic-accent"
              >
                {t.departments[activeComplaint.department] ?? DEPT_LABEL[activeComplaint.department] ?? activeComplaint.department}
              </span>
              <span
                data-testid="triage-urgency"
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${URGENCY_STYLE[activeComplaint.urgency] ?? URGENCY_STYLE.MEDIUM}`}
              >
                {lang === "en" ? activeComplaint.urgency : (t.urgencies[activeComplaint.urgency] ?? activeComplaint.urgency)}
              </span>
              <span className="rounded-full border border-civic-border bg-civic-surface px-2.5 py-0.5 text-[11px] text-slate-300">
                {t.categories[activeComplaint.category] ?? activeComplaint.category}
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

            {pendingComplaint && editingDraft ? (
              <div className="mt-3 space-y-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-civic-muted">{t.home.titleLabel}</label>
                  <input
                    type="text"
                    value={activeDraftTitle}
                    onChange={(e) => handleDraftTitleChange(e.target.value)}
                    dir={isRtl ? "rtl" : "ltr"}
                    className={`w-full rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent ${isRtl ? "urdu text-right" : ""}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-civic-muted">{t.home.descriptionLabel}</label>
                  <textarea
                    rows={3}
                    value={activeDraftSummary}
                    onChange={(e) => handleDraftSummaryChange(e.target.value)}
                    dir={isRtl ? "rtl" : "ltr"}
                    className={`w-full rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1.5 text-xs leading-relaxed text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent ${isRtl ? "urdu text-right text-sm" : ""}`}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-civic-muted">{t.home.categoryLabel}</label>
                    <select
                      aria-label={t.home.categoryLabel}
                      value={pendingComplaint.category}
                      onChange={(e) => handleDraftCategoryChange(e.target.value as IssueCategory)}
                      className="w-full rounded-lg border border-civic-border bg-civic-surface px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {t.categories[cat] ?? cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-civic-muted">{t.home.departmentLabel}</label>
                    <select
                      aria-label={t.home.departmentLabel}
                      value={pendingComplaint.department}
                      onChange={(e) => handleDraftDepartmentChange(e.target.value as Department)}
                      className="w-full rounded-lg border border-civic-border bg-civic-surface px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {t.departments[dept] ?? DEPT_LABEL[dept]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-civic-muted">{t.home.urgencyLabel}</label>
                    <select
                      aria-label={t.home.urgencyLabel}
                      value={pendingComplaint.urgency}
                      onChange={(e) => handleDraftUrgencyChange(e.target.value as Urgency)}
                      className="w-full rounded-lg border border-civic-border bg-civic-surface px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent"
                    >
                      {URGENCIES.map((u) => (
                        <option key={u} value={u}>
                          {lang === "en" ? u : (t.urgencies[u] ?? u)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3
                  dir={isRtl ? "rtl" : "ltr"}
                  lang={isRtl ? "ur" : "en"}
                  className={`font-semibold text-slate-50 ${isRtl ? "urdu text-right text-lg leading-relaxed" : "text-base"}`}
                >
                  {activeDraftTitle}
                </h3>
                <p
                  dir={isRtl ? "rtl" : "ltr"}
                  lang={isRtl ? "ur" : "en"}
                  className={`mt-2 leading-relaxed text-civic-muted ${
                    isRtl ? "urdu text-right text-base text-slate-100" : "text-sm"
                  }`}
                >
                  {activeDraftSummary}
                </p>
              </>
            )}

            {/* Photo preview + swap/remove controls while in draft */}
            {activeComplaint.beforePhotoUrl.startsWith("data:") ? (
              <div className="relative mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeComplaint.beforePhotoUrl}
                  alt={`Attached photo: ${activeDraftTitle}`}
                  data-testid="triage-photo"
                  className="aspect-video w-full rounded-xl border border-civic-border object-cover"
                />
                {pendingComplaint && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => draftPhotoInputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:text-civic-accent"
                    >
                      <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                      {t.home.replacePhoto}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveDraftPhoto}
                      className="inline-flex items-center gap-1 rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:text-red-300"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      {t.home.removeAttachedPhoto}
                    </button>
                  </div>
                )}
              </div>
            ) : pendingComplaint ? (
              <button
                type="button"
                onClick={() => draftPhotoInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-civic-border bg-civic-surface/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-civic-accent/60 hover:text-civic-accent"
              >
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                {t.home.addPhoto}
              </button>
            ) : null}

            <p className="mt-3 flex items-center gap-1 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
              {activeComplaint.location.landmark}
              {activeComplaint.location.sector ? ` · ${activeComplaint.location.sector}` : ""}
            </p>

            {/* Location quick editor + Approve / Discard actions on Draft */}
            {pendingComplaint && !duplicateMatch && (
              <div className="mt-3 space-y-2.5 border-t border-civic-border pt-3">
                <div className="flex items-center gap-2">
                  <select
                    aria-label={t.home.sectorLabel}
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
                    aria-label={t.home.landmarkLabel}
                    value={pendingComplaint.location.landmark}
                    onChange={(e) => handleDraftLandmarkChange(e.target.value)}
                    placeholder={t.home.landmarkLabel}
                    className="min-w-0 flex-1 rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-civic-muted focus:outline-none focus:ring-2 focus:ring-civic-accent"
                  />
                </div>
                <p className="text-[11px] text-civic-muted">{t.home.editTip}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApproveTicket}
                    data-testid="approve-submit-ticket-btn"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-civic-accent px-3 py-2 text-xs font-semibold text-civic-bg transition hover:bg-civic-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {t.home.approveSubmit}
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    aria-label={t.home.discardDraft}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs font-medium text-slate-300 transition hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.home.discardDraft}
                  </button>
                </div>
              </div>
            )}

            {created ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-civic-border pt-2.5">
                <p className="text-xs font-medium text-emerald-300">✓ {t.home.ticketFiled}</p>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-1 rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:text-civic-accent"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  {t.home.reportAnother}
                </button>
              </div>
            ) : impactSubmitted ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-civic-border pt-2.5">
                <p className="text-xs font-medium text-emerald-300">✓ {t.home.impactsMeToo}</p>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-1 rounded-lg border border-civic-border bg-civic-surface px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:text-civic-accent"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  {t.home.reportAnother}
                </button>
              </div>
            ) : duplicateMatch ? (
              <p className="mt-2 text-xs text-amber-300">⚠ {t.home.duplicateDetected}</p>
            ) : null}
          </article>
        )}

        {liveDuplicateComplaint && duplicateMatch && !generatingTicket && (
          <div className="mx-auto w-full max-w-md">
            <DuplicateCard
              complaint={liveDuplicateComplaint}
              distanceMeters={duplicateMatch.distanceMeters}
              citizenId={citizenId}
              impactSubmitted={impactSubmitted}
              onImpactMeToo={handleImpactMeToo}
              onSubmitSeparate={handleSubmitSeparate}
            />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Sticky Chat Composer + Generate Ticket Action Strip */}
      <form
        className="sticky bottom-16 border-t border-civic-border bg-civic-surface/95 px-3 pb-6 pt-2.5 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          void sendChatTurn(null, text, attachedPhoto);
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

        {/* Ready-to-Generate bar once citizen starts chatting */}
        {hasUserMessages && !created && !recording && (!pendingComplaint || dirtySinceDraft) && (
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleGenerateTicket()}
              disabled={isBusy}
              data-testid="generate-ticket-btn"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-civic-accent px-3 py-2 text-xs font-semibold text-civic-bg shadow-sm transition hover:bg-civic-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 disabled:opacity-50"
            >
              {generatingTicket ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {pendingComplaint ? t.home.updateTicket : t.home.generateTicket}
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              disabled={isBusy}
              aria-label={t.home.clearChat}
              className="inline-flex items-center gap-1 rounded-xl border border-civic-border bg-civic-raised px-3 py-2 text-xs font-medium text-civic-muted transition hover:text-slate-100 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t.home.clearChat}
            </button>
          </div>
        )}

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
            <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{t.home.attachPhoto}</span>
            <button
              type="button"
              onClick={() => setAttachedPhoto(null)}
              aria-label={t.home.removePhoto}
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
              <option value="">{t.home.locationLabel}: Auto-detect</option>
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
              disabled={isBusy}
              aria-label={t.home.attachPhoto}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-civic-muted transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent disabled:opacity-50"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setShowLocationPicker((v) => !v)}
              disabled={isBusy}
              aria-label="Set location"
              aria-pressed={showLocationPicker}
              className={`flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-accent disabled:opacity-50 ${
                selectedSector || manualGps
                  ? "bg-civic-accent/15 text-civic-accent"
                  : "text-civic-muted hover:text-slate-100"
              }`}
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {(selectedSector || manualGps) && <span>{selectedSector || "GPS"}</span>}
            </button>
            <label htmlFor="intake-text" className="sr-only">
              Describe issue in Urdu or English
            </label>
            <input
              id="intake-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isBusy}
              dir={isRtl ? "rtl" : "ltr"}
              placeholder={t.home.placeholder}
              className={`min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-civic-muted focus:outline-none ${isRtl ? "urdu text-right" : ""}`}
            />
            {canSubmit || text.trim() || attachedPhoto ? (
              <button
                type="submit"
                aria-label={t.home.sendComplaint}
                disabled={!canSubmit}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-civic-accent text-civic-bg transition hover:bg-civic-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 disabled:opacity-50"
              >
                <Send className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={isBusy}
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
