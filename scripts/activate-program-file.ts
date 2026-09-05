/**
 * Loads an owner-authored program file (paste format, see PROGRAM_FORMAT.md)
 * into an athlete's account and makes it the active program, exactly as the
 * in-app paste on /program would: parse with the real parser, refuse on any
 * error, insert the row inactive, deactivate that athlete's other rows, then
 * activate the new one. Nothing is deleted; older rows stay as history.
 *
 * Service-role REST (bypasses RLS), so the athlete is chosen explicitly by
 * the email they signed up with. Run from repo root:
 *   npx tsx --env-file=.env scripts/activate-program-file.ts <file> <email>
 *
 * NOTE: this is a write. Do not run it without the owner's go-ahead.
 */

import { readFileSync } from "node:fs";
import { parseProgramText } from "../lib/program/parse-program-text";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [filePath, email] = process.argv.slice(2);

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}
if (!filePath || !email) {
  console.error("Usage: npx tsx --env-file=.env scripts/activate-program-file.ts <program-file> <athlete-email>");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function findUserId(): Promise<string> {
  const res = await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers });
  if (!res.ok) throw new Error(`Listing users failed ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { users?: { id: string; email?: string }[] };
  const user = (json.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`No account with email ${email}. Sign up in the app first.`);
  return user.id;
}

async function main() {
  const sourceText = readFileSync(filePath, "utf-8");
  const { program, errors, warnings } = parseProgramText(sourceText);

  for (const warning of warnings) console.log(`warning: ${warning}`);
  if (!program) {
    console.error("PARSE FAILED:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  const userId = await findUserId();

  const insertRes = await fetch(`${url}/rest/v1/training_programs`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: userId,
      name: program.name,
      source_text: sourceText,
      parsed: program,
      is_active: false,
    }),
  });
  if (!insertRes.ok) throw new Error(`Insert failed ${insertRes.status}: ${await insertRes.text()}`);
  const [inserted] = (await insertRes.json()) as { id: string }[];

  const deactivateRes = await fetch(`${url}/rest/v1/training_programs?user_id=eq.${userId}&is_active=eq.true`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ is_active: false }),
  });
  if (!deactivateRes.ok) throw new Error(`Deactivate failed ${deactivateRes.status}: ${await deactivateRes.text()}`);
  const deactivated = (await deactivateRes.json()) as { id: string; name: string }[];

  const activateRes = await fetch(`${url}/rest/v1/training_programs?id=eq.${inserted.id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ is_active: true }),
  });
  if (!activateRes.ok) throw new Error(`Activate failed ${activateRes.status}: ${await activateRes.text()}`);

  console.log(`Inserted and activated ${inserted.id}  "${program.name}" for ${email}`);
  for (const row of deactivated) console.log(`Deactivated ${row.id}  "${row.name}"`);
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
