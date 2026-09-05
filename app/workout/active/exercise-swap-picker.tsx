"use client";

import { useMemo, useState } from "react";
import type { Exercise, SectionType } from "@/lib/program/program-types";
import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";
import { rankSubstitutes } from "@/lib/program/rank-substitutes";
import ExercisePickerList from "./exercise-picker-list";

/**
 * Inline, no-modal swap picker (Phase 5, owner-approved 2026-08-26: catalog
 * substitution supersedes the earlier "or pairs only" decision). Shares its
 * list rendering, search box, and muscle-group chips with the "Add
 * exercise" picker via ExercisePickerList (R10). Two ranked groups:
 * exercises that target the same muscles as the current one ("Targets the
 * same muscles") first, then everything else ("Other exercises") —
 * 2026-09-04 owner request: "it should recommend exercises that target the
 * same muscles in case I do decide to go with a different one."
 *
 * The search box deliberately does NOT autofocus when the picker opens
 * (owner, 2026-09-04: "I do not want to be defaulted into the search bar...
 * the whole point of swap exercise is to see what else I can do out of
 * curiosity") — ExercisePickerList never autofocuses its own search input.
 *
 * Picking an exercise hands the full Exercise object back to the caller,
 * which is responsible for updating chosenExerciseId, injecting it into
 * exercisesSnapshot, recording the SlotSubstitution, and (R10, "presets
 * feed Swap") adjusting the slot's prescription when the substitute logs a
 * different kind of set — this component only searches and reports a
 * choice.
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

  const { similar, others } = useMemo(
    () => rankSubstitutes(currentExercise, EXERCISE_CATALOG, sectionType),
    [currentExercise, sectionType]
  );

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

  function handlePick(exercise: Exercise) {
    onPick(exercise);
    setExpanded(false);
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

      <ExercisePickerList
        exercises={EXERCISE_CATALOG}
        groups={[
          { label: "Targets the same muscles", items: similar },
          { label: "Other exercises", items: others },
        ]}
        onPick={handlePick}
      />

      <p className="text-xs text-ink-tertiary">
        Sets and reps stay as prescribed unless the new exercise logs a different kind of set.
      </p>
    </div>
  );
}
