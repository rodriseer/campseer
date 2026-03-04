import { NextRequest, NextResponse } from "next/server";
import { getForecastDays } from "@/lib/campseer/fetchForecast";

function parseLatLng(searchParams: NextRequest["nextUrl"]["searchParams"]) {
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const latNum = lat ? parseFloat(lat) : NaN;
  const lngNum = lng ? parseFloat(lng) : NaN;
  return { lat: latNum, lng: lngNum };
}

export async function GET(request: NextRequest) {
  const { lat, lng } = parseLatLng(request.nextUrl.searchParams);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng required" },
      { status: 400 }
    );
  }

  try {
    const days = await getForecastDays(lat, lng);
    if (!days) {
      return NextResponse.json(
        { error: "Forecast not configured or could not load" },
        { status: 503 }
      );
    }
    return NextResponse.json({ days });
  } catch (e) {
    console.error("Forecast error:", e);
    return NextResponse.json(
      { error: "Could not load forecast" },
      { status: 500 }
    );
  }
}
