import { NextRequest, NextResponse } from "next/server";
import { getCachedNearby, setCachedNearby } from "@/lib/campseer/cache";

const RIDB_API_KEY = process.env.RIDB_API_KEY;
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN;

type NearbySource = "RIDB" | "OSM" | "MAPBOX";

interface NearbyCampsite {
  name: string;
  lat: number;
  lng: number;
  distance_km: number;
  source: NearbySource;
}

interface NearbyResponse {
  campsites: NearbyCampsite[];
}

function toNumber(value: string | null): number {
  if (!value) return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  const lat = toNumber(request.nextUrl.searchParams.get("lat"));
  const lng = toNumber(request.nextUrl.searchParams.get("lng"));
  const radiusKm = toNumber(request.nextUrl.searchParams.get("radiusKm") ?? "50");

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) {
    return NextResponse.json(
      { error: "lat, lng and radiusKm are required" },
      { status: 400 }
    );
  }

  const cached = getCachedNearby<NearbyResponse>(lat, lng, radiusKm);
  if (cached) {
    return NextResponse.json(cached, { headers: { "x-campseer-cache": "nearby" } });
  }

  // Step A: Mapbox POI search (works globally and doesn't require RIDB)
  if (MAPBOX_TOKEN) {
    const mapbox = await fetchFromMapbox(lat, lng, radiusKm, MAPBOX_TOKEN);
    if (mapbox.campsites.length > 0) {
      setCachedNearby(lat, lng, radiusKm, mapbox);
      return NextResponse.json(mapbox);
    }
  }

  // Step B: RIDB (if configured)
  if (RIDB_API_KEY) {
    const ridb = await fetchFromRidb(lat, lng, radiusKm, RIDB_API_KEY);
    if (ridb.campsites.length > 0) {
      setCachedNearby(lat, lng, radiusKm, ridb);
      return NextResponse.json(ridb);
    }
  }

  // Step C: Overpass (OSM) fallback
  const osm = await fetchFromOverpass(lat, lng, radiusKm);
  setCachedNearby(lat, lng, radiusKm, osm);
  return NextResponse.json(osm);
}

async function fetchFromRidb(
  lat: number,
  lng: number,
  radiusKm: number,
  apiKey: string
): Promise<NearbyResponse> {
  try {
    const base = new URL("https://ridb.recreation.gov/api/v1/facilities");
    const radiusMiles = radiusKm * 0.621371;
    base.searchParams.set("latitude", String(lat));
    base.searchParams.set("longitude", String(lng));
    base.searchParams.set("radius", radiusMiles.toFixed(1));
    base.searchParams.set("activity", "CAMPING");
    base.searchParams.set("limit", "50");

    const res = await fetch(base.toString(), {
      headers: { apikey: apiKey },
      // RIDB is public, but keep a modest timeout.
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("RIDB nearby error:", res.status, text);
      return { campsites: [] };
    }

    const data = (await res.json()) as {
      RECDATA?: Array<{
        FacilityName?: string;
        FacilityLatitude?: number;
        FacilityLongitude?: number;
      }>;
    };

    const raw = data.RECDATA ?? [];
    const campsites: NearbyCampsite[] = raw
      .map((f) => {
        const name = f.FacilityName?.trim();
        const flat = typeof f.FacilityLatitude === "number" ? f.FacilityLatitude : null;
        const flng = typeof f.FacilityLongitude === "number" ? f.FacilityLongitude : null;
        if (!name || flat == null || flng == null) return null;
        const distance_km = haversineKm(lat, lng, flat, flng);
        return {
          name,
          lat: flat,
          lng: flng,
          distance_km,
          source: "RIDB" as const,
        };
      })
      .filter(Boolean) as NearbyCampsite[];

    campsites.sort((a, b) => a.distance_km - b.distance_km);

    return { campsites: campsites.slice(0, 12) };
  } catch (e) {
    console.error("RIDB nearby exception:", e);
    return { campsites: [] };
  }
}

async function fetchFromOverpass(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<NearbyResponse> {
  try {
    const radiusMeters = Math.max(1000, Math.round(radiusKm * 1000));
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"="camp_site"](around:${radiusMeters},${lat},${lng});
        way["tourism"="camp_site"](around:${radiusMeters},${lat},${lng});
        relation["tourism"="camp_site"](around:${radiusMeters},${lat},${lng});
      );
      out center;
    `;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({ data: query }).toString(),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Overpass nearby error:", res.status, text);
      return { campsites: [] };
    }

    const data = (await res.json()) as {
      elements?: Array<{
        type: "node" | "way" | "relation";
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: { name?: string };
      }>;
    };

    const elements = data.elements ?? [];
    const campsites: NearbyCampsite[] = elements
      .map((el) => {
        const coords =
          el.type === "node"
            ? { lat: el.lat, lng: el.lon }
            : el.center
            ? { lat: el.center.lat, lng: el.center.lon }
            : null;
        if (!coords || typeof coords.lat !== "number" || typeof coords.lng !== "number") {
          return null;
        }
        const name = el.tags?.name?.trim() || "Unnamed campsite";
        const distance_km = haversineKm(lat, lng, coords.lat, coords.lng);
        return {
          name,
          lat: coords.lat,
          lng: coords.lng,
          distance_km,
          source: "OSM" as const,
        };
      })
      .filter(Boolean) as NearbyCampsite[];

    campsites.sort((a, b) => a.distance_km - b.distance_km);

    return { campsites: campsites.slice(0, 12) };
  } catch (e) {
    console.error("Overpass nearby exception:", e);
    return { campsites: [] };
  }
}

async function fetchFromMapbox(
  lat: number,
  lng: number,
  radiusKm: number,
  token: string
): Promise<NearbyResponse> {
  try {
    const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
    url.searchParams.set("q", "campground");
    url.searchParams.set("proximity", `${lng},${lat}`);
    url.searchParams.set("limit", "12");
    url.searchParams.set("types", "poi");
    url.searchParams.set("access_token", token);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      console.error("Mapbox nearby error:", res.status, text);
      return { campsites: [] };
    }

    const data = (await res.json()) as {
      type: string;
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: { name?: string };
      }>;
    };

    const features = data.features ?? [];
    const campsites: NearbyCampsite[] = features
      .map((f) => {
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;
        const [flng, flat] = coords;
        if (typeof flat !== "number" || typeof flng !== "number") return null;
        const name = f.properties?.name?.trim() || "Unnamed campsite";
        const distance_km = haversineKm(lat, lng, flat, flng);
        // Allow Mapbox to return slightly farther results; cap at ~3x requested radius.
        if (distance_km > radiusKm * 3) return null;
        return {
          name,
          lat: flat,
          lng: flng,
          distance_km,
          source: "MAPBOX" as const,
        };
      })
      .filter(Boolean) as NearbyCampsite[];

    campsites.sort((a, b) => a.distance_km - b.distance_km);
    return { campsites: campsites.slice(0, 12) };
  } catch (e) {
    console.error("Mapbox nearby exception:", e);
    return { campsites: [] };
  }
}

