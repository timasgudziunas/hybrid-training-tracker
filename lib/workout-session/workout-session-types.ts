/**
 * Types for an in-progress / completed workout session.
 *
 * `WorkoutSessionPerformance` is EXACTLY the shape persisted in the
 * `workout_sessions.performance` jsonb column (supabase/schema.sql) and
 * mirrored in localStorage (CLAUDE.md non-negotiable 22: a refresh or
 * accidental close must never lose data). Nothing about the program itself
 * (sections, exercises, prescriptions) is duplicated here — that always
 * comes from lib/program via the session's `weekday` field, so there is
 * still exactly one canonical program definition (non-negotiable 16).
 *
 * A "slot" is one PrescribedExercise position within the flattened linear
 * flow (see flatten-template-slots.ts). Slot keys are stable across a
 * session regardless of which "or" alternative the athlete picks.
 */

import type { Weekday } from '@/lib/program/program-types';

/** Mirrors CLAUDE.md's WorkoutSession.status. Modified/missed are Phase
 * 5/6 flows; the type supports them now so the schema never needs to change. */
export type WorkoutSessionStatus = 'planned' | 'active' | 'completed' | 'modified' | 'missed';

/** One logged set. Which fields are meaningful depends on the exercise's
 * Prescription type (see program-types.ts) — a repetitions set uses
 * weight/reps/rir, a hold/duration set uses seconds, a distance set uses
 * distanceCompleted/timeSeconds. */
export interface SetLog {
  setNumber: number;
  completed: boolean;
  weight?: number;
  reps?: number;
  /** Reps in reserve, 0-4 (TRAINING_SYSTEM.md §11). */
  rir?: number;
  /** Hold/duration prescriptions: seconds achieved. */
  seconds?: number;
  /** Distance prescriptions: this rep was performed. */
  distanceCompleted?: boolean;
  /** Distance prescriptions: optional timed-sprint time. */
  timeSeconds?: number;
}

export type ExerciseSlotStatus = 'upcoming' | 'completed' | 'skipped';

/** Per-slot log. `slotKey` matches the slot produced by
 * flatten-template-slots.ts for the session's template. */
export interface ExerciseSlotLog {
  slotKey: string;
  /** The program-defined primary exerciseId for this slot (identifies the
   * slot's "or" choice set, independent of which one was picked). */
  prescribedExerciseId: string;
  /** The exercise actually being logged: prescribedExerciseId or one of its
   * alternativeExerciseIds. Undefined until the athlete picks, for slots
   * that offer a choice. */
  chosenExerciseId?: string;
  status: ExerciseSlotStatus;
  sets: SetLog[];
  /** Sets added beyond the program's prescribed count via "+ Add set".
   * Persisted (not local UI state) so it survives a refresh mid-exercise. */
  extraSets?: number;
  /** Qualitative prescriptions (warm-ups, mobility, Zone 2, L-sit practice)
   * have no sets — a single mark-complete tap. */
  qualitativeCompleted?: boolean;
  note?: string;
}

/** Fun, restrained completion stats (PRODUCT_SPEC §6 linear execution flow). */
export interface CompletionStats {
  totalTonnage: number;
  totalSprintDistanceMeters: number;
  totalHoldSeconds: number;
  exercisesCompleted: number;
  exercisesSkipped: number;
  setsCompleted: number;
}

/** The full in-progress/completed state. Exactly the jsonb shape. */
export interface WorkoutSessionPerformance {
  slots: Record<string, ExerciseSlotLog>;
  /** Null once the athlete has advanced past the final slot (completion
   * screen showing); also null before any slots exist. */
  currentSlotKey: string | null;
  sessionDifficulty?: number;
  sessionNote?: string;
  /** Computed once, at Finish. */
  stats?: CompletionStats;
}

/** One full session row — mirrors workout_sessions 1:1. */
export interface WorkoutSessionRecord {
  id: string;
  sessionDate: string;
  weekday: Weekday;
  workoutTemplateId: string;
  startedAt: string;
  completedAt: string | null;
  status: WorkoutSessionStatus;
  durationSeconds: number | null;
  notes: string | null;
  sessionDifficulty: number | null;
  performance: WorkoutSessionPerformance;
}

/** Previous performance for a single exercise: the ordered sets logged the
 * last time that exact exercise was performed (PRODUCT_SPEC §7). */
export type PreviousPerformanceByExercise = Record<string, SetLog[]>;
