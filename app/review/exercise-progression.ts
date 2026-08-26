/**
 * Deterministic, plain-language exercise progression comparison for the
 * Review dashboard (PRODUCT_SPEC §16 "7 exercises improved, 4 maintained, 1
 * regressed" / §17 "strength progression"). CLAUDE.md non-negotiable 17:
 * progression logic must be transparent, never hidden behind an inferred
 * model. The rule is exactly what double progression tracks: heaviest
 * working weight first, then total reps performed at that weight.
 *
 * Only repetitions-type prescriptions are compared — hold/duration/distance/
 * qualitative work has no weight-and-reps signal to compare this way.
 */

import { flattenTemplateSlots } from "@/lib/workout-session/flatten-template-slots";
import type { SetLog, WorkoutSessionRecord, WorkoutSessionStatus } from "@/lib/workout-session/workout-session-types";

const COUNTABLE_STATUSES: ReadonlySet<WorkoutSessionStatus> = new Set(["completed", "modified"]);

export type ProgressionVerdict = "progressed" | "maintained" | "regressed";

interface WeightedRepSet {
  weight: number;
  reps: number;
}

function weightedRepSets(sets: SetLog[]): WeightedRepSet[] {
  return sets
    .filter((set) => typeof set.weight === "number" && typeof set.reps === "number")
    .map((set) => ({ weight: set.weight as number, reps: set.reps as number }));
}

/**
 * Compares two logged exposures of the same exercise. Returns null when
 * either exposure has no weight+reps sets to compare (e.g. a hold/duration
 * exercise misfiled here, or a skipped exercise with no logged sets).
 */
export function compareExposures(earlier: SetLog[], later: SetLog[]): ProgressionVerdict | null {
  const earlierSets = weightedRepSets(earlier);
  const laterSets = weightedRepSets(later);
  if (earlierSets.length === 0 || laterSets.length === 0) return null;

  const earlierMaxWeight = Math.max(...earlierSets.map((s) => s.weight));
  const laterMaxWeight = Math.max(...laterSets.map((s) => s.weight));

  if (laterMaxWeight > earlierMaxWeight) return "progressed";
  if (laterMaxWeight < earlierMaxWeight) return "regressed";

  const earlierRepsAtMax = earlierSets.filter((s) => s.weight === earlierMaxWeight).reduce((sum, s) => sum + s.reps, 0);
  const laterRepsAtMax = laterSets.filter((s) => s.weight === laterMaxWeight).reduce((sum, s) => sum + s.reps, 0);

  if (laterRepsAtMax > earlierRepsAtMax) return "progressed";
  if (laterRepsAtMax < earlierRepsAtMax) return "regressed";
  return "maintained";
}

export interface ExerciseExposure {
  date: string;
  exerciseName: string;
  sets: SetLog[];
}

/**
 * Every repetitions-type exercise exposure across `sessions` (completed or
 * modified only — an unfinished or missed session logged nothing meaningful
 * to compare), grouped by the exercise actually performed (its chosen
 * exerciseId, so an "or" alternative doesn't get conflated with its pair)
 * and ordered oldest to newest.
 */
export function collectRepetitionExposures(sessions: WorkoutSessionRecord[]): Map<string, ExerciseExposure[]> {
  const byExercise = new Map<string, ExerciseExposure[]>();

  for (const session of sessions) {
    if (!COUNTABLE_STATUSES.has(session.status)) continue;

    const { performance } = session;
    const templateSlots = flattenTemplateSlots(performance.templateSnapshot);
    const slotByKey = new Map(templateSlots.map((slot) => [slot.slotKey, slot]));

    for (const [slotKey, log] of Object.entries(performance.slots)) {
      const slot = slotByKey.get(slotKey);
      if (!slot || slot.exercise.prescription.type !== "repetitions") continue;
      if (!log.chosenExerciseId || log.sets.length === 0) continue;

      const exerciseName = performance.exercisesSnapshot[log.chosenExerciseId]?.name ?? log.chosenExerciseId;
      const list = byExercise.get(log.chosenExerciseId) ?? [];
      list.push({ date: session.sessionDate, exerciseName, sets: log.sets });
      byExercise.set(log.chosenExerciseId, list);
    }
  }

  for (const list of byExercise.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }

  return byExercise;
}

export interface WeeklyProgressionSummary {
  progressed: number;
  maintained: number;
  regressed: number;
}

/**
 * Compares each exercise's most recent two exposures within `sessions`
 * (the caller passes sessions already filtered to the review window). An
 * exercise logged only once in the window is not evaluated — there is
 * nothing yet to compare it against.
 */
export function summarizeWeeklyProgression(sessions: WorkoutSessionRecord[]): WeeklyProgressionSummary {
  const byExercise = collectRepetitionExposures(sessions);
  let progressed = 0;
  let maintained = 0;
  let regressed = 0;

  for (const exposures of byExercise.values()) {
    if (exposures.length < 2) continue;
    const [earlier, later] = exposures.slice(-2);
    const verdict = compareExposures(earlier.sets, later.sets);
    if (verdict === "progressed") progressed += 1;
    else if (verdict === "maintained") maintained += 1;
    else if (verdict === "regressed") regressed += 1;
  }

  return { progressed, maintained, regressed };
}

export interface StrengthHighlight {
  exerciseName: string;
  earlierWeight: number;
  laterWeight: number;
  deltaWeight: number;
}

/**
 * Exercises ranked by heaviest-working-weight change between the first and
 * last logged exposure within `sessions` (caller passes sessions already
 * filtered to the review window). Highest increase first.
 */
export function topStrengthHighlights(sessions: WorkoutSessionRecord[], limit: number): StrengthHighlight[] {
  const byExercise = collectRepetitionExposures(sessions);
  const highlights: StrengthHighlight[] = [];

  for (const exposures of byExercise.values()) {
    if (exposures.length < 2) continue;
    const first = weightedRepSets(exposures[0].sets);
    const last = weightedRepSets(exposures[exposures.length - 1].sets);
    if (first.length === 0 || last.length === 0) continue;

    const earlierWeight = Math.max(...first.map((s) => s.weight));
    const laterWeight = Math.max(...last.map((s) => s.weight));
    highlights.push({
      exerciseName: exposures[exposures.length - 1].exerciseName,
      earlierWeight,
      laterWeight,
      deltaWeight: laterWeight - earlierWeight,
    });
  }

  return highlights.sort((a, b) => b.deltaWeight - a.deltaWeight).slice(0, limit);
}
