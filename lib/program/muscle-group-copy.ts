/**
 * Display order and labels for the library's muscle-group and equipment
 * filters (R10). Config over code: the one place this copy lives. Labels
 * are user-facing, so no dashes as punctuation (owner's NO DASHES rule).
 */

import type { Equipment, MuscleGroup } from './program-types';

export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'hips',
  'calves',
  'core',
  'full-body',
  'cardio',
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms and grip',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  hips: 'Hips and adductors',
  calves: 'Calves and lower legs',
  core: 'Core',
  'full-body': 'Full body',
  cardio: 'Cardio',
};

export const EQUIPMENT_ORDER: Equipment[] = [
  'bodyweight',
  'barbell',
  'dumbbell',
  'kettlebell',
  'cable',
  'machine',
  'smith-machine',
  'band',
  'bench',
  'pull-up-bar',
  'dip-bars',
  'parallettes',
  'rings',
  'box',
  'medicine-ball',
  'trap-bar',
  'sled',
  'cardio-machine',
  'other',
];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: 'Bodyweight',
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  cable: 'Cable',
  machine: 'Machine',
  'smith-machine': 'Smith machine',
  band: 'Band',
  bench: 'Bench',
  'pull-up-bar': 'Pull-up bar',
  'dip-bars': 'Dip bars',
  parallettes: 'Parallettes',
  rings: 'Rings',
  box: 'Box',
  'medicine-ball': 'Medicine ball',
  'trap-bar': 'Trap bar',
  sled: 'Sled',
  'cardio-machine': 'Cardio machine',
  other: 'Other',
};
