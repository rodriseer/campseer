import type { ForecastDay, ScoreWithReasons, FireScoreWithReasons } from "./types";

const C_TO_F = (c: number) => (c * 9) / 5 + 32;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 0–3.9 = Bad, 4.0–6.9 = Fair, 7.0–10 = Great */
function scoreLabel(score: number): ScoreWithReasons["label"] {
  if (score >= 7) return "Great";
  if (score >= 4) return "Fair";
  return "Bad";
}

/**
 * CampScore 0–10: overnight temp comfort, wind, precip, humidity.
 * Ideal overnight low ~50–72°F (10–22°C). Penalize high wind, precip, humidity.
 */
export function campScore(day: ForecastDay): ScoreWithReasons {
  const reasons: string[] = [];
  let score = 10;

  const lowF = C_TO_F(day.overnightLowC);
  if (lowF < 40) {
    score -= 3;
    reasons.push("Cold overnight low");
  } else if (lowF < 50) {
    score -= 1.5;
    reasons.push("Cool overnight");
  } else if (lowF >= 75) {
    score -= 2;
    reasons.push("Warm overnight");
  } else if (lowF >= 72) {
    score -= 0.5;
    reasons.push("Slightly warm overnight");
  } else {
    reasons.push("Comfortable overnight temps");
  }

  const windMph = day.windSpeedMps * 2.237;
  if (windMph > 20) {
    score -= 2.5;
    reasons.push("High wind");
  } else if (windMph > 12) {
    score -= 1;
    reasons.push("Moderate wind");
  }

  if (day.precipMm > 5) {
    score -= 2;
    reasons.push("Rain likely");
  } else if (day.precipMm > 0.5) {
    score -= 1;
    reasons.push("Chance of rain");
  }

  if (day.humidityPct > 85) {
    score -= 1;
    reasons.push("High humidity");
  } else if (day.humidityPct > 70) {
    score -= 0.5;
    reasons.push("Moderate humidity");
  }

  const finalScore = clamp(Math.round(score * 10) / 10, 0, 10);
  return {
    score: finalScore,
    label: scoreLabel(finalScore),
    reasons: reasons.slice(0, 3),
  };
}

/**
 * Night Sky Score 0–10: low cloud = higher; lower moon = higher (if available).
 */
export function nightSkyScore(day: ForecastDay): ScoreWithReasons {
  const reasons: string[] = [];
  let score = 10;

  score -= (day.cloudCoverPct / 100) * 7; // clouds can kill most of the score
  if (day.cloudCoverPct < 20) reasons.push("Clear skies");
  else if (day.cloudCoverPct < 50) reasons.push("Some clouds");
  else reasons.push("Cloudy");

  if (day.moonIllumination != null) {
    if (day.moonIllumination > 0.8) {
      score -= 1.5;
      reasons.push("Bright moon");
    } else if (day.moonIllumination > 0.4) {
      score -= 0.5;
      reasons.push("Moderate moon");
    } else {
      reasons.push("Dark sky");
    }
  }
  // When moon is missing, UI shows "coming soon" instead of a reason bullet

  const finalScore = clamp(Math.round(score * 10) / 10, 0, 10);
  return {
    score: finalScore,
    label: scoreLabel(finalScore),
    reasons,
  };
}

/**
 * Fire Risk 0–10 and LOW/MED/HIGH: high wind + low humidity => higher risk.
 */
export function fireRiskScore(day: ForecastDay): FireScoreWithReasons {
  const reasons: string[] = [];
  const windMph = day.windSpeedMps * 2.237;
  const dryness = 100 - day.humidityPct; // proxy for dryness

  let score = 0;
  if (windMph > 20 && dryness > 50) {
    score = 8 + (dryness / 50);
    reasons.push("High wind, low humidity");
  } else if (windMph > 15 || dryness > 60) {
    score = 4 + (windMph / 10) + (dryness / 100);
    reasons.push("Elevated wind or dryness");
  } else if (windMph > 10 || dryness > 40) {
    score = 2 + (windMph / 20) + (dryness / 200);
    reasons.push("Moderate conditions");
  } else {
    reasons.push("Lower risk");
  }

  const finalScore = clamp(Math.round(score * 10) / 10, 0, 10);
  let level: FireScoreWithReasons["level"] = "LOW";
  if (finalScore >= 6) level = "HIGH";
  else if (finalScore >= 3) level = "MED";

  return {
    score: finalScore,
    label: level === "HIGH" ? "Bad" : level === "MED" ? "Fair" : "Great",
    level,
    reasons: reasons.slice(0, 3),
  };
}
