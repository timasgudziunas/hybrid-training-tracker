/**
 * Tuesday: Speed + Lower A + Abs. Source: TRAINING_SYSTEM.md §4.
 */

import type { TrainingDayTemplate } from '../program-types';

export const TUESDAY_SPEED_LOWER_A: TrainingDayTemplate = {
  restDay: false,
  id: 'tuesday-speed-lower-a',
  weekday: 'tuesday',
  name: 'Speed + Lower A + Abs',
  ultimatePracticeLater: false,
  description:
    "Speed volume should initially be conservative because of existing Ultimate workload and the athlete's reported right-groin sensitivity. If groin discomfort is present during sprinting, do not simply push through it.",
  sections: [
    {
      id: 'tuesday-dynamic-warm-up',
      name: 'Dynamic Warm-Up',
      order: 1,
      type: 'warmup',
      exercises: [
        {
          exerciseId: 'dynamic-warm-up',
          order: 1,
          prescription: {
            type: 'qualitative',
            description: 'Approximately 8-10 minutes of dynamic warm-up.',
            items: [
              'Easy movement',
              'Leg swings',
              'Adductor preparation',
              'Glute activation',
              'Ankle preparation',
              'A-skips',
              'Pogos',
              'Progressive accelerations',
            ],
            approxMinMinutes: 8,
            approxMaxMinutes: 10,
          },
        },
      ],
    },
    {
      id: 'tuesday-speed',
      name: 'Speed',
      order: 2,
      type: 'speed',
      notes: [
        'Use substantial recovery between repetitions. These are speed repetitions, not conditioning intervals. Quality is more important than density. Do not deliberately create exhaustion. Early weeks may use lower volume.',
      ],
      exercises: [
        {
          exerciseId: 'acceleration-10m',
          order: 1,
          prescription: { type: 'distance', sets: 3, meters: 10, timed: true },
          restCategory: 'sprint',
        },
        {
          exerciseId: 'acceleration-20m',
          order: 2,
          prescription: { type: 'distance', sets: 3, meters: 20, timed: true },
          restCategory: 'sprint',
        },
        {
          exerciseId: 'sprint-30m',
          order: 3,
          prescription: { type: 'distance', sets: 2, meters: 30, timed: true },
          restCategory: 'sprint',
        },
      ],
    },
    {
      id: 'tuesday-adductor-preparation',
      name: 'Adductor Preparation',
      order: 3,
      type: 'strength',
      exercises: [
        {
          exerciseId: 'short-lever-copenhagen-plank',
          order: 1,
          prescription: {
            type: 'hold',
            sets: 2,
            minSeconds: 15,
            maxSeconds: 20,
            perSide: true,
          },
          restCategory: 'calisthenics-skill',
          notes: ['Progress conservatively.'],
        },
      ],
    },
    {
      id: 'tuesday-strength',
      name: 'Strength',
      order: 4,
      type: 'strength',
      exercises: [
        {
          exerciseId: 'hack-squat',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 6, maxReps: 10 },
          restCategory: 'heavy-compound',
        },
        {
          exerciseId: 'romanian-deadlift',
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 },
          restCategory: 'heavy-compound',
        },
        {
          exerciseId: 'bulgarian-split-squat',
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
          exerciseId: 'seated-leg-curl',
          alternativeExerciseIds: ['lying-leg-curl'],
          order: 4,
          prescription: { type: 'repetitions', sets: 3, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'adductor-machine',
          order: 5,
          prescription: { type: 'repetitions', sets: 2, minReps: 12, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'standing-calf-raise',
          order: 6,
          prescription: { type: 'repetitions', sets: 3, minReps: 10, maxReps: 15 },
          restCategory: 'isolation',
        },
      ],
    },
    {
      id: 'tuesday-core',
      name: 'Core',
      order: 5,
      type: 'core',
      exercises: [
        {
          exerciseId: 'cable-crunch',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'hanging-knee-raise',
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 15 },
          restCategory: 'isolation',
        },
      ],
    },
  ],
};
