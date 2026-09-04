/**
 * Single shared formatter for one logged set, used by both the history
 * drill-down (app/history/[date]/format-set-log.ts) and the "Last time"
 * panel shown mid-workout (app/workout/active/previous-performance-summary.tsx).
 * Those two previously duplicated slightly different versions of the same
 * logic; this is the one place it lives now. Pure, no React.
 */

import type { Prescription } from '@/lib/program/program-types';
import type { SetLog } from './workout-session-types';
import { isCardioSet } from './cardio-slot';

function formatElapsedMinutesSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function formatCardioSet(set: SetLog): string {
  // Time and resistance join with a space into one leading segment
  // ("12:30 at 8"); everything after that joins with ", " ("... , 150 W
  // avg, 18.2 mph avg").
  let leading = '';
  if (set.seconds !== undefined) {
    leading = formatElapsedMinutesSeconds(set.seconds);
  }
  if (set.resistance !== undefined && set.resistance.trim().length > 0) {
    // Machines label resistance differently (a level, a gear, a watts
    // target), so it is rendered verbatim: `at 8` for a bare number typed
    // by the athlete, `at L8` (or whatever they typed) otherwise.
    const resistancePart = `at ${set.resistance.trim()}`;
    leading = leading.length > 0 ? `${leading} ${resistancePart}` : resistancePart;
  }

  const parts: string[] = leading.length > 0 ? [leading] : [];
  if (set.averageWatts !== undefined) {
    parts.push(`${set.averageWatts} W avg`);
  }
  if (set.averageSpeedMph !== undefined) {
    parts.push(`${set.averageSpeedMph} mph avg`);
  }
  if (set.distanceMiles !== undefined) {
    parts.push(`${set.distanceMiles} mi`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Logged';
}

/**
 * One-line description of a logged set. `prescriptionType` decides the
 * default shape, but a cardio set (identified by isCardioSet) always
 * formats as cardio regardless of the nominal prescription type, since a
 * cardio block can be authored as either qualitative or duration.
 */
export function formatLoggedSet(set: SetLog, prescriptionType: Prescription['type']): string {
  if (isCardioSet(set, prescriptionType)) {
    return formatCardioSet(set);
  }

  if (prescriptionType === 'repetitions') {
    const parts: string[] = [];
    if (set.boxHeightInches !== undefined) {
      parts.push(`${set.boxHeightInches} in x ${set.reps ?? 1}`);
    } else if (set.jumpDistanceInches !== undefined) {
      parts.push(`${set.jumpDistanceInches} in x ${set.reps ?? 1}`);
    } else if (set.weight !== undefined && set.reps !== undefined) {
      parts.push(`${set.weight} x ${set.reps}`);
    } else if (set.reps !== undefined) {
      parts.push(`${set.reps} reps`);
    }
    if (set.rir !== undefined) {
      parts.push(`RIR ${set.rir}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'Logged';
  }

  if (prescriptionType === 'hold' || prescriptionType === 'duration') {
    return set.seconds !== undefined ? `${set.seconds} sec` : 'Logged';
  }

  if (prescriptionType === 'distance') {
    return set.timeSeconds !== undefined ? `${set.timeSeconds} sec` : 'Completed';
  }

  return 'Logged';
}
