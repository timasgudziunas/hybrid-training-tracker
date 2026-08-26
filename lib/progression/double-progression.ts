/**
 * Double progression for repetitions-type prescriptions (TRAINING_SYSTEM.md
 * §12, PRODUCT_SPEC.md §8). Pure and deterministic: data in, data out. No
 * I/O, no Date.now(), no randomness, never an AI model (CLAUDE.md
 * non-negotiables 5, 6, 17).
 *
 * Decision order, evaluated against the single most recent exposure only
 * (history[0]):
 *
 * 1. No history at all -> no-data: establish a baseline.
 * 2. Fewer completed sets than prescribed, or reps missing for a set that
 *    was logged -> hold. Incomplete data can never qualify for increase-load
 *    (binding rule from the rework brief).
 * 3. Otherwise every prescribed set has weight + reps + completed=true.
 *    Determine the "reference weight":
 *      - If every set used the same weight, that weight is the reference
 *        and every set counts toward qualification.
 *      - If sets used different weights (judgment call, per the rework
 *        brief's own wording: "use the highest weight used ... qualify
 *        only if all sets at or above the reference weight hit the top"),
 *        the reference weight is the HIGHEST weight logged, and only the
 *        sets performed AT that weight count toward qualification. Sets
 *        performed at a lower weight are evidence, but do not block
 *        qualification and do not count toward the "every set" reps check.
 *      - If some sets have no weight logged at all (bodyweight-only
 *        exercise, no external load ever recorded), there is no reference
 *        weight; the top-of-range condition can still be evaluated for
 *        add-reps purposes, but the module never invents a weight to
 *        increase.
 * 4. If every qualifying set (per the reference-weight rule above) reached
 *    the top of the range:
 *      a. No reference weight -> hold: praise reaching the top, but there
 *         is nothing to add load to.
 *      b. Two or more qualifying sets were ALSO logged at 0 RIR (grinding)
 *         -> hold: consolidate reps in reserve before adding load
 *         (TRAINING_SYSTEM.md §11: hypertrophy work should generally finish
 *         around 1 to 3 RIR). Unlogged RIR is treated as unknown, never as
 *         failing this condition.
 *      c. Otherwise -> increase-load: add the configured increment and
 *         return toward the low end of the range.
 * 5. Otherwise -> add-reps: name which sets have room and the next
 *    incremental rep target (weakest set's reps + 1, capped at maxReps).
 */

import type { RepetitionsPrescription } from '@/lib/program/program-types';
import {
  DEFAULT_LOAD_INCREMENT_LB,
  DEFAULT_MIN_GRINDING_SETS_TO_HOLD,
} from './progression-types';
import type {
  ExposureLog,
  ProgressionEvidence,
  ProgressionEvidenceSet,
  ProgressionOptions,
  ProgressionRecommendation,
} from './progression-types';

export interface RecommendNextPrescriptionInput {
  prescription: RepetitionsPrescription;
  /** Most recent exposure first. */
  history: ExposureLog[];
  options?: ProgressionOptions;
}

/** "1 set" vs "2 sets" — kept as a tiny local helper so reason sentences
 * stay grammatical for single-set prescriptions rather than a blanket
 * "X sets" that reads oddly at 1. */
function setsWord(count: number): string {
  return count === 1 ? 'set' : 'sets';
}

/** Builds the fixed-length considered-sets array for a prescription: one
 * entry per prescribed set number, in order, defaulting to an
 * uncompleted/empty placeholder when a set was never logged at all. Sets
 * logged beyond the prescribed count (via "+ Add set") are intentionally
 * excluded; they are informational, not part of the double progression
 * condition. */
function buildConsideredSets(
  exposure: ExposureLog,
  prescribedSets: number
): ProgressionEvidenceSet[] {
  return Array.from({ length: prescribedSets }, (_, i) => {
    const setNumber = i + 1;
    const logged = exposure.find((s) => s.setNumber === setNumber);
    if (!logged) {
      return { setNumber, completed: false };
    }
    return {
      setNumber,
      weight: logged.weight,
      reps: logged.reps,
      rir: logged.rir,
      completed: logged.completed,
    };
  });
}

export function recommendNextPrescription(
  input: RecommendNextPrescriptionInput
): ProgressionRecommendation {
  const { prescription, history } = input;
  const loadIncrement = input.options?.loadIncrementLb ?? DEFAULT_LOAD_INCREMENT_LB;
  const minGrindingSets =
    input.options?.minGrindingSetsToHold ?? DEFAULT_MIN_GRINDING_SETS_TO_HOLD;
  const rangeLabel = `${prescription.minReps} to ${prescription.maxReps}`;

  const baseEvidence: ProgressionEvidence = {
    prescribedSets: prescription.sets,
    minReps: prescription.minReps,
    maxReps: prescription.maxReps,
  };

  // 1. No data.
  if (history.length === 0) {
    return {
      action: 'no-data',
      reason:
        `This is the first time this exercise has been logged. Pick a weight you could perform for ` +
        `${prescription.minReps} reps with 2 to 3 reps in reserve, at the low end of the ${rangeLabel} range, ` +
        `and let the next exposure guide progression from there.`,
      evidence: baseEvidence,
    };
  }

  const consideredSets = buildConsideredSets(history[0], prescription.sets);

  // 2a. Fewer completed sets than prescribed.
  const allCompleted = consideredSets.every((s) => s.completed);
  if (!allCompleted) {
    const completedCount = consideredSets.filter((s) => s.completed).length;
    const lastLoggedWeight = [...consideredSets].reverse().find((s) => s.weight !== undefined)?.weight;
    return {
      action: 'hold',
      suggestedWeight: lastLoggedWeight,
      reason:
        `Only ${completedCount} of the ${prescription.sets} prescribed ${setsWord(prescription.sets)} ` +
        `${prescription.sets === 1 ? 'was' : 'were'} completed last time, so hold at the same weight` +
        `${lastLoggedWeight !== undefined ? ` (${lastLoggedWeight} lb)` : ''} and complete every prescribed set before adding load.`,
      evidence: { ...baseEvidence, consideredSets, incompleteSets: true },
    };
  }

  // 2b. A completed set is missing its reps.
  const allHaveReps = consideredSets.every((s) => s.reps !== undefined);
  if (!allHaveReps) {
    return {
      action: 'hold',
      reason:
        `Last exposure is missing a logged rep count for one or more sets, so hold at the same weight ` +
        `and log reps for every set next time before progressing.`,
      evidence: { ...baseEvidence, consideredSets, incompleteSets: true },
    };
  }

  // 3. Determine the reference weight and which sets qualify against it.
  const numericWeights = consideredSets
    .map((s) => s.weight)
    .filter((w): w is number => w !== undefined);
  const hasWeightForEverySet = numericWeights.length === consideredSets.length;
  const referenceWeight = hasWeightForEverySet ? Math.max(...numericWeights) : undefined;
  const mixedWeights = hasWeightForEverySet && new Set(numericWeights).size > 1;

  const qualifyingSets =
    referenceWeight !== undefined && mixedWeights
      ? consideredSets.filter((s) => s.weight === referenceWeight)
      : consideredSets;

  const allQualifyingAtTop =
    qualifyingSets.length > 0 && qualifyingSets.every((s) => (s.reps as number) >= prescription.maxReps);
  const zeroRirAtTopCount = qualifyingSets.filter(
    (s) => (s.reps as number) >= prescription.maxReps && s.rir === 0
  ).length;

  // 4a. Top of range reached, but no consistent weight to increase.
  if (allQualifyingAtTop && referenceWeight === undefined) {
    return {
      action: 'hold',
      reason:
        `Every prescribed set reached the top of the ${rangeLabel} range, but no weight was logged to ` +
        `increase. Hold this rep target and log a weight next time if external load applies, so the engine ` +
        `can recommend a load increase.`,
      evidence: { ...baseEvidence, consideredSets, allSetsAtTop: true, zeroRirAtTopCount },
    };
  }

  if (allQualifyingAtTop && referenceWeight !== undefined) {
    const scopeClause =
      qualifyingSets.length === prescription.sets
        ? prescription.sets === 1
          ? 'The prescribed set'
          : `All ${prescription.sets} sets`
        : `The ${qualifyingSets.length} of ${prescription.sets} ${setsWord(prescription.sets)} performed at ${referenceWeight} lb`;
    const mixedNote = mixedWeights
      ? ` Weight varied across sets last time, so this recommendation is based only on the sets performed ` +
        `at the highest weight used, ${referenceWeight} lb.`
      : '';

    // 4b. Grinding: reached the top, but with no reps in reserve on multiple sets.
    if (zeroRirAtTopCount >= minGrindingSets) {
      return {
        action: 'hold',
        suggestedWeight: referenceWeight,
        reason:
          `${scopeClause} reached the top of the ${rangeLabel} range at ${referenceWeight} lb, but ` +
          `${zeroRirAtTopCount} of those sets had no reps in reserve. Hold at ${referenceWeight} lb and ` +
          `consolidate with better reps in reserve before adding load.${mixedNote}`,
        evidence: {
          ...baseEvidence,
          consideredSets,
          mixedWeights,
          referenceWeight,
          allSetsAtTop: true,
          zeroRirAtTopCount,
        },
      };
    }

    // 4c. Increase load.
    const suggestedWeight = referenceWeight + loadIncrement;
    const rirClause = qualifyingSets.some((s) => s.rir !== undefined) ? ' with reps in reserve' : '';
    return {
      action: 'increase-load',
      suggestedWeight,
      targetReps: rangeLabel,
      reason:
        `${scopeClause} reached the top of the ${rangeLabel} range at ${referenceWeight} lb${rirClause}, ` +
        `so add ${loadIncrement} lb and work back from the low end of the range at ${suggestedWeight} lb.${mixedNote}`,
      evidence: {
        ...baseEvidence,
        consideredSets,
        mixedWeights,
        referenceWeight,
        allSetsAtTop: true,
        zeroRirAtTopCount,
      },
    };
  }

  // 5. Add reps: identify the weakest set and the sets with room to grow.
  const weakestReps = Math.min(...consideredSets.map((s) => s.reps as number));
  const nextTarget = Math.min(weakestReps + 1, prescription.maxReps);
  const setsWithRoom = consideredSets
    .filter((s) => (s.reps as number) < prescription.maxReps)
    .map((s) => `set ${s.setNumber} at ${s.reps}`)
    .join(', ');
  const perSetSummary = consideredSets
    .map((s) => `${s.weight !== undefined ? `${s.weight} lb x ` : ''}${s.reps}`)
    .join(', ');
  const mixedNote = mixedWeights
    ? ' Weight also varied across sets last time; use one consistent weight for every set next time.'
    : '';

  return {
    action: 'add-reps',
    suggestedWeight: referenceWeight,
    targetReps: `${nextTarget} to ${prescription.maxReps}`,
    reason:
      `Last exposure was ${perSetSummary}, short of the top of the ${rangeLabel} range. Aim for ` +
      `${nextTarget} or more reps on ${setsWithRoom || 'every set'} before adding load.${mixedNote}`,
    evidence: {
      ...baseEvidence,
      consideredSets,
      mixedWeights,
      referenceWeight,
      allSetsAtTop: false,
      zeroRirAtTopCount,
    },
  };
}
