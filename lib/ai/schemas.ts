import { z } from "zod";
import type { Department, Urgency } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";

const DEPARTMENTS = ["CDA_SANITATION", "CDA_ROADS", "IESCO", "WASA", "SNGPL"] as const satisfies readonly Department[];
const URGENCIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const satisfies readonly Urgency[];

export const DepartmentSchema = z.enum(DEPARTMENTS).catch("CDA_SANITATION");
export const UrgencySchema = z.enum(URGENCIES).catch("MEDIUM");

/** Model output for /api/analyze-audio (spec §4.1, without the route's isOfflineFallback flag). */
export const AudioAnalysisResponseSchema = z.object({
  urduTranscript: z.string(),
  englishSummary: z.string(),
  title: z.string(),
  titleUrdu: z.string(),
  category: z.enum(CATEGORIES).catch("Other"),
  department: DepartmentSchema,
  urgency: UrgencySchema,
  landmark: z.string().catch(""),
  sector: z.string().catch(""),
  priorityBreakdown: z
    .object({
      issueSeverity: z.number().min(1).max(10),
      publicDensityRisk: z.enum(["HIGH", "MEDIUM", "LOW"]),
      reasoning: z.string(),
    })
    .optional()
    .catch(undefined),
});

/**
 * Model output for /api/verify-fix (spec §5.2). FAIL CLOSED: every field that decides a pass is
 * required, with no defaults or catches. Confidence is validated raw here and normalised to
 * 0.0–1.0 by `normalizeConfidence` in the route.
 */
export const FixVerificationModelSchema = z.object({
  verdict: z.enum(["VERIFIED_RESOLVED", "REJECTED_UNRESOLVED"]),
  reasoning: z.string().trim().min(1),
  confidence: z.number(),
  detectedChanges: z.array(z.string()).default([]),
});

/** /api/verify-fix response (spec §4.2). One name per field; confidence is 0.0–1.0. */
export interface FixVerificationResponse {
  passed: boolean;
  confidence: number;
  verdict: "VERIFIED_RESOLVED" | "REJECTED_UNRESOLVED";
  reasoning: string;
  detectedChanges: string[];
  timestamp: string;
  complaintId: string;
  isOfflineFallback: boolean;
}

/**
 * The single place a model confidence is normalised: 0–1 passes through, 1 < c ≤ 100 is treated
 * as a percentage and divided by 100 once. Anything else (negative, > 100, NaN) → null (invalid).
 */
export function normalizeConfidence(c: number): number | null {
  if (!Number.isFinite(c) || c < 0) return null;
  if (c <= 1) return c;
  if (c <= 100) return c / 100;
  return null;
}

export type AudioAnalysisResponse = z.infer<typeof AudioAnalysisResponseSchema>;
export type FixVerificationModelOutput = z.infer<typeof FixVerificationModelSchema>;
