"use client";

import { motion } from "framer-motion";
import { TentIcon } from "@/components/icons/CampSeerIcons";

export interface NearbyCampground {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

interface NearbyCampgroundsPanelProps {
  campgrounds: NearbyCampground[];
  onSelectCampground: (cg: NearbyCampground) => void;
  reducedMotion?: boolean;
}

export default function NearbyCampgroundsPanel({
  campgrounds,
  onSelectCampground,
  reducedMotion = false,
}: NearbyCampgroundsPanelProps) {
  return (
    <motion.div
      className="mx-auto w-full max-w-5xl px-4 pb-16"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={reducedMotion ? false : { opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <p className="mb-4 text-sm text-zinc-500">
        Found {campgrounds.length} campground{campgrounds.length !== 1 ? "s" : ""} near you
      </p>

      <ul className="space-y-2">
        {campgrounds.map((cg, i) => (
          <motion.li
            key={cg.id}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={reducedMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.03 * i }}
          >
            <button
              type="button"
              onClick={() => onSelectCampground(cg)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-brand-card p-4 text-left backdrop-blur-md transition-colors hover:border-brand-accent/30 hover:bg-brand-card/90 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg"
            >
              <TentIcon className="h-5 w-5 shrink-0 text-zinc-500" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{cg.name}</p>
                <p className="text-xs text-zinc-500">
                  {cg.distanceKm} km away
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-brand-accent">
                Get CampScore →
              </span>
            </button>
          </motion.li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-zinc-500">
        Data from OpenStreetMap. Click a campground to see weather, night sky, and fire risk scores.
      </p>
    </motion.div>
  );
}
