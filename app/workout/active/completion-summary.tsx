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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Session complete</p>
        <h1 className="text-xl font-semibold text-white">{formatDuration(durationSeconds)}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-zinc-800 p-3">
          <p className="text-zinc-500">Exercises completed</p>
          <p className="text-lg font-medium text-white">{stats.exercisesCompleted}</p>
        </div>
        <div className="rounded-md border border-zinc-800 p-3">
          <p className="text-zinc-500">Sets completed</p>
          <p className="text-lg font-medium text-white">{stats.setsCompleted}</p>
        </div>
        {stats.exercisesSkipped > 0 ? (
          <div className="rounded-md border border-zinc-800 p-3">
            <p className="text-zinc-500">Skipped</p>
            <p className="text-lg font-medium text-white">{stats.exercisesSkipped}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600">Today</p>
        <div className="flex flex-col gap-1 text-sm text-zinc-300">
          {stats.totalTonnage > 0 ? <p>{Math.round(stats.totalTonnage).toLocaleString()} lb lifted</p> : null}
          {stats.totalSprintDistanceMeters > 0 ? <p>{stats.totalSprintDistanceMeters} m sprinted</p> : null}
          {stats.totalHoldSeconds > 0 ? <p>{stats.totalHoldSeconds}s held</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Difficulty (optional)</span>
        <div className="flex gap-1.5">
          {DIFFICULTY_OPTIONS.map((option) => {
            const selected = difficulty === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onSetDifficulty(selected ? undefined : option)}
                className={`h-11 w-11 rounded-md border text-sm font-medium ${
                  selected ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-300 active:bg-zinc-800"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Note (optional)</span>
        <textarea
          value={note}
          onChange={(e) => onSetNote(e.target.value)}
          rows={3}
          className="rounded-md border border-zinc-700 bg-black p-3 text-sm text-white"
        />
      </label>

      <button
        type="button"
        onClick={onFinish}
        disabled={finished}
        className="h-14 rounded-md bg-white text-base font-semibold text-black active:bg-zinc-300 disabled:opacity-50"
      >
        {finished ? "Saved" : "Finish"}
      </button>
    </div>
  );
}
