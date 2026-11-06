# HANDOFF.md — Session Handoff (updated 2026-11-06 ~06:30 UTC, supersedes all 2026-09-27 and earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables), then `PLAN.md` (R12 Make-up sessions is the newest completed block). `PRODUCT_SPEC.md` is the product source of truth; `TRAINING_SYSTEM.md` is programming rules/philosophy only; `PROGRAM_FORMAT.md` is the owner-facing paste format; `PROGRAM_BRIEF.md` is the one file the owner pastes to an LLM to get a new block written.

## Current state (as of 2026-11-06 ~06:30 UTC)

**The 2026-11-06 feedback batch is committed and pushed as `c212be8` (owner go-ahead given), together with the previous session's `PROGRAM_BRIEF.md` and `scripts/generate-program-brief.ts`.** **Deployed and verified live:** the first Vercel build of `c212be8` failed in 23 s with `errorCode ENOENT`, "npm run build exited with 1" (no log reachable, see landmine 31); the retry on `f754f34` built READY in 36 s and is aliased to hybrid-training-tracker.vercel.app (2026-11-06 ~07:00 UTC). The same 23-check headless drive was then run against production with a throwaway user: 23/23.

- **Active program is Block 4 `ff5e6593` "Three-Day Strength, Calisthenics and Mobility"** (Mon, Tue, Thu; Wed, Fri, Sat, Sun rest), file `programs/block-4-three-day-athletic-strength-and-skills.md`, activated 2026-11-06 05:08 UTC via `activate-program-file.ts`, then PATCHed in place (same row, same created_at) at ~05:40 UTC after two exercise renames (Assisted Pistol Squat to Box became Pistol Squat; Kettlebell Around-the-Body Pass became Kettlebell Around the World). All 34 slots have catalog guidance. Block 3 `045c959d` deactivated, kept as history. The program's own description carries a deload week (Dec 7 to 13, halve sets) and a race week (skip lower-body lifting) that the app does not enforce.
- **Verification state (this tree):** `npx tsc --noEmit` clean; `npx eslint app lib scripts proxy.ts` clean; all 20 test suites green (new: test-warmup-slot 10, test-exercise-notes-log 5, test-group-superset-rows 7); `validate-program.ts` and the Block 4 file validator pass; `next build` green (foreground only, see landmine 27); headless Edge drive 23/23 against `next start -p 3100` with a throwaway user (Block 4 active since Nov 1, completed Monday Nov 3 with a Wall Handstand Hold note, today Friday Nov 6 making up Thursday). Driver: `drive-feedback-2026-11-06.mjs` plus `seed-feedback.ts` in this session's scratchpad only.

## Just completed (this session, 2026-11-06)

Owner feedback batch, all owner decisions dated 2026-11-06:

1. **Untimed warm-ups.** In a `warmup` section a hold/duration prescription (Wrist Preparation 1 x 60-90s) shows no time string on Today and renders `untimed-warmup-card.tsx` ("Warm-up, no timing needed", Mark complete) instead of a seconds input; no warm-up slot shows the rest line. Reps warm-ups unchanged; cardio never affected; the header time-on-exercise timer stays (owner kept it). Rule lives in `lib/workout-session/warmup-slot.ts`; session-deviations skips the "fewer sets" check for a tap-completed slot. Rendering rule only: program data and old sessions untouched.
2. **Hold weight field.** Every hold/duration set now shows "Added weight (lb)" plus "Seconds achieved" (`DEFAULT_HOLD_SET_FIELDS`); the per-exercise override map is empty. Owner chose "every hold exercise" over a curated list.
3. **Superset overview.** `workout-overview.tsx` groups contiguous members into one block: single "Superset A" label, left accent bracket (`border-l-2 border-accent/60 pl-3`, same as Today), no per-row pill. Helper `lib/workout-session/group-superset-rows.ts`. Today already grouped this way and was not changed.
4. **Swap set count.** `prescriptionForSwap`: the substitute's preset decides the set count; same set kind keeps the program's range and per-side flag; different kind adopts the preset whole. Owner chose this over "preset wins entirely" and "only the one-set case".
5. **Notes log.** `fetchExerciseNotes(exerciseIds, excludeSessionId?)` in `app/workout/actions.ts` scans EVERY session of the athlete (any status, no limit, sample rows excluded, the in-progress session excluded by id) through pure `lib/workout-session/exercise-notes-log.ts`. In the workout: footer button "Notes (N)" (disabled "No past notes" at 0) opens `exercise-notes-log.tsx` below the footer row like the swap panel (mutually exclusive with it); the "Last time" panel shows "Note last time: ..." via a `lastNote` prop threaded through `exercise-entry-card.tsx`; the library page `/exercises/[id]` shows a "Your notes" card (`exercise-notes-history.tsx`). Dates are effective dates (makeUpForDate wins).
6. **Library.** Kettlebell Halo and Kettlebell Around the World (mobility, `mobility-prehab.ts`), Pistol Squat (calisthenics, `quads.ts`, double progression, substitutions Bulgarian/Split Squat). `PROGRAM_FORMAT.md` and `PROGRAM_BRIEF.md` regenerated.

## In progress / where it stopped

Nothing mid-flight.

## Next steps (priority order)

1. **Owner: try the batch on the phone** on the next Block 4 day (Vercel serves `f754f34`, verified headlessly against production).
2. **Owner: gym verification** on the phone of the five changes above on a real Block 4 day, plus the still-unconfirmed 2026-09-17 and 2026-09-27 items (blank inputs, timer survives leaving, Unskip, swap panel, Undo, superset handoffs, make-up flow).
3. Optional hygiene from the 2026-09-27 list: backfill row `f793ce6e` with `performance.makeUpForDate = "2026-09-25"`; delete stray active row `52b05e65`; the Nov 4 Wednesday row `a871f121` and Oct 30 Friday row `7970ac5a` are still `active` (unfinished Block 3 sessions; harmless, their notes now show in the log).
4. Next build block: the in-app program builder (PLAN R10 deferred item), needs a superset control.
5. Optional: the Dec 7 to 13 deload and race week in Block 4 could be a pasted reduced variant for those weeks rather than mental arithmetic.
6. Optional cosmetic: pre-existing dashes in a few in-workout strings (`lib/program/rest-guidance.ts`, `app/today/format-prescription.ts`, entry card range labels like "8-12").

## Open decisions / blockers

- Adherence window is 28 days trailing; a make-up performed after the window's start for a missed date before it is credited outside the window. Edge case, acceptable.
- Superset rest line is template-order based; acceptable.
- `getAthleteContext()` calls `supabase.auth.getUser()` once per server action or page fetch. Fine at this scale.
- If `APP_PASSPHRASE` is ever removed from Vercel env, sign-up becomes open to anyone.
- Benchmarks and readiness may return later: tables and PRODUCT_SPEC sections retained; they would need `user_id` + an `own rows` policy.
- The notes log fetch has no row limit; at three sessions a week that is about 150 rows a year of `performance` jsonb per workout start. Revisit with a limit or a dedicated notes table if it ever feels slow.

## Where everything lives

| Path | What it is |
|---|---|
| `lib/workout-session/warmup-slot.ts` · `app/workout/active/untimed-warmup-card.tsx` · `scripts/test-warmup-slot.ts` | Untimed warm-up rule (2026-11-06), its card, tests |
| `lib/workout-session/exercise-notes-log.ts` · `app/workout/active/exercise-notes-log.tsx` · `app/exercises/[exerciseId]/exercise-notes-history.tsx` · `scripts/test-exercise-notes-log.ts` | Per-exercise notes log: pure extractor, in-workout panel, library card, tests (action: `fetchExerciseNotes` in `app/workout/actions.ts`) |
| `lib/workout-session/group-superset-rows.ts` · `app/workout/active/workout-overview.tsx` · `scripts/test-group-superset-rows.ts` | Overview superset block grouping |
| `lib/workout-session/swap-prescription.ts` · `lib/program/set-entry-fields.ts` | Swap set-count rule (preset sets, program range); hold fields default to added weight plus seconds |
| `programs/block-4-three-day-athletic-strength-and-skills.md` · `scripts/activate-program-file.ts` | Active program file; loader (write, owner go-ahead required) |
| `lib/workout-session/make-up-candidates.ts` · `scripts/test-make-up-candidates.ts` | Make-up window rule (`MAKE_UP_WINDOW_DAYS`, candidates, single-date validation) + tests (also cover effective-date grouping and `madeUpOn`) |
| `lib/history/session-filtering.ts` · `lib/history/day-classification.ts` · `lib/history/adherence.ts` | Effective-date grouping (`effectiveSessionDate`), day classification (`madeUpOn`), adherence (unchanged; counts by effective date) |
| `lib/history/active-since-date.ts` · `lib/date/format-date-label.ts` | Shared program-active-since approximation; timezone-safe date labels |
| `app/today/today-workout.tsx` · `today-workout-client.tsx` · `rest-day-card.tsx` · `make-up-offer.tsx` · `start-workout-button.tsx` | Today: recent-session fetch, candidate computation, rest-day buttons, training-day "Missed" card, "Made up X today" |
| `app/workout/active/page.tsx` · `active-workout-screen.tsx` · `completion-summary.tsx` | `?makeUpFor=` parsing, re-validation, session stamping, "Making up" lines |
| `app/history/actions.ts` · `calendar-day-cell.tsx` · `calendar-legend.tsx` · `[date]/session-detail.tsx` · `app/review/review-dashboard.tsx` | OR lookup by missed date, summary `makeUpForDate`, dashed made-up cell, legend, detail line, review grouping |
| `lib/program/parse-program-text.ts` · `lib/program/program-types.ts` | Paste parser (`superset:` clause), `PrescribedExercise.supersetGroup` |
| `lib/workout-session/superset-flow.ts` · `slot-time.ts` · `set-entry-fields.ts` | Superset handoff rule, per-slot time bookkeeping, per-exercise set input config |
| `PROGRAM_FORMAT.md` | Paste format; library block generated by `scripts/generate-program-format-library.ts` |
| `PROGRAM_BRIEF.md` · `scripts/generate-program-brief.ts` | The one file the owner pastes to an LLM to get a new block written (prompt + TRAINING_SYSTEM §10 to 21 + PROGRAM_FORMAT.md). Generated, never hand-edited; the prompt text lives in the script |
| `proxy.ts` · `lib/auth/athlete-context.ts` · `lib/supabase/*` · `supabase/schema.sql` | Auth gate, per-user data entry point, clients, multi-user schema with RLS |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16).
2. Sunday always renders REST DAY and any weekday can be rest — never hardcode "Sunday" in rest-day copy. Since 2026-09-27 a make-up offer may appear on Sunday; that is the only training-related thing allowed there.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap). Upload path prefix comes from the server's `userId`.
4. ALL session saves go through the mount's `createSessionSaveQueue` instance; read `sessionRef.current` at fire time; `clearLocalSession()` only after a queue-confirmed ok save or a non-resumable leftover. `handleLogSet` persists once per tap.
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
19. Catalog edits must keep `npx tsx scripts/test-exercise-catalog.ts` green, then rerun `npx tsx scripts/generate-program-format-library.ts`, then `npx tsx scripts/generate-program-brief.ts`. Same regen after any change to `loggingFieldLabels` in `set-entry-fields.ts`, to `TRAINING_SYSTEM.md`, or to the prompt in the brief script.
20. End-to-end UI verification: `puppeteer-core` (present in older session scratchpads' `node_modules`, load it via `createRequire` on that path) + system Edge against `npx next start -p 3100`; port 3000 is often the `blurbs` dev server. Throwaway auth users via `POST /auth/v1/admin/users` with `email_confirm: true`; delete after. A fresh account's Today shows "No program loaded": seed a `training_programs` row with `parseProgramText(programs/block-3-five-day-gym-program.md)` output and a backdated `created_at`. `npx tsx --env-file=.env <scratchpad script>` run from the repo root resolves `@/` imports. Kill the server with `taskkill //PID <pid> //F //T` (find it via `netstat -ano | grep ":3100 "`).
21. Parallel agents with exclusive file ownership work well here; the orchestrator writes shared types/config/contracts FIRST (done that way for R12: types, grouping, classification, candidate module, tests, then Today/active and History/review agents in parallel).
22. Set inputs must never prefill from a previous session (owner, 2026-09-17). The "Last time" panel is the only place previous performance shows.
23. `ExerciseSlotLog.enteredAt` is only set while a slot is current; the transition effect in `active-workout-screen.tsx` (keyed on `currentSlotKey`) is the one place that opens/closes it.
24. Superset invariants the runtime assumes and the parser guarantees: members contiguous within one section, at least two members, never a qualitative member.
25. **(new)** Every per-date view must group sessions with `groupSessionsByDate` (effective date). Anything that builds its own date map from `sessionDate` will read made-up days as missed. `WorkoutSessionRecord` has no top-level `makeUpForDate`; pull it from `performance` before grouping (see review dashboard and `fetchSessionForDate`).
26. **(new)** `/workout/active` ignores `?makeUpFor=` whenever a resumable session exists (server row for today or local mirror). Headless checks of the fallback must run before starting a real session for the day.
27. **(new 2026-11-06)** `next build` and anything fetching Google Fonts or Supabase must run in a FOREGROUND Bash call: a background (`run_in_background`) shell on this machine has no network, the build "succeeds" with exit 0 through a pipe while actually failing on next/font, and `next start` then reports no production build. Check `.next/BUILD_ID` exists before starting the server.
28. **(new 2026-11-06)** Headless driver: install `puppeteer-core@24` fresh in the current session's scratchpad (`npm i puppeteer-core@24`); older scratchpads' `node_modules` are pruned and fail on `@puppeteer/browsers`. Keep the browser part an `.mjs` next to that `node_modules` and the Supabase seeding a `.ts` run with `npx tsx --env-file=.env` from the repo root (tsx compiles to CJS, so no top-level await, and `require` of puppeteer-core fails there). Today is served at `/`, not `/today`. Date labels read "Tuesday, November 3, 2026".
29. **(new 2026-11-06)** Every per-slot view must treat a slot with `qualitativeCompleted: true` and zero sets as done regardless of its prescription type (untimed warm-ups). Anything that assumes a hold/duration slot has sets (progression, stats, deviations) must go through that check first.
30. **(new 2026-11-06)** Updating the ACTIVE program's content in place (same row, same `created_at`) is the right move when no sessions have been logged against it yet; re-running `activate-program-file.ts` would insert a new row and reset the program's active-since date (make-up candidates, History approximation).
31. **(new 2026-11-06)** A Vercel build can fail transiently with `errorCode ENOENT` / "npm run build exited with 1" in about 20 s while the same tree builds fine locally and from a clean clone. The Vercel MCP `list_deployment_events` returns 404 for this project with or without team scope (`get_deployment` and `list_deployments` work; team id `team_i8cG3o7fGYsBvbJWyyJ3AhKb`, project `prj_fSTZkzjGFxGIm1CGjIU4AatxjuCU`), so build logs are only reachable in the dashboard. Before hunting a cause: confirm the previous commit's status was `success`, build from a clean clone, then push any small commit to retry; the retry succeeded first time here.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ clean tree, the feedback-batch commit at head and pushed, every table `0 without user_id`, URL returns 307 to `/sign-in`.
