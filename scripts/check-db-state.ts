/**
 * Read-only DB state check: row counts + workout_sessions rows (id, date,
 * status, template, timestamps — no jsonb dump). Dependency-free fetch
 * against Supabase REST. Run from repo root:
 *   npx tsx --env-file=.env scripts/check-db-state.ts
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" };

async function countRows(table: string, query = ""): Promise<string> {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1${query}`, { headers });
  if (!res.ok) return `ERROR ${res.status}: ${await res.text()}`;
  const range = res.headers.get("content-range");
  return range?.split("/")[1] ?? "?";
}

async function main() {
  for (const table of [
    "body_checkins",
    "training_programs",
    "workout_sessions",
    "ultimate_practice_days",
    "athlete_settings",
  ]) {
    const total = await countRows(table);
    const nullCount = await countRows(table, "&user_id=is.null");
    console.log(`${table}: ${total} rows (${nullCount} without user_id)`);
  }

  const res = await fetch(
    `${url}/rest/v1/workout_sessions?select=id,session_date,weekday,workout_template_id,status,started_at,completed_at,duration_seconds&order=started_at.desc&limit=10`,
    { headers }
  );
  console.log("\nworkout_sessions rows:");
  console.log(JSON.stringify(await res.json(), null, 2));
}

main();

// Module scope (not script scope), so top-level names here can never
// collide with other scripts/ files under the whole-program typecheck.
export {};
