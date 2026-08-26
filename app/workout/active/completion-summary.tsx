"use client";

import { useState } from "react";
import type { CompletionStats } from "@/lib/workout-session/workout-session-types";

const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5] as const;

function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  return `${minutes} min`;
}

/** Completion summary (PRODUCT_SPEC §6): duration, exercises/sets
 * completed, optional difficulty + note, plus restrained fun stats — data,
 * not badges (non-negotiable / PRODUCT_SPEC §20). */
export default function CompletionSummary({
  startedAt,
  finalDurationSeconds,
  stats,
  difficulty,
  note,
  onSetDifficulty,
  onSetNote,
  onFinish,
  finished,
}: {
  startedAt: string;
  finalDurationSeconds: number | null;
  stats: CompletionStats;
  difficulty: number | undefined;
  note: string;
  onSetDifficulty: (value: number | undefined) => void;
  onSetNote: (value: string) => void;
  onFinish: () => void;
  finished: boolean;
}) {
  // Frozen when this screen appears (the parent remounts it on view change)
  // so it doesn't tick while the athlete types a note; the exact stored
  // duration takes over once Finish has been pressed.
  const [reachedAtSeconds] = useState(() => (Date.now() - new Date(startedAt).getTime()) / 1000);
  const durationSeconds = finished && finalDurationSeconds !== null ? finalDurationSeconds : reachedAtSeconds;

  const todayStats = [
    stats.totalTonnage > 0 ? { label: "Lifted", value: `${Math.round(stats.totalTonnage).toLocaleString()} lb` } : null,
    stats.totalSprintDistanceMeters > 0 ? { label: "Sprinted", value: `${stats.totalSprintDistanceMeters} m` } : null,
    stats.totalHoldSeconds > 0 ? { label: "Held", value: `${stats.totalHoldSeconds}s` } : null,
  ].filter((entry): entry is { label: string; value: string } => entry !== null);

  return (
    <div className="flex flex-col gap-7 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
          Session complete
        </p>
        <h1 className="font-display text-6xl font-bold tabular-nums text-ink-primary sm:text-7xl">
          {formatDuration(durationSeconds)}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line-hairline bg-surface-2 p-4">
          <p className="text-xs text-ink-tertiary">Exercises</p>
          <p className="font-display text-3xl font-bold tabular-nums text-ink-primary">{stats.exercisesCompleted}</p>
        </div>
        <div className="rounded-xl border border-line-hairline bg-surface-2 p-4">
          <p className="text-xs text-ink-tertiary">Sets</p>
          <p className="font-display text-3xl font-bold tabular-nums text-ink-primary">{stats.setsCompleted}</p>
        </div>
        {stats.exercisesSkipped > 0 ? (
          <div className="rounded-xl border border-line-hairline bg-surface-2 p-4">
            <p className="text-xs text-ink-tertiary">Skipped</p>
            <p className="font-display text-3xl font-bold tabular-nums text-ink-primary">{stats.exercisesSkipped}</p>
          </div>
        ) : null}
      </div>

      {todayStats.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Today</p>
          <div className="flex flex-col divide-y divide-line-hairline">
            {todayStats.map((entry) => (
              <div key={entry.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-secondary">{entry.label}</span>
                <span className="font-display text-lg font-semibold tabular-nums text-ink-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Difficulty (optional)</span>
        <div className="flex gap-1.5">
          {DIFFICULTY_OPTIONS.map((option) => {
            const selected = difficulty === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onSetDifficulty(selected ? undefined : option)}
                className={`h-11 w-11 rounded-lg border font-display text-base font-semibold tabular-nums transition-colors ${
                  selected ? "border-accent bg-accent text-accent-ink" : "border-line-default text-ink-secondary active:bg-surface-2"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Note (optional)</span>
        <textarea
          value={note}
          onChange={(e) => onSetNote(e.target.value)}
          rows={3}
          className="rounded-xl border border-line-default bg-surface-2 p-3 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={onFinish}
        disabled={finished}
        className="h-16 rounded-xl bg-accent text-lg font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong disabled:opacity-50"
      >
        {finished ? "Saved" : "Finish"}
      </button>
    </div>
  );
}
