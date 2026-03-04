import type { ForecastDay } from "./types";

/** Stormglass v2 point response hour */
interface StormglassHour {
  time: string;
  airTemperature?: Record<string, number>;
  windSpeed?: Record<string, number>;
  humidity?: Record<string, number>;
  cloudCover?: Record<string, number>;
  precipitation?: Record<string, number>;
}

interface StormglassResponse {
  hours?: StormglassHour[];
  meta?: { lat: number; lng: number };
}

function firstNumber(obj: Record<string, number> | undefined): number {
  if (!obj || typeof obj !== "object") return 0;
  const v = Object.values(obj)[0];
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

/** Aggregate hourly Stormglass data into one record per calendar day (next 5 days). */
export function normalizeStormglassToDays(data: StormglassResponse): ForecastDay[] {
  if (!data) return [];

  const rawHours =
    (data as { hours?: StormglassHour[]; data?: StormglassHour[] }).hours ??
    (data as { hours?: StormglassHour[]; data?: StormglassHour[] }).data ??
    [];
  const hours = Array.isArray(rawHours) ? rawHours : [];

  const dayMap = new Map<
    string,
    {
      minTemp: number;
      maxTemp: number;
      temps: number[];
      windSum: number;
      windCount: number;
      humiditySum: number;
      humidityCount: number;
      cloudSum: number;
      cloudCount: number;
      precipSum: number;
    }
  >();

  for (const h of hours) {
    const date = h.time.slice(0, 10);
    const at = firstNumber(h.airTemperature as unknown as Record<string, number>);
    const wind = firstNumber(h.windSpeed as unknown as Record<string, number>);
    const humidity = firstNumber(h.humidity as unknown as Record<string, number>);
    const cloud = firstNumber(h.cloudCover as unknown as Record<string, number>);
    const precip = firstNumber(h.precipitation as unknown as Record<string, number>);

    let row = dayMap.get(date);
    if (!row) {
      row = {
        minTemp: at,
        maxTemp: at,
        temps: [at],
        windSum: 0,
        windCount: 0,
        humiditySum: 0,
        humidityCount: 0,
        cloudSum: 0,
        cloudCount: 0,
        precipSum: 0,
      };
      dayMap.set(date, row);
    }

    row.minTemp = Math.min(row.minTemp, at);
    row.maxTemp = Math.max(row.maxTemp, at);
    row.temps.push(at);
    row.windSum += wind;
    row.windCount += 1;
    row.humiditySum += humidity;
    row.humidityCount += 1;
    row.cloudSum += cloud;
    row.cloudCount += 1;
    row.precipSum += precip;
  }

  const sortedDates = Array.from(dayMap.keys()).sort().slice(0, 5);
  const days: ForecastDay[] = [];

  for (const date of sortedDates) {
    const row = dayMap.get(date)!;
    const count = row.windCount || 1;
    days.push({
      date,
      minTempC: row.minTemp,
      maxTempC: row.maxTemp,
      overnightLowC: row.minTemp,
      windSpeedMps: row.windSum / count,
      humidityPct: row.humiditySum / count,
      cloudCoverPct: row.cloudSum / count,
      precipMm: row.precipSum,
      moonIllumination: null,
    });
  }

  return days;
}
