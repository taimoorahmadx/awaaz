"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import type { AIVerificationResult, Complaint } from "@/lib/types";
import OfflineBadge from "@/components/common/OfflineBadge";
import { compressImage } from "@/lib/image";

interface BeforeAfterViewerProps {
  complaint: Complaint;
  onUpdateComplaint: (complaint: Complaint) => void;
}

// INTEGRATOR NOTE: /api/verify-fix contract is docs/spec.md §4.2. Request: { complaintId,
// beforePhotoBase64, beforeMimeType, afterPhotoBase64, afterMimeType, category }; base64 strings are
// RAW (no "data:...;base64," prefix). Response: { passed, confidence (0.0–1.0), verdict, reasoning,
// detectedChanges, timestamp, complaintId, isOfflineFallback }. `passed` is decided server-side only.
interface VerifyResponse {
  passed: boolean;
  confidence: number;
  verdict: AIVerificationResult["verdict"];
  reasoning: string;
  detectedChanges: string[];
  timestamp: string;
  complaintId: string;
  isOfflineFallback: boolean;
}

const pct = (confidence: number) => `${Math.round(confidence * 100)}%`;

/** Splits a data URL into mime + raw base64. */
function splitDataUrl(dataUrl: string): { mime: string; base64: string } {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  return match ? { mime: match[1], base64: match[2] } : { mime: "application/octet-stream", base64: dataUrl };
}

async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load Before photo (${res.status})`);
  const compressed = await compressImage(await res.blob());
  return compressed.dataUrl;
}

export default function BeforeAfterViewer({ complaint, onUpdateComplaint }: BeforeAfterViewerProps) {
  const [afterDataUrl, setAfterDataUrl] = useState<string | null>(complaint.afterPhotoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const alreadyVerified = complaint.status === "PENDING_COMMUNITY_VERIFICATION" || complaint.status === "RESOLVED";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setResult(null);
    setError(null);
    try {
      const compressed = await compressImage(file);
      setAfterDataUrl(compressed.dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process image.");
    }
  }

  async function handleVerify() {
    if (!afterDataUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const before = splitDataUrl(await urlToDataUrl(complaint.beforePhotoUrl));
      const after = splitDataUrl(afterDataUrl);
      const res = await fetch("/api/verify-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: complaint.id,
          beforePhotoBase64: before.base64,
          afterPhotoBase64: after.base64,
          beforeMimeType: before.mime,
          afterMimeType: after.mime,
          category: complaint.category,
        }),
      });
      if (!res.ok) throw new Error(`Verification failed (${res.status})`);
      const data = (await res.json()) as VerifyResponse;
      setResult(data);
      const now = new Date().toISOString();
      const aiVerification: AIVerificationResult = {
        passed: data.passed === true,
        confidence: data.confidence,
        verdict: data.verdict,
        reasoning: data.reasoning,
        detectedChanges: data.detectedChanges ?? [],
        verifiedAt: data.timestamp ?? now,
        isOfflineFallback: data.isOfflineFallback === true,
      };
      if (aiVerification.passed) {
        // AC-4.5: pass → awaiting community sign-off.
        onUpdateComplaint({
          ...complaint,
          status: "PENDING_COMMUNITY_VERIFICATION",
          afterPhotoUrl: afterDataUrl,
          aiVerification,
          updatedAt: now,
          history: [
            ...(complaint.history ?? []),
            {
              type: "AI_VERIFIED" as const,
              status: "PENDING_COMMUNITY_VERIFICATION" as const,
              at: now,
              actorId: "worker-sajid",
              actorName: "Sajid",
              note: data.reasoning,
            },
          ],
        });
      } else {
        // AC-4.6: rejection is stored, status stays IN_PROGRESS so the worker can retry.
        onUpdateComplaint({
          ...complaint,
          status: "IN_PROGRESS",
          aiVerification,
          updatedAt: now,
          history: [
            ...(complaint.history ?? []),
            {
              type: "AI_REJECTED" as const,
              status: "IN_PROGRESS" as const,
              at: now,
              actorId: "worker-sajid",
              actorName: "Sajid",
              note: data.reasoning,
            },
          ],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <figure className="flex flex-col gap-1">
          <figcaption className="text-[11px] uppercase tracking-wider text-civic-muted">Before</figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={complaint.beforePhotoUrl}
            alt={`Before: ${complaint.title}`}
            className="aspect-square w-full rounded-xl object-cover ring-1 ring-civic-border"
          />
        </figure>
        <figure className="flex flex-col gap-1">
          <figcaption className="text-[11px] uppercase tracking-wider text-civic-muted">After</figcaption>
          {afterDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={afterDataUrl}
              alt={`After: ${complaint.title}`}
              className="aspect-square w-full rounded-xl object-cover ring-1 ring-civic-border"
            />
          ) : (
            <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-civic-border text-xs text-civic-muted hover:text-slate-200">
              <Upload className="h-5 w-5" aria-hidden="true" />
              Upload Fix
              <input type="file" accept="image/*" className="sr-only" onChange={handleFile} data-testid="after-photo-input" />
            </label>
          )}
        </figure>
      </div>

      {!alreadyVerified && (
        <div className="flex gap-2">
          {afterDataUrl && (
            <label className="cursor-pointer rounded-lg border border-civic-border px-3 py-2 text-xs text-civic-muted hover:text-slate-200">
              Change photo
              <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
            </label>
          )}
          <button
            type="button"
            onClick={handleVerify}
            data-testid="verify-fix-button"
            disabled={!afterDataUrl || loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-civic-accent px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {loading ? "Verifying…" : "Verify Fix"}
          </button>
        </div>
      )}

      <div aria-live="polite">
        {result?.passed && (
          <p
            data-testid="ai-verified-badge"
            className="flex items-start gap-2 rounded-lg bg-green-500/15 px-3 py-2 text-xs text-green-300 ring-1 ring-green-500/40">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>AI Verified</strong> ({pct(result.confidence)}): {result.reasoning}
            </span>
          </p>
        )}
        {result && !result.passed && (
          <p
            data-testid="ai-rejected-badge"
            className="flex items-start gap-2 rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300 ring-1 ring-red-500/40">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>AI Rejected</strong> ({pct(result.confidence)}): {result.reasoning}
            </span>
          </p>
        )}
        {result && <OfflineBadge visible={result.isOfflineFallback === true} className="mt-2" />}
        {!result && alreadyVerified && complaint.aiVerification && (
          <>
            <p
              data-testid="ai-verified-badge"
              className="flex items-start gap-2 rounded-lg bg-green-500/15 px-3 py-2 text-xs text-green-300 ring-1 ring-green-500/40">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>AI Verified</strong> ({pct(complaint.aiVerification.confidence)}):{" "}
                {complaint.aiVerification.reasoning}
              </span>
            </p>
            <OfflineBadge visible={complaint.aiVerification.isOfflineFallback === true} className="mt-2" />
          </>
        )}
        {!result && !alreadyVerified && complaint.aiVerification && !complaint.aiVerification.passed && (
          <>
            <p
              data-testid="ai-rejected-badge"
              className="flex items-start gap-2 rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300 ring-1 ring-red-500/40">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>AI Rejected</strong> ({pct(complaint.aiVerification.confidence)}):{" "}
                {complaint.aiVerification.reasoning}
              </span>
            </p>
            <OfflineBadge visible={complaint.aiVerification.isOfflineFallback === true} className="mt-2" />
          </>
        )}
        {error && <p className="text-xs text-red-300" role="alert">{error}</p>}
      </div>
    </div>
  );
}
