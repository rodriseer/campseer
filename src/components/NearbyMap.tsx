"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_PUBLIC_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface NearbyMapProps {
  userLocation: { lat: number; lng: number };
  campsites: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function NearbyMap({
  userLocation,
  campsites,
  selectedId,
  onSelect,
}: NearbyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!MAPBOX_PUBLIC_TOKEN) return;
    if (!containerRef.current) return;
    if (mapRef.current) return;
    if (!campsites.length) return;

    mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [userLocation.lng, userLocation.lat],
      zoom: 7,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [campsites.length, userLocation.lat, userLocation.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // User location marker
    const userEl = document.createElement("div");
    userEl.className =
      "h-3 w-3 rounded-full border-2 border-white bg-brand-accent shadow-md";
    markersRef.current.push(
      new mapboxgl.Marker({ element: userEl })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map)
    );

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([userLocation.lng, userLocation.lat]);

    // Campsite markers
    campsites.forEach((campsite) => {
      const el = document.createElement("div");
      el.className =
        "h-3 w-3 rounded-full border-2 " +
        (campsite.id === selectedId
          ? "border-white bg-brand-accent"
          : "border-brand-accent bg-white");

      el.addEventListener("click", () => {
        onSelect(campsite.id);
      });

      markersRef.current.push(
        new mapboxgl.Marker({ element: el })
          .setLngLat([campsite.lng, campsite.lat])
          .addTo(map)
      );

      bounds.extend([campsite.lng, campsite.lat]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 11, duration: 500 });
    }
  }, [campsites, selectedId, userLocation.lng, userLocation.lat, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const selected = campsites.find((c) => c.id === selectedId);
    if (!selected) return;
    map.easeTo({
      center: [selected.lng, selected.lat],
      zoom: Math.max(map.getZoom(), 9),
      duration: 600,
    });
  }, [campsites, selectedId]);

  if (!MAPBOX_PUBLIC_TOKEN || !campsites.length) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/60 p-3 shadow-lg backdrop-blur-md md:mt-6">
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-300">
        <span>Nearby campsites map preview</span>
      </div>
      <div
        ref={containerRef}
        className="h-56 w-full overflow-hidden rounded-lg md:h-64"
        aria-label="Map preview of nearby campsites"
      />
    </div>
  );
}

