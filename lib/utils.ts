import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import landmarksData from "@/lib/data/landmarks.json";
import type {
  CivicGrade,
  Complaint,
  Department,
  GeoLocation,
  IssueCategory,
  Landmark,
  SectorHealth,
} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ISLAMABAD_BOX = {
  minLat: 33.5,
  maxLat: 33.8,
  minLng: 72.8,
  maxLng: 73.3,
} as const;

export const GPS_MAX_ACCURACY_METERS = 100;
export const DUPLICATE_RADIUS_METERS = 50;

export const LANDMARKS: Landmark[] = landmarksData.landmarks;
export const SECTOR_CENTRES: Record<string, { lat: number; lng: number }> = landmarksData.sectorCentres;

export function isInIslamabadBox(lat: number, lng: number): boolean {
  return (
    lat >= ISLAMABAD_BOX.minLat &&
    lat <= ISLAMABAD_BOX.maxLat &&
    lng >= ISLAMABAD_BOX.minLng &&
    lng <= ISLAMABAD_BOX.maxLng
  );
}

/** Great-circle Haversine distance in meters between two coordinates. */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function nearestSector(lat: number, lng: number): string {
  let best = "F-10";
  let bestDist = Infinity;
  for (const [sector, coords] of Object.entries(SECTOR_CENTRES)) {
    const d = haversineMeters({ lat, lng }, coords);
    if (d < bestDist) {
      bestDist = d;
      best = sector;
    }
  }
  return best;
}

/**
 * Normalized lowercase substring match against `landmarks.json` aliases.
 * Prefers entries in `preferredSector`; first match wins.
 */
export function matchLandmark(queryTexts: string[], preferredSector?: string): Landmark | null {
  const haystack = queryTexts
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
  if (!haystack) return null;

  const ordered = preferredSector
    ? [
        ...LANDMARKS.filter((l) => l.sector === preferredSector),
        ...LANDMARKS.filter((l) => l.sector !== preferredSector),
      ]
    : LANDMARKS;

  for (const lm of ordered) {
    if (lm.aliases.some((alias) => haystack.includes(alias.toLowerCase()))) {
      return lm;
    }
  }
  return null;
}

export interface GpsReading {
  lat: number;
  lng: number;
  accuracy: number;
}

/** Requests GPS coordinates with AC-11.3 options; never throws (returns null on error/denial). */
export function getCurrentGpsPosition(): Promise<GpsReading | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
    );
  });
}

/**
 * Resolves coordinates per AC-11.3:
 * 1. GPS (accuracy ≤ 100m and inside Islamabad bounding box)
 * 2. Landmark match against landmarks.json (no jitter)
 * 3. Sector centre + small jitter
 */
export function extractSectorFromText(text: string): string {
  const upper = text.toUpperCase();
  for (const sector of Object.keys(SECTOR_CENTRES)) {
    const escaped = sector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Z0-9])${escaped}([^A-Z0-9]|$)`).test(upper)) {
      return sector;
    }
  }
  return "";
}

export function resolveComplaintLocation(params: {
  gps: GpsReading | null;
  aiLandmark: string;
  typedText: string;
  aiSector: string;
  homeSector: string;
  city: string;
}): { location: GeoLocation; chipLabel: string } {
  const { gps, aiLandmark, typedText, aiSector, homeSector, city } = params;
  const textSector = extractSectorFromText(typedText);
  const knownSector =
    textSector && SECTOR_CENTRES[textSector]
      ? textSector
      : aiSector && SECTOR_CENTRES[aiSector]
        ? aiSector
        : homeSector && SECTOR_CENTRES[homeSector]
          ? homeSector
          : "";

  if (gps && gps.accuracy <= GPS_MAX_ACCURACY_METERS && isInIslamabadBox(gps.lat, gps.lng)) {
    const sector = knownSector || nearestSector(gps.lat, gps.lng);
    return {
      location: {
        lat: gps.lat,
        lng: gps.lng,
        city,
        sector,
        landmark: aiLandmark || `${sector} (GPS)`,
        source: "GPS",
      },
      chipLabel: "📍 GPS",
    };
  }

  const matched = matchLandmark([aiLandmark, typedText], knownSector || undefined);
  if (matched) {
    return {
      location: {
        lat: matched.lat,
        lng: matched.lng,
        city,
        sector: matched.sector,
        landmark: aiLandmark || matched.name,
        source: "LANDMARK",
      },
      chipLabel: `📍 Landmark: ${matched.name}`,
    };
  }

  const fallbackSector = knownSector || "F-10";
  const base = SECTOR_CENTRES[fallbackSector] ?? SECTOR_CENTRES["F-10"];
  const jitter = () => (Math.random() - 0.5) * 0.006;
  return {
    location: {
      lat: base.lat + jitter(),
      lng: base.lng + jitter(),
      city,
      sector: fallbackSector,
      landmark: aiLandmark || `${fallbackSector} sector`,
      source: "SECTOR_CENTRE",
    },
    chipLabel: "📍 Sector estimate",
  };
}

export interface DuplicateMatch {
  complaint: Complaint;
  distanceMeters: number;
}

/**
 * Finds the closest non-RESOLVED complaint with the same department and category within 50m (AC-11.1).
 * Only runs when `location.source` is GPS or LANDMARK (AC-11.3).
 */
export function findDuplicateComplaint(
  complaints: Complaint[],
  candidate: {
    department: Department;
    category: IssueCategory;
    location: GeoLocation;
  },
): DuplicateMatch | null {
  if (candidate.location.source !== "GPS" && candidate.location.source !== "LANDMARK") {
    return null;
  }
  let best: DuplicateMatch | null = null;
  for (const existing of complaints) {
    if (existing.status === "RESOLVED") continue;
    if (existing.department !== candidate.department) continue;
    if (existing.category !== candidate.category) continue;
    const distanceMeters = haversineMeters(existing.location, candidate.location);
    if (distanceMeters <= DUPLICATE_RADIUS_METERS) {
      if (!best || distanceMeters < best.distanceMeters) {
        best = { complaint: existing, distanceMeters };
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Dynamic Civic Health Scorecard (T4.4, AC-12.1 / AC-12.2)
// ---------------------------------------------------------------------------

export const HEALTH_SECTORS = ["F-10", "F-6", "G-9", "I-9"] as const;

export function scoreToGrade(score: number): CivicGrade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

/**
 * Computes per-sector Civic Health score & grade (AC-12.1):
 * score = clamp(0, 100, round(100 - (openCritical*15 + openHigh*8 + openMedium*3) + resolvedRatio*20))
 */
export function computeSectorHealth(complaints: Complaint[]): SectorHealth[] {
  return HEALTH_SECTORS.map((sector) => {
    const sectorComplaints = complaints.filter((c) => c.location.sector === sector);
    const totalComplaints = sectorComplaints.length;
    const resolvedComplaints = sectorComplaints.filter((c) => c.status === "RESOLVED").length;
    const open = sectorComplaints.filter((c) => c.status !== "RESOLVED");

    const openCritical = open.filter((c) => c.urgency === "CRITICAL").length;
    const openHigh = open.filter((c) => c.urgency === "HIGH").length;
    const openMedium = open.filter((c) => c.urgency === "MEDIUM").length;
    const resolvedRatio = totalComplaints > 0 ? resolvedComplaints / totalComplaints : 0;

    const raw =
      100 - (openCritical * 15 + openHigh * 8 + openMedium * 3) + resolvedRatio * 20;
    const score = Math.max(0, Math.min(100, Math.round(raw)));

    return {
      sector,
      score,
      grade: scoreToGrade(score),
      totalComplaints,
      openCritical,
      resolvedComplaints,
    };
  });
}

/** Citywide Civic Health score = rounded mean of the 4 sector scores (AC-12.2). */
export function computeCityHealth(
  input: Complaint[] | SectorHealth[],
): { score: number; grade: CivicGrade; sectors: SectorHealth[] } {
  const sectors =
    input.length > 0 && "grade" in input[0]
      ? (input as SectorHealth[])
      : computeSectorHealth(input as Complaint[]);
  const score =
    sectors.length > 0
      ? Math.round(sectors.reduce((sum, s) => sum + s.score, 0) / sectors.length)
      : 100;
  return { score, grade: scoreToGrade(score), sectors };
}

export function gradeColorClasses(grade: CivicGrade): {
  badge: string;
  text: string;
  bar: string;
  border: string;
} {
  switch (grade) {
    case "A":
      return {
        badge: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
        text: "text-emerald-400",
        bar: "bg-emerald-500",
        border: "border-emerald-500/40",
      };
    case "B":
      return {
        badge: "border-green-500/40 bg-green-500/15 text-green-300",
        text: "text-green-400",
        bar: "bg-green-500",
        border: "border-green-500/40",
      };
    case "C":
      return {
        badge: "border-amber-500/40 bg-amber-500/15 text-amber-300",
        text: "text-amber-400",
        bar: "bg-amber-400",
        border: "border-amber-500/40",
      };
    case "D":
      return {
        badge: "border-orange-500/40 bg-orange-500/15 text-orange-300",
        text: "text-orange-400",
        bar: "bg-orange-500",
        border: "border-orange-500/40",
      };
    case "F":
      return {
        badge: "border-red-500/40 bg-red-500/15 text-red-300",
        text: "text-red-400",
        bar: "bg-red-500",
        border: "border-red-500/40",
      };
  }
}
