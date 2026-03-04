/**
 * Moon illumination (0–1) from date using lunar cycle.
 * No external API; based on mean lunar month 29.530588853 days.
 * Good enough for Night Sky score (dark vs bright moon).
 */

const LUNAR_MONTH_DAYS = 29.530588853;
const JULIAN_EPOCH_NEW_MOON = 2451550.1;

function getJulianDate(date: Date): number {
  const time = date.getTime();
  const tzoffset = date.getTimezoneOffset();
  return time / 86400000 - tzoffset / 1440 + 2440587.5;
}

/** Lunar age as fraction of cycle: 0 = new moon, 0.5 = full, 1 = new again */
function getLunarAge(date: Date): number {
  const jd = getJulianDate(date);
  let age = (jd - JULIAN_EPOCH_NEW_MOON) / LUNAR_MONTH_DAYS;
  age = age - Math.floor(age);
  if (age < 0) age += 1;
  return age;
}

/**
 * Illumination fraction 0–1 (0 = new moon, 1 = full moon).
 * Formula: (1 - cos(2π * age)) / 2
 */
export function getMoonIllumination(date: Date): number {
  const age = getLunarAge(date);
  const illumination = (1 - Math.cos(2 * Math.PI * age)) / 2;
  return Math.round(illumination * 1000) / 1000;
}

/**
 * For a date string YYYY-MM-DD, return moon illumination 0–1 at noon UTC.
 */
export function getMoonIlluminationForDate(dateStr: string): number {
  const date = new Date(dateStr + "T12:00:00Z");
  return getMoonIllumination(date);
}
