/**
 * Builds a brand-new WorkoutSessionRecord for "Start Workout": every slot
 * begins 'upcoming' with no sets, positioned at the first slot in the
 * linear flow. Pure construction only — persistence (localStorage +
 * Supabase) happens where this is called.
 */

import { getLocalDateString } from '@/lib/date/local-date-string';
import { getLocalWeekday } from '@/lib/date/weekday-from-date';
import type { TrainingDayTemplate } from '@/lib/program/program-types';
import { flattenTemplateSlots } from './flatten-template-slots';
import type { ExerciseSlotLog, WorkoutSessionRecord } from './workout-session-types';

export function createNewSession(template: TrainingDayTemplate, now: Date): WorkoutSessionRecord {
  const slots = flattenTemplateSlots(template);

  const slotLogs: Record<string, ExerciseSlotLog> = {};
  for (const slot of slots) {
    // Only slots with program-defined alternatives need an explicit choice
    // (PRODUCT_SPEC §6); everything else defaults straight to its one
    // prescribed exercise so the flow never stalls on a pointless picker.
    const hasChoice = Boolean(slot.exercise.alternativeExerciseIds?.length);
    slotLogs[slot.slotKey] = {
      slotKey: slot.slotKey,
      prescribedExerciseId: slot.exercise.exerciseId,
      chosenExerciseId: hasChoice ? undefined : slot.exercise.exerciseId,
      status: 'upcoming',
      sets: [],
    };
  }

  return {
    id: crypto.randomUUID(),
    sessionDate: getLocalDateString(now),
    weekday: getLocalWeekday(now),
    workoutTemplateId: template.id,
    startedAt: now.toISOString(),
    completedAt: null,
    status: 'active',
    durationSeconds: null,
    notes: null,
    sessionDifficulty: null,
    performance: {
      slots: slotLogs,
      currentSlotKey: slots[0]?.slotKey ?? null,
    },
  };
}
