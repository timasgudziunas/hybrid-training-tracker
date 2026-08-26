"use client";

import { useMemo, useState } from "react";
import type { Exercise, ExerciseCategory, SectionType } from "@/lib/program/program-types";
import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";

const MAX_RESULTS = 20;

/** Rough priority mapping from a workout section's type to the exercise
 * catalog categories most relevant to it, used only to sort the swap list
 * (never to filter it out entirely — any catalog exercise remains pickable,
 * per the owner's 2026-08-26 decision to go beyond program-defined "or"
 * pairs). Sections without an exact category counterpart (warmup, core,
 * recovery) map to the closest catalog categories. */
const SECTION_CATEGORY_PRIORITY: Record<SectionType, ExerciseCategory[]> = {
  warmup: ["mobility"],
  speed: ["speed"],
  power: ["power"],
  calisthenics: ["calisthenics"],
  strength: ["strength", "hypertrophy"],
  core: ["calisthenics", "hypertrophy"],
  mobility: ["mobility"],
  recovery: ["mobility", "rehabilitation-prehab"],
  cardio: ["cardio"],
};

/**
 * Inline, no-modal swap picker (Phase 5, owner-approved 2026-08-26: catalog
 * substitution supersedes the earlier "or pairs only" decision). Search
 * filters the full exercise catalog by name; exercises whose category
 * matches the slot's own section sort first. Picking one hands the full
 * Exercise object back to the caller, which is responsible for updating
 * chosenExerciseId, injecting it into exercisesSnapshot, and recording the
 * SlotSubstitution — this component only searches and reports a choice.
 */
export default function ExerciseSwapPicker({
  sectionType,
  currentChosenExerciseId,
  prescribedName,
  hasSubstitution,
  onPick,
  onRevert,
}: {
  sectionType: SectionType;
  currentChosenExerciseId: string | undefined;
  prescribedName: string;
  hasSubstitution: boolean;
  onPick: (exercise: Exercise) => void;
  onRevert: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const priority = SECTION_CATEGORY_PRIORITY[sectionType] ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    return EXERCISE_CATALOG.filter((exercise) => exercise.id !== currentChosenExerciseId)
      .filter((exercise) => !normalizedQuery || exercise.name.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        const aPriority = priority.includes(a.category) ? 0 : 1;
        const bPriority = priority.includes(b.category) ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.name.localeCompare(b.name);
      })
      .slice(0, MAX_RESULTS);
  }, [sectionType, currentChosenExerciseId, query]);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="self-start text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
      >
        Swap
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-line-default bg-surface-2/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-tertiary">Swap exercise</p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
        >
          Close
        </button>
      </div>

      {hasSubstitution ? (
        <button
          type="button"
          onClick={() => {
            onRevert();
            setExpanded(false);
          }}
          className="self-start rounded-lg border border-line-default px-3 py-2 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2"
        >
          Back to {prescribedName}
        </button>
      ) : null}

      <input
        type="text"
        inputMode="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises"
        autoFocus
        className="h-11 rounded-lg border border-line-default bg-surface-2 px-3 text-sm text-ink-primary focus:border-accent focus:outline-none"
      />

      <div className="flex max-h-64 flex-col divide-y divide-line-hairline overflow-y-auto">
        {results.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => {
              onPick(exercise);
              setExpanded(false);
              setQuery("");
            }}
            className="flex items-center justify-between gap-3 py-2.5 text-left text-sm text-ink-secondary transition-colors active:bg-surface-2 active:text-ink-primary"
          >
            {exercise.name}
          </button>
        ))}
        {results.length === 0 ? <p className="py-2.5 text-sm text-ink-tertiary">No matches.</p> : null}
      </div>

      <p className="text-xs text-ink-tertiary">Prescription (sets and reps) stays as prescribed.</p>
    </div>
  );
}
