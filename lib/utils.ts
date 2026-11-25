import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import landmarksData from "@/lib/data/landmarks.json";
import type { Complaint, Department, GeoLocation, IssueCategory, Landmark } from "@/lib/types";

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
export function resolveComplaintLocation(params: {
  gps: GpsReading | null;
  aiLandmark: string;
  typedText: string;
  aiSector: string;
  homeSector: string;
  city: string;
}): { location: GeoLocation; chipLabel: string } {
  const { gps, aiLandmark, typedText, aiSector, homeSector, city } = params;
  const knownSector =
    aiSector && SECTOR_CENTRES[aiSector]
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
