/**
 * Tests for lib/workout-session/save-queue.ts — the serialization fix for
 * the 2026-08-26 "phantom active" incident (a real workout saved every
 * debounced autosave but ended stuck at status 'active': handleFinish's
 * final save landed, then a stale pre-finish debounce fired afterward and
 * overwrote the row back to 'active'). These are the pre-registered
 * requirements the queue must satisfy, asserted with fake async save
 * functions whose resolution order is controlled manually via deferred
 * promises.
 *
 * Run with:
 *   npx tsx scripts/test-save-queue.ts
 *
 * Exits non-zero on any failure.
 */

import { createSessionSaveQueue, type SessionSaveFn } from '../lib/workout-session/save-queue';
import type { WorkoutSessionRecord } from '../lib/workout-session/workout-session-types';

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

/** A deferred promise: resolution is triggered manually from the test body,
 * so we can control exactly when a fake save "completes". */
function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Flushes both the microtask queue and any already-scheduled macrotasks,
 * which is enough for the queue's internal `.then().then().then()` chain to
 * fully settle after a deferred promise is resolved. */
function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeRecord(overrides: Partial<WorkoutSessionRecord> = {}): WorkoutSessionRecord {
  return {
    id: 'test-id',
    sessionDate: '2026-08-26',
    weekday: 'wednesday',
    workoutTemplateId: 'wednesday',
    startedAt: '2026-08-26T10:00:00.000Z',
    completedAt: null,
    status: 'active',
    durationSeconds: null,
    notes: null,
    sessionDifficulty: null,
    performance: {
      slots: {},
      currentSlotKey: null,
      templateSnapshot: {
        id: 'wednesday',
        weekday: 'wednesday',
        name: 'Test Day',
        restDay: false,
        ultimatePracticeLater: false,
        sections: [],
      },
      exercisesSnapshot: {},
    },
    ...overrides,
  };
}

async function testSerialization(): Promise<void> {
  const callOrder: string[] = [];
  const deferreds: Record<string, ReturnType<typeof createDeferred<{ ok: boolean }>>> = {};
  const save: SessionSaveFn = (record) => {
    callOrder.push(record.id);
    const deferred = createDeferred<{ ok: boolean }>();
    deferreds[record.id] = deferred;
    return deferred.promise;
  };
  const queue = createSessionSaveQueue(save);

  queue.request(makeRecord({ id: 'a' }));
  await tick();
  check('serialization: first request starts immediately', callOrder, ['a']);

  queue.request(makeRecord({ id: 'b' }));
  await tick();
  check('serialization: second request does not start while first is in flight', callOrder, ['a']);

  deferreds.a.resolve({ ok: true });
  await tick();
  check('serialization: second request starts once first completes', callOrder, ['a', 'b']);

  deferreds.b.resolve({ ok: true });
  await tick();
}

async function testCoalescing(): Promise<void> {
  const callOrder: string[] = [];
  const deferreds: Record<string, ReturnType<typeof createDeferred<{ ok: boolean }>>> = {};
  const save: SessionSaveFn = (record) => {
    callOrder.push(record.id);
    const deferred = createDeferred<{ ok: boolean }>();
    deferreds[record.id] = deferred;
    return deferred.promise;
  };
  const queue = createSessionSaveQueue(save);

  queue.request(makeRecord({ id: 'r1' }));
  await tick();
  // r1 is now in flight. Three more rapid requests arrive before it
  // completes: only the latest (r4) should ever reach the save function.
  queue.request(makeRecord({ id: 'r2' }));
  queue.request(makeRecord({ id: 'r3' }));
  queue.request(makeRecord({ id: 'r4' }));
  await tick();
  check('coalescing: queued requests do not start while one is in flight', callOrder, ['r1']);

  deferreds.r1.resolve({ ok: true });
  await tick();
  check('coalescing: exactly 2 save calls total (first + latest)', callOrder.length, 2);
  check('coalescing: the second call is the latest queued record', callOrder[1], 'r4');

  deferreds.r4.resolve({ ok: true });
  await tick();
}

async function testFinishScenario(): Promise<void> {
  const callArgs: WorkoutSessionRecord[] = [];
  const deferreds: Record<string, ReturnType<typeof createDeferred<{ ok: boolean }>>> = {};
  const save: SessionSaveFn = (record) => {
    callArgs.push(record);
    const deferred = createDeferred<{ ok: boolean }>();
    deferreds[record.id === 'stale' ? 'stale' : 'final'] = deferred;
    return deferred.promise;
  };
  const queue = createSessionSaveQueue(save);

  const staleRecord = makeRecord({ id: 'stale', status: 'active' });
  const finalRecord = makeRecord({ id: 'final', status: 'completed' });

  // Mirrors the real bug: a debounced pre-finish save is already in flight
  // (stale, slow) when handleFinish requests the final completed record.
  queue.request(staleRecord);
  await tick();
  queue.request(finalRecord);

  // The stale save is slow to resolve, but even so it must be persisted
  // BEFORE the final record, never after.
  await tick();
  deferreds.stale.resolve({ ok: true });
  await tick();
  deferreds.final.resolve({ ok: true });
  await tick();

  check('finish scenario: exactly 2 saves happened', callArgs.length, 2);
  check('finish scenario: stale record persisted first', callArgs[0]?.id, 'stale');
  check('finish scenario: final record persisted last', callArgs[1]?.id, 'final');
  check('finish scenario: final record keeps status completed', callArgs[1]?.status, 'completed');
}

async function testSettleOk(): Promise<void> {
  // Nothing ever requested: settle() resolves true.
  const neverCalledSave: SessionSaveFn = async () => ({ ok: true });
  const emptyQueue = createSessionSaveQueue(neverCalledSave);
  check('settle: resolves true when nothing was ever requested', await emptyQueue.settle(), true);

  // Last save succeeds.
  const okSave: SessionSaveFn = async () => ({ ok: true });
  const okQueue = createSessionSaveQueue(okSave);
  okQueue.request(makeRecord({ id: 'ok' }));
  check('settle: resolves the ok of the last completed save (success)', await okQueue.settle(), true);

  // Last save fails.
  const failSave: SessionSaveFn = async () => ({ ok: false });
  const failQueue = createSessionSaveQueue(failSave);
  failQueue.request(makeRecord({ id: 'fail' }));
  check('settle: resolves the ok of the last completed save (failure)', await failQueue.settle(), false);
}

async function testConcurrentSettle(): Promise<void> {
  const deferred = createDeferred<{ ok: boolean }>();
  const save: SessionSaveFn = () => deferred.promise;
  const queue = createSessionSaveQueue(save);

  queue.request(makeRecord({ id: 'concurrent' }));
  const settlePromises = [queue.settle(), queue.settle(), queue.settle()];
  deferred.resolve({ ok: true });
  const results = await Promise.all(settlePromises);
  check('settle: multiple concurrent callers all resolve', results, [true, true, true]);
}

async function testRejectingSave(): Promise<void> {
  let unhandledRejectionFired = false;
  const onUnhandledRejection = () => {
    unhandledRejectionFired = true;
  };
  process.on('unhandledRejection', onUnhandledRejection);

  const save: SessionSaveFn = () => Promise.reject(new Error('boom'));
  const queue = createSessionSaveQueue(save);
  queue.request(makeRecord({ id: 'rejecting' }));
  const ok = await queue.settle();
  await tick();

  check('rejecting save: treated as ok false, never throws', ok, false);
  check('rejecting save: no unhandled rejection escapes the queue', unhandledRejectionFired, false);

  process.off('unhandledRejection', onUnhandledRejection);
}

async function main(): Promise<void> {
  await testSerialization();
  await testCoalescing();
  await testFinishScenario();
  await testSettleOk();
  await testConcurrentSettle();
  await testRejectingSave();

  console.log('');
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
