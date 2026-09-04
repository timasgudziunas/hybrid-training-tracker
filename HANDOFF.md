# HANDOFF.md — Session Handoff (updated 2026-09-04 ~21:30 UTC, supersedes all 2026-08-26 and earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables), then `PLAN.md` (R9 is the newest completed block; the "Rework plan" section reflects current reality; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth (§6 now has the settled week-one mechanics); `TRAINING_SYSTEM.md` is programming rules/philosophy only; `PROGRAM_FORMAT.md` is the owner-facing paste format (now documents cardio blocks).

## Current state (as of 2026-09-04 ~21:30 UTC)

**The app is live and in real use.** Deployed at **https://hybrid-training-tracker.vercel.app** behind the passphrase gate. Head is `d50fc71` (R9 complete), pushed ~21:15 UTC; **production deploy confirmed** (Vercel commit status on GitHub: success, ~21:45 UTC; URL returns 307 to the gate).

- **No program is active.** The owner asked on 2026-09-04 to stop following Block 1 ("I will be changing it up"). `training_programs` row `aea8db93` (Athletic Muscle Base — Block 1) was set `is_active=false` via `scripts/deactivate-active-program.ts`; it stays in the "Your programs" list for one-tap reactivation. Today shows the waiting-for-program state until a new program is pasted. The repo copy `programs/block-1-athletic-muscle-base.md` was kept as the archive of the owner's real program.
- **Supabase** (ref `woawbkhcoegvwrsfgbix`, service-role only, RLS no-policies by design). Rows as of ~20:00 UTC: `body_checkins` 9, `training_programs` 1 (inactive), `workout_sessions` 8 real rows (2026-08-26 through 2026-09-02; one stray `active` Saturday 2026-08-29 row `52b05e65` with nothing logged, harmless, created by re-opening /workout/active right after finishing), `athletic_benchmarks` 0, `readiness_entries` 0. Whether `ultimate_practice_days` was ever created by the owner is unverified (not in `check-db-state.ts`'s table list).
- **Verification state (all on `d50fc71`):** `npm run build` green; `npx tsc --noEmit` clean; `npx eslint app lib scripts` 0 errors; test suites 202 assertions green: slot-navigation 16, slot-set-edits 25, cardio-slot 23, previous-performance 8, rank-substitutes 9, resumable-session 37, session-deviations 28, save-queue 16, progression 34, ultimate-practice-metrics 10; `validate-program.ts` passes. Headless Edge drive of the sample workout against a local production build: 34/34 checks (delete logged set, remove current set, choice, skip, overview-after-last, cardio setup/run/refresh/stop/resume/results/save, timer freeze at Finish, Back to Today). Sample rows deleted afterwards.

## Just completed (this session, 2026-09-04): R9, the week-one mechanics rework

Owner ran Block 1 for a week and listed what got in the way. Everything shipped in one commit, built by four parallel Sonnet agents with exclusive file ownership, then wired, reviewed, and driven end to end. Settled design (do not re-litigate; details in `PRODUCT_SPEC.md` §6 and `PLAN.md` R9):

1. **Cardio card** (`lib/workout-session/cardio-slot.ts`, `app/workout/active/cardio-entry-card.tsx`): a qualitative or duration slot is cardio when its section is `cardio`, its exercise category is `cardio`, or its name matches the cardio name pattern. States are driven only by persisted `draft` fields (`cardioStartedAt`/`cardioEndedAt`) and `sets[0]`, so a refresh lands in the same state. Setup (resistance, Start {verb}) → Running (big clock, Stop, Restart) → Results (time in minutes, resistance, avg watts, avg speed mph, distance mi, "Resume timer" undoes an accidental Stop) → Logged (Next exercise, Edit). The ride is ONE `SetLog` with `seconds` + cardio fields. The header exercise timer is hidden on cardio slots.
2. **Set removal** (`lib/workout-session/slot-set-edits.ts`): "Remove this set" removes the CURRENT unlogged set (decrements `extraSets`, else increments new `removedSets`); target = `max(logged, prescribed + extra - removed)`. When logged ≥ target the card shows "Next exercise" instead of an input. Any logged set opens an edit form with "Delete set" (renumbers later sets).
3. **Navigation** (`nextUnfinishedSlotKey` + `isSlotNotDone` in `flatten-template-slots.ts`): Next lands on the first UPCOMING slot after the current one (completed AND skipped slots are stepped over). If nothing is upcoming after it but other slots are "not done" (upcoming, or skipped with nothing logged), the overview opens with "N exercises not done yet" and a "Finish workout" button; the first such slot becomes current. Only when nothing is left does the completion screen show. The Overview toggle stays available on the completion screen until Finish.
4. **Finish**: `SessionTimer` takes `endedAt` and freezes; after a saved Finish the primary button is a "Back to Today" link (also offered alongside Retry on failure). Completion "Today" stats gained a Cardio row (`totalCardioSeconds`).
5. **Per-exercise set fields** (`lib/program/set-entry-fields.ts`, config): `box-jump`/`depth-jump` log box height + reps, `standing-broad-jump`/`broad-jump` log distance + reps, category `power`/`speed` log reps only (no weight, no RIR, no progression strip). Parsed exercises that do not match the catalog default to category `strength`, so e.g. "Pogo Jump" (catalog has "Pogos") still gets weight/reps/RIR; add an id override in that file if it bothers the owner.
6. **Last time across days**: `fetchPreviousPerformance(exerciseIds, beforeDate)` scans the last 60 real sessions (`performance->slots` only, sample rows excluded via `not like sample-%`, shape verified against the live DB) and takes each exercise's newest logged sets. A swapped-in exercise back-fills its own history. Side effect: the sample workout now shows the owner's real Hack Squat history because exercise ids are slugified names (harmless; sample is a demo).
7. **Stale sessions**: `isResumableSession(record, today, nowMs)` resumes a previous-day active session only within `RESUME_ACROSS_MIDNIGHT_HOURS = 6` of its start. Beyond that, `isStaleUnfinishedSession` is true and the active screen's init closes it via `closeUnfinishedSession` (upcoming → skipped, `endedEarlyReason: 'unfinished'`, status modified, completedAt/duration null, drafts cleared), syncs through the queue, stashes on failure, then starts today's session fresh. Deviation label: "Left unfinished, N exercises not done". Sample sessions are never sync-closed. This was the root cause of "tomorrow's session changes because I didn't finish": the old rule resumed any active session with logged work regardless of date.
8. **Swap picker**: `rankSubstitutes` scores shared primary muscles (2), primary↔secondary (1), same category (1); "Targets the same muscles" group (max 8, muscles shown) then "Other exercises".
9. **Program deactivation**: `deactivateActiveProgram` action + "Stop using this program" button on the Active program card; `scripts/deactivate-active-program.ts` for the CLI. Block 1 deactivated (see Current state).

Prior sessions' settled items (still standing): Ultimate attendance opt-in (never inferred from the schedule flag); Phase 5 modification system (`modified` is TERMINAL, deviations always derived); the finish-save race root cause and serialized save queue; parser/day-template/progression/adherence decisions in PLAN.md and CLAUDE.md.

## In progress / where it stopped

Nothing mid-flight. Session closed cleanly with this handoff's commit.

## Next steps (priority order)

1. **Owner: paste the new program** on /program (Block 1 is deactivated; Today is in the waiting state). For cardio blocks, see `PROGRAM_FORMAT.md` "Cardio blocks" (a plain descriptive line in a `(cardio)` section, or any line whose exercise name contains cycling/rowing/running etc.).
2. **Owner: gym verification of R9 on the next real session:** remove current set, delete a logged set, skip then come back via overview, cardio Start/Stop/readouts, Last time on an exercise done on a different day, Back to Today after Finish.
3. If "Pogo Jump" or other jump names the catalog does not know should lose the weight field: add one line to `REPETITION_SET_FIELDS_BY_EXERCISE_ID` (id is the slugified pasted name).
4. Optional hygiene: delete the stray active Saturday 2026-08-29 row `52b05e65`; repair 2026-08-26's null completed_at.
5. Optional: add `ultimate_practice_days` to `scripts/check-db-state.ts`'s table list and confirm it exists.

## Open decisions / blockers

- No active program (by owner request) until the new one is pasted. Not a bug.
- A skipped exercise is stepped over by Next and only offered again via the overview ("N not done yet"). Deliberate: skip means "not unless I ask". If the owner would rather Next revisit skipped slots, change `isUpcoming` in `nextUnfinishedSlotKey` to use `isSlotNotDone`.
- A cardio ride saved with every readout blank still counts as cardio only on a qualitative slot (`isCardioSet(set, prescriptionType)`); on a `duration` slot it would count as hold seconds. Only matters if the owner writes `Cycling: 1 x 600s` AND types nothing at the end.
- Multi-word target durations like "65-70 minutes" parse as the lower bound only. Cosmetic.
- Skipping a NON-optional warm-up or mobility block flips a session to Modified (deliberate).

## Where everything lives

| Path | What it is |
|---|---|
| `programs/` | Owner's real programs in paste format, verbatim (Block 1, now inactive in the app) |
| `lib/program/` | Types, parser, resolved-program helpers, sample program, exercise catalog, rest guidance, progression chains, **`set-entry-fields.ts`** (per-exercise set inputs, config), **`rank-substitutes.ts`** (swap ranking) |
| `lib/workout-session/` | Session types (`SetDraft`, cardio/jump `SetLog` fields, `removedSets`), slot flattening + **`nextUnfinishedSlotKey`/`isSlotNotDone`**, factory, completion stats (+cardio), session-deviations, localStorage mirror, resumable-session (+stale rule), **`close-unfinished-session.ts`**, save-queue, pending-sync-store, **`slot-set-edits.ts`**, **`cardio-slot.ts`**, **`format-logged-set.ts`** (one formatter for history + Last time), **`previous-performance.ts`** |
| `lib/progression/` | Deterministic progression engine + strip formatting |
| `lib/history/` · `lib/benchmarks/` | Calendar/adherence/day-classification; benchmark definitions + formatting |
| `app/page.tsx` + `app/today/` | Home: check-in prompt, Today card, readiness strip, Start/Resume/Completed panel, Ultimate attendance checkbox |
| `app/workout/` | Active workout: `active-workout-screen.tsx` (flow, stale-close, finish), `exercise-slot-view.tsx` (picks cardio / qualitative / set entry card), **`cardio-entry-card.tsx`**, `exercise-entry-card.tsx` (field-config driven, remove/delete), `workout-overview.tsx` (remaining count + Finish), `completion-summary.tsx`, `exercise-swap-picker.tsx` (similar group); `actions.ts` (cross-day previous performance) |
| `app/program/` | Paste, preview, "Your programs" switcher, **`deactivate-program-button.tsx`** + program server actions |
| `app/history/` · `app/progress/` · `app/exercises/` · `app/readiness/` · `app/review/` | Feature routes; history set lines via `format-logged-set.ts` |
| `supabase/schema.sql` | Idempotent schema (no changes this session; cardio/jump fields live inside the `performance` jsonb) |
| `scripts/test-*.ts` | 10 pre-registered suites, 202 assertions (see Verification state) |
| `scripts/check-db-state.ts` · `inspect-session-row.ts` · `mark-session-completed.ts` · **`deactivate-active-program.ts`** | Ops tools (the last one WRITES: sets every active program inactive) |
| `PROGRAM_FORMAT.md` | Owner-facing paste format, now with "Cardio blocks" |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16).
2. Sunday always rest; parser coerces pasted Sunday workouts to rest with a warning. Any weekday can be rest — never hardcode "Sunday" in rest-day copy.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap).
4. ALL session saves must go through the mount's `createSessionSaveQueue` instance — never call `saveWorkoutSession` directly for the active session (pending-sync retries of OTHER session ids are the one exception). Never capture a session record in a delayed closure; read `sessionRef.current` at fire time. `clearLocalSession()` call sites: after a queue-confirmed ok save at Finish/retry, and the active-screen init discarding a NON-RESUMABLE leftover (a stale one with work is sync-closed first, never just dropped).
5. Next 16: `proxy.ts` not `middleware.ts`; new routes are gated automatically.
6. Vercel MCP plugin unreliable for this team; CLI not installed. **Reliable deploy verification:** `gh api repos/timasgudziunas/hybrid-training-tracker/commits/<sha>/status` (Vercel posts success/failure there).
7. No `ANTHROPIC_API_KEY` in any env (root CLAUDE.md rule).
8. RLS has no policies BY DESIGN (service-role only) on ALL tables. Don't add anon policies.
9. Owner's NO DASHES rule applies to user-facing UI strings and owner-facing docs. Code comments exempt. Owner-authored program text is stored verbatim, dashes included. Note: CSS uppercases some labels, so headless text checks must be case-insensitive.
10. Coaching/guidance text lives ONLY in `lib/program/exercise-catalog.ts` fields — never hardcoded in components.
11. Session template ids must stay bare weekday slugs across parser changes, or history lookups silently break. Exercise ids are slugified names, so the same name in any program (including the sample) shares history.
12. `next dev`/`next build` flip-flop `next-env.d.ts` — leave that file's churn uncommitted. Commit the `nextjs-agent-rules` block `next dev` appends to CLAUDE.md.
13. Sample sessions (`workout_template_id` prefix `sample-`) must stay excluded from adherence, history states, reviews, previous performance, the Today Resume state, and the Completed-today panel.
14. React StrictMode in `next dev` can double-fire the active-workout init effect; does not happen in production builds. Clean up dev-created rows.
15. Scratchpad tsx scripts can't resolve the project's `node_modules` — put runnable checks in `scripts/`, or use dependency-free `fetch` against Supabase REST with `npx tsx --env-file=.env`. Never read/print `.env`. New `scripts/` files without imports need a trailing `export {}`.
16. ESLint runs React Compiler-era rules: no ref reads or `Date.now()`/`new Date()` during render outside a useState initializer; setState in effects nested inside an inner function.
17. `modified` is TERMINAL. Deviations are always derived via `detectSessionDeviations`, never persisted.
18. End-to-end UI verification: `puppeteer-core` (install into the session scratchpad, not the repo) + system Edge against `npx next start -p 3100` (port 3000 is often held by the `blurbs` dev server; never kill it). Drive the SAMPLE workout, delete sample rows before and after via REST. Load env via `node --env-file=.env`, never print values. Recreate the drive script per session.
19. Ultimate practice attendance is NEVER inferred from the program's `ultimatePracticeLater` flag; only an `ultimate_practice_days` row means attended.
20. **(new)** Cardio card state is persisted `draft` data, not component state. Never add local-only state for start/stop; a refresh mid-ride must land in the same place. The ride is one `SetLog` (`setNumber: 1`).
21. **(new)** `isResumableSession`/`hasResumableLocalProgramSession` take `nowMs`; the 6-hour window is `RESUME_ACROSS_MIDNIGHT_HOURS` in resumable-session.ts. Do not reintroduce "any logged work resumes forever".
22. **(new)** Set-entry inputs come from `lib/program/set-entry-fields.ts`; never branch on an exercise name inside `exercise-entry-card.tsx`.
23. **(new)** Four parallel agents with exclusive file ownership worked well for this codebase; the shared types (`workout-session-types.ts`) and config modules must be written FIRST by the orchestrator so agents code against a fixed contract.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\test-slot-navigation.ts"
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ clean tree (only `next-env.d.ts` churn) with `d50fc71`+ at head, 16 passed, `training_programs` 1 row and no `sample-` sessions, URL returns 307 (gate working). In-app: /program shows "No program is active yet" until the new program is pasted; /workout/active?source=sample shows the cardio card on the last sample slot.
