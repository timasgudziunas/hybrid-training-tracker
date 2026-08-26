/**
 * Table-driven, pre-registered test suite for the progression engine (R3,
 * logic half). Pass/fail criteria are fixed before this script is treated
 * as "done" — they are not adjusted to match whatever the implementation
 * happens to output. Prints every case's recommendation reason so a human
 * can eyeball the language quality (CLAUDE.md: reasons are always shown to
 * the athlete, never hidden).
 *
 * Run with:
 *   npx tsx scripts/test-progression.ts
 *
 * Exits non-zero on any failing case.
 */

import { recommendNextPrescription } from '../lib/progression/double-progression';
import { recommendNextHold } from '../lib/progression/hold-progression';
import { recommendProgression } from '../lib/progression/recommend-progression';
import type {
  DistancePrescription,
  DurationPrescription,
  HoldPrescription,
  QualitativePrescription,
  RepetitionsPrescription,
} from '../lib/program/program-types';
import type { SetLog } from '../lib/workout-session/workout-session-types';

// --- tiny SetLog builder to keep cases readable ---
function set(
  setNumber: number,
  fields: Partial<Omit<SetLog, 'setNumber' | 'completed'>> & { completed?: boolean } = {}
): SetLog {
  return { setNumber, completed: fields.completed ?? true, ...fields };
}

let passCount = 0;
let failCount = 0;

function check(caseName: string, condition: boolean, detail: string): void {
  if (condition) {
    passCount += 1;
  } else {
    failCount += 1;
    console.log(`  FAIL: ${detail}`);
  }
  void caseName;
}

function heading(name: string): void {
  console.log('');
  console.log('-'.repeat(72));
  console.log(name);
  console.log('-'.repeat(72));
}

// =====================================================================
// Repetitions / double progression
// =====================================================================

const rangeSixToTen: RepetitionsPrescription = { type: 'repetitions', sets: 3, minReps: 6, maxReps: 10 };

// --- Case: first exposure (no history at all) ---
{
  const name = 'first exposure -> no-data';
  heading(name);
  const rec = recommendNextPrescription({ prescription: rangeSixToTen, history: [] });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'no-data', `expected action no-data, got ${rec.action}`);
  check(name, /first time/.test(rec.reason), 'reason should mention this is the first exposure');
}

// --- Case: PRODUCT_SPEC.md §8 worked example, week 1 (partial reps) ---
{
  const name = 'PRODUCT_SPEC §8 week 1 (70x8, 70x8, 70x7) -> add-reps';
  heading(name);
  const history = [[set(1, { weight: 70, reps: 8 }), set(2, { weight: 70, reps: 8 }), set(3, { weight: 70, reps: 7 })]];
  const rec = recommendNextPrescription({ prescription: rangeSixToTen, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  // Judgment call: all 3 prescribed sets were completed, just short of the
  // top of the range, so this is add-reps rather than hold. Incomplete-set
  // hold is reserved for a session with fewer than 3 logged/completed sets
  // (see the dedicated "incomplete sets" case below).
  check(name, rec.action === 'add-reps', `expected action add-reps, got ${rec.action}`);
  check(name, rec.targetReps === '8 to 10', `expected targetReps "8 to 10", got ${rec.targetReps}`);
}

// --- Case: PRODUCT_SPEC.md §8 worked example, week 3 (all top of range) ---
{
  const name = 'PRODUCT_SPEC §8 week 3 (70x10, 70x10, 70x10) -> increase-load to 75';
  heading(name);
  const history = [[set(1, { weight: 70, reps: 10 }), set(2, { weight: 70, reps: 10 }), set(3, { weight: 70, reps: 10 })]];
  const rec = recommendNextPrescription({ prescription: rangeSixToTen, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  suggestedWeight: ${rec.suggestedWeight}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'increase-load', `expected action increase-load, got ${rec.action}`);
  check(name, rec.suggestedWeight === 75, `expected suggestedWeight 75, got ${rec.suggestedWeight}`);
  check(name, rec.targetReps === '6 to 10', `expected targetReps "6 to 10", got ${rec.targetReps}`);
}

// --- Case: grinding (top of range but 0 RIR on multiple sets) -> hold ---
{
  const name = 'grinding: top of range at 0 RIR on 2+ sets -> hold';
  heading(name);
  const history = [[
    set(1, { weight: 70, reps: 10, rir: 0 }),
    set(2, { weight: 70, reps: 10, rir: 0 }),
    set(3, { weight: 70, reps: 10, rir: 1 }),
  ]];
  const rec = recommendNextPrescription({ prescription: rangeSixToTen, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'hold', `expected action hold, got ${rec.action}`);
  check(name, rec.evidence.zeroRirAtTopCount === 2, `expected zeroRirAtTopCount 2, got ${rec.evidence.zeroRirAtTopCount}`);
}

// --- Case: incomplete sets (fewer completed than prescribed) can never increase ---
{
  const name = 'incomplete sets (only 2 of 3 completed, both at top) -> never increase';
  heading(name);
  const history = [[
    set(1, { weight: 70, reps: 10 }),
    set(2, { weight: 70, reps: 10 }),
    // set 3 never logged at all
  ]];
  const rec = recommendNextPrescription({ prescription: rangeSixToTen, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action !== 'increase-load', 'incomplete sets must never qualify for increase-load');
  check(name, rec.action === 'hold', `expected action hold, got ${rec.action}`);
  check(name, rec.evidence.incompleteSets === true, 'evidence.incompleteSets should be true');
}

// --- Case: missing RIR entirely can still qualify for an increase ---
{
  const name = 'missing RIR (unlogged, not 0) -> can still increase-load';
  heading(name);
  const history = [[
    set(1, { weight: 70, reps: 10 }),
    set(2, { weight: 70, reps: 10 }),
    set(3, { weight: 70, reps: 10 }),
  ]];
  const rec = recommendNextPrescription({ prescription: rangeSixToTen, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'increase-load', `unlogged RIR must not block an increase, got ${rec.action}`);
  check(name, rec.evidence.zeroRirAtTopCount === 0, 'unlogged RIR should not count toward zeroRirAtTopCount');
}

// --- Case: mixed weights, the higher-weight sets qualify -> increase-load ---
{
  const name = 'mixed weights (65/70/70), sets at the higher weight all hit top -> increase-load';
  heading(name);
  const history = [[
    set(1, { weight: 65, reps: 10 }),
    set(2, { weight: 70, reps: 10 }),
    set(3, { weight: 70, reps: 10 }),
  ]];
  const rec = recommendNextPrescription({ prescription: rangeSixToTen, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  suggestedWeight: ${rec.suggestedWeight}`);
  console.log(`  reason: ${rec.reason}`);
  // Judgment call, per the rework brief's own wording: reference weight is
  // the highest weight logged (70), and only the sets performed at that
  // weight must hit the top to qualify. The set 1 performed at 65 lb is
  // evidence but does not block qualification.
  check(name, rec.action === 'increase-load', `expected action increase-load, got ${rec.action}`);
  check(name, rec.suggestedWeight === 75, `expected suggestedWeight 75 (70 + 5), got ${rec.suggestedWeight}`);
  check(name, rec.evidence.mixedWeights === true, 'evidence.mixedWeights should be true');
}

// --- Case: mixed weights where the higher-weight sets do NOT all hit top -> add-reps ---
{
  const name = 'mixed weights (70/75/75), one higher-weight set short of top -> add-reps';
  heading(name);
  const history = [[
    set(1, { weight: 70, reps: 10 }),
    set(2, { weight: 75, reps: 10 }),
    set(3, { weight: 75, reps: 9 }),
  ]];
  const rec = recommendNextPrescription({ prescription: rangeSixToTen, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'add-reps', `expected action add-reps, got ${rec.action}`);
  check(name, /varied/.test(rec.reason), 'reason should call out that weight varied');
}

// --- Case: single-set prescription ---
{
  const name = 'single-set prescription (1 x 8-12) at top -> increase-load';
  heading(name);
  const singleSet: RepetitionsPrescription = { type: 'repetitions', sets: 1, minReps: 8, maxReps: 12 };
  const history = [[set(1, { weight: 40, reps: 12, rir: 2 })]];
  const rec = recommendNextPrescription({ prescription: singleSet, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  suggestedWeight: ${rec.suggestedWeight}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'increase-load', `expected action increase-load, got ${rec.action}`);
  check(name, rec.suggestedWeight === 45, `expected suggestedWeight 45, got ${rec.suggestedWeight}`);
}

// --- Case (bonus): all sets at top but no weight ever logged (bodyweight-only) ---
{
  const name = 'bonus: bodyweight-only reps at top of range, no weight logged -> hold';
  heading(name);
  const history = [[set(1, { reps: 10 }), set(2, { reps: 10 }), set(3, { reps: 10 })]];
  const rec = recommendNextPrescription({ prescription: rangeSixToTen, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'hold', `expected action hold, got ${rec.action}`);
  check(name, rec.suggestedWeight === undefined, 'no weight should be suggested when none was ever logged');
}

// =====================================================================
// Hold / duration progression
// =====================================================================

const plancheLean: HoldPrescription = { type: 'hold', sets: 4, minSeconds: 10, maxSeconds: 20 };

// --- Case: hold, first exposure ---
{
  const name = 'hold: first exposure -> no-data';
  heading(name);
  const rec = recommendNextHold({ prescription: plancheLean, history: [] });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'no-data', `expected action no-data, got ${rec.action}`);
}

// --- Case: hold, incomplete sets ---
{
  const name = 'hold: incomplete sets (2 of 4) -> hold';
  heading(name);
  const history = [[set(1, { seconds: 20 }), set(2, { seconds: 20 })]];
  const rec = recommendNextHold({ prescription: plancheLean, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'hold', `expected action hold, got ${rec.action}`);
  check(name, rec.evidence.incompleteSets === true, 'evidence.incompleteSets should be true');
}

// --- Case: hold, working toward the top of the range ---
{
  const name = 'hold: below top of range -> hold, keep working toward top';
  heading(name);
  const history = [[
    set(1, { seconds: 15 }),
    set(2, { seconds: 14 }),
    set(3, { seconds: 16 }),
    set(4, { seconds: 15 }),
  ]];
  const rec = recommendNextHold({ prescription: plancheLean, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'hold', `expected action hold, got ${rec.action}`);
  check(name, rec.suggestedTargetSeconds === undefined, 'no target extension should be suggested yet');
}

// --- Case: hold, every set reached the top -> extend range ---
{
  const name = 'hold: every set at top of range -> increase-target';
  heading(name);
  const history = [[
    set(1, { seconds: 20 }),
    set(2, { seconds: 20 }),
    set(3, { seconds: 21 }),
    set(4, { seconds: 20 }),
  ]];
  const rec = recommendNextHold({ prescription: plancheLean, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  suggestedTargetSeconds: ${rec.suggestedTargetSeconds}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'increase-target', `expected action increase-target, got ${rec.action}`);
  check(name, rec.suggestedTargetSeconds === 25, `expected suggestedTargetSeconds 25, got ${rec.suggestedTargetSeconds}`);
}

// =====================================================================
// Dispatcher: distance, qualitative, duration
// =====================================================================

// --- Case: distance (sprints) -> not-applicable, never invented ---
{
  const name = 'distance (sprint) -> not-applicable';
  heading(name);
  const sprint: DistancePrescription = { type: 'distance', sets: 3, meters: 30, timed: true };
  const rec = recommendProgression({ prescription: sprint, history: [] });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'not-applicable', `expected action not-applicable, got ${rec.action}`);
}

// --- Case: qualitative (warm-up/mobility flow) -> not-applicable ---
{
  const name = 'qualitative (dynamic warm-up) -> not-applicable';
  heading(name);
  const warmup: QualitativePrescription = {
    type: 'qualitative',
    description: 'Dynamic warm-up',
    approxMinMinutes: 8,
    approxMaxMinutes: 10,
  };
  const rec = recommendProgression({ prescription: warmup, history: [] });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'not-applicable', `expected action not-applicable, got ${rec.action}`);
}

// --- Case: duration (e.g. wrist preparation) routes through recommendNextHold ---
{
  const name = 'duration (wrist preparation) at top of range -> increase-target via dispatcher';
  heading(name);
  const wristPrep: DurationPrescription = { type: 'duration', sets: 1, minSeconds: 120, maxSeconds: 180 };
  const history = [[set(1, { seconds: 180 })]];
  const rec = recommendProgression({ prescription: wristPrep, history });
  console.log(`  action: ${rec.action}`);
  console.log(`  reason: ${rec.reason}`);
  check(name, rec.action === 'increase-target', `expected action increase-target, got ${rec.action}`);
}

// --- Case: repetitions routes through the dispatcher too ---
{
  const name = 'repetitions via dispatcher matches recommendNextPrescription directly';
  heading(name);
  const history = [[set(1, { weight: 70, reps: 10 }), set(2, { weight: 70, reps: 10 }), set(3, { weight: 70, reps: 10 })]];
  const direct = recommendNextPrescription({ prescription: rangeSixToTen, history });
  const viaDispatch = recommendProgression({ prescription: rangeSixToTen, history });
  console.log(`  direct action: ${direct.action}, dispatch action: ${viaDispatch.action}`);
  check(name, direct.action === viaDispatch.action, 'dispatcher should match direct call for repetitions');
}

// =====================================================================
// Summary
// =====================================================================

console.log('');
console.log('='.repeat(72));
console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
console.log('='.repeat(72));

if (failCount > 0) {
  process.exit(1);
}
process.exit(0);
