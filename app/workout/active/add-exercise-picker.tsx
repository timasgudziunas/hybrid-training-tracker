"use client";

import { useState } from "react";
import type { Exercise, MuscleGroup } from "@/lib/program/program-types";
import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";
import { MUSCLE_GROUP_ORDER } from "@/lib/program/muscle-group-copy";
import ExercisePickerList from "./exercise-picker-list";

const MUSCLE_GROUP_RANK = new Map<MuscleGroup, number>(MUSCLE_GROUP_ORDER.map((group, index) => [group, index]));

function muscleGroupRank(exercise: Exercise): number {
  return exercise.muscleGroup ? (MUSCLE_GROUP_RANK.get(exercise.muscleGroup) ?? MUSCLE_GROUP_ORDER.length) : MUSCLE_GROUP_ORDER.length;
}

const SORTED_CATALOG: Exercise[] = [...EXERCISE_CATALOG].sort((a, b) => {
  const rankDiff = muscleGroupRank(a) - muscleGroupRank(b);
  return rankDiff !== 0 ? rankDiff : a.name.localeCompare(b.name);
});

/**
 * "Add exercise" mid-workout (R10, owner decision 2026-09-04). A disclosure
 * over the full library, sorted by muscle group then name, so anything done
 * beyond the plan gets logged the same way as everything else. Rendered
 * both on the session overview and on the completion summary
 * (active-workout-screen.tsx wires the pick through handleAddExercise:
 * adds it to the session, persists, and fetches its previous performance).
 */
export default function AddExercisePicker({ onAdd }: { onAdd: (exercise: Exercise) => void }) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="self-start rounded-lg border border-line-default px-3 py-2 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2"
      >
        + Add exercise
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-default bg-surface-2/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-tertiary">Add exercise</p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
        >
          Close
        </button>
      </div>
      <ExercisePickerList
        exercises={SORTED_CATALOG}
        onPick={(exercise) => {
          onAdd(exercise);
          setExpanded(false);
        }}
      />
    </div>
  );
}
