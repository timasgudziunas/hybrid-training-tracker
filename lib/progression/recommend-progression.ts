/**
 * Single dispatch point the UI calls regardless of prescription type
 * (rework phase R3). Repetitions get double progression, holds and
 * duration blocks get conservative seconds-range progression, and distance
 * (sprints) and qualitative (warm-ups, mobility flows) prescriptions have
 * no progression model and always come back not-applicable. Per the
 * rework brief and CLAUDE.md non-negotiable 17: never invent a progression
 * rule the training system does not define one for.
 */

import type { Prescription } from '@/lib/program/program-types';
import { recommendNextPrescription } from './double-progression';
import { recommendNextHold } from './hold-progression';
import type {
  ExposureLog,
  HoldProgressionOptions,
  HoldProgressionRecommendation,
  NotApplicableRecommendation,
  ProgressionOptions,
  ProgressionRecommendation,
} from './progression-types';

export interface RecommendProgressionInput {
  prescription: Prescription;
  /** Most recent exposure first. Ignored for distance/qualitative. */
  history: ExposureLog[];
  options?: ProgressionOptions & HoldProgressionOptions;
}

export type AnyProgressionRecommendation =
  | ProgressionRecommendation
  | HoldProgressionRecommendation
  | NotApplicableRecommendation;

export function recommendProgression(input: RecommendProgressionInput): AnyProgressionRecommendation {
  const { prescription, history, options } = input;

  switch (prescription.type) {
    case 'repetitions':
      return recommendNextPrescription({ prescription, history, options });

    case 'hold':
    case 'duration':
      return recommendNextHold({ prescription, history, options });

    case 'distance':
      return {
        action: 'not-applicable',
        reason:
          'Sprint and distance work is not automatically progressed by the app. Progress here comes from ' +
          'coaching judgment and periodic athletic benchmark testing, not a rep or load rule.',
      };

    case 'qualitative':
      return {
        action: 'not-applicable',
        reason:
          'This is a descriptive block without a formal set structure, so there is no numeric ' +
          'progression to suggest.',
      };

    default: {
      const exhaustive: never = prescription;
      throw new Error(`Unhandled prescription type: ${JSON.stringify(exhaustive)}`);
    }
  }
}
