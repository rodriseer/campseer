"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ScoreCountUp } from "./ScoreCountUp";
import { TentIcon, MoonStarsIcon, CampfireIcon } from "@/components/icons/CampSeerIcons";

export interface DayScoreItem {
  date: string;
  dayName: string;
  campScore: { score: number; label: string; reasons: string[] };
  nightSkyScore: { score: number; label: string; reasons: string[] };
  fireScore: { score: number; label: string; level: string; reasons: string[] };
}

export interface ScoresResult {
  locationName: string;
  campScore: { score: number; label: string; reasons: string[] };
  nightSkyScore: { score: number; label: string; reasons: string[] };
  fireRiskScore: { score: number; label: string; level: string; reasons: string[] };
  firstDay?: { cloudCoverPct: number; moonIllumination: number | null };
  bestNight: { date: string; dayName: string; score: string };
  fiveDay: DayScoreItem[];
}

interface ResultsPanelProps {
  data: ScoresResult;
  reducedMotion?: boolean;
}

function scoreLabelColor(label: string): string {
  if (label === "Great") return "text-brand-accent";
  if (label === "Fair") return "text-amber-400";
  return "text-red-400";
}

function ScoreProgressBar({ score }: { score: number }) {
  const pct = Math.min(100, (score / 10) * 100);
  const barColor =
    score >= 7 ? "bg-brand-accent" : score >= 4 ? "bg-amber-500" : "bg-red-500/80";
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={`h-full rounded-full ${barColor}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

function CampScoreCard({
  score,
  label,
  reasons,
  reducedMotion,
  index,
}: {
  score: number;
  label: string;
  reasons: string[];
  reducedMotion?: boolean;
  index: number;
}) {
  const labelColor = scoreLabelColor(label);
  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-brand-card p-4 backdrop-blur-md sm:p-5"
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={reducedMotion ? false : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 * index }}
    >
      <div className="flex items-center gap-2">
        <TentIcon className="h-4 w-4 shrink-0 text-zinc-500" />
        <h3 className="text-sm font-medium text-zinc-400">CampScore</h3>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <ScoreCountUp
          value={score}
          duration={0.45}
          className={`text-2xl font-semibold tabular-nums sm:text-3xl ${labelColor}`}
        />
      </div>
      <ScoreProgressBar score={score} />
      <p className={`mt-1 text-xs font-medium ${labelColor}`}>{label}</p>
      <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-zinc-500">
        {reasons.slice(0, 3).map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </motion.div>
  );
}

function NightSkyCard({
  score,
  label,
  reasons,
  cloudCoverPct,
  moonIllumination,
  reducedMotion,
  index,
}: {
  score: number;
  label: string;
  reasons: string[];
  cloudCoverPct?: number;
  moonIllumination?: number | null;
  reducedMotion?: boolean;
  index: number;
}) {
  const hasMoon = moonIllumination != null;
  const labelColor = scoreLabelColor(label);
  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-brand-card p-4 backdrop-blur-md sm:p-5"
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={reducedMotion ? false : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 * index }}
    >
      <div className="flex items-center gap-2">
        <MoonStarsIcon className="h-4 w-4 shrink-0 text-zinc-500" />
        <h3 className="text-sm font-medium text-zinc-400">Night Sky Score</h3>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <ScoreCountUp
          value={score}
          duration={0.45}
          className={`text-2xl font-semibold tabular-nums sm:text-3xl ${labelColor}`}
        />
      </div>
      <ScoreProgressBar score={score} />
      <p className={`mt-1 text-xs font-medium ${labelColor}`}>{label}</p>
      <p className="mt-2 text-xs text-zinc-500">
        Cloud cover: {cloudCoverPct ?? "—"}%
      </p>
      {hasMoon ? (
        <p className="text-xs text-zinc-500">Moon: {moonIllumination}%</p>
      ) : (
        <p className="text-xs italic text-zinc-500">Moon: coming soon</p>
      )}
      <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-zinc-500">
        {reasons.slice(0, 3).map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </motion.div>
  );
}

function FireSafetyCard({
  level,
  reasons,
  reducedMotion,
  index,
}: {
  level: string;
  reasons: string[];
  reducedMotion?: boolean;
  index: number;
}) {
  const isHigh = level === "HIGH";
  const isLow = level === "LOW";
  return (
    <motion.div
      className={`rounded-xl border p-4 backdrop-blur-md sm:p-5 ${
        isHigh
          ? "border-brand-accentOrange/40 bg-brand-accentOrange/10"
          : isLow
            ? "border-brand-accent/30 bg-brand-accent/10"
            : "border-white/10 bg-brand-card"
      }`}
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={reducedMotion ? false : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 * index }}
    >
      <div className="flex items-center gap-2">
        <CampfireIcon className="h-4 w-4 shrink-0 text-zinc-500" />
        <h3 className="text-sm font-medium text-zinc-400">Fire Safety</h3>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
            isHigh
              ? "bg-brand-accentOrange/30 text-orange-200"
              : isLow
                ? "bg-brand-accent/20 text-emerald-200"
                : "bg-zinc-500/20 text-zinc-300"
          }`}
        >
          {level}
        </span>
      </div>
      {isHigh && (
        <p className="mt-1.5 text-xs text-orange-200/90">
          Check local fire restrictions before you go.
        </p>
      )}
      <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-zinc-500">
        {reasons.slice(0, 3).map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function ResultsPanel({ data, reducedMotion = false }: ResultsPanelProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  return (
    <motion.div
      className="mx-auto w-full max-w-5xl px-4 pb-16"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={reducedMotion ? false : { opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 1. Selected location line */}
      <p className="mb-4 text-sm text-zinc-500">
        Selected location: <span className="text-zinc-300">{data.locationName}</span>
      </p>

      {/* 2. Three score cards */}
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        <CampScoreCard
          score={data.campScore.score}
          label={data.campScore.label}
          reasons={data.campScore.reasons}
          reducedMotion={reducedMotion}
          index={0}
        />
        <NightSkyCard
          score={data.nightSkyScore.score}
          label={data.nightSkyScore.label}
          reasons={data.nightSkyScore.reasons}
          cloudCoverPct={data.firstDay?.cloudCoverPct}
          moonIllumination={data.firstDay?.moonIllumination}
          reducedMotion={reducedMotion}
          index={1}
        />
        <FireSafetyCard
          level={data.fireRiskScore.level}
          reasons={data.fireRiskScore.reasons}
          reducedMotion={reducedMotion}
          index={2}
        />
      </div>

      {/* 3. Best Night strip */}
      <div className="mt-8 rounded-xl border border-white/10 bg-brand-card px-4 py-3 backdrop-blur-md sm:py-4">
        <p className="text-center text-sm text-zinc-300">
          Best night in the next 5 days:{" "}
          <span className="font-semibold text-brand-accent">
            {data.bestNight.dayName} ({data.bestNight.score})
          </span>
        </p>
      </div>

      {/* 4. 5-day row */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {data.fiveDay.map((day) => {
          const composite = (
            (day.campScore.score +
              day.nightSkyScore.score +
              (10 - day.fireScore.score)) /
            3
          ).toFixed(1);
          return (
            <motion.button
              key={day.date}
              type="button"
              onClick={() =>
                setExpandedDate(expandedDate === day.date ? null : day.date)
              }
              className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-lg border border-white/10 bg-brand-card px-3 py-2 text-center transition-colors hover:border-brand-accent/30 hover:bg-brand-card/90 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg"
              whileHover={reducedMotion ? {} : { scale: 1.02 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <span className="text-xs text-zinc-400">{day.dayName}</span>
              <span className="text-sm font-semibold text-white">{composite}</span>
            </motion.button>
          );
        })}
      </div>

      {data.fiveDay.map(
        (day) =>
          expandedDate === day.date && (
            <motion.div
              key={day.date}
              className="mt-3 rounded-lg border border-white/5 bg-brand-card/80 p-3 text-xs text-zinc-400"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={reducedMotion ? false : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-medium text-zinc-300">
                {day.dayName} {day.date}
              </p>
              <p>Camp: {day.campScore.score.toFixed(1)} — {day.campScore.reasons.join("; ")}</p>
              <p>Night sky: {day.nightSkyScore.score.toFixed(1)} — {day.nightSkyScore.reasons.join("; ")}</p>
              <p>Fire: {day.fireScore.level} — {day.fireScore.reasons.join("; ")}</p>
            </motion.div>
          )
      )}

      <details className="group mt-6">
        <summary className="cursor-pointer list-none text-center text-xs text-zinc-500 hover:text-zinc-400">
          Details
        </summary>
        <div className="mt-2 rounded-lg border border-white/5 bg-brand-card/80 p-3 text-xs text-zinc-500">
          {data.fiveDay.map((d) => (
            <div key={d.date} className="flex justify-between gap-2 border-b border-white/5 py-1 last:border-0">
              <span>{d.date} ({d.dayName})</span>
              <span>Camp {d.campScore.score.toFixed(1)} · Sky {d.nightSkyScore.score.toFixed(1)} · Fire {d.fireScore.level}</span>
            </div>
          ))}
        </div>
      </details>
    </motion.div>
  );
}
