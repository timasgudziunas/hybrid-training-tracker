/**
 * Wednesday: Upper B: Pull + Back + Abs. Source: TRAINING_SYSTEM.md §5.
 * Ultimate practice occurs later.
 */

import type { TrainingDayTemplate } from '../program-types';

export const WEDNESDAY_UPPER_B: TrainingDayTemplate = {
  restDay: false,
  id: 'wednesday-upper-b',
  weekday: 'wednesday',
  name: 'Upper B: Pull + Back + Abs',
  description: 'Primary emphasis: back development and pulling strength.',
  ultimatePracticeLater: true,
  sections: [
    {
      id: 'wednesday-pull',
      name: 'Pull + Back',
      order: 1,
      type: 'strength',
      notes: ['Ultimate practice occurs later.'],
      exercises: [
        {
          exerciseId: 'pull-up',
          order: 1,
          prescription: { type: 'repetitions', sets: 4, minReps: 3, maxReps: 5 },
          restCategory: 'heavy-compound',
          notes: [
            'Initial objective: develop excellent strict pull-ups and eventually exceed 10 repetitions. Once substantially stronger, weighted pull-ups may be introduced.',
          ],
        },
        {
          exerciseId: 'chest-supported-row',
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 },
          restCategory: 'moderate-compound',
        },
        {
          exerciseId: 'neutral-grip-lat-pulldown',
          order: 3,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 },
          restCategory: 'moderate-compound',
        },
        {
          exerciseId: 'single-arm-cable-row',
          order: 4,
          prescription: { type: 'repetitions', sets: 2, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'reverse-pec-deck',
          order: 5,
          prescription: { type: 'repetitions', sets: 3, minReps: 12, maxReps: 20 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'incline-dumbbell-curl',
          order: 6,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'cable-curl',
          order: 7,
          prescription: { type: 'repetitions', sets: 2, minReps: 12, maxReps: 15 },
          restCategory: 'isolation',
        },
      ],
    },
    {
      id: 'wednesday-core',
      name: 'Core',
      order: 2,
      type: 'core',
      exercises: [
        {
          exerciseId: 'ab-wheel',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 6, maxReps: 12 },
          restCategory: 'isolation',
        },
      ],
    },
  ],
};
