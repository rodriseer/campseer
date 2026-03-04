"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ResultsPanel, { type ScoresResult } from "./ResultsPanel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import NearbyMap from "./NearbyMap";

const HERO_IMAGES = [
  "/campseer/camping-one.jpg",
  "/campseer/camping-two.jpg",
  "/campseer/camping-three.jpg",
] as const;

function getRandomHeroImage() {
  return HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];
}

export interface Suggestion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type?: "place" | "campsite";
  distanceKm?: number;
  source?: "RIDB" | "OSM" | "MAPBOX";
}

const DEBOUNCE_MS = 280;

type Status = "idle" | "loading" | "success" | "error";

const heroItem = (delay: number, reduced: boolean) =>
  reduced
    ? {}
    : {
        initial: { opacity: 1, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut", delay },
      };

const formAnim = (reduced: boolean) =>
  reduced
    ? {}
    : {
        initial: { opacity: 1, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: "easeOut", delay: 0.25 },
      };

const buttonTap = (reduced: boolean) =>
  reduced ? {} : { scale: 0.98 };
const buttonHover = (reduced: boolean) =>
  reduced ? {} : { y: -2, boxShadow: "0 4px 20px rgba(255,255,255,0.15)" };

export default function Hero() {
  const reduced = useReducedMotion();
  const heroImage = useMemo(() => getRandomHeroImage(), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ScoresResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyMessage, setNearbyMessage] = useState<string | null>(null);
  const [nearbyUserLocation, setNearbyUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyCampsites, setNearbyCampsites] = useState<Suggestion[]>([]);
  const [selectedCampsiteId, setSelectedCampsiteId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const nearbySlowTimerRef = useRef<number | null>(null);

  const fetchScores = useCallback(async (lat: number, lng: number, locationName: string) => {
    setStatus("loading");
    setErrorMessage("");
    setDropdownOpen(false);
    try {
      const res = await fetch(`/api/campseer/scores?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error || "Couldn't load forecast, try again.");
        return;
      }
      setResult({
        ...data,
        locationName,
      });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't load forecast, try again.");
    }
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const res = await fetch(`/api/campseer/suggest?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setSuggestions(data?.suggestions ?? []);
      setDropdownOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(q), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      setStatus("loading");
      setErrorMessage("");
      try {
        let lat: number;
        let lng: number;
        let name: string;
        if (selectedSuggestion) {
          lat = selectedSuggestion.lat;
          lng = selectedSuggestion.lng;
          name = selectedSuggestion.name;
        } else {
          const suggestRes = await fetch(`/api/campseer/suggest?q=${encodeURIComponent(q)}`);
          const suggestData = await suggestRes.json();
          const list = suggestData?.suggestions ?? [];
          if (!list.length) {
            setStatus("error");
            setErrorMessage("No location found. Try a different search.");
            return;
          }
          const first = list[0];
          lat = first.lat;
          lng = first.lng;
          name = first.name || q;
        }
        await fetchScores(lat, lng, name);
      } catch {
        setStatus("error");
        setErrorMessage("Couldn't load forecast, try again.");
      }
    },
    [query, selectedSuggestion, fetchScores]
  );

  const handleSuggestionSelect = useCallback(
    async (s: Suggestion, options?: { autoRun?: boolean }) => {
      setSelectedSuggestion(s);
      setQuery(s.name);
      setDropdownOpen(false);
      setSuggestions([]);
       if (s.type === "campsite") {
        setSelectedCampsiteId(s.id);
      } else {
        setSelectedCampsiteId(null);
      }
      if (options?.autoRun) {
        await fetchScores(s.lat, s.lng, s.name);
      }
    },
    [fetchScores]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      if (suggestions.length > 0) {
        e.preventDefault();
        const first = suggestions[0];
        handleSuggestionSelect(first, { autoRun: true });
      }
    },
    [suggestions, handleSuggestionSelect, fetchScores]
  );

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported.");
      return;
    }
    setStatus("loading");
    setErrorMessage("");
    setDropdownOpen(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const reverseRes = await fetch(
            `/api/campseer/reverse?lat=${lat}&lng=${lng}`
          );
          const reverseData = await reverseRes.json();
          const name = reverseData?.name || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
          await fetchScores(lat, lng, name);
        } catch {
          setStatus("error");
          setErrorMessage("Couldn't load forecast, try again.");
        }
      },
      () => {
        setStatus("error");
        setErrorMessage("Couldn't get your location. Check permissions.");
      }
    );
  }, [fetchScores]);

  const handleFindCampsitesNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported.");
      return;
    }
    setErrorMessage("");
    setDropdownOpen(false);
    setLoadingNearby(true);
    setNearbyMessage("Searching within 50 km...");
    if (nearbySlowTimerRef.current) {
      window.clearTimeout(nearbySlowTimerRef.current);
    }
    nearbySlowTimerRef.current = window.setTimeout(() => {
      setNearbyMessage("Still searching… (this can take a few seconds)");
    }, 3000);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(
            `/api/campseer/nearby?lat=${lat}&lng=${lng}&radiusKm=50`
          );
          const data = (await res.json()) as {
            campsites?: Array<{
              name: string;
              lat: number;
              lng: number;
              distance_km?: number;
              source?: "RIDB" | "OSM";
            }>;
          };
          const camps = (data.campsites ?? []).map((c) => ({
            id: `${c.lat}-${c.lng}-${c.name.slice(0, 30)}`,
            name: c.name,
            lat: c.lat,
            lng: c.lng,
            type: "campsite" as const,
            distanceKm: c.distance_km,
            source: c.source,
          }));
          setNearbyUserLocation({ lat, lng });
          setNearbyCampsites(camps);
          setSuggestions(camps);
          setDropdownOpen(camps.length > 0);
          if (!camps.length) {
            setStatus("error");
            setErrorMessage("No campsites found nearby. Try a different location.");
          }
        } catch {
          setStatus("error");
          setErrorMessage("Couldn't load campsites. Try again.");
        } finally {
          if (nearbySlowTimerRef.current) {
            window.clearTimeout(nearbySlowTimerRef.current);
            nearbySlowTimerRef.current = null;
          }
          setLoadingNearby(false);
          setNearbyMessage(null);
        }
      },
      () => {
        setStatus("error");
        setErrorMessage("Couldn't get your location. Check permissions.");
        if (nearbySlowTimerRef.current) {
          window.clearTimeout(nearbySlowTimerRef.current);
          nearbySlowTimerRef.current = null;
        }
        setLoadingNearby(false);
        setNearbyMessage(null);
      }
    );
  }, []);

  return (
    <>
      <section
        id="explore"
        className="relative flex min-h-[70vh] flex-col md:min-h-[80vh]"
        aria-label="Hero"
      >
        {/* Background image only - z-0, overflow only here so image doesn't spill */}
        <div
          className="absolute inset-0 z-0 overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden
        />
        {/* Dark overlay for readability - z-10 */}
        <div
          className="absolute inset-0 z-[10] bg-gradient-to-b from-black/65 to-black/90"
          aria-hidden
        />
        {/* Subtle starfield - z-[11] */}
        <div className="starfield-overlay" aria-hidden />
        {/* Aurora shimmer - z-[12] */}
        <div className="aurora-shimmer hero-aurora" aria-hidden />

        {/* Content wrapper: centered, no overflow */}
        <div
          id="get-campscore"
          className="relative z-20 flex min-h-[70vh] flex-1 flex-col items-center justify-center pb-16 pt-28 scroll-mt-24 md:min-h-[80vh] md:pb-24 md:pt-32"
        >
          <div className="w-full max-w-5xl px-4 text-center sm:px-6">
            <motion.h1
              className="font-heading text-balance text-5xl font-semibold leading-tight tracking-heading text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-6xl md:text-7xl lg:text-7xl"
              {...heroItem(0, reduced)}
            >
              Find the best nights to camp.
            </motion.h1>
            <motion.p
              className="mx-auto mt-3 font-heading text-xl font-medium uppercase tracking-heading text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] sm:text-2xl"
              {...heroItem(0.08, reduced)}
            >
              Know before you camp.
            </motion.p>
            <motion.p
              className="mx-auto mt-2 max-w-xl text-sm text-zinc-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-base"
              {...heroItem(0.12, reduced)}
            >
              Weather, night sky, and fire risk — one score.
            </motion.p>

            <motion.form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 max-w-md"
              {...formAnim(reduced)}
            >
              <div ref={wrapperRef} className="relative">
                <div className="flex flex-col gap-2 rounded-xl border border-zinc-400/40 bg-white/95 p-2 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center">
                  <input
                    id="search-input"
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedSuggestion(null);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setDropdownOpen(true)}
                    placeholder="Enter location"
                    aria-label="Enter location"
                    aria-autocomplete="list"
                    aria-expanded={dropdownOpen}
                    aria-controls="suggestions-list"
                    className="min-h-[44px] flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    disabled={status === "loading"}
                  />
                  <motion.button
                    type="submit"
                    disabled={status === "loading"}
                    className="min-h-[44px] rounded-lg bg-brand-accent px-4 font-medium text-white transition-opacity disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg"
                    whileHover={status !== "loading" ? buttonHover(reduced) : undefined}
                    whileTap={status !== "loading" ? buttonTap(reduced) : undefined}
                    transition={{ duration: 0.2 }}
                  >
                    {status === "loading" ? "Loading…" : "Get CampScore"}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {dropdownOpen && (suggestions.length > 0 || loadingSuggest) && (
                    <motion.ul
                      key="suggestions-dropdown"
                      id="suggestions-list"
                      role="listbox"
                      className="absolute left-2 right-2 top-full z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-white/10 bg-black/95 py-1 shadow-xl backdrop-blur-md"
                      initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                      animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                      exit={
                        reduced
                          ? undefined
                          : { opacity: 0, scale: 0.98, transition: { duration: 0.12 } }
                      }
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {loadingSuggest ? (
                        <li className="px-4 py-3 text-sm text-zinc-400">Loading…</li>
                      ) : (
                      suggestions.map((s) => (
                        <li key={s.id} role="option">
                          <button
                            type="button"
                            onClick={() =>
                              handleSuggestionSelect(
                                s,
                                s.type === "campsite" ? { autoRun: true } : undefined
                              )
                            }
                            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                          >
                            <span className="block">{s.name}</span>
                            {s.type === "campsite" && (s.distanceKm || s.source) && (
                              <span className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                                {s.source && (
                                  <span className="rounded-full border border-zinc-600/60 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-200">
                                    {s.source === "RIDB"
                                      ? "Recreation.gov"
                                      : s.source === "OSM"
                                      ? "OpenStreetMap"
                                      : "Mapbox"}
                                  </span>
                                )}
                                {typeof s.distanceKm === "number"
                                  ? `${s.distanceKm.toFixed(1)} km away`
                                  : null}
                              </span>
                            )}
                          </button>
                        </li>
                      ))
                      )}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
              {loadingNearby && nearbyMessage && (
                <p className="mt-2 text-xs text-zinc-200">{nearbyMessage}</p>
              )}
              <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                <motion.button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={status === "loading"}
                  className="min-h-[40px] text-sm text-white underline underline-offset-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] hover:text-zinc-200 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent"
                  whileHover={status !== "loading" ? { opacity: 1 } : undefined}
                  whileTap={status !== "loading" ? buttonTap(reduced) : undefined}
                  transition={{ duration: 0.2 }}
                >
                  Use my location
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleFindCampsitesNearMe}
                  disabled={status === "loading" || loadingNearby}
                  className="min-h-[40px] rounded-full border border-white/40 bg-black/30 px-4 text-xs font-medium uppercase tracking-wide text-white/90 shadow-sm backdrop-blur-md hover:bg-white/10 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent"
                  whileHover={status !== "loading" ? buttonHover(reduced) : undefined}
                  whileTap={status !== "loading" ? buttonTap(reduced) : undefined}
                  transition={{ duration: 0.2 }}
                >
                  {loadingNearby ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-transparent" />
                      <span>Finding campsites…</span>
                    </span>
                  ) : (
                    "Find campsites near me"
                  )}
                </motion.button>
              </div>
            </motion.form>

            {status === "error" && (
              <p className="mt-4 text-sm text-amber-200" role="alert">
                {errorMessage}
              </p>
            )}
            {nearbyCampsites.length > 0 && nearbyUserLocation && (
              <NearbyMap
                userLocation={nearbyUserLocation}
                campsites={nearbyCampsites}
                selectedId={selectedCampsiteId}
                onSelect={(id) => {
                  const campsite = nearbyCampsites.find((c) => c.id === id);
                  if (campsite) {
                    handleSuggestionSelect(campsite, { autoRun: true });
                  }
                }}
              />
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {status === "success" && result && (
          <motion.section
            className="relative z-10 -mt-8 pt-0"
            aria-label="Results"
            initial={reduced ? undefined : { opacity: 0, y: 24 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ResultsPanel data={result} reducedMotion={reduced} />
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
