# HANDOFF.md — Session Handoff (updated 2026-09-27 ~20:30 UTC, supersedes all 2026-09-17 and earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables; 11 and 20 were amended 2026-09-27), then `PLAN.md` (R12 Make-up sessions is the newest completed block; R11 Supersets before it; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth (§5 has a Make-up sessions subsection); `TRAINING_SYSTEM.md` is programming rules/philosophy only; `PROGRAM_FORMAT.md` is the owner-facing paste format.

## Current state (as of 2026-09-27 ~20:30 UTC)

**R12 Make-up sessions shipped this session (committed with this handoff; verify the push with landmine 6's `gh api` command before assuming it is live).** Replaces the temporary one-day `?day=` override from 2026-09-26 (`cb7ca4a`, `92b0348`).

- **Rule (owner decisions 2026-09-27):** a training day missed within the last 3 days can be made up on any later day, rest days and Sunday included. `MAKE_UP_WINDOW_DAYS = 3` in `lib/workout-session/make-up-candidates.ts` (`findMakeUpCandidates`, `makeUpCandidateForDate`). A day is a candidate when the program covered it (on or after `activeSinceDate`), it was a training day, it is before today and inside the window, and no completed or modified session is credited to it. Unfinished (active) rows leave the day open.
- **Storage:** the make-up session keeps `session_date` = performed date and carries `performance.makeUpForDate` = missed date (no schema migration). `groupSessionsByDate` keys by effective date (`makeUpForDate ?? sessionDate`), so calendar, adherence, review, and the candidate rule all credit the missed date; the performed date stays whatever the program says it is (a rest day shows rest).
- **Today:** `today-workout.tsx` also fetches session summaries from UTC today minus 4 days; the client resolves the device-local date, groups, and computes candidates. Rest-day card (Sunday included) lists one 56px button per candidate ("Make up Friday: Upper B"). Training day: `make-up-offer.tsx` card under the workout card, "Missed" label, "Make it up instead" link per candidate, "Starts in place of today's session." Start button reads "Made up Friday today" after a make-up.
- **Active route:** `/workout/active?makeUpFor=yyyy-mm-dd`. `page.tsx` regex-validates; the screen re-validates with `makeUpCandidateForDate` (program only, never sample, never on resume) and falls back to the device weekday when invalid, expired, or already done. Header line "Making up Friday, Sep 25" (also on the completion screen). No Sunday guard anymore.
- **History:** `fetchSessionForDate` matches `session_date = D` OR `performance->>makeUpForDate = D`; `SessionSummary.makeUpForDate` selected via `make_up_for_date:performance->>makeUpForDate`. Cell for the missed date keeps the completed/modified tint with a dashed border and aria-label "made up on <date>"; legend "Made up later"; session detail line "Makes up for Friday, Sep 25. Performed Sunday, Sep 27." Review dashboard maps `performance.makeUpForDate` before grouping so weekly/monthly adherence credit make-ups.
- **Shared helpers:** `lib/history/active-since-date.ts` (was duplicated in history page and review dashboard), `lib/date/format-date-label.ts` (`formatDateLabel`, `formatDateLabelShort`; `app/history/[date]/format-date-label.ts` re-exports).
- **Verification state (this tree):** `npx tsc --noEmit` clean; `npx eslint app lib scripts proxy.ts` clean; all 17 test suites plus `validate-program.ts` green (new: `scripts/test-make-up-candidates.ts`, 26 checks); `next build` green; headless Edge drive against `next start -p 3100` with a throwaway user (Block 3 program active since 2026-09-01, completed Thursday 09-24, today Sunday 09-27): 18/18 (Sunday offers Friday only, link, header line, DB stamp, out-of-window and already-done links fall back to "nothing to start today", calendar cell/legend/adherence 2 of 2, drill-down on the missed date, offer disappears once made up). Driver lives in the session scratchpad only.
- **Active program is still Block 3 `045c959d`** (Mon to Fri, Sat and Sun rest).

## Just completed (this session, 2026-09-27)

R12 as above. Design decisions worth knowing: credit goes to the missed date everywhere (calendar, adherence, candidates), which means a make-up done on a training day leaves that day's own session undone and it becomes a candidate itself for 3 days; one make-up per tap, no double sessions; multiple open misses are all listed, most recent first, and the athlete picks; the rest-day card has no "completed today" line (the start button, which carries that state, only renders on training days).

## In progress / where it stopped

Nothing mid-flight.

## Next steps (priority order)

1. **Owner decision: backfill yesterday's make-up.** Row `f793ce6e` (session_date 2026-09-26, Friday template, completed) was made with the temporary override and has no stamp, so Friday 2026-09-25 still reads missed. One PATCH setting `performance.makeUpForDate = "2026-09-25"` (via the REST API with the service key, or the Supabase table editor) fixes it. Not done: owner's history, owner's call.
2. **Owner: gym verification** of the make-up flow on the phone (offer on a rest day and under a training day, header line, History credit) plus the 2026-09-17 items still pending gym confirmation (blank inputs, timer survives leaving, Unskip, swap panel, Undo, superset handoffs on Block 3).
3. **Next build block: the in-app program builder** (PLAN R10 deferred item). Needs a superset control too.
4. Optional: a "completed today" line on the rest-day card after a make-up (see Just completed).
5. Optional cosmetic: pre-existing dashes in a few in-workout strings (`lib/program/rest-guidance.ts`, `app/today/format-prescription.ts`, entry card range labels like "8-12").
6. Optional hygiene: delete stray active Saturday 2026-08-29 row `52b05e65`; repair 2026-08-26's null completed_at.

## Open decisions / blockers

- Adherence window is 28 days trailing; a make-up performed after the window's start for a missed date before it is credited to the missed date and therefore outside the window. Edge case, acceptable.
- Superset rest line is template-order based (see 2026-09-17 note); acceptable.
- `getAthleteContext()` calls `supabase.auth.getUser()` once per server action or page fetch. Fine at this scale.
- If `APP_PASSPHRASE` is ever removed from Vercel env, sign-up becomes open to anyone.
- Benchmarks and readiness may return later: tables and PRODUCT_SPEC sections retained; they would need `user_id` + an `own rows` policy.

## Where everything lives

| Path | What it is |
|---|---|
| `lib/workout-session/make-up-candidates.ts` · `scripts/test-make-up-candidates.ts` | Make-up window rule (`MAKE_UP_WINDOW_DAYS`, candidates, single-date validation) + tests (also cover effective-date grouping and `madeUpOn`) |
| `lib/history/session-filtering.ts` · `lib/history/day-classification.ts` · `lib/history/adherence.ts` | Effective-date grouping (`effectiveSessionDate`), day classification (`madeUpOn`), adherence (unchanged; counts by effective date) |
| `lib/history/active-since-date.ts` · `lib/date/format-date-label.ts` | Shared program-active-since approximation; timezone-safe date labels |
| `app/today/today-workout.tsx` · `today-workout-client.tsx` · `rest-day-card.tsx` · `make-up-offer.tsx` · `start-workout-button.tsx` | Today: recent-session fetch, candidate computation, rest-day buttons, training-day "Missed" card, "Made up X today" |
| `app/workout/active/page.tsx` · `active-workout-screen.tsx` · `completion-summary.tsx` | `?makeUpFor=` parsing, re-validation, session stamping, "Making up" lines |
| `app/history/actions.ts` · `calendar-day-cell.tsx` · `calendar-legend.tsx` · `[date]/session-detail.tsx` · `app/review/review-dashboard.tsx` | OR lookup by missed date, summary `makeUpForDate`, dashed made-up cell, legend, detail line, review grouping |
| `lib/program/parse-program-text.ts` · `lib/program/program-types.ts` | Paste parser (`superset:` clause), `PrescribedExercise.supersetGroup` |
| `lib/workout-session/superset-flow.ts` · `slot-time.ts` · `set-entry-fields.ts` | Superset handoff rule, per-slot time bookkeeping, per-exercise set input config |
| `PROGRAM_FORMAT.md` | Paste format; library block generated by `scripts/generate-program-format-library.ts` |
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
19. Catalog edits must keep `npx tsx scripts/test-exercise-catalog.ts` green, then rerun `npx tsx scripts/generate-program-format-library.ts`. Same regen after any change to `loggingFieldLabels` in `set-entry-fields.ts`.
20. End-to-end UI verification: `puppeteer-core` (present in older session scratchpads' `node_modules`, load it via `createRequire` on that path) + system Edge against `npx next start -p 3100`; port 3000 is often the `blurbs` dev server. Throwaway auth users via `POST /auth/v1/admin/users` with `email_confirm: true`; delete after. A fresh account's Today shows "No program loaded": seed a `training_programs` row with `parseProgramText(programs/block-3-five-day-gym-program.md)` output and a backdated `created_at`. `npx tsx --env-file=.env <scratchpad script>` run from the repo root resolves `@/` imports. Kill the server with `taskkill //PID <pid> //F //T` (find it via `netstat -ano | grep ":3100 "`).
21. Parallel agents with exclusive file ownership work well here; the orchestrator writes shared types/config/contracts FIRST (done that way for R12: types, grouping, classification, candidate module, tests, then Today/active and History/review agents in parallel).
22. Set inputs must never prefill from a previous session (owner, 2026-09-17). The "Last time" panel is the only place previous performance shows.
23. `ExerciseSlotLog.enteredAt` is only set while a slot is current; the transition effect in `active-workout-screen.tsx` (keyed on `currentSlotKey`) is the one place that opens/closes it.
24. Superset invariants the runtime assumes and the parser guarantees: members contiguous within one section, at least two members, never a qualitative member.
25. **(new)** Every per-date view must group sessions with `groupSessionsByDate` (effective date). Anything that builds its own date map from `sessionDate` will read made-up days as missed. `WorkoutSessionRecord` has no top-level `makeUpForDate`; pull it from `performance` before grouping (see review dashboard and `fetchSessionForDate`).
26. **(new)** `/workout/active` ignores `?makeUpFor=` whenever a resumable session exists (server row for today or local mirror). Headless checks of the fallback must run before starting a real session for the day.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ clean tree, the R12 commit at head and pushed, every table `0 without user_id`, URL returns 307 to `/sign-in`.
