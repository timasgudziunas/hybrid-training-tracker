/**
 * Friday: Power + Lower B + Abs. Source: TRAINING_SYSTEM.md §7.
 * Power exercises occur before strength work.
 */

import type { TrainingDayTemplate } from '../program-types';

export const FRIDAY_POWER_LOWER_B: TrainingDayTemplate = {
  restDay: false,
  id: 'friday-power-lower-b',
  weekday: 'friday',
  name: 'Power + Lower B + Abs',
  description: 'Power exercises occur before strength work. They should be explosive and high quality.',
  ultimatePracticeLater: false,
  sections: [
    {
      id: 'friday-power',
      name: 'Power',
      order: 1,
      type: 'power',
      notes: [
        'Use appropriate rest. Stop or reduce volume if jump quality deteriorates substantially. Longer term, the program may incorporate bounds, lateral hops, single-leg jumps, and reactive jumps. Do not add these indiscriminately.',
      ],
      exercises: [
        {
          exerciseId: 'pogos',
          order: 1,
          prescription: { type: 'repetitions', sets: 2, minReps: 15, maxReps: 20 },
          restCategory: 'jump',
        },
        {
          exerciseId: 'box-jump',
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 3 },
          restCategory: 'jump',
        },
        {
          exerciseId: 'standing-broad-jump',
          order: 3,
          prescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 3 },
          restCategory: 'jump',
        },
      ],
    },
    {
      id: 'friday-strength',
      name: 'Strength',
      order: 2,
      type: 'strength',
      exercises: [
        {
          exerciseId: 'trap-bar-deadlift',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
          restCategory: 'heavy-compound',
        },
        {
          exerciseId: 'leg-press',
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 },
          restCategory: 'moderate-compound',
        },
        {
          exerciseId: 'reverse-lunge',
          alternativeExerciseIds: ['walking-lunge'],
          order: 3,
          prescription: {
            type: 'repetitions',
            sets: 2,
            minReps: 8,
            maxReps: 12,
            perSide: true,
          },
          restCategory: 'moderate-compound',
        },
        {
          exerciseId: 'leg-curl',
          order: 4,
          prescription: { type: 'repetitions', sets: 3, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'hip-abduction',
          order: 5,
          prescription: { type: 'repetitions', sets: 2, minReps: 12, maxReps: 20 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'calf-raise',
          order: 6,
          prescription: { type: 'repetitions', sets: 3, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
      ],
    },
    {
      id: 'friday-core',
      name: 'Core',
      order: 3,
      type: 'core',
      exercises: [
        {
          exerciseId: 'hanging-knee-raise',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'cable-crunch',
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
      ],
    },
  ],
};
