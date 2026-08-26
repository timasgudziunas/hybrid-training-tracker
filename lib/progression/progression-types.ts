/**
 * Shared types for the progression engine (rework phase R3, logic half).
 * Pure, deterministic recommendation types: no AI model, no I/O, no
 * Date.now(), no randomness (CLAUDE.md non-negotiables 5, 6, 17 —
 * progression logic is transparent and deterministic, and the reasoning
 * behind every recommendation is always shown to the athlete, never hidden
 * behind a model).
 *
 * Every recommendation carries a plain-language `reason` sentence the UI
 * can render verbatim, plus a structured `evidence` object so the UI never
 * has to re-derive the qualifying numbers from raw SetLogs itself.
 */

import type { SetLog } from '@/lib/workout-session/workout-session-types';

/** One prior exposure to an exercise: the SetLog[] actually logged that
 * day. `history` arguments throughout this module are ordered most recent
 * exposure first. */
export type ExposureLog = SetLog[];

export interface ProgressionOptions {
  /** Smallest sensible load jump once every qualifying set hits the top of
   * the rep range. Config over code: no magic number buried in logic. */
  loadIncrementLb?: number;
  /** Number of 0-RIR top-of-range sets in one exposure before the engine
   * treats it as grinding and prefers consolidating over adding load. */
  minGrindingSetsToHold?: number;
}

export const DEFAULT_LOAD_INCREMENT_LB = 5;
export const DEFAULT_MIN_GRINDING_SETS_TO_HOLD = 2;

export interface HoldProgressionOptions {
  /** Smallest sensible increase to the hold target once every prescribed
   * set reaches the top of the current seconds range. */
  secondsIncrement?: number;
}

export const DEFAULT_HOLD_SECONDS_INCREMENT = 5;

/** One set's numbers as considered by the engine, for the UI to render
 * alongside the reason without re-deriving them from raw SetLogs. */
export interface ProgressionEvidenceSet {
  setNumber: number;
  weight?: number;
  reps?: number;
  rir?: number;
  seconds?: number;
  completed: boolean;
}

export type ProgressionAction = 'increase-load' | 'add-reps' | 'hold' | 'no-data';

export interface ProgressionEvidence {
  prescribedSets: number;
  minReps: number;
  maxReps: number;
  /** The most recent exposure's sets actually considered, in set order.
   * Undefined only for the no-data action. */
  consideredSets?: ProgressionEvidenceSet[];
  /** True when the considered exposure had fewer completed sets than
   * prescribed, or was missing reps for one or more sets. This alone rules
   * out increase-load. */
  incompleteSets?: boolean;
  /** True when the considered sets used more than one distinct weight. */
  mixedWeights?: boolean;
  /** The weight the recommendation reasons about: the single weight used
   * by every set (no mixing), or the highest weight used when weights were
   * mixed (see double-progression.ts's mixed-weight rule). */
  referenceWeight?: number;
  /** True when the qualifying sets at referenceWeight all reached maxReps. */
  allSetsAtTop?: boolean;
  /** Count of qualifying sets logged at 0 RIR while also at the top of the
   * range (the "grinding" signal). */
  zeroRirAtTopCount?: number;
}

export interface ProgressionRecommendation {
  action: ProgressionAction;
  suggestedWeight?: number;
  /** Plain "6 to 10" style string describing the rep target for the next
   * exposure. Present for increase-load and add-reps. */
  targetReps?: string;
  /** A complete, plain-language sentence. No em dashes, en dashes, or
   * hyphens used as punctuation (owner hard rule) — periods and commas
   * only; hyphens inside compound words are fine. */
  reason: string;
  evidence: ProgressionEvidence;
}

export type HoldProgressionAction = 'increase-target' | 'hold' | 'no-data';

export interface HoldProgressionEvidence {
  prescribedSets: number;
  minSeconds: number;
  maxSeconds: number;
  consideredSets?: ProgressionEvidenceSet[];
  incompleteSets?: boolean;
  allSetsAtTop?: boolean;
}

export interface HoldProgressionRecommendation {
  action: HoldProgressionAction;
  /** Present only for increase-target: the new top-of-range seconds to aim
   * for next time. There is never a load/weight concept for holds. */
  suggestedTargetSeconds?: number;
  reason: string;
  evidence: HoldProgressionEvidence;
}

export interface NotApplicableRecommendation {
  action: 'not-applicable';
  reason: string;
}
