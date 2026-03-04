import { NextRequest, NextResponse } from "next/server";
import { getForecastDays } from "@/lib/campseer/fetchForecast";
import { campScore, nightSkyScore, fireRiskScore } from "@/lib/campseer/scoring";
import type { DayScores, ForecastDay } from "@/lib/campseer/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayName(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return DAY_NAMES[d.getUTCDay()];
}

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");
  const latNum = lat ? parseFloat(lat) : NaN;
  const lngNum = lng ? parseFloat(lng) : NaN;

  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return NextResponse.json(
      { error: "lat and lng required" },
      { status: 400 }
    );
  }

  try {
    const days = await getForecastDays(latNum, lngNum);
    if (!days?.length) {
      return NextResponse.json(
        { error: "No forecast data" },
        { status: 502 }
      );
    }

    const dayScores: DayScores[] = days.map((day) => ({
      date: day.date,
      dayName: dayName(day.date),
      campScore: campScore(day),
      nightSkyScore: nightSkyScore(day),
      fireScore: fireRiskScore(day),
    }));

    const first = dayScores[0];
    const best = dayScores.reduce((a, b) => {
      const aAvg =
        (a.campScore.score + a.nightSkyScore.score + (10 - a.fireScore.score)) / 3;
      const bAvg =
        (b.campScore.score + b.nightSkyScore.score + (10 - b.fireScore.score)) / 3;
      return bAvg > aAvg ? b : a;
    });

    const firstDay = days[0];
    return NextResponse.json({
      campScore: first.campScore,
      nightSkyScore: first.nightSkyScore,
      fireRiskScore: first.fireScore,
      firstDay: {
        cloudCoverPct: Math.round(firstDay.cloudCoverPct),
        moonIllumination: firstDay.moonIllumination != null
          ? Math.round(firstDay.moonIllumination * 100)
          : null,
      },
      bestNight: {
        date: best.date,
        dayName: best.dayName,
        score: (
          (best.campScore.score +
            best.nightSkyScore.score +
            (10 - best.fireScore.score)) /
          3
        ).toFixed(1),
      },
      fiveDay: dayScores,
    });
  } catch (e) {
    console.error("Scores error:", e);
    return NextResponse.json(
      { error: "Could not compute scores" },
      { status: 500 }
    );
  }
}
