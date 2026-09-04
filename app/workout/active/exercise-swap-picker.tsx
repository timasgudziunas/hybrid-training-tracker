"use client";

import { useMemo, useState } from "react";
import type { Exercise, SectionType } from "@/lib/program/program-types";
import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";
import { rankSubstitutes } from "@/lib/program/rank-substitutes";

const MAX_RESULTS = 20;
/** Cap on the "Similar" group so it never crowds out "Other exercises"
 * entirely when a lot of catalog entries share a muscle. */
const MAX_SIMILAR_RESULTS = 8;

/**
 * Inline, no-modal swap picker (Phase 5, owner-approved 2026-08-26: catalog
 * substitution supersedes the earlier "or pairs only" decision). With no
 * search text it shows two groups: exercises that target the same muscles
 * as the current one ("Similar"), then everything else sorted by section
 * relevance ("Other exercises") — 2026-09-04 owner request: "it should
 * recommend exercises that target the same muscles in case I do decide to
 * go with a different one." Typing a search filters both groups by name,
 * similar ones still listed first. Picking one hands the full Exercise
 * object back to the caller, which is responsible for updating
 * chosenExerciseId, injecting it into exercisesSnapshot, and recording the
 * SlotSubstitution — this component only searches and reports a choice.
 */
export default function ExerciseSwapPicker({
  sectionType,
  currentExercise,
  prescribedName,
  hasSubstitution,
  onPick,
  onRevert,
}: {
  sectionType: SectionType;
  currentExercise: Exercise | undefined;
  prescribedName: string;
  hasSubstitution: boolean;
  onPick: (exercise: Exercise) => void;
  onRevert: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const { similar, others } = useMemo(
    () => rankSubstitutes(currentExercise, EXERCISE_CATALOG, sectionType),
    [currentExercise, sectionType]
  );

  const { similarResults, otherResults } = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = (exercise: Exercise) => !normalizedQuery || exercise.name.toLowerCase().includes(normalizedQuery);

    if (!normalizedQuery) {
      const similarResults = similar.slice(0, MAX_SIMILAR_RESULTS);
      const otherResults = others.slice(0, Math.max(0, MAX_RESULTS - similarResults.length));
      return { similarResults, otherResults };
    }

    const similarResults = similar.filter(matches).slice(0, MAX_RESULTS);
    const otherResults = others.filter(matches).slice(0, Math.max(0, MAX_RESULTS - similarResults.length));
    return { similarResults, otherResults };
  }, [similar, others, query]);

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

  const noResults = similarResults.length === 0 && otherResults.length === 0;

  function handlePick(exercise: Exercise) {
    onPick(exercise);
    setExpanded(false);
    setQuery("");
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

      <div className="flex max-h-64 flex-col overflow-y-auto">
        {similarResults.length > 0 ? (
          <div className="flex flex-col divide-y divide-line-hairline border-b border-line-hairline pb-1">
            <p className="pb-1.5 text-xs font-medium uppercase tracking-widest text-ink-tertiary">
              Targets the same muscles
            </p>
            {similarResults.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} onPick={() => handlePick(exercise)} />
            ))}
          </div>
        ) : null}

        {otherResults.length > 0 ? (
          <div className="flex flex-col divide-y divide-line-hairline pt-1">
            <p className="pb-1.5 pt-1.5 text-xs font-medium uppercase tracking-widest text-ink-tertiary">
              Other exercises
            </p>
            {otherResults.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} onPick={() => handlePick(exercise)} />
            ))}
          </div>
        ) : null}

        {noResults ? <p className="py-2.5 text-sm text-ink-tertiary">No matches.</p> : null}
      </div>

      <p className="text-xs text-ink-tertiary">Prescription (sets and reps) stays as prescribed.</p>
    </div>
  );
}

function ExerciseRow({ exercise, onPick }: { exercise: Exercise; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex flex-col gap-0.5 py-2.5 text-left transition-colors active:bg-surface-2"
    >
      <span className="text-sm text-ink-secondary">{exercise.name}</span>
      {exercise.primaryMuscles.length > 0 ? (
        <span className="text-xs text-ink-tertiary">{exercise.primaryMuscles.join(", ")}</span>
      ) : null}
    </button>
  );
}
