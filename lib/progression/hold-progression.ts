/**
 * Progression for seconds-range prescriptions: both `hold` (planche leans,
 * hollow-body holds, dead hangs, Copenhagen planks) and `duration`
 * (timed-but-itemless blocks like wrist preparation), which share the exact
 * same sets/minSeconds/maxSeconds/perSide shape in program-types.ts. There
 * is no load concept for either, so this is deliberately simpler than
 * double-progression.ts: work toward the top of the current seconds range
 * first, and only once every prescribed set gets there does the range
 * itself extend (rework brief: "progress conservatively, no load concept").
 * Pure and deterministic: no I/O, no Date.now(), no randomness, never an AI
 * model (CLAUDE.md non-negotiables 5, 6, 17).
 */

import type { DurationPrescription, HoldPrescription } from '@/lib/program/program-types';
import {
  DEFAULT_HOLD_SECONDS_INCREMENT,
} from './progression-types';
import type {
  ExposureLog,
  HoldProgressionEvidence,
  HoldProgressionOptions,
  HoldProgressionRecommendation,
  ProgressionEvidenceSet,
} from './progression-types';

export interface RecommendNextHoldInput {
  prescription: HoldPrescription | DurationPrescription;
  /** Most recent exposure first. */
  history: ExposureLog[];
  options?: HoldProgressionOptions;
}

/** "1 hold" vs "2 holds" — kept grammatical for single-set prescriptions. */
function holdsWord(count: number): string {
  return count === 1 ? 'hold' : 'holds';
}

function buildConsideredSets(exposure: ExposureLog, prescribedSets: number): ProgressionEvidenceSet[] {
  return Array.from({ length: prescribedSets }, (_, i) => {
    const setNumber = i + 1;
    const logged = exposure.find((s) => s.setNumber === setNumber);
    if (!logged) {
      return { setNumber, completed: false };
    }
    return { setNumber, seconds: logged.seconds, completed: logged.completed };
  });
}

export function recommendNextHold(input: RecommendNextHoldInput): HoldProgressionRecommendation {
  const { prescription, history } = input;
  const secondsIncrement = input.options?.secondsIncrement ?? DEFAULT_HOLD_SECONDS_INCREMENT;
  const rangeLabel = `${prescription.minSeconds} to ${prescription.maxSeconds} second`;

  const baseEvidence: HoldProgressionEvidence = {
    prescribedSets: prescription.sets,
    minSeconds: prescription.minSeconds,
    maxSeconds: prescription.maxSeconds,
  };

  // No data.
  if (history.length === 0) {
    return {
      action: 'no-data',
      reason:
        `This is the first time this hold has been logged. Aim for the low end of the ${rangeLabel} ` +
        `range with good position quality, and let the next exposure guide progression from there.`,
      evidence: baseEvidence,
    };
  }

  const consideredSets = buildConsideredSets(history[0], prescription.sets);

  // Fewer completed sets than prescribed.
  const allCompleted = consideredSets.every((s) => s.completed);
  if (!allCompleted) {
    const completedCount = consideredSets.filter((s) => s.completed).length;
    return {
      action: 'hold',
      reason:
        `Only ${completedCount} of the ${prescription.sets} prescribed ${holdsWord(prescription.sets)} ` +
        `${prescription.sets === 1 ? 'was' : 'were'} completed last time, so keep the same target and ` +
        `complete every prescribed set before extending the range.`,
      evidence: { ...baseEvidence, consideredSets, incompleteSets: true },
    };
  }

  // A completed set is missing its hold time.
  const allHaveSeconds = consideredSets.every((s) => s.seconds !== undefined);
  if (!allHaveSeconds) {
    return {
      action: 'hold',
      reason:
        `Last exposure is missing a logged hold time for one or more sets, so keep the same target and ` +
        `log a time for every set next time before extending the range.`,
      evidence: { ...baseEvidence, consideredSets, incompleteSets: true },
    };
  }

  const allAtTop = consideredSets.every((s) => (s.seconds as number) >= prescription.maxSeconds);

  // Every set reached the top: extend the range.
  if (allAtTop) {
    const suggestedTargetSeconds = prescription.maxSeconds + secondsIncrement;
    const scopeClause = prescription.sets === 1 ? 'The prescribed hold' : `All ${prescription.sets} holds`;
    return {
      action: 'increase-target',
      suggestedTargetSeconds,
      reason:
        `${scopeClause} reached the top of the ${rangeLabel} range, so extend the target ` +
        `to ${suggestedTargetSeconds} seconds next time.`,
      evidence: { ...baseEvidence, consideredSets, allSetsAtTop: true },
    };
  }

  // Otherwise, keep working toward the top of the current range.
  const bestSeconds = Math.max(...consideredSets.map((s) => s.seconds as number));
  return {
    action: 'hold',
    reason:
      `Best hold last time was ${bestSeconds} seconds, short of the top of the ${rangeLabel} range. Keep ` +
      `working toward ${prescription.maxSeconds} seconds on every set before the target extends.`,
    evidence: { ...baseEvidence, consideredSets, allSetsAtTop: false },
  };
}
