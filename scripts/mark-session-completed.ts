/**
 * Repair tool: marks a workout_sessions row 'completed' and fills in its
 * completion stats, using the same real functions handleFinish uses
 * (computeCompletionStats + flattenTemplateSlots against the row's own
 * performance.templateSnapshot/slots) — never a hand-typed stats object.
 * For rows stuck at 'active' after a real workout was fully logged but the
 * save-queue bug (2026-08-26) let a stale autosave clobber the final save.
 *
 * completed_at and duration_seconds are left untouched: this script has no
 * reliable source for either (the row's own startedAt plus "now" would be
 * wrong for a repair run well after the workout), and the UI already
 * handles a null duration_seconds gracefully. Fix those by hand in Supabase
 * if the real values are known.
 *
 * Run from repo root:
 *   npx tsx --env-file=.env scripts/mark-session-completed.ts <row-id>
 */

import { computeCompletionStats } from '../lib/workout-session/completion-stats';
import { flattenTemplateSlots } from '../lib/workout-session/flatten-template-slots';
import type { WorkoutSessionRecord, WorkoutSessionStatus } from '../lib/workout-session/workout-session-types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const id = process.argv[2];
if (!url || !key || !id) {
  console.error('Usage: npx tsx --env-file=.env scripts/mark-session-completed.ts <row-id>');
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

type WorkoutSessionDbRow = {
  id: string;
  session_date: string;
  weekday: string;
  workout_template_id: string;
  started_at: string;
  completed_at: string | null;
  status: WorkoutSessionStatus;
  duration_seconds: number | null;
  notes: string | null;
  session_difficulty: number | null;
  performance: WorkoutSessionRecord['performance'];
};

async function main(): Promise<void> {
  const getRes = await fetch(`${url}/rest/v1/workout_sessions?select=*&id=eq.${id}`, { headers });
  if (!getRes.ok) {
    console.error(`ERROR ${getRes.status}: ${await getRes.text()}`);
    process.exit(1);
  }
  const rows = (await getRes.json()) as WorkoutSessionDbRow[];
  const row = rows[0];
  if (!row) {
    console.error(`No workout_sessions row with id ${id}.`);
    process.exit(1);
  }

  console.log('Before:');
  console.log(
    `  status: ${row.status} | session_date: ${row.session_date} | completed_at: ${row.completed_at} | duration_seconds: ${row.duration_seconds}`
  );

  if (row.status === 'completed') {
    console.log('Row is already completed. Nothing to do.');
    process.exit(0);
  }

  const templateSlots = flattenTemplateSlots(row.performance.templateSnapshot);
  const stats = computeCompletionStats(row.performance, templateSlots);

  const patchBody = {
    status: 'completed' as WorkoutSessionStatus,
    performance: { ...row.performance, stats },
  };

  const patchRes = await fetch(`${url}/rest/v1/workout_sessions?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(patchBody),
  });
  if (!patchRes.ok) {
    console.error(`PATCH ERROR ${patchRes.status}: ${await patchRes.text()}`);
    process.exit(1);
  }
  const patched = (await patchRes.json()) as WorkoutSessionDbRow[];
  const after = patched[0];

  console.log('');
  console.log('After:');
  console.log(
    `  status: ${after?.status} | completed_at: ${after?.completed_at} | duration_seconds: ${after?.duration_seconds}`
  );
  console.log(`  stats: ${JSON.stringify(stats)}`);
}

main();
