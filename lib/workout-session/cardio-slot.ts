/**
 * Detection and small display helpers for "cardio slots" (owner request,
 * 2026-09-04): cycling, rowing, running, and similar machine-based cardio
 * gets its own entry flow (app/workout/active/cardio-entry-card.tsx)
 * instead of the generic qualitative "mark complete" or single-set
 * duration entry. Pure, no React, so it can be unit tested directly
 * (scripts/test-cardio-slot.ts) and reused by both the active-workout
 * screen and the history/previous-performance formatters.
 */

import type {
  DurationPrescription,
  Exercise,
  Prescription,
  QualitativePrescription,
  WorkoutSection,
} from '@/lib/program/program-types';
import type { SetLog } from './workout-session-types';

/** Case-insensitive, word-boundary-aware match over an exercise name.
 * Deliberately over-matches names like "Chest-Supported Row" — the caller
 * (isCardioSlot) also requires the prescription to be qualitative/duration,
 * which a rowing-machine block always is but a repetitions row exercise
 * never is, so the false positive never actually fires. */
export const CARDIO_NAME_PATTERN =
  /\b(cycling|cycle|bike|biking|spin|row|rowing|erg|run|running|jog|treadmill|elliptical|stair|stairmaster|stepmill|ski erg|swim|swimming|walk|walking|assault bike|air bike)\b/i;

/** Ordered so more specific patterns (e.g. "assault bike") are checked
 * before generic ones; config as data, not an if-chain (CLAUDE.md "config
 * over code"). */
const VERB_TABLE: { pattern: RegExp; verb: string }[] = [
  { pattern: /assault|air bike|cycl|bike|biking|spin/i, verb: 'cycling' },
  { pattern: /row|erg/i, verb: 'rowing' },
  { pattern: /treadmill|run|jog/i, verb: 'running' },
  { pattern: /walk/i, verb: 'walking' },
  { pattern: /swim/i, verb: 'swimming' },
  { pattern: /stair|stepmill/i, verb: 'climbing' },
  { pattern: /ski/i, verb: 'skiing' },
];

/**
 * True when this slot should render the cardio entry card. Only
 * qualitative and duration prescriptions are ever cardio slots
 * (repetitions/hold/distance never are, regardless of the exercise name),
 * and one of: the section is typed 'cardio', the exercise's own category
 * is 'cardio', or the exercise name matches the cardio name pattern.
 */
export function isCardioSlot(
  section: WorkoutSection,
  exercise: Exercise | undefined,
  prescription: Prescription
): boolean {
  if (prescription.type !== 'qualitative' && prescription.type !== 'duration') return false;

  return (
    section.type === 'cardio' ||
    exercise?.category === 'cardio' ||
    CARDIO_NAME_PATTERN.test(exercise?.name ?? '')
  );
}

/** Gerund for the "Start {verb}" button. */
export function cardioVerbFor(exerciseName: string): string {
  const match = VERB_TABLE.find((entry) => entry.pattern.test(exerciseName));
  return match?.verb ?? 'cardio';
}

function formatMinuteRange(min: number, max: number): string {
  return min === max ? `${min} min` : `${min} to ${max} min`;
}

/** Target duration line shown in the setup state, e.g. "8 to 10 min". No
 * dashes (CLAUDE.md NO DASHES rule): a range reads "8 to 10 min", never
 * "8-10 min". Returns null when the prescription carries no duration info. */
export function cardioTargetLabel(prescription: QualitativePrescription | DurationPrescription): string | null {
  if (prescription.type === 'qualitative') {
    const { approxMinMinutes: min, approxMaxMinutes: max } = prescription;
    if (min === undefined && max === undefined) return null;
    if (min !== undefined && max !== undefined) return formatMinuteRange(min, max);
    const only = min ?? max;
    return only !== undefined ? `${only} min` : null;
  }

  // duration: render in minutes only when the whole range lands on exact
  // minutes (e.g. 600-900s -> "10 to 15 min"); a range like 60-90s doesn't
  // round cleanly, so it stays in seconds ("60 to 90 sec").
  const { minSeconds, maxSeconds } = prescription;
  if (minSeconds >= 60 && minSeconds % 60 === 0 && maxSeconds % 60 === 0) {
    return formatMinuteRange(minSeconds / 60, maxSeconds / 60);
  }
  return minSeconds === maxSeconds ? `${minSeconds} sec` : `${minSeconds} to ${maxSeconds} sec`;
}

/** A logged set carries cardio-only readouts. Used to separate cardio sets
 * from ordinary hold/duration sets for stats and formatting purposes even
 * when the prescription type alone would not distinguish them. A set logged
 * against a QUALITATIVE prescription with a time on it is also cardio: the
 * cardio card is the only thing that ever logs sets on qualitative slots,
 * so a ride with no readouts typed (blank resistance, no watts) still
 * formats and counts as a ride rather than falling through to "Logged". */
export function isCardioSet(set: SetLog, prescriptionType?: Prescription['type']): boolean {
  return (
    set.resistance !== undefined ||
    set.averageWatts !== undefined ||
    set.averageSpeedMph !== undefined ||
    set.distanceMiles !== undefined ||
    (prescriptionType === 'qualitative' && set.seconds !== undefined)
  );
}
