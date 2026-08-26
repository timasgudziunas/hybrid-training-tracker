import type { Exercise } from "@/lib/program/program-types";

/**
 * True when an exercise carries enough of the instructional fields
 * (lib/program/exercise-catalog.ts: intendedFeeling, cues, commonMistakes)
 * to render meaningful guidance. Mirrors the check
 * app/workout/active/exercise-guidance-disclosure.tsx uses to decide
 * whether to show its "Help me feel it" disclosure, so the same exercise
 * is judged "has guidance" consistently everywhere in the app.
 */
export function hasFullGuidance(exercise: Exercise): boolean {
  return Boolean(exercise.intendedFeeling || exercise.cues?.length || exercise.commonMistakes?.length);
}
