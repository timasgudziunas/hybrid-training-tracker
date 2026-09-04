/**
 * Deactivates every active row in training_programs (owner request
 * 2026-09-04: stop using the current program, without deleting it —
 * history rows already snapshot their own template, so nothing else
 * breaks). Dependency-free fetch against Supabase REST, same pattern as
 * scripts/check-db-state.ts. Lists what was active, then PATCHes it to
 * inactive and prints what changed. Run from repo root:
 *   npx tsx --env-file=.env scripts/deactivate-active-program.ts
 *
 * NOTE: this is a write. Do not run it without the owner's go-ahead.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  console.error("Usage: npx tsx --env-file=.env scripts/deactivate-active-program.ts");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function main() {
  const listRes = await fetch(`${url}/rest/v1/training_programs?select=id,name&is_active=eq.true`, { headers });
  if (!listRes.ok) {
    console.error(`ERROR listing active programs ${listRes.status}: ${await listRes.text()}`);
    process.exit(1);
  }
  const active = (await listRes.json()) as { id: string; name: string }[];

  if (active.length === 0) {
    console.log("No active program found. Nothing to do.");
    return;
  }

  console.log("Active program(s) before deactivation:");
  for (const program of active) {
    console.log(`  ${program.id}  ${program.name}`);
  }

  const patchRes = await fetch(`${url}/rest/v1/training_programs?is_active=eq.true`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ is_active: false }),
  });

  if (!patchRes.ok) {
    console.error(`ERROR deactivating ${patchRes.status}: ${await patchRes.text()}`);
    process.exit(1);
  }

  const updated = (await patchRes.json()) as { id: string; name: string; is_active: boolean }[];
  console.log(`\nDeactivated ${updated.length} program(s):`);
  for (const program of updated) {
    console.log(`  ${program.id}  ${program.name}  is_active=${program.is_active}`);
  }
}

main();

// Module scope (not script scope), so top-level names here can never
// collide with other scripts/ files under the whole-program typecheck.
export {};
