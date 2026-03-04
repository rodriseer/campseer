import { NextRequest, NextResponse } from "next/server";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN;

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
  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: "Mapbox not configured" },
      { status: 503 }
    );
  }

  try {
    const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
    url.searchParams.set("longitude", String(lngNum));
    url.searchParams.set("latitude", String(latNum));
    url.searchParams.set("access_token", MAPBOX_TOKEN);
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.text();
      console.error("Mapbox reverse error:", res.status, err);
      return NextResponse.json(
        { error: "Could not get place name" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      type: string;
      features?: Array<{
        properties?: {
          name?: string;
          place_formatted?: string;
          full_address?: string;
        };
      }>;
    };

    const f = data.features?.[0];
    const name =
      f?.properties?.name ||
      f?.properties?.full_address ||
      f?.properties?.place_formatted ||
      "Unknown location";

    return NextResponse.json({ name });
  } catch (e) {
    console.error("Reverse error:", e);
    return NextResponse.json(
      { error: "Could not get place name" },
      { status: 500 }
    );
  }
}
