/**
 * Saturday: Upper C: Shoulders + Back + Arms + Planche.
 * Source: TRAINING_SYSTEM.md §8.
 */

import type { TrainingDayTemplate } from '../program-types';

export const SATURDAY_UPPER_C: TrainingDayTemplate = {
  restDay: false,
  id: 'saturday-upper-c',
  weekday: 'saturday',
  name: 'Upper C: Shoulders + Back + Arms + Planche',
  description: 'Primary emphasis: shoulders, back, arms, planche.',
  ultimatePracticeLater: false,
  sections: [
    {
      id: 'saturday-planche',
      name: 'Planche',
      order: 1,
      type: 'calisthenics',
      exercises: [
        {
          exerciseId: 'wrist-preparation',
          order: 1,
          prescription: { type: 'duration', sets: 1, minSeconds: 120, maxSeconds: 180 },
          notes: ['See Monday.'],
        },
        {
          exerciseId: 'planche-lean',
          order: 2,
          prescription: { type: 'hold', sets: 4, minSeconds: 10, maxSeconds: 20 },
          restCategory: 'calisthenics-skill',
        },
        {
          exerciseId: 'pseudo-planche-push-up',
          order: 3,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 10 },
          restCategory: 'calisthenics-skill',
        },
      ],
    },
    {
      id: 'saturday-hypertrophy',
      name: 'Hypertrophy',
      order: 2,
      type: 'strength',
      exercises: [
        {
          exerciseId: 'machine-shoulder-press',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 },
          restCategory: 'moderate-compound',
        },
        {
          exerciseId: 'pull-up',
          alternativeExerciseIds: ['assisted-pull-up'],
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
          restCategory: 'heavy-compound',
        },
        {
          exerciseId: 'cable-lateral-raise',
          order: 3,
          prescription: { type: 'repetitions', sets: 4, minReps: 12, maxReps: 20 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'seated-cable-row',
          order: 4,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 },
          restCategory: 'moderate-compound',
        },
        {
          exerciseId: 'rear-delt-fly',
          order: 5,
          prescription: { type: 'repetitions', sets: 3, minReps: 12, maxReps: 20 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'cable-curl',
          alternativeExerciseIds: ['dumbbell-curl'],
          order: 6,
          prescription: { type: 'repetitions', sets: 3, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'triceps-pressdown',
          order: 7,
          prescription: { type: 'repetitions', sets: 3, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
      ],
    },
    {
      id: 'saturday-optional-zone-2',
      name: 'Optional Zone 2',
      order: 3,
      type: 'cardio',
      optional: true,
      notes: [
        'Once the athlete has adapted to the lifting plus Ultimate schedule: approximately 30-45 minutes. Cycling is preferred initially to limit additional running impact. Zone 2 is optional and should not compromise recovery. Consider omitting it during the first several weeks while establishing the routine.',
      ],
      exercises: [
        {
          exerciseId: 'zone-2-cardio',
          order: 1,
          prescription: {
            type: 'qualitative',
            description: 'Optional Zone 2 cardio, cycling preferred.',
            approxMinMinutes: 30,
            approxMaxMinutes: 45,
          },
        },
      ],
    },
  ],
};
