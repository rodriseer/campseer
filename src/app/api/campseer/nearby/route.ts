import { NextRequest, NextResponse } from "next/server";
import { getCachedNearby, setCachedNearby } from "@/lib/campseer/cache";

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const DEFAULT_RADIUS_KM = 25;
const MAX_RADIUS_KM = 30;
const MAX_RESULTS = 30;
const FETCH_TIMEOUT_MS = 35000;

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface NearbyCampground {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");
  const radiusParam = request.nextUrl.searchParams.get("radiusKm");
  const latNum = lat ? parseFloat(lat) : NaN;
  const lngNum = lng ? parseFloat(lng) : NaN;
  const radiusKm = radiusParam ? parseFloat(radiusParam) : DEFAULT_RADIUS_KM;

  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return NextResponse.json(
      { error: "lat and lng required" },
      { status: 400 }
    );
  }

  const radiusKmCapped = Math.min(MAX_RADIUS_KM, Math.max(10, radiusKm));
  const radiusM = radiusKmCapped * 1000;

  const cached = getCachedNearby<NearbyCampground[]>(
    latNum,
    lngNum,
    radiusKmCapped
  );
  if (cached) {
    return NextResponse.json({ campgrounds: cached });
  }

  const query = `
[out:json][timeout:45];
(
  node(around:${radiusM},${latNum},${lngNum})["tourism"="camp_site"];
  node(around:${radiusM},${latNum},${lngNum})["amenity"="camp_site"];
);
out body;
`.trim();

  let res: Response | null = null;
  let lastError: string | null = null;

  for (const baseUrl of OVERPASS_SERVERS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) break;
      lastError = await res.text();
      console.warn("Overpass API non-OK:", baseUrl, res.status, lastError?.slice(0, 200));
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.warn("Overpass API request failed:", baseUrl, lastError);
    }
  }

  try {
    if (!res?.ok) {
      console.error("Overpass API error (all servers):", lastError?.slice(0, 300));
      return NextResponse.json(
        { error: "Could not fetch nearby campgrounds. Try again in a moment." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      elements?: Array<{
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };

    const seen = new Set<string>();
    const campgrounds: NearbyCampground[] = [];

    for (const el of data.elements ?? []) {
      if (el.type !== "node" || el.lat == null || el.lon == null) continue;
      const lat = el.lat;
      const lon = el.lon;

      const key = `${el.type}-${el.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const name =
        el.tags?.name ??
        el.tags?.operator ??
        `Campground ${el.id}`;

      const distanceKm = haversineDistanceKm(latNum, lngNum, lat, lon);
      campgrounds.push({
        id: key,
        name,
        lat,
        lng: lon,
        distanceKm: Math.round(distanceKm * 10) / 10,
      });
    }

    campgrounds.sort((a, b) => a.distanceKm - b.distanceKm);
    const limited = campgrounds.slice(0, MAX_RESULTS);

    setCachedNearby(latNum, lngNum, radiusKmCapped, limited);

    return NextResponse.json({ campgrounds: limited });
  } catch (e) {
    console.error("Nearby campgrounds error:", e);
    return NextResponse.json(
      { error: "Could not fetch nearby campgrounds" },
      { status: 500 }
    );
  }
}
