# HANDOFF.md — Session Handoff (updated 2026-09-05 ~00:00 UTC, supersedes all 2026-09-04 21:30 UTC and earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables; 23 and 24 are new), then `PLAN.md` (R10 is the newest completed block; the "Rework plan" section reflects current reality; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth (§6 "Flow polish, settings, and adding exercises" and §12 "Built-in library" are the settled R10 behavior); `TRAINING_SYSTEM.md` is programming rules/philosophy only; `PROGRAM_FORMAT.md` is the owner-facing paste format.

## Current state (as of 2026-09-05 ~00:00 UTC)

**The app is live and in real use** at **https://hybrid-training-tracker.vercel.app** behind the passphrase gate. R10 (built-in exercise library + workout flow polish) is complete locally and being committed as this handoff is written; see the next section for the deploy status the committing session must confirm.

- **No program is active** (owner request 2026-09-04, "I will be changing it up"). `training_programs` row `aea8db93` (Athletic Muscle Base — Block 1) is `is_active=false`, kept for one-tap reactivation. Today shows the waiting-for-program state. Repo copy of the program: `programs/block-1-athletic-muscle-base.md`.
- **Supabase** (ref `woawbkhcoegvwrsfgbix`, service-role only, RLS no-policies by design). **One schema change is NOT applied yet:** the new `athlete_settings` table (bottom of `supabase/schema.sql`). Until the owner runs it in the SQL editor, /settings shows defaults (RIR hidden) and toggling fails with an explicit "table has not been applied yet" message; nothing else is affected. Row counts unchanged from the previous handoff otherwise (`workout_sessions` 8 real rows through 2026-09-02, plus the stray active Saturday 2026-08-29 row `52b05e65`).
- **Verification state (this session's tree, pre-commit):** `npm run build` green (281 exercise pages prerendered); `npx tsc --noEmit` clean; `npx eslint app lib scripts` clean; 15 test suites, 4,629 assertions green (new: exercise-catalog 4,378, exercise-filters 19, add-exercise 26); `validate-program.ts` passes. Headless Edge drive of the sample workout against a local production build: **39/39 checks** (library chips/filters/detail preset, settings page, no autofocus on arrival/after Next set/after delete/in Swap and Add pickers, Next set → Log set labels, no auto-advance after the last set, swipe-left Delete via touch events, progress bar 2 / 10 and 20%, add Barbell Curl mid-workout → 3 / 11, swap Face Pull → Dead Hang adopts a hold input, revert restores reps, completion lists Added today, Finish saves). Sample rows deleted after.

## Just completed (this session, 2026-09-04): R10

Owner asked for a large built-in library plus a list of workout-flow fixes. Four clarifying answers were obtained first and are SETTLED (do not re-litigate): remove everything on foot from the library (sprints and accelerations included); about 250 exercises; build "add exercise mid-workout" and "presets feed Swap" now; settings synced in Supabase; **the in-app program builder is deferred but must not be forgotten** (PLAN.md R10, CLAUDE.md non-negotiable 23).

1. **Catalog** rebuilt as one file per muscle group in `lib/program/catalog/` (281 `CatalogExercise` entries), aggregated by `lib/program/exercise-catalog.ts` (throws on duplicate ids). Every entry: `muscleGroup`, `equipment`, `defaultPrescription` (logging preset), where to feel it, cues, common mistakes. **Ids are always `slugifyExerciseName(name)`** (`lib/program/slugify-exercise-name.ts`, also used by the parser), so catalog ids and pasted-program ids always agree. `scripts/test-exercise-catalog.ts` asserts all rules including guidance coverage of every Block 1 name except the removed sprint lines. Renamed on purpose: "Pogos" → "Pogo Jump", "Hanging Knee/Leg Raise" → "Hanging Knee Raise" (both now match the owner's program text). Removed: 10 m / 20 m Acceleration, 30 m Sprint. Sample program's sprint slot became "Farmer Carry: 3 x 30m" so the distance card type is still demonstrated.
2. **Library** (/exercises): search (never autofocused), muscle-group chips with counts, category + equipment selects, sort by muscle group / name / category (`lib/program/exercise-filters.ts`, pure, tested). Detail page: muscle group badge, equipment line, substitutions as links, and a subdued "Logging preset" card at the bottom (respects the RIR setting). Program-only exercises group under "Other".
3. **Settings** (/settings, in the More nav): `athlete_settings` key/value table, `app/settings/actions.ts` (`fetchAthleteSettings` always degrades to defaults; `updateAthleteSettings` surfaces a missing table), `lib/settings/athlete-settings.ts` (types, `showRir` default **false**: owner takes every set to failure).
4. **Workout flow** (`app/workout/active/`): every `autoFocus` removed. Set button reads "Next set" until the final set, then "Log set". Logging the final set does NOT advance: the slot is marked completed right there (in `handleLogSet`, so the progress bar and Finish agree even if the athlete jumps away) and the card shows the logged sets with one prominent advance button labeled "Next exercise" / "Session overview" / "Session summary" (computed from `nextUnfinishedSlotKey`). Swipe-left on a logged set reveals Delete (`swipeable-set-row.tsx`, pointer events, `touch-action: pan-y`, pointercancel never opens the edit form); tap still opens the edit form. Session overview opens with `session-progress-bar.tsx` ("9 / 10", percent, one segment per slot; skipped = warning tint). `exercise-picker-list.tsx` is shared by Swap and the new "+ Add exercise" (`add-exercise-picker.tsx`, on the overview and the completion screen).
5. **Add exercise mid-workout** (`lib/workout-session/add-exercise.ts`, pure, tested): appended to the session's own `templateSnapshot` in an optional "Added today" section (`ADDED_SECTION_ID`), preset prescription, slot key `added:N`, recorded in `modifications.addedSlotKeys`, current slot jumps to it. Never a deviation, never flips the session to Modified; listed on the completion screen as "Added today".
6. **Presets feed Swap** (`lib/workout-session/swap-prescription.ts`, pure, tested): same set type keeps the program's prescription; different type adopts the substitute's preset with the program's set count; the true program original is stored on `SlotSubstitution.originalPrescription` (survives double swaps) and restored on revert, including the "pick the prescribed exercise again" revert path.

Prior sessions' settled items still standing: R9 mechanics (cardio card, set removal, navigation, stale-session close, cross-day last time), Ultimate attendance opt-in, `modified` is TERMINAL with derived deviations, serialized save queue.

## In progress / where it stopped

Nothing mid-flight. Commit + push + deploy confirmation are the last steps of this session (the committing session updates the deploy line in Current state).

## Next steps (priority order)

1. **Owner: run the `athlete_settings` DDL** (last block of `supabase/schema.sql`) in the Supabase SQL editor, then confirm the toggle on /settings saves. Optional: `npx tsx --env-file=.env scripts/check-db-state.ts` now lists `athlete_settings` and `ultimate_practice_days`.
2. **Owner: paste the new program** on /program (Block 1 stays deactivated until then).
3. **Owner: gym verification of R10** on the next real session: no keyboard popping up on arrival / Next set / Add set; Log set then Next exercise; swipe a set to delete; overview progress bar; add an exercise; swap to a different set type and revert.
4. **Next build block: the in-app program builder** (owner: "put it off for now, but make sure it isn't forgotten"). Presets on every catalog entry exist for it. Scope it as its own PLAN.md block before starting.
5. Optional cosmetic: pre-existing dashes in a few in-workout strings ("Rest: Approximately 2-3 minutes" from `lib/program/rest-guidance.ts`, "Target: 8-12 reps" ranges in `exercise-entry-card.tsx`, `app/today/format-prescription.ts`). The owner's NO DASHES rule would prefer "2 to 3"; untouched this session to keep scope tight.
6. Optional hygiene (unchanged): delete stray active Saturday 2026-08-29 row `52b05e65`; repair 2026-08-26's null completed_at.

## Open decisions / blockers

- `athlete_settings` not applied (see Next steps 1). Not a bug; the app defaults safely.
- A same-type swap keeps the program's sets and reps; a different-type swap keeps only the set count. If the owner wants swapped-in exercises to ALWAYS take their preset reps, change `prescriptionForSwap` (one function) and its tests.
- Logged sets survive a swap that changes the set type (e.g. two reps sets logged, then swapped to a hold): they stay in the slot and format by the new type. Edge case; revert restores everything.
- An exercise is marked completed the moment its final target set is logged. "+ Add set" afterwards grows the target but leaves the status completed; if the athlete then leaves without logging the extra set, no deviation is recorded (prescribed count was met). Deliberate.
- /exercises and /exercises/[id] are prerendered at build time (pre-existing "static friendly" choice), so program-only entries and the preset card's RIR chip reflect build-time data until the next deploy. Cosmetic.
- Skipped slots are stepped over by Next and only offered again via the overview (unchanged R9 decision).

## Where everything lives

| Path | What it is |
|---|---|
| `lib/program/catalog/*.ts` | The 281-entry library, one file per muscle group (chest, back, shoulders, arms, quads, posterior-chain, calves, core, calisthenics, power, mobility-prehab, cardio) |
| `lib/program/exercise-catalog.ts` · `slugify-exercise-name.ts` · `muscle-group-copy.ts` · `exercise-filters.ts` | Aggregator (+`findExerciseById`), the one id rule, filter labels/order, pure library filtering |
| `lib/program/set-entry-fields.ts` | Per-exercise set inputs (config) + **`loggingFieldLabels`** / **`formatPrescriptionPreset`** for library and pickers |
| `lib/program/program-types.ts` | `Exercise` gained `muscleGroup`, `equipment`, `defaultPrescription`; `CatalogExercise` = all required |
| `lib/settings/athlete-settings.ts` · `app/settings/` | Settings types/defaults; page, form, server actions |
| `lib/workout-session/add-exercise.ts` · `swap-prescription.ts` | Pure reducers for add-mid-workout and preset-driven swap prescriptions |
| `lib/workout-session/workout-session-types.ts` | `SlotSubstitution.originalPrescription`, `SessionModificationState.addedSlotKeys` |
| `app/workout/active/` | `active-workout-screen.tsx` (settings fetch, advanceLabel, completion-on-final-set, add/swap wiring), `exercise-entry-card.tsx`, **`swipeable-set-row.tsx`**, **`session-progress-bar.tsx`**, **`exercise-picker-list.tsx`**, **`add-exercise-picker.tsx`**, `exercise-swap-picker.tsx`, `workout-overview.tsx`, `completion-summary.tsx` |
| `app/exercises/` | Library index (`exercise-library-browser.tsx`), `merge-exercise-sources.ts`, detail page |
| `supabase/schema.sql` | Idempotent schema; **`athlete_settings` block at the bottom is new and unapplied** |
| `scripts/test-*.ts` (15) · `validate-program.ts` | Pre-registered suites, 4,629 assertions; new: `test-exercise-catalog.ts`, `test-exercise-filters.ts`, `test-add-exercise.ts` |
| `programs/` | Owner's real programs verbatim (Block 1, inactive) |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16). The catalog is a knowledge base and picker source, never a workout.
2. Sunday always rest; parser coerces pasted Sunday workouts to rest with a warning. Any weekday can be rest — never hardcode "Sunday" in rest-day copy.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap).
4. ALL session saves go through the mount's `createSessionSaveQueue` instance — never call `saveWorkoutSession` directly for the active session (pending-sync retries of OTHER ids are the exception). Never capture a session record in a delayed closure; read `sessionRef.current` at fire time. `clearLocalSession()` only after a queue-confirmed ok save at Finish/retry, or when the init discards a NON-RESUMABLE leftover.
5. Next 16: `proxy.ts` not `middleware.ts`; new routes are gated automatically (/settings needed nothing).
6. Vercel MCP plugin unreliable; CLI not installed. **Reliable deploy verification:** `gh api repos/timasgudziunas/hybrid-training-tracker/commits/<sha>/status`.
7. No `ANTHROPIC_API_KEY` in any env (root CLAUDE.md rule).
8. RLS has no policies BY DESIGN (service-role only) on ALL tables, `athlete_settings` included. Don't add anon policies.
9. Owner's NO DASHES rule applies to user-facing UI strings and owner-facing docs; `scripts/test-exercise-catalog.ts` enforces it on every catalog string. CSS uppercases many labels: **headless text checks must be case-insensitive** (bit this session four times: "Added today", "Targets the same muscles", "Seconds achieved", "Session complete").
10. Coaching/guidance text lives ONLY in `lib/program/catalog/*.ts` — never hardcoded in components.
11. Session template ids stay bare weekday slugs; exercise ids are ALWAYS `slugifyExerciseName(name)` (catalog and parser alike), so the same name anywhere shares history. Renaming a catalog entry changes its id and orphans history logged under the old name.
12. `next dev`/`next build` flip-flop `next-env.d.ts` — leave that churn uncommitted.
13. Sample sessions (`workout_template_id` prefix `sample-`) stay excluded from adherence, history, reviews, previous performance, Today, and the Completed-today panel.
14. React StrictMode in `next dev` can double-fire the active-workout init effect; production builds don't. Clean up dev-created rows.
15. Scratchpad scripts can't resolve the project's `node_modules`; runnable checks go in `scripts/`. Never read/print `.env`. New `scripts/` files without imports need a trailing `export {}`.
16. ESLint runs React Compiler-era rules: no ref reads or `Date.now()` during render outside a useState initializer; setState in effects nested inside an inner function.
17. `modified` is TERMINAL. Deviations are derived via `detectSessionDeviations`, never persisted. Added exercises are NOT deviations (optional section).
18. End-to-end UI verification: `puppeteer-core` in the session scratchpad + system Edge against `npx next start -p 3100` (port 3000 is often the `blurbs` dev server; never kill it). Drive the SAMPLE workout; delete sample rows before and after via REST; load env with `node --env-file=.env`. **Swipe gestures need `page.touchscreen` (mouse events read as a tap under mobile emulation).** Recreate the drive script per session.
19. Ultimate practice attendance is NEVER inferred from the program flag; only an `ultimate_practice_days` row means attended.
20. Cardio card state is persisted `draft` data, never component state; the ride is one `SetLog` (`setNumber: 1`).
21. `isResumableSession`/`hasResumableLocalProgramSession` take `nowMs`; the 6-hour window is `RESUME_ACROSS_MIDNIGHT_HOURS`. Never reintroduce "any logged work resumes forever".
22. Set-entry inputs come from `lib/program/set-entry-fields.ts`; never branch on an exercise name inside `exercise-entry-card.tsx`.
23. Parallel agents with exclusive file ownership work well here; the orchestrator writes shared types/config/pure reducers FIRST (this session: types, catalog aggregator + stubs, settings types, add-exercise, swap-prescription) so agents code against a fixed contract.
24. **(new)** Never add `autoFocus` (or programmatic focus on mount) anywhere under `app/workout/active/` or the library search. The owner explicitly does not want to be dropped into a text box.
25. **(new)** Logging the final target set marks the slot completed in `handleLogSet`; the advance button is navigation only. Do not reintroduce auto-advance, and do not move completion back onto the advance tap (it would reopen the "logged everything but shows Not done" hole).
26. **(new)** Catalog edits must keep `npx tsx scripts/test-exercise-catalog.ts` green: unique ids/names, id = slug(name), all metadata + guidance present, no running words, no dashes, substitutions resolve, Block 1 names covered.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\test-exercise-catalog.ts"
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\test-add-exercise.ts"
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ clean tree (only `next-env.d.ts` churn) with the R10 commit at head, 4378 and 26 passed, `training_programs` 1 row, no `sample-` sessions, `athlete_settings` listed (a "does not exist" there means the DDL is still unapplied), URL returns 307 (gate working). In-app: /exercises shows muscle-group chips with counts and no running entries; /settings shows the RIR toggle; /workout/active?source=sample never focuses an input on arrival.
