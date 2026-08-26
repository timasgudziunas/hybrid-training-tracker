/**
 * Inspect one workout_sessions row's performance jsonb (slot statuses and
 * logged sets, no snapshot dump). Run from repo root:
 *   npx tsx --env-file=.env scripts/inspect-session-row.ts <row-id>
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const id = process.argv[2];
if (!url || !key || !id) {
  console.error("Usage: npx tsx --env-file=.env scripts/inspect-session-row.ts <row-id>");
  process.exit(1);
}

async function main() {
  const res = await fetch(`${url}/rest/v1/workout_sessions?select=performance&id=eq.${id}`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.error(`ERROR ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const rows = (await res.json()) as Array<{ performance: Record<string, unknown> }>;
  if (!rows[0]) {
    console.error("No row with that id.");
    process.exit(1);
  }
  const p = rows[0].performance as {
    currentSlotKey?: string | null;
    stats?: unknown;
    sessionDifficulty?: unknown;
    sessionNote?: unknown;
    slots?: Record<string, { status?: string; chosenExerciseId?: string; sets?: unknown[]; note?: string }>;
  };
  console.log("currentSlotKey:", p.currentSlotKey);
  console.log("stats:", JSON.stringify(p.stats ?? null));
  console.log("sessionDifficulty:", p.sessionDifficulty, "sessionNote:", JSON.stringify(p.sessionNote ?? null));
  console.log("jsonb size (chars):", JSON.stringify(p).length);
  for (const [k, s] of Object.entries(p.slots ?? {})) {
    console.log(
      `${k} | status: ${s.status} | chosen: ${s.chosenExerciseId} | note: ${JSON.stringify(s.note ?? null)} | sets: ${JSON.stringify(s.sets)}`
    );
  }
}

main();

// Module scope (not script scope), so top-level names here can never
// collide with other scripts/ files under the whole-program typecheck.
export {};
