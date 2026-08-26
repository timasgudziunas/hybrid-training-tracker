# HANDOFF.md — Session Handoff (updated 2026-08-26 ~18:05 UTC, supersedes all earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables), then `PLAN.md` (the "Rework plan" section reflects current reality; Phase 5 is now also complete; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth; `TRAINING_SYSTEM.md` is programming rules/philosophy only (its weekly program was removed from the app); `PROGRAM_FORMAT.md` is the owner-facing paste format.

## Current state (as of 2026-08-26 ~18:00 UTC)

**The app is live and in real use.** Deployed at **https://hybrid-training-tracker.vercel.app** behind the passphrase gate. Head is `834c23b` (Phase 5 complete: modification system), pushed ~17:50 UTC; **production deploy confirmed complete** (Vercel commit status on GitHub: success, ~18:05 UTC). The owner's first real workout (2026-08-26 Pull day) is in the DB as completed.

- **Supabase** (ref `woawbkhcoegvwrsfgbix`, service-role only, RLS no-policies by design). Rows as of ~17:45 UTC: `body_checkins` 2, `training_programs` 1 (active, Block 1), `workout_sessions` 1 (the 2026-08-26 Pull session, status completed; completed_at/duration_seconds null, true finish time unknown, UI handles null), `athletic_benchmarks` 0, `readiness_entries` 0. All headless-drive sample rows were deleted after verification.
- **Verification state (all on `834c23b`):** `npm run build` green; `npx eslint app lib scripts` 0 errors; test suites `test-session-deviations` 26/26, `test-resumable-session` 18/18, `test-save-queue` 16/16, `test-progression` 34/34; full headless browser drive of the modification flows 19/19 including a Supabase round trip (row saved with status `modified`, modifications jsonb intact) and a focused swap drive 5/5.

## Just completed (this session, 2026-08-26 evening): Phase 5, modification system

Owner-approved design decisions (2026-08-26, settled — do not re-litigate):

1. **`modified` is a TERMINAL status**, assigned deterministically at Finish by `resolveFinishStatus` (`lib/workout-session/session-deviations.ts`). Any detected deviation → `modified`, else `completed`. Never chosen mid-workout, never resumable. The completion screen shows the exact deviation list BEFORE Finish (transparency, non-negotiable 17).
2. **Auto-detected deviations:** skipped or not-done exercises (optional sections excluded, both for skips and for reduced sets), fewer completed sets than prescribed (extraSets never masks it, qualitative exempt), plus the explicit actions below. Zero extra logging friction.
3. **Catalog substitution approved**, superseding the earlier "or-pairs only" decision: Swap on any exercise card searches the 58-exercise catalog, records a `SlotSubstitution`, injects the exercise into `exercisesSnapshot`, keeps the slot's prescription. Picking the slot's own prescribed exercise acts as a revert (no "Substituted X for X" record).
4. **Explicit actions:** "Going lighter" toggle per exercise; "Recovery mode" toggle and "End workout early" (optional reason chips: time, fatigue, discomfort, other) in the Overview panel's "Modify session" section. Ending early marks upcoming slots skipped and lands on completion; the deviation list folds zero-work skips into one "Ended early, N exercises not done" line. Reason "discomfort" adds the restrained sports-medicine line on completion (non-negotiable 19).
5. **Storage:** explicit inputs only, in `performance.modifications` (`SessionModificationState`); deviations are always derived on demand by `detectSessionDeviations`, never stored, so wording can evolve without migration. History detail recomputes them from the session's own snapshot.
6. **Terminal-status cleanup:** `modified` removed from resumable/in-flight semantics (`isResumableSession`, `fetchActiveSessionForToday`, active-screen init resume branch). A locally lingering `modified` record is treated exactly like `completed`: retry sync, stash to pending-sync on failure. Today panel shows "Modified session today" vs "Completed today" (`fetchLatestSessionSummaryForDate` now returns status).
7. Bug found and fixed during QA: the exercise card header resolved its name from the prescribed exercise only; after a swap it kept showing the original name. Now `chosenExercise.name` wins once set (also names the picked side of "or" choices).

Prior session's settled items (still standing, do not re-derive): the 2026-08-26 finish-save race root cause and serialized save queue fix; parser/day-template/progression/adherence decisions listed in PLAN.md and CLAUDE.md.

## In progress / where it stopped

Nothing mid-flight. Session closed cleanly with this handoff's commit.

## Next steps (priority order)

1. **Owner: next real session on the phone.** Both the 2026-08-26 fixes (finish save, set editing, draft weights, exercise timer) and the new Phase 5 flows are unverified by the owner in a real gym session. Worth trying: skip something and watch the completion screen announce "Saving as Modified" with reasons; the Swap picker; Recovery mode.
2. Old Phase 6 (History) is already delivered by R4. Remaining PLAN.md content is fully built or deferred; next build work is whatever the owner asks for next (deferred list in CLAUDE.md non-negotiable 23 still stands: no AI analysis, no HYROX phase, etc.).
3. Optional data hygiene: the repaired 2026-08-26 session still has null completed_at/duration_seconds; owner may set real values in Supabase if he remembers.

## Open decisions / blockers

- Multi-word target durations like "65-70 minutes" parse as the lower bound only (65). Cosmetic; owner has not objected.
- Skipping a NON-optional warm-up or mobility block flips a session to Modified (deliberate: honest by design, and modified counts fully toward adherence). If the owner finds this too strict in practice, the fix is a per-section or per-prescription optional flag in the program format, not a detection-rule carve-out.
- Block 1 program title contains an em dash: owner-authored text, stored verbatim; the NO DASHES rule applies to copy drafted in the owner's voice, not the owner's own words.

## Where everything lives

| Path | What it is |
|---|---|
| `programs/` | Owner's real programs in paste format, verbatim (`block-1-athletic-muscle-base.md`) |
| `lib/program/` | Types, parser, resolved-program helpers, sample program, exercise catalog (58, 47 with guidance), rest guidance, progression chains |
| `lib/workout-session/` | Session types (incl. `modifications`), slot flattening, factory, completion stats, **session-deviations.ts** (Phase 5 rule), localStorage mirror, resumable-session rules, save-queue.ts, pending-sync-store.ts |
| `lib/progression/` | Deterministic progression engine + strip formatting |
| `lib/history/` · `lib/benchmarks/` | Calendar/adherence (pure); benchmark definitions (config) + formatting |
| `app/page.tsx` + `app/today/` | Home: check-in prompt, Today card, readiness strip, Start/Resume/Completed-or-Modified-today button |
| `app/workout/` | Active workout (immersive) + session server actions; `active/exercise-swap-picker.tsx`, `active/end-workout-early-control.tsx` are the Phase 5 controls |
| `app/program/` | Paste, preview, "Your programs" switcher + program server actions |
| `app/history/` · `app/progress/` · `app/exercises/` · `app/readiness/` · `app/review/` | Feature routes; `history/[date]` now renders a Modifications section for modified sessions |
| `app/site-header.tsx` | Shared nav (8 destinations; More disclosure on mobile) |
| `app/body/` · `app/unlock/` · `proxy.ts` · `lib/auth/` · `lib/supabase/` · `lib/date/` | Unchanged roles from earlier phases |
| `supabase/schema.sql` | Idempotent schema, fully applied 2026-08-26 (status is plain text, `modified` needs no schema change) |
| `scripts/validate-program.ts` · `validate-program-file.ts` | Sample-program validation; parse ANY program file before pasting |
| `scripts/test-progression.ts` · `test-resumable-session.ts` · `test-save-queue.ts` · `test-session-deviations.ts` | 34 + 18 + 16 + 26 pre-registered assertions |
| `scripts/check-db-state.ts` · `inspect-session-row.ts` · `mark-session-completed.ts` | Ops tools: row counts, one row's performance blob, repair a stuck row |
| `PROGRAM_FORMAT.md` | Owner-facing paste format with full example week |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16, revised).
2. Sunday always rest; parser coerces pasted Sunday workouts to rest with a warning (non-negotiables 11/20). Any weekday can be rest — never hardcode "Sunday" in rest-day copy.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap, real failure 2026-08-25).
4. ALL session saves must go through the mount's `createSessionSaveQueue` instance — never call `saveWorkoutSession` directly for the active session (pending-sync retries of OTHER session ids are the one exception). Never capture a session record in a delayed closure; read `sessionRef.current` at fire time. `clearLocalSession()` call sites: after a queue-confirmed ok save at Finish/retry, and the active-screen init discarding a NON-RESUMABLE leftover. Never add a clear site that can drop a session with logged work whose server save hasn't succeeded.
5. Next 16: `proxy.ts` not `middleware.ts`; new routes are gated automatically.
6. Vercel MCP plugin unreliable for this team (env add loops; list_deployments 403s, re-verified 2026-08-26). CLI not installed. **Reliable deploy verification:** `gh api repos/timasgudziunas/hybrid-training-tracker/commits/<sha>/status` — the Vercel GitHub integration posts success/failure there promptly and authoritatively.
7. No `ANTHROPIC_API_KEY` in any env (root CLAUDE.md rule).
8. RLS has no policies BY DESIGN (service-role only) on ALL tables. Don't add anon policies.
9. Owner's NO DASHES rule applies to user-facing UI strings and owner-facing docs. Code comments exempt. Owner-authored program text is stored verbatim, dashes included.
10. Coaching/guidance text lives ONLY in `lib/program/exercise-catalog.ts` fields — never hardcoded in components.
11. Session template ids must stay bare weekday slugs across parser changes, or previous-performance/history lookups silently break.
12. `next dev`/`next build` flip-flop `next-env.d.ts` import paths — leave that file's churn uncommitted. The `nextjs-agent-rules` block `next dev` appends to CLAUDE.md is different: commit that one.
13. Sample sessions (`workout_template_id` prefix `sample-`) must stay excluded from adherence, history states, reviews, the Today Resume state, AND the Completed-today panel (`fetchLatestSessionSummaryForDate` filters them).
14. React StrictMode in `next dev` can double-fire the active-workout init effect and create two session rows locally; does not happen in production builds. Clean up any dev-created rows.
15. Scratchpad tsx scripts can't resolve the project's `node_modules` — put runnable checks in `scripts/`, or use dependency-free `fetch` against Supabase REST with `npx tsx --env-file=.env` from the repo root. Never read/print `.env` itself. New `scripts/` files without imports need a trailing `export {}`.
16. This repo's ESLint runs React Compiler-era rules (`react-hooks/refs`, `react-hooks/purity`, `react-hooks/set-state-in-effect`): no ref reads or `Date.now()` during render; setState in effects nested inside an inner function (see the timer effect in active-workout-screen.tsx for the pattern).
17. **(new, Phase 5)** `modified` is TERMINAL. Never treat it as in-flight/resumable again; a lingering local `modified` record is a finished-but-possibly-unsynced session (retry + stash path). Deviations are always derived via `detectSessionDeviations`, never persisted — do not add a stored deviations field.
18. **(new)** End-to-end UI verification works headlessly via `puppeteer-core` + system Edge against `npm run start` on localhost:3000, driving the SAMPLE workout (safe: sample rows are excluded everywhere and get deleted after). Drive scripts from this session live in the session scratchpad (temporary); recreate as needed. Load env via `node --env-file=.env`, never print values.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\test-session-deviations.ts"
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ clean tree with `834c23b`+ at head, 26 passed, workout_sessions shows exactly the 2026-08-26 row as completed (no sample rows), URL returns 307 (gate working). In-app: unlock → start the sample workout → Overview shows a "Modify session" section; skipping an exercise makes the completion screen show "Saving as Modified".
