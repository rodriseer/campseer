/** Single-day forecast inputs used for scoring */
export interface ForecastDay {
  date: string; // YYYY-MM-DD
  minTempC: number;
  maxTempC: number;
  /** Overnight / early-morning low (proxy: min of day's temps) */
  overnightLowC: number;
  windSpeedMps: number;
  humidityPct: number;
  cloudCoverPct: number;
  precipMm: number;
  /** 0–1 if available; absent = null */
  moonIllumination: number | null;
}

export interface ScoreWithReasons {
  score: number;
  label: "Great" | "Fair" | "Bad";
  reasons: string[];
}

export interface FireScoreWithReasons extends ScoreWithReasons {
  level: "LOW" | "MED" | "HIGH";
}

export interface DayScores {
  date: string;
  dayName: string;
  campScore: ScoreWithReasons;
  nightSkyScore: ScoreWithReasons;
  fireScore: FireScoreWithReasons;
}
