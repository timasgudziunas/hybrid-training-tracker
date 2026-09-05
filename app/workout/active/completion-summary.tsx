"use client";

import Link from "next/link";
import { useState } from "react";
import type { Exercise } from "@/lib/program/program-types";
import type { SessionDeviation } from "@/lib/workout-session/session-deviations";
import type { CompletionStats, EndedEarlyReason } from "@/lib/workout-session/workout-session-types";
import AddExercisePicker from "./add-exercise-picker";

const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5] as const;

/** Mirrors the save-queue outcome of Finish, replacing the old bare
 * `finished` boolean so the UI can distinguish "saving", "saved", and
 * "failed" instead of collapsing them all into one disabled state (the
 * 2026-08-26 incident: a save that actually failed still showed "Saved"). */
export type FinishState = "idle" | "saving" | "saved" | "failed";

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
  finishState,
  onRetry,
  deviations,
  endedEarlyReason,
  addedExerciseNames,
  onAddExercise,
}: {
  startedAt: string;
  finalDurationSeconds: number | null;
  stats: CompletionStats;
  difficulty: number | undefined;
  note: string;
  onSetDifficulty: (value: number | undefined) => void;
  onSetNote: (value: string) => void;
  onFinish: () => void;
  finishState: FinishState;
  onRetry: () => void;
  deviations: SessionDeviation[];
  endedEarlyReason: EndedEarlyReason | undefined;
  /** Names of exercises added mid-workout (performance.modifications.
   * addedSlotKeys, resolved by active-workout-screen.tsx). Informational
   * only, never a deviation: adding extra work is not failing the plan. */
  addedExerciseNames: string[];
  onAddExercise: (exercise: Exercise) => void;
}) {
  // Frozen when this screen appears (the parent remounts it on view change)
  // so it doesn't tick while the athlete types a note; the exact stored
  // duration takes over once Finish has been pressed (any state past
  // "idle" means handleFinish has run and finalDurationSeconds is set).
  const [reachedAtSeconds] = useState(() => (Date.now() - new Date(startedAt).getTime()) / 1000);
  const isFinished = finishState !== "idle";
  const durationSeconds = isFinished && finalDurationSeconds !== null ? finalDurationSeconds : reachedAtSeconds;

  const todayStats = [
    stats.totalTonnage > 0 ? { label: "Lifted", value: `${Math.round(stats.totalTonnage).toLocaleString()} lb` } : null,
    stats.totalSprintDistanceMeters > 0 ? { label: "Sprinted", value: `${stats.totalSprintDistanceMeters} m` } : null,
    stats.totalHoldSeconds > 0 ? { label: "Held", value: `${stats.totalHoldSeconds}s` } : null,
    stats.totalCardioSeconds && stats.totalCardioSeconds > 0
      ? { label: "Cardio", value: `${Math.max(1, Math.round(stats.totalCardioSeconds / 60))} min` }
      : null,
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

      {addedExerciseNames.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line-hairline bg-surface-2 p-4">
          <p className="text-sm font-semibold text-ink-primary">Added today</p>
          <ul className="flex flex-col gap-1 text-sm text-ink-secondary">
            {addedExerciseNames.map((name, index) => (
              <li key={`${name}-${index}`}>{name}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {deviations.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-line-hairline bg-surface-2 p-4">
          <p className="text-sm font-semibold text-ink-primary">Saving as Modified</p>
          <ul className="flex flex-col gap-1 text-sm text-ink-secondary">
            {deviations.map((deviation, index) => (
              <li key={`${deviation.kind}-${deviation.slotKey ?? index}`}>{deviation.label}</li>
            ))}
          </ul>
          <p className="text-xs text-ink-tertiary">A modified session still counts as showing up.</p>
          {endedEarlyReason === "discomfort" ? (
            <p className="text-xs text-ink-tertiary">
              This is not a diagnosis. If the discomfort persists or interferes with sprinting or cutting, consider
              getting assessed by a sports medicine professional or physical therapist.
            </p>
          ) : null}
        </div>
      ) : null}

      {finishState === "failed" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4">
          <p className="text-sm text-ink-primary">
            Not saved to the cloud yet. Your workout is safe on this device and will sync automatically next time you
            open a workout.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onRetry}
              className="h-11 rounded-lg border border-line-default px-4 text-sm font-medium text-ink-secondary transition-colors active:bg-surface-2"
            >
              Retry save
            </button>
            <Link href="/" className="text-sm font-medium text-accent-strong underline underline-offset-4">
              Back to Today
            </Link>
          </div>
        </div>
      ) : null}

      {finishState === "saved" ? (
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs text-ink-tertiary">Saved to your history.</p>
          <Link
            href="/"
            className="flex h-16 items-center justify-center rounded-xl bg-accent text-lg font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong"
          >
            Back to Today
          </Link>
        </div>
      ) : (
        <>
          <AddExercisePicker onAdd={onAddExercise} />
          <button
            type="button"
            onClick={onFinish}
            disabled={isFinished}
            className="h-16 rounded-xl bg-accent text-lg font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong disabled:opacity-50"
          >
            {finishState === "saving" ? "Saving" : "Finish workout"}
          </button>
        </>
      )}
    </div>
  );
}
