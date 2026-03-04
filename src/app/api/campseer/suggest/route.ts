import { NextRequest, NextResponse } from "next/server";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ suggestions: [] });
  }
  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: "Mapbox not configured" },
      { status: 503 }
    );
  }

  try {
    const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
    url.searchParams.set("q", q.trim());
    url.searchParams.set("access_token", MAPBOX_TOKEN);
    url.searchParams.set("limit", "5");
    url.searchParams.set("autocomplete", "true");

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.text();
      console.error("Mapbox suggest error:", res.status, err);
      return NextResponse.json(
        { error: "Could not load suggestions" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      type: string;
      features?: Array<{
        type: string;
        geometry?: { coordinates?: [number, number] };
        properties?: {
          name?: string;
          place_formatted?: string;
          full_address?: string;
        };
      }>;
    };

    const suggestions = (data.features ?? []).map((f) => {
      const [lng, lat] = f.geometry?.coordinates ?? [0, 0];
      const name =
        f.properties?.name ||
        f.properties?.full_address ||
        f.properties?.place_formatted ||
        "";
      const place = f.properties?.place_formatted || "";
      const label = place ? `${name}, ${place}` : name;
      return {
        id: `${lat}-${lng}-${label.slice(0, 30)}`,
        name: label,
        lat,
        lng,
      };
    });

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("Suggest error:", e);
    return NextResponse.json(
      { error: "Could not load suggestions" },
      { status: 500 }
    );
  }
}
