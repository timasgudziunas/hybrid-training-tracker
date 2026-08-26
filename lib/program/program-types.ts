/**
 * Core type definitions for the training program shape.
 *
 * Since the 2026-08-25 rework there is no more code-seeded program content:
 * the owner pastes a program in-app (see lib/program/parse-program-text.ts),
 * which is stored parsed in `training_programs` and rendered through
 * ResolvedProgram below. lib/program/exercise-catalog.ts remains as a
 * knowledge base the parser matches parsed exercise names against (never a
 * source of workout content on its own), and lib/program/sample-program.ts
 * provides the built-in sample shown before any program has been pasted.
 * No workout content belongs in this file — only the shape of it.
 *
 * String-literal unions are used throughout instead of enums so this file
 * survives Node's native TypeScript type stripping (enums are not erasable
 * syntax).
 */

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/** Section types actually used across the program (CLAUDE.md domain model). */
export type SectionType =
  | 'warmup'
  | 'speed'
  | 'power'
  | 'calisthenics'
  | 'strength'
  | 'core'
  | 'mobility'
  | 'recovery'
  | 'cardio';

/**
 * Broad exercise category. Based on PRODUCT_SPEC.md section 12's exercise
 * library category list (hypertrophy, strength, speed, power, mobility,
 * calisthenics, rehabilitation/prehab), extended with 'cardio' to cover
 * pure aerobic work (easy cycling, Zone 2) since CLAUDE.md's WorkoutSection
 * type union already treats cardio as a first-class section type and
 * PRODUCT_SPEC's list is illustrative rather than exhaustive.
 */
export type ExerciseCategory =
  | 'hypertrophy'
  | 'strength'
  | 'speed'
  | 'power'
  | 'mobility'
  | 'calisthenics'
  | 'rehabilitation-prehab'
  | 'cardio';

/** How an exercise's prescription advances over time. Never hidden logic. */
export type ProgressionType =
  | 'double-progression'
  | 'progression-chain'
  | 'none';

/**
 * Rest guidance is a CATEGORY per TRAINING_SYSTEM.md §13, not a hardcoded
 * seconds value. The category -> guidance text mapping lives once, as data,
 * in rest-guidance.ts.
 */
export type RestCategory =
  | 'heavy-compound'
  | 'moderate-compound'
  | 'isolation'
  | 'sprint'
  | 'jump'
  | 'calisthenics-skill';

/** One named level within a skill progression chain (e.g. L-sit, planche). */
export interface ProgressionChainLevel {
  id: string;
  name: string;
  order: number;
  description?: string;
}

/** An ordered progression chain, referenced by Exercise.progressionChainId. */
export interface ProgressionChain {
  id: string;
  name: string;
  levels: ProgressionChainLevel[];
}

/**
 * Prescription: what is actually prescribed for a given exercise on a given
 * day. Not every exercise uses reps, so this is a discriminated union
 * rather than one forced sets x reps shape.
 */
export type Prescription =
  | RepetitionsPrescription
  | DurationPrescription
  | DistancePrescription
  | HoldPrescription
  | QualitativePrescription;

/** Standard sets x rep-range work (most hypertrophy/strength/power exercises). */
export interface RepetitionsPrescription {
  type: 'repetitions';
  sets: number;
  minReps: number;
  maxReps: number;
  /** True when the rep range applies per side/leg (e.g. Bulgarian Split Squat). */
  perSide?: boolean;
}

/**
 * A single timed exercise/activity with a defined set count and second
 * range, but no rep count and no itemized content (e.g. wrist preparation:
 * "2-3 minutes"). Distinct from `qualitative`, which covers descriptive,
 * multi-content blocks like a dynamic warm-up or mobility flow.
 */
export interface DurationPrescription {
  type: 'duration';
  sets: number;
  minSeconds: number;
  maxSeconds: number;
  perSide?: boolean;
}

/** Sprint/acceleration work: a rep count over a fixed distance. */
export interface DistancePrescription {
  type: 'distance';
  sets: number;
  meters: number;
  /** True for timed-sprint-capable reps (all current distance work is). */
  timed?: boolean;
}

/** Isometric hold work (planche lean, hollow-body hold, dead hang, etc). */
export interface HoldPrescription {
  type: 'hold';
  sets: number;
  minSeconds: number;
  maxSeconds: number;
  /** True when the hold is performed per side (e.g. Copenhagen plank). */
  perSide?: boolean;
}

/**
 * A descriptive, checklist-like block of activity without a formal sets
 * structure: a dynamic warm-up, a mobility flow, an easy aerobic warm-up,
 * or optional Zone 2 cardio. `items` lists the discrete contents named in
 * TRAINING_SYSTEM.md where the program itemizes them.
 */
export interface QualitativePrescription {
  type: 'qualitative';
  description: string;
  items?: string[];
  approxMinMinutes?: number;
  approxMaxMinutes?: number;
}

/** One exercise as prescribed within a specific section of a specific day. */
export interface PrescribedExercise {
  exerciseId: string;
  /**
   * Alternative exercise ids for program-authored "or" choices, e.g.
   * "Face Pull or Reverse Cable Fly". The exerciseId above is the primary/
   * default choice.
   */
  alternativeExerciseIds?: string[];
  order: number;
  prescription: Prescription;
  /** Omitted where the program gives no rest guidance for this item. */
  restCategory?: RestCategory;
  notes?: string[];
}

export interface WorkoutSection {
  id: string;
  name: string;
  order: number;
  type: SectionType;
  /** e.g. Saturday's Zone 2 cardio, which is optional per TRAINING_SYSTEM.md §8. */
  optional?: boolean;
  /** Section-level notes/emphasis text, e.g. Monday's planche emphasis line. */
  notes?: string[];
  exercises: PrescribedExercise[];
}

/** A normal training day: a real workout assembled from ordered sections. */
export interface TrainingDayTemplate {
  restDay: false;
  id: string;
  weekday: Exclude<Weekday, 'sunday'>;
  name: string;
  description?: string;
  targetDurationMinutes?: number;
  /** True Monday/Wednesday/Thursday: Ultimate practice occurs later that day. */
  ultimatePracticeLater: boolean;
  sections: WorkoutSection[];
}

/**
 * A rest day: no workout at all — this shape has no sections field, so
 * there is structurally nothing to render but name + description. Sunday is
 * always one (CLAUDE.md non-negotiables 11 and 20; never manufacture a
 * workout for it). Since the 2026-08-25 pivot, ANY weekday absent from a
 * pasted program is also a rest day — `weekday` was widened from the
 * literal 'sunday' to the full Weekday union to represent that.
 */
export interface RestDayTemplate {
  restDay: true;
  id: string;
  weekday: Weekday;
  name: string;
  description: string;
}

export type WorkoutTemplate = TrainingDayTemplate | RestDayTemplate;

/** Exercise library entry. Instructional fields are Phase 8 content. */
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  progressionType: ProgressionType;
  /** Set only when progressionType is 'progression-chain' (L-sit, planche). */
  progressionChainId?: string;
  /** General substitution options, distinct from an in-program "or" choice. */
  substitutions?: string[];
  // Phase 8 content — intentionally left unfilled for now:
  instructions?: string;
  cues?: string[];
  commonMistakes?: string[];
  intendedFeeling?: string;
}

/**
 * A fully resolved program (2026-08-25 rework, non-negotiable 16): exactly
 * one WorkoutTemplate per weekday, plus an entry for every exercise
 * referenced anywhere in it. This is the single shape everything in the app
 * renders from once a program is active — the owner's pasted-and-parsed
 * program, or the built-in sample when none is active yet. UI code must
 * never hardcode workout content; it always reads through a ResolvedProgram.
 *
 * `exercises` entries come from lib/program/exercise-catalog.ts (the
 * knowledge base, matched by normalized name) where a match exists, or a
 * minimal generated entry (name only, no guidance) otherwise. Either way the
 * `id` used throughout a ResolvedProgram is the slugified exercise name, so
 * the same exercise name always resolves to the same id across re-pastes,
 * independent of the catalog's own internal id spelling.
 */
export interface ResolvedProgram {
  name: string;
  templates: Record<Weekday, WorkoutTemplate>;
  exercises: Record<string, Exercise>;
}
