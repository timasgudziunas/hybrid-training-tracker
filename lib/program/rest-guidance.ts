/**
 * Rest guidance, stored once as data (config over code) per
 * TRAINING_SYSTEM.md §13. Rest is prescribed as a CATEGORY, never a
 * hardcoded seconds value — PrescribedExercise carries a RestCategory and
 * looks up its guidance text here.
 */

import type { RestCategory } from './program-types';

export interface RestGuidance {
  label: string;
  guidance: string;
}

export const REST_GUIDANCE_BY_CATEGORY: Record<RestCategory, RestGuidance> = {
  'heavy-compound': {
    label: 'Heavy compound',
    guidance: 'Approximately 2-3 minutes',
  },
  'moderate-compound': {
    label: 'Moderate compound',
    guidance: 'Approximately 90-150 seconds',
  },
  isolation: {
    label: 'Isolation',
    guidance: 'Approximately 60-120 seconds',
  },
  sprint: {
    label: 'Sprinting',
    guidance: 'Long enough to preserve speed quality',
  },
  jump: {
    label: 'Jumps',
    guidance: 'Long enough to preserve explosiveness',
  },
  'calisthenics-skill': {
    label: 'Calisthenics skill',
    guidance: 'Long enough to produce high-quality attempts',
  },
};

/** The app may offer timers, but per §13 timers must always remain optional. */
export const REST_TIMERS_ARE_OPTIONAL = true;
