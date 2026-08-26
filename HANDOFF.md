# HANDOFF.md — Session Handoff (updated 2026-08-26 ~05:30 UTC, supersedes all earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables), then `PLAN.md` (the "Rework plan" section reflects current reality; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth; `TRAINING_SYSTEM.md` is programming rules/philosophy only (its weekly program was removed from the app); `PROGRAM_FORMAT.md` is the owner-facing paste format.

## Current state (as of 2026-08-26 ~05:30 UTC)

**The full rework (R1-R8) is complete and pushed.** Live at **https://hybrid-training-tracker.vercel.app** behind the passphrase gate. The app is program-agnostic: no seeded workout content; the owner pastes a program at `/program` (format in `PROGRAM_FORMAT.md`), and every screen renders from the active pasted program. Until a program is pasted, Today shows a waiting state plus "Try the sample workout" (sample always opens its showcase day, `sample-` prefixed ids, excluded from adherence/history stats).

Screens, all on the R2 design system (Big Shoulders + IBM Plex Sans, surface/line/ink/accent tokens in `app/globals.css`): Today (home, one job: start today), active workout (linear card flow, timer, choice cards, Help me feel it, progression suggestion strip with Why + Use chips, autosave, completion stats), `/program` (paste/preview/history), `/body`, `/readiness`, `/history` (calendar + adherence + drill-down), `/progress` (benchmarks + trends + athleticism vs bodyweight), `/exercises` (library), `/review` (weekly/monthly). Nav: mobile Today/History/Progress + More disclosure; desktop all inline; no header on `/workout/active` or `/unlock`.

- **Supabase** (ref `woawbkhcoegvwrsfgbix`, service-role only, RLS no-policies by design): full schema applied by owner 2026-08-26 and verified via REST (all five tables present: `body_checkins` 1 real row 2026-08-25 190.5 lbs + photo; `workout_sessions`, `training_programs`, `athletic_benchmarks`, `readiness_entries` all 0 rows). Program saving, readiness, and benchmarks are unblocked.
- **Verification state:** `npm run build` + lint green; `npx tsx scripts/validate-program.ts` (parses/validates sample program + prescription-type coverage) and `npx tsx scripts/test-progression.ts` (34/34 pre-registered) both pass; every route driven headlessly at 390x844, zero page errors, all DB test rows cleaned (workout_sessions at 0).

## Just completed (this session, in commit order)

R1 program pivot → R2 design system → R3 progression (engine + card UI) → R7 readiness → R6 library → R5 dashboards → R4 history → R8 integration/nav/reviews. Built by parallel Sonnet subagents in directory-scoped lanes, orchestrator-QA'd (bugs caught pre-ship: sample-workout dead-end on rest days; R2 agent's first R8 attempt emitted its tool call as text and was restarted). Settled decisions, do not re-derive:

- **Program pivot:** parser (`lib/program/parse-program-text.ts`) is pure/deterministic with line-numbered errors; day template ids are bare weekday slugs for history stability; exercise id = slugified name, matched to the catalog by normalized name for guidance; Sunday coerced to rest with a warning (non-negotiables 11/20); sessions snapshot template+exercises into the performance blob at start (mid-week re-paste can never corrupt an in-flight/historical session).
- **Progression:** `recommendProgression` in `lib/progression/recommend-progression.ts` is the single entry point; only the most recent exposure drives the rules; increases require every prescribed set at the top of the range; 2+ sets at 0 RIR → hold; unlogged RIR is unknown, not zero; suggestions never auto-apply (explicit Use chip).
- **Adherence:** (completed + modified) / scheduled non-rest program days, last 28 days, sample sessions and pre-program days excluded, future never counted.
- **Reviews:** conservative, windows labeled, "not enough data yet" states, no correlation-as-causation, no composite scores (non-negotiable 18).

## In progress / where it stopped

Nothing mid-flight. R8 closed with this handoff's commit.

## Next steps (priority order)

1. ~~Schema paste~~ DONE 2026-08-26, verified.
2. **Owner: paste Block 1** at `/program`. The real program ("Athletic Muscle Base — Block 1") is stored verbatim at `programs/block-1-athletic-muscle-base.md` and validated 2026-08-26 via `npx tsx scripts/validate-program-file.ts programs/block-1-athletic-muscle-base.md` (zero errors, zero warnings, 51/70 exercise slots matched catalog guidance). Copy the file's contents into the paste screen. Deliberately NOT pre-inserted into the DB so the owner's first paste doubles as the end-to-end verification of the paste flow.
3. After that: verify end-to-end on the phone (paste → Today shows the day → run a real session → history/adherence/review populate) and fix whatever real use surfaces.
4. Deferred list in CLAUDE.md non-negotiable 23 still stands (no AI analysis, no HYROX phase, etc.).

## Open decisions / blockers

- Old Phase 5 (modification system: modify-don't-fail flows beyond skip) was NOT part of the rework scope decision and remains unbuilt; `status: modified` is supported in types/queries everywhere, no UI produces it yet.
- Substitution beyond program-defined "or" pairs: deliberately not built (program defines valid alternatives).
- Multiple programs + switching: already supported natively (every paste is kept in `training_programs`; the "Your programs" list on `/program` switches the active one with one tap; relabeled from "Program history" 2026-08-26 at owner request). Sessions snapshot their template at start, so switching never corrupts history.
- Multi-word target durations like "65-70 minutes" parse as the lower bound only (65). Cosmetic; fine unless the owner objects.

## Where everything lives

| Path | What it is |
|---|---|
| `lib/program/` | Types, parser, resolved-program helpers, sample program, exercise catalog (58, 47 with guidance), rest guidance, progression chains |
| `lib/workout-session/` | Session types (jsonb shape incl. template/exercises snapshots), slot flattening, factory, completion stats, localStorage mirror |
| `lib/progression/` | Deterministic progression engine + strip formatting; tests in `scripts/test-progression.ts` |
| `lib/history/` | Calendar grid, day classification, adherence (pure) |
| `lib/benchmarks/` | Benchmark definitions (config), formatting |
| `app/page.tsx` + `app/today/` | Home: check-in prompt, Today card / waiting state, readiness strip, Start/Resume |
| `app/workout/` | Active workout (immersive, no site header) + session server actions |
| `app/program/` | Paste, preview, history, activate + program server actions |
| `app/history/` · `app/progress/` · `app/exercises/` · `app/readiness/` · `app/review/` | Feature routes, each with its own actions.ts following the same typed-result degrade pattern |
| `app/site-header.tsx` | Shared nav (8 destinations; More disclosure on mobile) |
| `app/body/` · `app/unlock/` · `proxy.ts` · `lib/auth/` · `lib/supabase/` · `lib/date/` | Unchanged roles from earlier phases |
| `supabase/schema.sql` | Idempotent schema: body_checkins, workout_sessions, training_programs, athletic_benchmarks, readiness_entries |
| `PROGRAM_FORMAT.md` | Owner-facing paste format with full example week |
| `programs/` | Owner's real programs in paste format, verbatim (`block-1-athletic-muscle-base.md`) |
| `scripts/validate-program-file.ts` | Parses any program file through the real parser; use before pasting a new program |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16, revised).
2. Sunday always rest; parser coerces pasted Sunday workouts to rest with a warning (non-negotiables 11/20). Any weekday can be rest now — never hardcode "Sunday" in rest-day copy.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap, real failure 2026-08-25).
4. Never clear the localStorage session mirror unless the server save succeeded — `clearLocalSession()` has exactly one call site, guarded by `result.ok`.
5. Next 16: `proxy.ts` not `middleware.ts`; new routes are gated automatically.
6. Vercel MCP plugin unreliable for this team — use the CLI. `vercel env add ... preview` loops; workaround: REST API with the CLI token.
7. No `ANTHROPIC_API_KEY` in any env (root CLAUDE.md rule).
8. RLS has no policies BY DESIGN (service-role only) on ALL tables. Don't add anon policies.
9. Owner's NO DASHES rule applies to user-facing UI strings and owner-facing docs (PROGRAM_FORMAT.md). Code comments exempt.
10. Coaching/guidance text lives ONLY in `lib/program/exercise-catalog.ts` fields — never hardcoded in components.
11. Session template ids must stay bare weekday slugs across parser changes, or previous-performance/history lookups silently break.
12. `next dev` auto-appends a `nextjs-agent-rules` block to CLAUDE.md; commit it, don't fight it.
13. Sample sessions (`workout_template_id` prefix `sample-`) must stay excluded from adherence, history states, and reviews.
14. React StrictMode in `next dev` can double-fire the active-workout init effect and create two session rows locally; does not happen in production builds. Clean up any dev-created rows.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\validate-program.ts"
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\test-progression.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ latest commit is "R8 complete...", clean tree, VALIDATION PASSED, 34 passed, URL returns 307 (gate working). In-app: unlock → home shows the check-in prompt, waiting-for-program card, readiness strip; "Try the sample workout" opens a runnable session.
