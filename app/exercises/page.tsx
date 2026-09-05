import { fetchActiveProgram } from "@/app/program/actions";
import { mergeExerciseSources } from "./merge-exercise-sources";
import ExerciseLibraryBrowser from "./exercise-library-browser";
import SiteHeader from "@/app/site-header";

/**
 * Exercise library index (PLAN.md R6 / old Phase 8, PRODUCT_SPEC.md §12;
 * expanded to a ~250 entry catalog under R10, 2026-09-04).
 * Merges the code catalog (lib/program/exercise-catalog.ts) with any
 * exercise the athlete's active pasted program references that the catalog
 * has no match for, so the library always covers everything the athlete
 * actually trains, not just what shipped in code.
 *
 * Wired into app/site-header.tsx's nav (as "Library") as of the R8
 * integration pass.
 */
// Per-account program merge read through the session cookie: never prerender.
export const dynamic = "force-dynamic";

export default async function ExerciseLibraryPage() {
  const activeProgramResult = await fetchActiveProgram();
  const programExercises = activeProgramResult.ok
    ? (activeProgramResult.data?.parsed.exercises ?? null)
    : null;

  const entries = mergeExerciseSources(programExercises);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <SiteHeader active="exercises" />

        <div className="flex flex-col gap-1.5">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
            Reference
          </p>
          <h1 className="font-display text-4xl font-bold text-ink-primary sm:text-5xl">Exercise Library</h1>
          <p className="text-sm text-ink-secondary">
            Every exercise the app knows, with where to feel it, cues, common mistakes, and how it is logged.
          </p>
        </div>

        <ExerciseLibraryBrowser entries={entries} />
      </div>
    </div>
  );
}
