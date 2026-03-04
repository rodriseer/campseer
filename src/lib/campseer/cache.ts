const TTL_MS = 60 * 60 * 1000; // 60 minutes

interface Entry<T> {
  data: T;
  expires: number;
}

const memory = new Map<string, Entry<unknown>>();

function cacheKey(lat: number, lng: number): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return `${r(lat)},${r(lng)}`;
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
