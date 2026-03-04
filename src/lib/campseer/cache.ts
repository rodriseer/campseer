const TTL_MS = 60 * 60 * 1000; // 60 minutes
const NEARBY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface Entry<T> {
  data: T;
  expires: number;
}

const memory = new Map<string, Entry<unknown>>();
const nearbyMemory = new Map<string, Entry<unknown>>();

function cacheKey(lat: number, lng: number): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return `${r(lat)},${r(lng)}`;
}

function nearbyCacheKey(lat: number, lng: number, radiusKm: number): string {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const rRadius = Math.round(radiusKm * 10) / 10;
  return `${r2(lat)},${r2(lng)},r=${rRadius}`;
}

export function getCachedForecast<T>(lat: number, lng: number): T | null {
  const key = cacheKey(lat, lng);
  const entry = memory.get(key) as Entry<T> | undefined;
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

export function setCachedForecast<T>(lat: number, lng: number, data: T): void {
  const key = cacheKey(lat, lng);
  memory.set(key, { data, expires: Date.now() + TTL_MS });
}

export function getCachedNearby<T>(
  lat: number,
  lng: number,
  radiusKm: number
): T | null {
  const key = nearbyCacheKey(lat, lng, radiusKm);
  const entry = nearbyMemory.get(key) as Entry<T> | undefined;
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

export function setCachedNearby<T>(
  lat: number,
  lng: number,
  radiusKm: number,
  data: T
): void {
  const key = nearbyCacheKey(lat, lng, radiusKm);
  nearbyMemory.set(key, { data, expires: Date.now() + NEARBY_TTL_MS });
}
