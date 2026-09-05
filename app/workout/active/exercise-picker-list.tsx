"use client";

import { useMemo, useState } from "react";
import type { Exercise, MuscleGroup } from "@/lib/program/program-types";
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from "@/lib/program/muscle-group-copy";
import { formatPrescriptionPreset } from "@/lib/program/set-entry-fields";

/** Combined cap on how many exercises a single group shows at once (R10):
 * a quick glance list should never turn into a huge uncapped scroll. Only
 * meaningful for the grouped (swap) usage — the ungrouped "Add exercise"
 * browse of the whole catalog is meant to be fully reachable via the
 * muscle-group chips and search instead of an arbitrary cut. */
const MAX_GROUP_RESULTS = 20;

export interface ExercisePickerGroup {
  label: string;
  items: Exercise[];
}

/**
 * Shared exercise list used by both the swap picker and "Add exercise"
 * (R10, owner request 2026-09-04: "the whole point of swap exercise is to
 * see what else I can do out of curiosity" — so the search box never grabs
 * focus on its own; the athlete taps in only when they want to type).
 *
 * Owns its own search text and muscle-group chip filter. With `groups`
 * given (the swap picker's ranked "Targets the same muscles"/"Other
 * exercises" split) each group is filtered and capped independently; with
 * a flat `exercises` list (the full catalog for "Add exercise") everything
 * matching the current filters is shown, uncapped, since browsing the
 * whole library is the point.
 */
export default function ExercisePickerList({
  exercises,
  onPick,
  groups,
  emptyLabel,
}: {
  exercises: Exercise[];
  onPick: (exercise: Exercise) => void;
  groups?: ExercisePickerGroup[];
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "all">("all");

  const presentMuscleGroups = useMemo(() => {
    const pool = groups ? groups.flatMap((group) => group.items) : exercises;
    const present = new Set(
      pool.map((exercise) => exercise.muscleGroup).filter((group): group is MuscleGroup => Boolean(group))
    );
    return MUSCLE_GROUP_ORDER.filter((group) => present.has(group));
  }, [exercises, groups]);

  const normalizedQuery = query.trim().toLowerCase();

  function matches(exercise: Exercise): boolean {
    if (muscleGroup !== "all" && exercise.muscleGroup !== muscleGroup) return false;
    if (!normalizedQuery) return true;
    if (exercise.name.toLowerCase().includes(normalizedQuery)) return true;
    return exercise.primaryMuscles.some((muscle) => muscle.toLowerCase().includes(normalizedQuery));
  }

  const displayGroups: ExercisePickerGroup[] = groups
    ? groups.map((group) => ({ label: group.label, items: group.items.filter(matches).slice(0, MAX_GROUP_RESULTS) }))
    : [{ label: "", items: exercises.filter(matches) }];

  const isEmpty = displayGroups.every((group) => group.items.length === 0);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        inputMode="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises"
        className="h-11 rounded-lg border border-line-default bg-surface-2 px-3 text-sm text-ink-primary focus:border-accent focus:outline-none"
      />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setMuscleGroup("all")}
          className={`flex h-9 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
            muscleGroup === "all"
              ? "border-accent bg-accent-soft text-accent-strong"
              : "border-line-default text-ink-secondary active:bg-surface-2"
          }`}
        >
          All
        </button>
        {presentMuscleGroups.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setMuscleGroup(group)}
            className={`flex h-9 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
              muscleGroup === group
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-line-default text-ink-secondary active:bg-surface-2"
            }`}
          >
            {MUSCLE_GROUP_LABELS[group]}
          </button>
        ))}
      </div>

      <div className="flex max-h-80 flex-col overflow-y-auto">
        {displayGroups.map((group) =>
          group.items.length === 0 ? null : (
            <div
              key={group.label || "flat"}
              className="flex flex-col divide-y divide-line-hairline border-b border-line-hairline pb-1 last:border-b-0"
            >
              {group.label ? (
                <p className="pb-1.5 text-xs font-medium uppercase tracking-widest text-ink-tertiary">{group.label}</p>
              ) : null}
              {group.items.map((exercise) => (
                <ExercisePickerRow key={exercise.id} exercise={exercise} onPick={() => onPick(exercise)} />
              ))}
            </div>
          )
        )}
        {isEmpty ? <p className="py-2.5 text-sm text-ink-tertiary">{emptyLabel ?? "No matches."}</p> : null}
      </div>
    </div>
  );
}

function ExercisePickerRow({ exercise, onPick }: { exercise: Exercise; onPick: () => void }) {
  const preset = exercise.defaultPrescription ? formatPrescriptionPreset(exercise.defaultPrescription) : null;

  return (
    <button type="button" onClick={onPick} className="flex flex-col gap-0.5 py-2.5 text-left transition-colors active:bg-surface-2">
      <span className="text-sm text-ink-secondary">{exercise.name}</span>
      {exercise.primaryMuscles.length > 0 ? (
        <span className="text-xs text-ink-tertiary">{exercise.primaryMuscles.join(", ")}</span>
      ) : null}
      {preset ? <span className="text-xs text-ink-tertiary">{preset}</span> : null}
    </button>
  );
}
