/**
 * Monday: Upper A. Source: TRAINING_SYSTEM.md §3.
 * Ultimate practice occurs later in the day.
 */

import type { TrainingDayTemplate } from '../program-types';

export const MONDAY_UPPER_A: TrainingDayTemplate = {
  restDay: false,
  id: 'monday-upper-a',
  weekday: 'monday',
  name: 'Upper A: Push + Shoulders + Planche',
  ultimatePracticeLater: true,
  sections: [
    {
      id: 'monday-planche-foundation',
      name: 'Planche Foundation',
      order: 1,
      type: 'calisthenics',
      notes: [
        'Emphasize: locked elbows, active scapular protraction, posterior pelvic tilt, gradually increasing forward lean, quality rather than fatigue.',
      ],
      exercises: [
        {
          exerciseId: 'wrist-preparation',
          order: 1,
          prescription: { type: 'duration', sets: 1, minSeconds: 120, maxSeconds: 180 },
        },
        {
          exerciseId: 'scapular-push-up',
          order: 2,
          prescription: { type: 'repetitions', sets: 2, minReps: 10, maxReps: 15 },
          restCategory: 'calisthenics-skill',
        },
        {
          exerciseId: 'planche-lean',
          order: 3,
          prescription: { type: 'hold', sets: 4, minSeconds: 10, maxSeconds: 20 },
          restCategory: 'calisthenics-skill',
        },
        {
          exerciseId: 'hollow-body-hold',
          order: 4,
          prescription: { type: 'hold', sets: 2, minSeconds: 20, maxSeconds: 30 },
          restCategory: 'calisthenics-skill',
        },
      ],
    },
    {
      id: 'monday-hypertrophy',
      name: 'Hypertrophy',
      order: 2,
      type: 'strength',
      notes: ['Ultimate practice occurs later in the day.'],
      exercises: [
        {
          exerciseId: 'incline-dumbbell-press',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 6, maxReps: 10 },
          restCategory: 'moderate-compound',
        },
        {
          exerciseId: 'seated-dumbbell-shoulder-press',
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 },
          restCategory: 'moderate-compound',
        },
        {
          exerciseId: 'cable-fly',
          order: 3,
          prescription: { type: 'repetitions', sets: 2, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'cable-lateral-raise',
          order: 4,
          prescription: { type: 'repetitions', sets: 4, minReps: 12, maxReps: 20 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'overhead-cable-triceps-extension',
          order: 5,
          prescription: { type: 'repetitions', sets: 3, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'face-pull',
          alternativeExerciseIds: ['reverse-cable-fly'],
          order: 6,
          prescription: { type: 'repetitions', sets: 2, minReps: 15, maxReps: 20 },
          restCategory: 'isolation',
        },
      ],
    },
  ],
};
