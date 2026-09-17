# HANDOFF.md — Session Handoff (updated 2026-09-17 ~23:30 UTC, supersedes all 2026-09-17 ~21:00 UTC and earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables), then `PLAN.md` (R11 Supersets is the newest completed block; R10 before it; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth (§6 now has a Supersets subsection); `TRAINING_SYSTEM.md` is programming rules/philosophy only; `PROGRAM_FORMAT.md` is the owner-facing paste format (now documents `superset:`).

## Current state (as of 2026-09-17 ~23:30 UTC)

**Three commits on 2026-09-17: `d220fca` gym feedback batch, `8a83e9b` supersets (both verified end to end on a local production build and pushed), and the library addition described below (committed with this handoff; verify the push with landmine 6's `gh api` command before assuming it is live).**

- **`d220fca` gym feedback batch** (owner's notes from gym sessions, 2026-09-17): set inputs no longer prefill from a previous session (reps and seconds always blank; weight, box height, jump distance still carry forward within the current session only); the per-exercise timer is persisted per slot (`ExerciseSlotLog.activeSeconds` + `enteredAt`, `lib/workout-session/slot-time.ts`) so leaving and returning, or refreshing, keeps counting; a skipped exercise can be un-skipped (banner + footer button, and logging a set on it un-skips automatically); the overview and progress bar show the swapped-in exercise name; a "Swapped in for X" line with a one-tap Undo sits under the heading; the swap panel is a full-width block below the footer controls with a 48px search box (16px text) and 48px+ rows; Weighted Plank asks for added weight (hold-field config), medicine ball throws and Trap Bar Jump ask for weight (`lib/program/set-entry-fields.ts`); `PROGRAM_FORMAT.md` library list regenerated.
- **`8a83e9b` supersets.** Paste clause `| superset: A` on each member line (`lib/program/parse-program-text.ts`, `PrescribedExercise.supersetGroup`). Parser: lone member → warning and field stripped; non-contiguous members moved together with a warning and orders renumbered; mismatched set counts → warning; descriptive line → error. Execution (`lib/workout-session/superset-flow.ts`, `active-workout-screen.tsx` `handleLogSet`): logging a NEW set hands off to the next partner that still needs work, wrapping through the group; edits never move; the log button reads `Next: <partner>`; the slot view shows a `Superset A` pill, `With <partner>`, `No rest here. Straight into <partner>.` on non-last members and `Rest after the pair: ...` on the last. Today, the paste preview, the overview, and history tag members. Sample program's Monday pairs Bulgarian Split Squat and Cable Woodchop (both 2 sets) as superset A.
- **Not done, by owner instruction:** the "cap sets at three" and "too much volume" notes were program content, and the owner said they are rewriting the program themselves. Nothing in the app enforces a set cap.
- **Verification state (this tree):** `npx tsc --noEmit` clean; `npx eslint app lib scripts proxy.ts` clean; all 16 test suites plus `validate-program.ts` green (new: `test-slot-time.ts` 21, `test-parse-superset.ts` 37, `test-superset-flow.ts` 14); `next build` green. Headless Edge drives against `next start -p 3100` with throwaway users (deleted afterwards): feedback batch 24/24, supersets 19/19. Scripts live in the session scratchpad only (not in the repo).
- **Library addition (this commit, ~21:00 UTC):** three handstand entries, Wall Handstand Weight Shift (3 x 5 to 8 reps each side), Wall Handstand Toe Pull (3 x 3 to 5 reps), Freestanding Handstand (4 holds of 5 to 20 sec), all `calisthenics` / `shoulders` / `bodyweight`, in `lib/program/catalog/calisthenics.ts` with the owner's own cues and mistakes. Library is now 274 entries; `PROGRAM_FORMAT.md` library section regenerated. Catalog, filters, and rank-substitutes tests green, `tsc` clean. Owner instruction: these are NOT in the active program and the program was not reloaded.
- **Active program is now Block 3: `045c959d` "Five-Day Gym Program: Muscle, Athleticism, and Calisthenics"** (loaded 2026-09-17 ~23:45 UTC via `scripts/activate-program-file.ts`; Block 2 `0df9dadc` deactivated, row kept as history; `training_programs` has 3 rows).
- **Block 3 file:** `programs/block-3-five-day-gym-program.md` ("Five-Day Gym Program: Muscle, Athleticism, and Calisthenics", Mon to Fri, Sat and Sun rest, Ultimate flagged Mon/Wed/Thu). Copied from the owner's Downloads file; only edits were the em dashes in the title and day headers (replaced with colons). Validator: PARSE PASSED, no warnings, 7 superset pairs, 60 of 61 slots have guidance (only "L-Sit Practice", a descriptive line, has none). Program files follow `programs/block-N-<kebab title>.md` with a plain `# <Program Name>` title line; Block 1's title lost its "— Block 1" suffix for that reason. `scripts/validate-program-file.ts` now prints `| superset: X` per member (it silently omitted them before).

## Just completed (this session, 2026-09-17 evening)

The three handstand library entries only. The owner supplied name, logging preset, muscles, equipment, substitutions, cues, and mistakes for each; the app has no `wall` equipment value so all three use `bodyweight`. The catalog test's no-dash rule turned "low-quality attempts" into "low quality attempts". Earlier the same day: gym feedback batch and supersets (bullets above). Design decisions worth knowing: one paste syntax only (`superset: <token>`, 1 to 3 letters or digits, uppercased); groups are section scoped; time spent with the app closed counts toward the current exercise (same tradeoff as the session timer); within-session weight carry-forward was kept on purpose (the owner's complaint was about previous-session defaults).

## In progress / where it stopped

Nothing mid-flight.

## Next steps (priority order)

1. **Owner: gym verification** of the feedback fixes and supersets on a real session (blank inputs, timer survives leaving, Unskip, swap panel on the phone, Undo, `Next: <partner>` flow, `Rest after the pair`).
2. **Owner: first real sessions on Block 3** (loaded and live). Watch the superset handoffs on Monday accessories (two pairs) and Friday (two pairs), and the choice lines inside supersets (Face Pull or Reverse Cable Fly, Seated or Lying Leg Curl, Cable or Dumbbell Curl).
3. **Next build block: the in-app program builder** (PLAN R10 deferred item). When it comes, it needs a superset control too.
4. Optional cosmetic: pre-existing dashes in a few in-workout strings (`lib/program/rest-guidance.ts`, `app/today/format-prescription.ts`, entry card range labels like "8-12").
5. Optional hygiene: delete stray active Saturday 2026-08-29 row `52b05e65`; repair 2026-08-26's null completed_at.

## Open decisions / blockers

- Superset rest line is template-order based: with mismatched set counts the last member's final tap can still hop back to an earlier member; the button label reflects that, the static rest line does not. Acceptable; the doc tells authors to match set counts.
- `getAthleteContext()` calls `supabase.auth.getUser()` once per server action or page fetch. Fine at this scale.
- If `APP_PASSPHRASE` is ever removed from Vercel env, sign-up becomes open to anyone.
- Benchmarks and readiness may return later: tables and PRODUCT_SPEC sections retained; they would need `user_id` + an `own rows` policy.

## Where everything lives

| Path | What it is |
|---|---|
| `lib/program/parse-program-text.ts` · `lib/program/program-types.ts` | Paste parser (now `superset:` clause + `finalizeSupersets`), `PrescribedExercise.supersetGroup` |
| `lib/workout-session/superset-flow.ts` · `scripts/test-superset-flow.ts` | Pure superset handoff rule (`nextSupersetSlotKey`, `slotNeedsWork`) + tests |
| `lib/workout-session/slot-time.ts` · `scripts/test-slot-time.ts` | Persisted per-exercise time bookkeeping + tests |
| `lib/program/set-entry-fields.ts` | Per-exercise set input config: repetitions fields and the new hold fields (Weighted Plank), ball weight overrides |
| `app/workout/active/` | Active workout screen: `active-workout-screen.tsx` (handleLogSet superset handoff, handleUnskip, slot time effect), `exercise-slot-view.tsx` (swap panel state, Undo line, Skipped banner, superset pill/rest line), `exercise-swap-picker.tsx` (panel only), `exercise-entry-card.tsx` (hold fields, `logSetLabel`) |
| `app/today/workout-section-card.tsx` · `app/history/[date]/session-exercise-list.tsx` · `app/workout/active/workout-overview.tsx` | Superset grouping/tags on Today (and paste preview), history, overview |
| `scripts/test-parse-superset.ts` · `scripts/validate-program.ts` | Parser superset tests; sample must demonstrate a superset |
| `PROGRAM_FORMAT.md` | Paste format incl. "Supersets" section; library block is generated by `scripts/generate-program-format-library.ts` (rerun after any catalog or logging-label change) |
| `proxy.ts` · `lib/auth/athlete-context.ts` · `lib/supabase/*` · `supabase/schema.sql` | Auth gate, per-user data entry point, clients, multi-user schema with RLS (unchanged this session) |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16).
2. Sunday always rest; any weekday can be rest — never hardcode "Sunday" in rest-day copy.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap). Upload path prefix comes from the server's `userId`.
4. ALL session saves go through the mount's `createSessionSaveQueue` instance; read `sessionRef.current` at fire time; `clearLocalSession()` only after a queue-confirmed ok save or a non-resumable leftover. `handleLogSet` now persists once with both the slot change and any superset `currentSlotKey` move; keep it that way (never two persists for one tap).
5. Next 16: `proxy.ts` not `middleware.ts`. New routes are gated automatically; add public routes to the matcher's exclusion list only.
6. Vercel MCP plugin unreliable; CLI not installed. Deploy verification: `gh api repos/timasgudziunas/hybrid-training-tracker/commits/<sha>/status`.
7. No `ANTHROPIC_API_KEY` in any env.
8. RLS has `own rows` policies on every athlete table; athlete data goes through `getAthleteContext()`. `createServerSupabaseClient` (service role) may only appear in `app/body/actions.ts` and `app/body/page.tsx`.
9. `getAthleteContext()` must rethrow Next's `DYNAMIC_SERVER_USAGE`; pages calling it need `export const dynamic = "force-dynamic"`.
10. Server-action redirects are soft navigations: headless checks poll `location.pathname`, never `waitForNavigation`.
11. Owner's NO DASHES rule applies to UI strings and docs; `scripts/test-exercise-catalog.ts` enforces it on catalog strings. CSS uppercases labels: headless text checks must be case-insensitive.
12. Coaching text lives ONLY in `lib/program/catalog/*.ts`.
13. Exercise ids are ALWAYS `slugifyExerciseName(name)`; renaming a catalog entry orphans history.
14. `next dev`/`next build` flip-flop `next-env.d.ts`; stale `.next/dev/types` can fail `next build`: `rm -rf .next/dev` then rebuild.
15. Sample sessions (`workout_template_id` prefix `sample-`) stay excluded everywhere.
16. Never add `autoFocus` under `app/workout/active/` or the library search.
17. Logging the final target set marks the slot completed in `handleLogSet`; the advance button is navigation only. Inside a superset the same tap also moves `currentSlotKey` to the partner that still needs work.
18. `modified` is TERMINAL; deviations are derived, never persisted; added exercises are not deviations.
19. Catalog edits must keep `npx tsx scripts/test-exercise-catalog.ts` green, then rerun `npx tsx scripts/generate-program-format-library.ts`. The same regen is needed after any change to `loggingFieldLabels` in `set-entry-fields.ts`.
20. End-to-end UI verification: `puppeteer-core` in the session scratchpad + system Edge against `npx next start -p 3100`; port 3000 is often the `blurbs` dev server. Throwaway auth users via `POST /auth/v1/admin/users` with `email_confirm: true`; delete after. A fresh account's Today shows "No program loaded", so verify Today rendering through the /program paste preview (same components). Kill the server with `taskkill //PID <pid> //F //T` (find it via `netstat -ano | grep ":3100 "`).
21. Parallel agents with exclusive file ownership work well here; the orchestrator writes shared types/config/contracts FIRST. An agent in a git worktree (`.claude/worktrees/...`) needs a `node_modules` junction (PowerShell `New-Item -ItemType Junction`); copy its files back, then `git worktree remove --force` and delete the `.claude/` dir before running `tsc` (the duplicate tree would be type-checked too).
22. **(new)** Set inputs must never prefill from a previous session (owner, 2026-09-17). The "Last time" panel is the only place previous performance shows; `prefillNumeric` in `exercise-entry-card.tsx` reads this session's committed sets only.
23. **(new)** `ExerciseSlotLog.enteredAt` is only set while a slot is current; the transition effect in `active-workout-screen.tsx` (keyed on `currentSlotKey`) is the one place that opens/closes it. Never set it elsewhere.
24. **(new)** Superset invariants the runtime assumes and the parser guarantees: members contiguous within one section, at least two members, never a qualitative member. If a future program builder writes `supersetGroup` directly, it must keep these.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ clean tree, the Block 3 commit at head and pushed, every table `0 without user_id`, URL returns 307 to `/sign-in`.
