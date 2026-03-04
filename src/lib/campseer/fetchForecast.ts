import { getCachedForecast, setCachedForecast } from "./cache";
import { normalizeStormglassToDays } from "./forecast";
import { getMoonIlluminationForDate } from "./moon";
import type { ForecastDay } from "./types";

const STORMGLASS_KEY = process.env.STORMGLASS_API_KEY;

export async function getForecastDays(lat: number, lng: number): Promise<ForecastDay[] | null> {
  const cached = getCachedForecast<ForecastDay[]>(lat, lng);
  if (cached) return cached;

  if (!STORMGLASS_KEY) return null;

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  // Stormglass weather/point does not include moon; astronomy is a separate API.
  // We merge moon illumination from a local calculation (see moon.ts).
  const params = [
    "airTemperature",
    "windSpeed",
    "humidity",
    "cloudCover",
    "precipitation",
  ].join(",");

  const url = new URL("https://api.stormglass.io/v2/weather/point");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("params", params);
  url.searchParams.set("start", start.toISOString());
  url.searchParams.set("end", end.toISOString());

  const res = await fetch(url.toString(), {
    headers: { Authorization: STORMGLASS_KEY },
  });

  if (!res.ok) return null;

  const raw = (await res.json()) as { hours?: unknown[]; data?: unknown[] };
  if (process.env.NODE_ENV === "development" && raw?.hours?.[0]) {
    const firstHour = raw.hours[0] as Record<string, unknown>;
    console.log("[CampSeer] Stormglass raw response keys (first hour):", Object.keys(firstHour));
    console.log("[CampSeer] Moon-related keys:", Object.keys(firstHour).filter((k) => k.toLowerCase().includes("moon")));
  }
  const days = normalizeStormglassToDays(raw);
  for (const day of days) {
    day.moonIllumination = getMoonIlluminationForDate(day.date);
  }
  setCachedForecast(lat, lng, days);
  return days;
}
