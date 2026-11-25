// Shared domain types for Awaaz (see docs/plan.md §4.1)

export type City = "Islamabad" | "Karachi" | "Lahore";

export type Urgency = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type Department = "CDA_SANITATION" | "CDA_ROADS" | "IESCO" | "WASA" | "SNGPL";

export type TicketStatus =
  | "REPORTED"
  | "IN_PROGRESS"
  | "PENDING_COMMUNITY_VERIFICATION"
  | "RESOLVED";

/** Closed list. Source of truth (departments, keywords, photos): lib/categories.ts */
export type IssueCategory =
  | "Open Manhole"
  | "Garbage Heap"
  | "Broken Streetlight"
  | "Pothole"
  | "Sewage Leak"
  | "Live Wire"
  | "Water Outage"
  | "Low Gas Pressure"
  | "Other";

export type Sector = "F-10" | "F-6" | "G-9" | "I-9" | (string & {});

export interface GeoLocation {
  lat: number;
  lng: number;
  city: City | (string & {});
  sector: Sector;
  landmark: string;
}

export interface AIVerificationResult {
  passed: boolean;
  /** ALWAYS 0.0–1.0. Display: Math.round(confidence * 100) + "%" */
  confidence: number;
  verdict: "VERIFIED_RESOLVED" | "REJECTED_UNRESOLVED";
  reasoning: string;
  detectedChanges: string[];
  verifiedAt: string;
  /** true when produced by the DEMO-FALLBACK */
  isOfflineFallback?: boolean;
}

// T3.3: lifecycle event types
export type ComplaintEventType =
  | "REPORTED"
  | "CLAIMED"
  | "AI_VERIFIED"
  | "AI_REJECTED"
  | "COMMUNITY_CONFIRMED"
  | "RESOLVED"
  | "IMPACT_ADDED"
  | "URGENCY_RAISED";

// T3.3: lifecycle history event
export interface ComplaintEvent {
  type: ComplaintEventType;
  status: TicketStatus;
  at: string;        // ISO
  actorId: string;
  actorName: string;
  note?: string;     // e.g. "AI: Lamp now lit and illuminating road."
}

/** Simple flat Facebook/Instagram-style comment. No nested threads, no parentId. */
export interface ComplaintComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  title: string;
  titleUrdu: string;
  urduTranscript: string;
  englishSummary: string;
  /** Local path under /images/hazards/ or an inline SVG data URI. Never an external URL. */
  beforePhotoUrl: string;
  afterPhotoUrl?: string;
  department: Department;
  category: IssueCategory;
  urgency: Urgency;
  status: TicketStatus;
  location: GeoLocation;
  reporter: {
    citizenId: string;
    citizenName: string;
  };
  // T3.3: assigned worker (set on claim)
  assignedTo?: { workerId: string; workerName: string };
  votes: {
    /** upvotes minus downvotes */
    score: number;
    upvotedBy: string[];
    downvotedBy: string[];
  };
  communityImpact: {
    affectedCount: number;
    verifiedCount: number;
    verifiedBy: string[];
    // T4.2: "+1 Impacts Me Too" citizens (normalized on load)
    impactConfirmedBy?: string[];
  };
  comments: ComplaintComment[];
  priorityBreakdown?: {
    /** 1–10 */
    issueSeverity: number;
    publicDensityRisk: "HIGH" | "MEDIUM" | "LOW";
    reasoning: string;
  };
  sla: {
    hoursRemaining: number;
    isBreached: boolean;
    escalationLevel: "STANDARD" | "WARNING" | "ESCALATED_TO_COMMISSIONER";
  };
  aiVerification?: AIVerificationResult;
  // T3.3: lifecycle history. Missing on old data → treat as [] and synthesize a REPORTED event.
  history?: ComplaintEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CitizenProfile {
  /** e.g. "citizen-tariq" */
  id: string;
  name: string;
  role: "CITIZEN" | "WORKER" | "ADMIN";
  city: string;
  /** e.g. "F-10" (empty for anonymous) */
  sector: string;
  occupation: string;
  avatar: string;
}

export type VoteDirection = "up" | "down";
