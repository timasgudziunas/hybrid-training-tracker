/**
 * The exercise catalog: every exercise referenced anywhere in the weekly
 * program, defined exactly once. Day seed files reference these by id —
 * never redefine an exercise inline.
 *
 * Naming/category notes (decisions made where TRAINING_SYSTEM.md doesn't
 * spell out taxonomy explicitly):
 * - "Standing Calf Raise" (Tuesday) and "Calf Raise" (Thursday/Friday) are
 *   kept as separate catalog entries because TRAINING_SYSTEM.md names them
 *   differently in different places; not force-merged.
 * - "Calf Raise" (Thursday's Resilience/Control table, Friday's Strength
 *   table) uses one shared id since both instances use the identical name.
 * - Instructional fields (instructions, cues, commonMistakes,
 *   intendedFeeling) and `substitutions` are intentionally left unfilled —
 *   that's Phase 8 exercise-library content, not invented here.
 */

import type { Exercise } from './program-types';

export const EXERCISE_CATALOG: Exercise[] = [
  // --- Monday: Planche Foundation ---
  {
    id: 'wrist-preparation',
    name: 'Wrist Preparation',
    category: 'mobility',
    primaryMuscles: ['wrists', 'forearms'],
    secondaryMuscles: [],
    progressionType: 'none',
  },
  {
    id: 'scapular-push-up',
    name: 'Scapular Push-Up',
    category: 'calisthenics',
    primaryMuscles: ['serratus anterior', 'scapular stabilizers'],
    secondaryMuscles: ['shoulders'],
    progressionType: 'double-progression',
  },
  {
    id: 'planche-lean',
    name: 'Planche Lean',
    category: 'calisthenics',
    primaryMuscles: ['shoulders', 'chest', 'core'],
    secondaryMuscles: ['wrists', 'triceps'],
    progressionType: 'progression-chain',
    progressionChainId: 'planche-progression',
  },
  {
    id: 'hollow-body-hold',
    name: 'Hollow-Body Hold',
    category: 'calisthenics',
    primaryMuscles: ['rectus abdominis', 'deep core'],
    secondaryMuscles: ['hip flexors'],
    progressionType: 'double-progression',
  },

  // --- Monday: Hypertrophy ---
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'hypertrophy',
    primaryMuscles: ['upper chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    progressionType: 'double-progression',
  },
  {
    id: 'seated-dumbbell-shoulder-press',
    name: 'Seated Dumbbell Shoulder Press',
    category: 'hypertrophy',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    progressionType: 'double-progression',
  },
  {
    id: 'cable-fly',
    name: 'Cable Fly',
    category: 'hypertrophy',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders'],
    progressionType: 'double-progression',
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    category: 'hypertrophy',
    primaryMuscles: ['lateral deltoid'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'overhead-cable-triceps-extension',
    name: 'Overhead Cable Triceps Extension',
    category: 'hypertrophy',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    category: 'hypertrophy',
    primaryMuscles: ['rear deltoid', 'upper back'],
    secondaryMuscles: ['rotator cuff'],
    progressionType: 'double-progression',
  },
  {
    id: 'reverse-cable-fly',
    name: 'Reverse Cable Fly',
    category: 'hypertrophy',
    primaryMuscles: ['rear deltoid', 'upper back'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },

  // --- Tuesday: Dynamic Warm-Up ---
  {
    id: 'dynamic-warm-up',
    name: 'Dynamic Warm-Up',
    category: 'mobility',
    primaryMuscles: ['full body'],
    secondaryMuscles: [],
    progressionType: 'none',
  },

  // --- Tuesday: Speed ---
  {
    id: 'acceleration-10m',
    name: '10 m Acceleration',
    category: 'speed',
    primaryMuscles: ['hamstrings', 'glutes', 'calves'],
    secondaryMuscles: ['hip flexors'],
    progressionType: 'none',
  },
  {
    id: 'acceleration-20m',
    name: '20 m Acceleration',
    category: 'speed',
    primaryMuscles: ['hamstrings', 'glutes', 'calves'],
    secondaryMuscles: ['hip flexors'],
    progressionType: 'none',
  },
  {
    id: 'sprint-30m',
    name: '30 m Sprint',
    category: 'speed',
    primaryMuscles: ['hamstrings', 'glutes', 'calves'],
    secondaryMuscles: ['hip flexors'],
    progressionType: 'none',
  },

  // --- Tuesday: Adductor Preparation / Thursday: Resilience-Control ---
  {
    id: 'short-lever-copenhagen-plank',
    name: 'Short-Lever Copenhagen Plank',
    category: 'rehabilitation-prehab',
    primaryMuscles: ['adductors'],
    secondaryMuscles: ['obliques'],
    progressionType: 'double-progression',
  },

  // --- Tuesday: Strength ---
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes'],
    progressionType: 'double-progression',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'hypertrophy',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['lower back'],
    progressionType: 'double-progression',
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    progressionType: 'double-progression',
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    category: 'hypertrophy',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    category: 'hypertrophy',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'adductor-machine',
    name: 'Adductor Machine',
    category: 'hypertrophy',
    primaryMuscles: ['adductors'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'hypertrophy',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },

  // --- Tuesday / Friday: Core ---
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    category: 'hypertrophy',
    primaryMuscles: ['rectus abdominis'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'hanging-knee-raise',
    name: 'Hanging Knee/Leg Raise',
    category: 'hypertrophy',
    primaryMuscles: ['rectus abdominis', 'hip flexors'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },

  // --- Wednesday: Upper B ---
  {
    id: 'pull-up',
    name: 'Pull-Up',
    category: 'strength',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper back'],
    progressionType: 'double-progression',
  },
  {
    id: 'assisted-pull-up',
    name: 'Assisted Pull-Up',
    category: 'strength',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper back'],
    progressionType: 'double-progression',
  },
  {
    id: 'chest-supported-row',
    name: 'Chest-Supported Row',
    category: 'hypertrophy',
    primaryMuscles: ['upper back', 'lats'],
    secondaryMuscles: ['biceps'],
    progressionType: 'double-progression',
  },
  {
    id: 'neutral-grip-lat-pulldown',
    name: 'Neutral-Grip Lat Pulldown',
    category: 'hypertrophy',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps'],
    progressionType: 'double-progression',
  },
  {
    id: 'single-arm-cable-row',
    name: 'Single-Arm Cable Row',
    category: 'hypertrophy',
    primaryMuscles: ['upper back', 'lats'],
    secondaryMuscles: ['biceps'],
    progressionType: 'double-progression',
  },
  {
    id: 'reverse-pec-deck',
    name: 'Reverse Pec Deck',
    category: 'hypertrophy',
    primaryMuscles: ['rear deltoid', 'upper back'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    category: 'hypertrophy',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    category: 'hypertrophy',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    category: 'hypertrophy',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'ab-wheel',
    name: 'Ab Wheel',
    category: 'hypertrophy',
    primaryMuscles: ['rectus abdominis', 'deep core'],
    secondaryMuscles: ['shoulders'],
    progressionType: 'double-progression',
  },

  // --- Thursday: Easy Aerobic Warm-Up ---
  {
    id: 'easy-aerobic-warm-up',
    name: 'Easy Aerobic Warm-Up (Cycling)',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['legs'],
    progressionType: 'none',
  },

  // --- Thursday: Mobility ---
  {
    id: 'mobility-flow',
    name: 'Mobility Flow',
    category: 'mobility',
    primaryMuscles: ['hips', 'ankles', 'shoulders', 'thoracic spine', 'wrists'],
    secondaryMuscles: [],
    progressionType: 'none',
  },

  // --- Thursday: Resilience / Control ---
  {
    id: 'single-leg-glute-bridge',
    name: 'Single-Leg Glute Bridge',
    category: 'rehabilitation-prehab',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    progressionType: 'double-progression',
  },
  {
    id: 'tibialis-raise',
    name: 'Tibialis Raise',
    category: 'rehabilitation-prehab',
    primaryMuscles: ['tibialis anterior'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'calf-raise',
    name: 'Calf Raise',
    category: 'hypertrophy',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'scapular-pull-up',
    name: 'Scapular Pull-Up',
    category: 'calisthenics',
    primaryMuscles: ['scapular stabilizers', 'lats'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'dead-hang',
    name: 'Dead Hang',
    category: 'calisthenics',
    primaryMuscles: ['forearms', 'grip'],
    secondaryMuscles: ['lats', 'shoulders'],
    progressionType: 'double-progression',
  },

  // --- Thursday: L-Sit Practice ---
  {
    id: 'l-sit',
    name: 'L-Sit',
    category: 'calisthenics',
    primaryMuscles: ['hip flexors', 'core'],
    secondaryMuscles: ['shoulders', 'triceps'],
    progressionType: 'progression-chain',
    progressionChainId: 'l-sit-progression',
  },

  // --- Friday: Power ---
  {
    id: 'pogos',
    name: 'Pogos',
    category: 'power',
    primaryMuscles: ['calves'],
    secondaryMuscles: ['ankles'],
    progressionType: 'none',
  },
  {
    id: 'box-jump',
    name: 'Box Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
  },
  {
    id: 'standing-broad-jump',
    name: 'Standing Broad Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
  },

  // --- Friday: Strength ---
  {
    id: 'trap-bar-deadlift',
    name: 'Trap-Bar Deadlift',
    category: 'hypertrophy',
    primaryMuscles: ['glutes', 'hamstrings', 'quadriceps'],
    secondaryMuscles: ['lower back'],
    progressionType: 'double-progression',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes'],
    progressionType: 'double-progression',
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse Lunge',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    progressionType: 'double-progression',
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    progressionType: 'double-progression',
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    category: 'hypertrophy',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'hip-abduction',
    name: 'Hip Abduction',
    category: 'hypertrophy',
    primaryMuscles: ['glute medius'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },

  // --- Saturday: Planche ---
  {
    id: 'pseudo-planche-push-up',
    name: 'Pseudo-Planche Push-Up',
    category: 'calisthenics',
    primaryMuscles: ['chest', 'shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    progressionType: 'double-progression',
  },

  // --- Saturday: Hypertrophy ---
  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    category: 'hypertrophy',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    progressionType: 'double-progression',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'hypertrophy',
    primaryMuscles: ['upper back', 'lats'],
    secondaryMuscles: ['biceps'],
    progressionType: 'double-progression',
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear-Delt Fly',
    category: 'hypertrophy',
    primaryMuscles: ['rear deltoid'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },
  {
    id: 'triceps-pressdown',
    name: 'Triceps Pressdown',
    category: 'hypertrophy',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
  },

  // --- Saturday: Optional Zone 2 ---
  {
    id: 'zone-2-cardio',
    name: 'Zone 2 Cardio (Cycling Preferred)',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['legs'],
    progressionType: 'none',
  },
];

export function findExerciseById(exerciseId: string): Exercise | undefined {
  return EXERCISE_CATALOG.find((exercise) => exercise.id === exerciseId);
}
