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

import type { Exercise, TrainingDayTemplate, Weekday } from '@/lib/program/program-types';

/** Mirrors CLAUDE.md's WorkoutSession.status. 'modified' is a TERMINAL
 * status (Phase 5, 2026-08-26 decision): assigned deterministically at
 * Finish by resolveFinishStatus (session-deviations.ts) when any deviation
 * was auto-detected, never chosen mid-workout. 'missed' remains a Phase 6
 * flow; the type supports it now so the schema never needs to change. */
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
  /** Jump exercises with a box (per lib/program/set-entry-fields.ts):
   * box height used for this set. */
  boxHeightInches?: number;
  /** Horizontal jump exercises (per lib/program/set-entry-fields.ts):
   * distance covered on this set. */
  jumpDistanceInches?: number;
  /**
   * Cardio blocks (see lib/workout-session/cardio-slot.ts) log ONE set for
   * the whole ride/row/run: `seconds` holds the elapsed time, and these
   * carry the machine readouts the athlete enters at the end. `resistance`
   * is free text (a level, a gear, "L8") since machines label it
   * differently. Shown back as "Last time" the next time the same exercise
   * comes up so there is a concrete number to beat.
   */
  resistance?: string;
  averageWatts?: number;
  /** Miles per hour. */
  averageSpeedMph?: number;
  distanceMiles?: number;
}

export type ExerciseSlotStatus = 'upcoming' | 'completed' | 'skipped';

/** Per-slot log. `slotKey` matches the slot produced by
 * flatten-template-slots.ts for the session's template. */
export interface ExerciseSlotLog {
  slotKey: string;
  /** The program-defined primary exerciseId for this slot (identifies the
   * slot's "or" choice set, independent of which one was picked). */
  prescribedExerciseId: string;
  /** The exercise actually being logged: prescribedExerciseId, one of its
   * alternativeExerciseIds, or (Phase 5) a catalog substitution id recorded
   * in performance.modifications.substitutions. Undefined until the athlete
   * picks, for slots that offer a choice and have not been substituted. */
  chosenExerciseId?: string;
  status: ExerciseSlotStatus;
  sets: SetLog[];
  /** Sets added beyond the program's prescribed count via "+ Add set".
   * Persisted (not local UI state) so it survives a refresh mid-exercise. */
  extraSets?: number;
  /** Sets removed from the program's prescribed count via "Remove this set"
   * on a not-yet-logged set (2026-09-04 rework: removing the CURRENT set
   * shrinks the target; it never deletes an earlier logged set). Target set
   * count = prescribed + extraSets - removedSets, never below the number of
   * sets already logged. */
  removedSets?: number;
  /** Qualitative prescriptions (warm-ups, mobility, Zone 2, L-sit practice)
   * have no sets — a single mark-complete tap. */
  qualitativeCompleted?: boolean;
  note?: string;
  /** Uncommitted input values for the set currently being entered,
   * persisted so nothing typed is ever lost when leaving the exercise or
   * refreshing (the parent remounts ExerciseEntryCard on every commit,
   * which would otherwise reset component-local input state to blank). */
  draft?: SetDraft;
}

/** Uncommitted input values for the set currently being entered (see
 * ExerciseSlotLog.draft). All string-typed except rir so the inputs can
 * round-trip partial typing ("12.", "") without coercion. The cardio*
 * fields drive the cardio card's three states (setup, running, results):
 * `cardioStartedAt` is set when the athlete taps Start, `cardioEndedAt`
 * when they tap Stop, and both are cleared once the ride is logged as a
 * SetLog. ISO timestamps so the running timer survives a refresh. */
export interface SetDraft {
  weight?: string;
  reps?: string;
  rir?: number;
  seconds?: string;
  timeSeconds?: string;
  boxHeightInches?: string;
  jumpDistanceInches?: string;
  resistance?: string;
  averageWatts?: string;
  averageSpeedMph?: string;
  distanceMiles?: string;
  cardioStartedAt?: string;
  cardioEndedAt?: string;
}

/** One catalog substitution recorded against a slot (Phase 5, "Swap"):
 * fromExerciseId is always the slot's own prescribedExerciseId, never a
 * previously chosen "or" alternative. At most one entry per slotKey. */
export interface SlotSubstitution {
  slotKey: string;
  fromExerciseId: string;
  toExerciseId: string;
}

/** 'unfinished' is never chosen by the athlete: it is assigned when a
 * session left active from a previous day is closed automatically so it can
 * never hijack the next day's workout (lib/workout-session/resumable-session.ts). */
export type EndedEarlyReason = 'time' | 'fatigue' | 'discomfort' | 'other' | 'unfinished';

/** Explicit modify-don't-fail inputs (PRODUCT_SPEC §14, PLAN Phase 5).
 * Deviations shown to the athlete are DERIVED from this plus the slot logs
 * by detectSessionDeviations — never stored, so labels can evolve. */
export interface SessionModificationState {
  endedEarly?: boolean;
  endedEarlyReason?: EndedEarlyReason;
  recoveryMode?: boolean;
  reducedLoadSlotKeys?: string[];
  substitutions?: SlotSubstitution[];
}

/** Fun, restrained completion stats (PRODUCT_SPEC §6 linear execution flow). */
export interface CompletionStats {
  totalTonnage: number;
  totalSprintDistanceMeters: number;
  totalHoldSeconds: number;
  exercisesCompleted: number;
  exercisesSkipped: number;
  setsCompleted: number;
  /** Total elapsed cardio time across cardio-slot sets (see SetLog cardio
   * fields). Optional so older stored stats blobs still type-check. */
  totalCardioSeconds?: number;
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
  /**
   * Snapshot taken once at "Start Workout" (2026-08-25 rework, program
   * pivot): the program is no longer a fixed code constant, it is whatever
   * program was active (or the sample) at that moment. Storing the exact
   * TrainingDayTemplate the athlete started, plus every exercise it
   * references, INTO the session itself means the active-workout screen
   * never re-resolves the program on resume — a mid-week re-paste can never
   * corrupt an in-flight or historical session. flattenTemplateSlots always
   * runs against this snapshot, never against the current active program.
   */
  templateSnapshot: TrainingDayTemplate;
  exercisesSnapshot: Record<string, Exercise>;
  /** Explicit modify-don't-fail actions (Phase 5): recovery mode, ended
   * early, reduced load, catalog substitutions. Undefined means none were
   * ever taken. See session-deviations.ts for how these plus the slot logs
   * become the deviation list shown to the athlete. */
  modifications?: SessionModificationState;
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
