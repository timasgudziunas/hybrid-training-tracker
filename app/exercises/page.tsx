import { fetchActiveProgram } from "@/app/program/actions";
import { mergeExerciseSources } from "./merge-exercise-sources";
import ExerciseLibraryBrowser from "./exercise-library-browser";

/**
 * Exercise library index (PLAN.md R6 / old Phase 8, PRODUCT_SPEC.md §12).
 * Merges the code catalog (lib/program/exercise-catalog.ts, 58 entries)
 * with any exercise the athlete's active pasted program references that the
 * catalog has no match for, so the library always covers everything the
 * athlete actually trains, not just what shipped in code.
 *
 * This screen does not render the shared site header/nav: R6 only owns
 * app/exercises/, and wiring "Exercises" into the top nav and into
 * in-workout exercise links is a later integration pass across the whole
 * app (see PLAN.md R8).
 */
export default async function ExerciseLibraryPage() {
  const activeProgramResult = await fetchActiveProgram();
  const programExercises = activeProgramResult.ok
    ? (activeProgramResult.data?.parsed.exercises ?? null)
    : null;

  const entries = mergeExerciseSources(programExercises);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
            Reference
          </p>
          <h1 className="font-display text-4xl font-bold text-ink-primary sm:text-5xl">Exercise Library</h1>
          <p className="text-sm text-ink-secondary">
            Purpose, cues, and progression for every exercise in the program.
          </p>
        </div>

        <ExerciseLibraryBrowser entries={entries} />
      </div>
    </div>
  );
}
