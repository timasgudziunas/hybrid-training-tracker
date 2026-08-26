/**
 * Thursday: Recovery + Movement. Source: TRAINING_SYSTEM.md §6.
 * Intentionally low fatigue because Ultimate occurs Wednesday and Thursday.
 * Ultimate practice occurs later.
 */

import type { TrainingDayTemplate } from '../program-types';

export const THURSDAY_RECOVERY_MOBILITY: TrainingDayTemplate = {
  restDay: false,
  id: 'thursday-recovery-mobility',
  weekday: 'thursday',
  name: 'Recovery + Mobility + Calisthenics + Adductor Work',
  description:
    'This session should leave the athlete feeling better, not exhausted. There is no requirement to consume all 75 available minutes.',
  targetDurationMinutes: 75,
  ultimatePracticeLater: true,
  sections: [
    {
      id: 'thursday-easy-aerobic-warm-up',
      name: 'Easy Aerobic Warm-Up',
      order: 1,
      type: 'cardio',
      exercises: [
        {
          exerciseId: 'easy-aerobic-warm-up',
          order: 1,
          prescription: {
            type: 'qualitative',
            description: 'Approximately 10 minutes of easy cycling.',
            approxMinMinutes: 10,
            approxMaxMinutes: 10,
          },
        },
      ],
    },
    {
      id: 'thursday-mobility',
      name: 'Mobility',
      order: 2,
      type: 'mobility',
      notes: ['Avoid aggressively stretching an irritated groin.'],
      exercises: [
        {
          exerciseId: 'mobility-flow',
          order: 1,
          prescription: {
            type: 'qualitative',
            description: 'Controlled mobility work.',
            items: [
              '90/90 hip switches',
              'Adductor rockbacks',
              'Hip flexor mobility',
              'Deep squat positions',
              'Ankle dorsiflexion',
              'Thoracic rotations',
              'Shoulder CARs',
              'Wrist mobility',
            ],
          },
        },
      ],
    },
    {
      id: 'thursday-resilience-control',
      name: 'Resilience / Control',
      order: 3,
      type: 'recovery',
      exercises: [
        {
          exerciseId: 'short-lever-copenhagen-plank',
          order: 1,
          prescription: {
            type: 'hold',
            sets: 3,
            minSeconds: 15,
            maxSeconds: 30,
            perSide: true,
          },
          restCategory: 'calisthenics-skill',
        },
        {
          exerciseId: 'single-leg-glute-bridge',
          order: 2,
          prescription: {
            type: 'repetitions',
            sets: 3,
            minReps: 10,
            maxReps: 10,
            perSide: true,
          },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'tibialis-raise',
          order: 3,
          prescription: { type: 'repetitions', sets: 3, minReps: 15, maxReps: 20 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'calf-raise',
          order: 4,
          prescription: { type: 'repetitions', sets: 3, minReps: 15, maxReps: 15 },
          restCategory: 'isolation',
        },
        {
          exerciseId: 'scapular-pull-up',
          order: 5,
          prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 8 },
          restCategory: 'calisthenics-skill',
        },
        {
          exerciseId: 'dead-hang',
          order: 6,
          prescription: { type: 'hold', sets: 2, minSeconds: 30, maxSeconds: 60 },
          restCategory: 'calisthenics-skill',
        },
      ],
    },
    {
      id: 'thursday-l-sit-practice',
      name: 'L-Sit Practice',
      order: 4,
      type: 'calisthenics',
      notes: ['Ultimate practice occurs later.'],
      exercises: [
        {
          exerciseId: 'l-sit',
          order: 1,
          prescription: {
            type: 'qualitative',
            description: 'Approximately 4-5 high-quality attempts.',
          },
          restCategory: 'calisthenics-skill',
        },
      ],
    },
  ],
};
