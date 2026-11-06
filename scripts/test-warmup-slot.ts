/**
 * Tests for lib/workout-session/warmup-slot.ts (owner decision 2026-11-06:
 * no times on warm-up activities).
 *
 * Run with:
 *   npx tsx scripts/test-warmup-slot.ts
 *
 * Exits non-zero on any failure.
 */

import { isUntimedWarmupSlot, isWarmupSection } from '../lib/workout-session/warmup-slot';
import type { Exercise, Prescription, WorkoutSection } from '../lib/program/program-types';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`FAIL: ${name} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

function section(type: WorkoutSection['type']): WorkoutSection {
  return { id: type, name: type, order: 1, type, exercises: [] };
}

function exercise(name: string, category: Exercise['category'] = 'mobility'): Exercise {
  return { id: name, name, category, primaryMuscles: [], secondaryMuscles: [], progressionType: 'none' };
}

const hold: Prescription = { type: 'hold', sets: 1, minSeconds: 60, maxSeconds: 90 };
const duration: Prescription = { type: 'duration', sets: 1, minSeconds: 60, maxSeconds: 90 };
const reps: Prescription = { type: 'repetitions', sets: 2, minReps: 15, maxReps: 15 };
const qualitative: Prescription = { type: 'qualitative', description: 'Easy flow' };
const wristPrep = exercise('Wrist Preparation');

check('warmup section detected', isWarmupSection(section('warmup')), true);
check('strength section not warmup', isWarmupSection(section('strength')), false);

check('warmup hold is untimed', isUntimedWarmupSlot(section('warmup'), hold, wristPrep), true);
check('warmup duration is untimed', isUntimedWarmupSlot(section('warmup'), duration, wristPrep), true);
check('warmup duration without exercise is untimed', isUntimedWarmupSlot(section('warmup'), duration, undefined), true);
check('warmup reps keep reps', isUntimedWarmupSlot(section('warmup'), reps, exercise('Band Pull-Apart')), false);
check('warmup qualitative unaffected', isUntimedWarmupSlot(section('warmup'), qualitative, wristPrep), false);
check('non-warmup hold unaffected', isUntimedWarmupSlot(section('core'), hold, exercise('Plank', 'calisthenics')), false);
check(
  'warmup cardio duration excluded (category)',
  isUntimedWarmupSlot(section('warmup'), duration, exercise('Easy Spin', 'cardio')),
  false
);
check(
  'warmup cardio duration excluded (name)',
  isUntimedWarmupSlot(section('warmup'), duration, exercise('Rowing Machine')),
  false
);

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
