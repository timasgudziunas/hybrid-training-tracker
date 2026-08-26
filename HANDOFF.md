# HANDOFF.md — Session Handoff (updated 2026-08-26 ~19:30 UTC, supersedes all earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables), then `PLAN.md` (the "Rework plan" section reflects current reality; Phase 5 is complete; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth; `TRAINING_SYSTEM.md` is programming rules/philosophy only (its weekly program was removed from the app); `PROGRAM_FORMAT.md` is the owner-facing paste format.

## Current state (as of 2026-08-26 ~19:30 UTC)

**The app is live and in real use.** Deployed at **https://hybrid-training-tracker.vercel.app** behind the passphrase gate. Head is `7f7a845` (Ultimate practice attendance is opt-in), pushed ~19:10 UTC; **production deploy confirmed complete** (Vercel commit status on GitHub: success, ~19:25 UTC). The owner's first real workout (2026-08-26 Pull day) is in the DB as completed.

- **Supabase** (ref `woawbkhcoegvwrsfgbix`, service-role only, RLS no-policies by design). Rows as of ~17:45 UTC: `body_checkins` 2, `training_programs` 1 (active, Block 1), `workout_sessions` 1 (2026-08-26 Pull, completed; completed_at/duration_seconds null, UI handles null), `athletic_benchmarks` 0, `readiness_entries` 0. **`ultimate_practice_days` table DOES NOT EXIST YET** — owner must paste the new block at the bottom of `supabase/schema.sql` into the Supabase SQL editor (whole file is idempotent, safe to run in full). Until then the Today checkbox renders disabled and History/Review show zero attendance (graceful degradation, by design).
- **Verification state (all on `7f7a845`):** `npm run build` green; `npx eslint app lib scripts` 0 errors; test suites: `test-ultimate-practice-metrics` 10/10 (new), `test-session-deviations` 26/26, `test-resumable-session` 18/18, `test-save-queue` 16/16, `test-progression` 34/34.

## Just completed (this session, 2026-08-26 evening): Ultimate practice attendance is opt-in

Owner request: "I have to check a box to include frisbee practice for the day" (practice can be missed, cancelled, or rescheduled). Settled design — do not re-litigate:

1. **The program flag `ultimatePracticeLater` now means SCHEDULED only.** Attendance is a separate explicit record: new `ultimate_practice_days` table (one row per attended date; unchecking deletes the row).
2. **Today screen:** `app/today/ultimate-practice-checkbox.tsx` renders below the workout card on every NON-REST day (not just flagged ones, so a rescheduled practice can be logged on the day it actually happened). Label "Went to Ultimate practice today"; flagged days add "Scheduled in your program. It counts only when checked." Optimistic toggle with revert + inline error on save failure. Rest days (incl. Sunday): no checkbox.
3. **Consumers read attendance, never the schedule flag:** History calendar accent dot (`classifyDay` now takes caller-supplied `hasUltimatePractice`; field renamed from `ultimatePracticeLater`), legend text now "Ultimate practice attended", weekly review "Ultimate practices" tile (sub "days attended") via rewritten `countUltimatePracticeDays({ dates, attendedDates })`. The old snapshot/template fallback inference is deleted.
4. **Workout card badge** reworded to "Ultimate practice scheduled today" (still program-driven — it states the schedule, not the fact).
5. Server actions in `app/today/ultimate-practice-actions.ts` (get/set/fetch-range) mirror the repo's degrade-gracefully ActionResult posture; `fetchUltimatePracticeDates` returns `ok` with `[]` on query error (same as `fetchBodyCheckinDates`) so History/Review render before the table exists.

Prior sessions' settled items (still standing, do not re-derive): Phase 5 modification system decisions (modified is TERMINAL, deviations always derived via `detectSessionDeviations`, catalog substitution, explicit modify actions); the finish-save race root cause and serialized save queue; parser/day-template/progression/adherence decisions listed in PLAN.md and CLAUDE.md.

## In progress / where it stopped

Nothing mid-flight. Session closed cleanly with this handoff's commit.

## Next steps (priority order)

1. **Owner: paste the `ultimate_practice_days` block (bottom of `supabase/schema.sql`) into the Supabase SQL editor.** The feature is inert until this runs.
2. **Owner: real-device check.** Open Today on the phone, confirm the checkbox row appears under the workout card, check it, reload, confirm it stays checked; then glance at History (accent dot on today) and Review (Ultimate practices counts 1).
3. Owner's next real gym session still has unverified-in-the-gym flows from earlier today: Phase 5 modification flows (skip → "Saving as Modified", Swap picker, Recovery mode) and the finish-save/set-editing/draft-weights/exercise-timer fixes.
4. Optional data hygiene: the repaired 2026-08-26 session still has null completed_at/duration_seconds.

## Open decisions / blockers

- `ultimate_practice_days` not yet created in Supabase (see Next steps 1) — the only blocker for the new feature.
- Multi-word target durations like "65-70 minutes" parse as the lower bound only (65). Cosmetic; owner has not objected.
- Skipping a NON-optional warm-up or mobility block flips a session to Modified (deliberate). If too strict in practice, fix is a per-section/per-prescription optional flag in the program format, not a detection-rule carve-out.
- Block 1 program title contains an em dash: owner-authored text, stored verbatim; the NO DASHES rule applies to copy drafted in the owner's voice, not the owner's own words.

## Where everything lives

| Path | What it is |
|---|---|
| `programs/` | Owner's real programs in paste format, verbatim (`block-1-athletic-muscle-base.md`) |
| `lib/program/` | Types, parser, resolved-program helpers, sample program, exercise catalog (58, 47 with guidance), rest guidance, progression chains |
| `lib/workout-session/` | Session types (incl. `modifications`), slot flattening, factory, completion stats, session-deviations.ts, localStorage mirror, resumable-session rules, save-queue.ts, pending-sync-store.ts |
| `lib/progression/` | Deterministic progression engine + strip formatting |
| `lib/history/` · `lib/benchmarks/` | Calendar/adherence/day-classification (pure; `hasUltimatePractice` is caller-supplied); benchmark definitions (config) + formatting |
| `app/page.tsx` + `app/today/` | Home: check-in prompt, Today card, readiness strip, Start/Resume/Completed-or-Modified button; **ultimate-practice-actions.ts + ultimate-practice-checkbox.tsx** (attendance opt-in) |
| `app/workout/` | Active workout (immersive) + session server actions; `active/exercise-swap-picker.tsx`, `active/end-workout-early-control.tsx` are the Phase 5 controls |
| `app/program/` | Paste, preview, "Your programs" switcher + program server actions |
| `app/history/` · `app/progress/` · `app/exercises/` · `app/readiness/` · `app/review/` | Feature routes; history calendar dot + review weekly count now read `ultimate_practice_days`; `history/[date]` renders a Modifications section for modified sessions |
| `app/site-header.tsx` | Shared nav (8 destinations; More disclosure on mobile) |
| `app/body/` · `app/unlock/` · `proxy.ts` · `lib/auth/` · `lib/supabase/` · `lib/date/` | Unchanged roles from earlier phases |
| `supabase/schema.sql` | Idempotent schema; applied through `readiness_entries` 2026-08-26; **`ultimate_practice_days` block pending owner application** |
| `scripts/validate-program.ts` · `validate-program-file.ts` | Sample-program validation; parse ANY program file before pasting |
| `scripts/test-progression.ts` · `test-resumable-session.ts` · `test-save-queue.ts` · `test-session-deviations.ts` · `test-ultimate-practice-metrics.ts` | 34 + 18 + 16 + 26 + 10 pre-registered assertions |
| `scripts/check-db-state.ts` · `inspect-session-row.ts` · `mark-session-completed.ts` | Ops tools: row counts, one row's performance blob, repair a stuck row |
| `PROGRAM_FORMAT.md` | Owner-facing paste format with full example week (`+ Ultimate practice later` = scheduled only) |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16, revised).
2. Sunday always rest; parser coerces pasted Sunday workouts to rest with a warning (non-negotiables 11/20). Any weekday can be rest — never hardcode "Sunday" in rest-day copy.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap, real failure 2026-08-25).
4. ALL session saves must go through the mount's `createSessionSaveQueue` instance — never call `saveWorkoutSession` directly for the active session (pending-sync retries of OTHER session ids are the one exception). Never capture a session record in a delayed closure; read `sessionRef.current` at fire time. `clearLocalSession()` call sites: after a queue-confirmed ok save at Finish/retry, and the active-screen init discarding a NON-RESUMABLE leftover. Never add a clear site that can drop a session with logged work whose server save hasn't succeeded.
5. Next 16: `proxy.ts` not `middleware.ts`; new routes are gated automatically.
6. Vercel MCP plugin unreliable for this team (env add loops; list_deployments 403s, re-verified 2026-08-26). CLI not installed. **Reliable deploy verification:** `gh api repos/timasgudziunas/hybrid-training-tracker/commits/<sha>/status` — the Vercel GitHub integration posts success/failure there promptly and authoritatively.
7. No `ANTHROPIC_API_KEY` in any env (root CLAUDE.md rule).
8. RLS has no policies BY DESIGN (service-role only) on ALL tables, including `ultimate_practice_days`. Don't add anon policies.
9. Owner's NO DASHES rule applies to user-facing UI strings and owner-facing docs. Code comments exempt. Owner-authored program text is stored verbatim, dashes included.
10. Coaching/guidance text lives ONLY in `lib/program/exercise-catalog.ts` fields — never hardcoded in components.
11. Session template ids must stay bare weekday slugs across parser changes, or previous-performance/history lookups silently break.
12. `next dev`/`next build` flip-flop `next-env.d.ts` import paths — leave that file's churn uncommitted. The `nextjs-agent-rules` block `next dev` appends to CLAUDE.md is different: commit that one.
13. Sample sessions (`workout_template_id` prefix `sample-`) must stay excluded from adherence, history states, reviews, the Today Resume state, AND the Completed-today panel (`fetchLatestSessionSummaryForDate` filters them).
14. React StrictMode in `next dev` can double-fire the active-workout init effect and create two session rows locally; does not happen in production builds. Clean up any dev-created rows.
15. Scratchpad tsx scripts can't resolve the project's `node_modules` — put runnable checks in `scripts/`, or use dependency-free `fetch` against Supabase REST with `npx tsx --env-file=.env` from the repo root. Never read/print `.env` itself. New `scripts/` files without imports need a trailing `export {}`.
16. This repo's ESLint runs React Compiler-era rules (`react-hooks/refs`, `react-hooks/purity`, `react-hooks/set-state-in-effect`): no ref reads or `Date.now()`/`new Date()` during render outside a useState initializer; setState in effects nested inside an inner function (see the timer effect in active-workout-screen.tsx and ultimate-practice-checkbox.tsx for the pattern).
17. (Phase 5) `modified` is TERMINAL. Never treat it as in-flight/resumable again; a lingering local `modified` record is a finished-but-possibly-unsynced session (retry + stash path). Deviations are always derived via `detectSessionDeviations`, never persisted — do not add a stored deviations field.
18. End-to-end UI verification works headlessly via `puppeteer-core` + system Edge against `npm run start` on localhost:3000, driving the SAMPLE workout (safe: sample rows are excluded everywhere and get deleted after). Drive scripts live in session scratchpads (temporary); recreate as needed. Load env via `node --env-file=.env`, never print values.
19. **(new)** Ultimate practice attendance is NEVER inferred from the program's `ultimatePracticeLater` flag anywhere — not in the calendar, not in review counts, not in future features. The flag means scheduled; only an `ultimate_practice_days` row means attended. Do not reintroduce template-flag fallbacks "for convenience".

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\test-ultimate-practice-metrics.ts"
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ clean tree with `7f7a845`+ at head, 10 passed, workout_sessions shows exactly the 2026-08-26 row as completed (no sample rows), URL returns 307 (gate working). In-app once the table exists: Today shows the "Went to Ultimate practice today" checkbox under the workout card; checking it survives a reload and lights the History dot.
