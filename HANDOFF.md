# HANDOFF.md — Session Handoff (updated 2026-09-05 ~03:15 UTC, supersedes all 2026-09-05 ~02:30 UTC and earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables; the "What this project is" and "Tech stack" sections now describe accounts), then `PLAN.md` (R10 is the newest completed block; R5 benchmarks are retired; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth; `TRAINING_SYSTEM.md` is programming rules/philosophy only; `PROGRAM_FORMAT.md` is the owner-facing paste format.

## Current state (as of 2026-09-05 ~03:15 UTC)

**Production (https://hybrid-training-tracker.vercel.app) still runs `ddd50c1` (R10, passphrase gate, single-user, Progress and Readiness pages still visible there).** This session's work is two LOCAL commits (`613bac2` accounts + benchmarks removal, then the readiness removal) deliberately NOT pushed: pushing deploys, and the deploy only works once the owner has run the new schema (see Next steps). The Supabase project (`woawbkhcoegvwrsfgbix`) is unchanged: no `user_id` columns, no RLS policies, `athlete_settings` still unapplied, `auth.users` empty (a throwaway e2e user was created and deleted this session).

- **No program is active** (unchanged). `training_programs` row `aea8db93` (Block 1) is `is_active=false`.
- **Verification state (this tree):** `npm run build` green with zero static-render fallbacks; `npx tsc --noEmit` clean; `npx eslint app lib scripts proxy.ts` clean; all 14 test suites green (4,629 assertions) plus `validate-program.ts`. Headless Edge drive of the auth flow against a local production build (`next start -p 3100`, throwaway confirmed user via the admin API): **12/12** (gate redirect with redirect param, wrong password error, sign-in lands on the requested page, Today renders for a fresh account, no Progress nav item, Settings shows the signed-in email, toggle measures 48 x 28, sign-out returns to sign-in and the gate is back, invite field shown when `APP_PASSPHRASE` is set, wrong invite rejected). Data reads/writes under RLS could NOT be verified: the policies do not exist in Supabase yet.

## Just completed (this session, 2026-09-05): four owner requests

1. **Athletic benchmarks removed "for now."** `app/progress/` and `lib/benchmarks/` deleted; Progress nav item gone (mobile nav is now Today, History, More); monthly review lost its "Athletic benchmarks logged" and "Calisthenics" sections; `fetchBodyweightSeries` moved to `app/body/bodyweight-series-actions.ts`. The `athletic_benchmarks` table is intentionally NOT dropped (no code path, no policies). Docs note the pause (PLAN R5 / Phase 7, PRODUCT_SPEC screens table and benchmark section, CLAUDE.md non-negotiable 23).
2. **Accounts (Supabase Auth, email + password).** `@supabase/ssr` added. `proxy.ts` now requires a signed-in user on every route except `/sign-in`, `/sign-up`, `/auth/*`. New: `app/sign-in/`, `app/sign-up/`, `app/auth/actions.ts` (sign in / sign up / sign out), `app/auth/callback/route.ts` (email confirmation landing), `lib/supabase/user-client.ts` (anon key + session cookies), `lib/auth/athlete-context.ts` (`getAthleteContext()` returns `{ supabase, userId, email }` or `{ ok: false, reason }`). Every data-access file now goes through the athlete context; upserts include `user_id` and conflict on `(user_id, <date|key>)`. Service-role client is reserved for progress-photo signing (upload path is now `<userId>/<date>.<ext>`) and admin scripts. `APP_PASSPHRASE` is reused as an optional invite passphrase for sign-up only. Settings page gained an Account card (email + Sign out). Local workout mirrors are cleared on the sign-in / sign-up screens and on sign-out (`app/auth/clear-local-athlete-data.ts`) so a shared device never resumes another athlete's session. Today, Program, and both Library pages are now `force-dynamic` (they read per-account data). The old passphrase gate (`app/unlock/`, `lib/auth/passphrase-cookie.ts`) is deleted.
3. **RIR toggle** on /settings redrawn at 48 x 28 (was 52 x 44); the whole row is the switch.
4. **Readiness removed "for now"** (second request, after the owner saw benchmarks still live in production because nothing was pushed yet). `app/readiness/` and the home readiness strip deleted, Readiness nav item gone, Recovery tiles (sleep, energy, soreness, groin trend) dropped from both reviews, `app/review/recovery-metrics.ts` renamed to `bodyweight-change.ts` with only the bodyweight helper left. `readiness_entries` table kept, no code path, no policies, removed from the backfill migration and `check-db-state.ts`. Headless smoke with a throwaway user: no readiness strip on Today, nav is Today / History / More (Library, Program, Body, Review, Settings), Review shows Training / Progression / Bodyweight only, `/readiness` and `/progress` return 404.

## In progress / where it stopped

Nothing mid-flight. Local commit made; push pending on the owner's schema steps below.

## Next steps (priority order, owner actions, in THIS order)

1. **Supabase Auth settings** (dashboard: Authentication > Sign In / Providers > Email): turn **Confirm email OFF**. Reason: Supabase's built-in mailer only delivers to project team members, so other athletes would never get a confirmation link; sign-up is already gated by the invite passphrase. (Alternative: configure custom SMTP, e.g. Resend, and keep confirmation on; then also add `https://hybrid-training-tracker.vercel.app/auth/callback` under Authentication > URL Configuration > Redirect URLs.) Checked this session via the public settings endpoint: confirmation is currently ON.
2. **Run `supabase/schema.sql`** in the SQL editor (idempotent: adds `user_id`, swaps the per-date unique constraints to per-user, creates the `own rows` policies, creates `athlete_settings` with a `(user_id, key)` key).
3. **`git push`** (deploys). Confirm with `gh api repos/timasgudziunas/hybrid-training-tracker/commits/<sha>/status`.
4. **Sign up** in the app with your own email (the invite passphrase is the old `APP_PASSPHRASE` value already in Vercel env).
5. **Run `supabase/migrations/2026-09-05-backfill-owner-user-id.sql`** after replacing `OWNER_EMAIL_HERE` with the email you signed up with. It assigns every pre-accounts row (8 real sessions, check-ins, readiness, Ultimate days, Block 1 program) to your account. Verify with `npx tsx --env-file=.env scripts/check-db-state.ts` (every table should show `0 without user_id`).
6. Until step 5 is done your history looks empty in the app. That is expected, nothing is lost.
7. Then the standing items: paste the new program on /program; gym verification of R10; in-app program builder as the next build block (PLAN.md R10, CLAUDE.md non-negotiable 23).

## Open decisions / blockers

- Between steps 2 and 3 the live (old) code's body check-in upsert would fail because its conflict target `checkin_date` no longer has a unique constraint. Do the two steps back to back.
- Old progress photos stay at bucket root (`<date>.<ext>`); new ones go under `<userId>/`. Signing works for both because the server signs whatever path the owner's own row holds. No object move needed.
- `getAthleteContext()` calls `supabase.auth.getUser()` (a network round-trip) once per server action or page fetch. Fine at this scale; switch to `getClaims()` if it ever shows up in latency.
- If `APP_PASSPHRASE` is ever removed from Vercel env, sign-up becomes open to anyone.
- Benchmarks and readiness may return later: both tables and their PRODUCT_SPEC sections are retained. If they return under accounts, they need `user_id` + an `own rows` policy like every other table.

## Where everything lives

| Path | What it is |
|---|---|
| `proxy.ts` | Auth gate (session refresh + redirect to /sign-in) |
| `lib/supabase/user-client.ts` · `lib/auth/athlete-context.ts` · `lib/auth/safe-redirect-path.ts` | Per-user client, the one entry point for athlete data, redirect sanitizer |
| `lib/supabase/server-client.ts` | Service-role client: photo signing + admin scripts only |
| `app/auth/` · `app/sign-in/` · `app/sign-up/` | Auth actions, callback route, shared shell/styles, local-data clearing, the two screens |
| `app/settings/account-card.tsx` | Signed-in email + Sign out |
| `app/body/bodyweight-series-actions.ts` | Bodyweight series for Review (moved from the deleted progress actions) |
| `supabase/schema.sql` | Idempotent multi-user schema with RLS policies (benchmarks and readiness tables retired, not dropped) |
| `supabase/migrations/2026-09-05-backfill-owner-user-id.sql` | One-time owner backfill (edit the email placeholder first) |
| `lib/program/catalog/*.ts` · `lib/program/exercise-catalog.ts` | The 281-entry library (unchanged) |
| `app/workout/active/` | Active workout screen (unchanged this session) |
| `scripts/test-*.ts` (14) · `check-db-state.ts` | Test suites; DB state now reports rows missing `user_id` |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16).
2. Sunday always rest; any weekday can be rest — never hardcode "Sunday" in rest-day copy.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap). Upload path prefix comes from the server's `userId`, never from the client.
4. ALL session saves go through the mount's `createSessionSaveQueue` instance; read `sessionRef.current` at fire time; `clearLocalSession()` only after a queue-confirmed ok save or a non-resumable leftover.
5. Next 16: `proxy.ts` not `middleware.ts`. New routes are gated automatically; add public routes to the matcher's exclusion list only.
6. Vercel MCP plugin unreliable; CLI not installed. Deploy verification: `gh api repos/timasgudziunas/hybrid-training-tracker/commits/<sha>/status`.
7. No `ANTHROPIC_API_KEY` in any env.
8. **(changed)** RLS now HAS policies (`own rows`, `user_id = auth.uid()`) on every athlete table, and athlete data must go through `getAthleteContext()`. `createServerSupabaseClient` (service role) may only appear in `app/body/actions.ts` (upload URL) and `app/body/page.tsx` (photo signing); `grep -rn createServerSupabaseClient app lib` should show exactly those.
9. **(new)** `getAthleteContext()` must rethrow Next's `DYNAMIC_SERVER_USAGE` error; any page that calls it needs `export const dynamic = "force-dynamic"` (Today, Program, Library index and detail, Body, Settings all have it).
10. **(new)** Server-action redirects are soft navigations: headless checks must wait on `location.href`, not `waitForNavigation`. Reload the sign-in page between a failed and a successful attempt in a drive script.
11. Owner's NO DASHES rule applies to UI strings and docs; `scripts/test-exercise-catalog.ts` enforces it on catalog strings. CSS uppercases labels: headless text checks must be case-insensitive.
12. Coaching text lives ONLY in `lib/program/catalog/*.ts`.
13. Exercise ids are ALWAYS `slugifyExerciseName(name)`; renaming a catalog entry orphans history.
14. `next dev`/`next build` flip-flop `next-env.d.ts`; stale `.next/dev/types` can fail `next build`'s type check after routes are deleted: `rm -rf .next/dev` then rebuild.
15. Sample sessions (`workout_template_id` prefix `sample-`) stay excluded everywhere.
16. Never add `autoFocus` under `app/workout/active/` or the library search.
17. Logging the final target set marks the slot completed in `handleLogSet`; the advance button is navigation only.
18. `modified` is TERMINAL; deviations are derived, never persisted; added exercises are not deviations.
19. Catalog edits must keep `npx tsx scripts/test-exercise-catalog.ts` green.
20. End-to-end UI verification: `puppeteer-core` in the session scratchpad + system Edge (forward-slash path) against `npx next start -p 3100`; port 3000 is often the `blurbs` dev server. Throwaway auth users via `POST /auth/v1/admin/users` with `email_confirm: true`; delete after.
21. Parallel agents with exclusive file ownership work well here; the orchestrator writes shared types/config/contracts FIRST.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy after the owner's steps ≈ clean tree, accounts commit at head and pushed, every table `0 without user_id`, URL returns 307 to `/sign-in`. Before those steps, `check-db-state.ts` errors on the `user_id` filter (column not there yet): expected.
