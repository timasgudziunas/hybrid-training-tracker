/**
 * Warm-up timing rule (owner decision, 2026-11-06): "I don't like that some
 * of the warm-up activities, such as wrist preparation, have times
 * associated with them. This also goes for band pull-aparts."
 *
 * In a warm-up section (section.type === 'warmup'):
 * - a timed prescription (hold or duration, e.g. "Wrist Preparation:
 *   1 x 60-90s") never shows its time and never asks for "Seconds
 *   achieved"; it becomes a single mark-complete tap, like a qualitative
 *   block (an "untimed warm-up slot");
 * - no warm-up exercise shows the rest guidance line;
 * - reps prescriptions (Band Pull-Apart 2 x 15) keep their reps logging
 *   and label; cardio blocks are never affected.
 *
 * This is a rendering and logging rule only. The program data stays as
 * written (one canonical program), and old sessions keep their stored sets.
 * Pure, no React (scripts/test-warmup-slot.ts).
 */

import type { Exercise, Prescription, WorkoutSection } from '@/lib/program/program-types';
import { isCardioSlot } from './cardio-slot';

export function isWarmupSection(section: WorkoutSection): boolean {
  return section.type === 'warmup';
}

/** True when this slot is a timed (hold or duration) prescription inside a
 * warm-up section and is not a cardio block. */
export function isUntimedWarmupSlot(
  section: WorkoutSection,
  prescription: Prescription,
  exercise: Exercise | undefined
): boolean {
  if (!isWarmupSection(section)) return false;
  if (prescription.type !== 'hold' && prescription.type !== 'duration') return false;
  return !isCardioSlot(section, exercise, prescription);
}
