# HANDOFF.md — Session Handoff (updated 2026-08-26 ~12:15 UTC, supersedes all earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables), then `PLAN.md` (the "Rework plan" section reflects current reality; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth; `TRAINING_SYSTEM.md` is programming rules/philosophy only (its weekly program was removed from the app); `PROGRAM_FORMAT.md` is the owner-facing paste format.

## Current state (as of 2026-08-26 ~12:15 UTC)

**The app is fully live and in real use.** R1-R8 rework complete, deployed at **https://hybrid-training-tracker.vercel.app** behind the passphrase gate. The owner's real program **"Athletic Muscle Base — Block 1"** was pasted and activated 2026-08-26 11:42 UTC (row `aea8db93-...` in `training_programs`, is_active=true, verified via REST: all 7 days parsed, 6 training days + Sunday rest). The program source is stored verbatim in the repo at `programs/block-1-athletic-muscle-base.md`.

- **Supabase** (ref `woawbkhcoegvwrsfgbix`, service-role only, RLS no-policies by design): full schema applied by owner 2026-08-26 and verified (all five tables). Rows as of ~12:15 UTC: `body_checkins` 1 (2026-08-25, 190.5 lbs + photo), `training_programs` 1 (active), `workout_sessions` 0, `athletic_benchmarks` 0, `readiness_entries` 0.
- **Multiple programs + switching is a supported feature**: every paste is kept in `training_programs`, exactly one active; the "Your programs" list on `/program` switches with one tap (relabeled from "Program history" 2026-08-26 at owner request). Sessions snapshot their template at start, so switching never corrupts history. Treat this as settled — do not rebuild.
- **Verification state:** `npm run build` green; `npx tsx scripts/validate-program.ts` passes; `scripts/test-progression.ts` 34/34; `scripts/test-resumable-session.ts` 18/18; owner's Block 1 file passes `scripts/validate-program-file.ts` with zero errors/warnings.

## Just completed (this session, 2026-08-26)

1. Schema applied by owner + verified; three previously missing tables now live.
2. Block 1 program stored in repo, validated, pasted and activated by the owner (commit `ceb02f9` + this one).
3. `/program` list relabeled as a program switcher ("Your programs" / "Switch to").
4. **Phantom "Resume workout" fix.** Root cause: opening `/workout/active` (including via "Try the sample workout") creates a session record in localStorage immediately; backing out left an 'active' record that held the Today button in "Resume" mode forever (the owner hit this — DB had 0 session rows, so it was purely the local mirror). Fix: new pure rules in `lib/workout-session/resumable-session.ts` — a session resumes only if active/modified AND (from today OR has logged work); sample sessions never count as the athlete's own workout. Today button uses `hasResumableLocalProgramSession()`; the active-screen init discards (clears) non-resumable or sample leftovers before starting fresh, and ignores `sample-` rows fetched from Supabase when starting a program workout. Anything with logged work always resumes, including across midnight (non-negotiable 22 preserved). Tests: `scripts/test-resumable-session.ts` (18 assertions). Self-healing on the owner's device: after this deploys, the stale record is ignored and then discarded on next workout start — no manual localStorage clearing needed.

Settled decisions from the rework (do not re-derive): parser is pure/deterministic with line-numbered errors; day template ids are bare weekday slugs; exercise id = slugified name matched to catalog by normalized name; Sunday coerced to rest with warning; sessions snapshot template+exercises at start; `recommendProgression` is the single progression entry point (most recent exposure only, increases require every set at top of range, 2+ sets at 0 RIR → hold, unlogged RIR is unknown); adherence = (completed+modified)/scheduled non-rest days over 28 days, samples and pre-program days excluded.

## In progress / where it stopped

Nothing mid-flight. Session closed cleanly with this handoff's commit.

## Next steps (priority order)

1. **Owner: first real session.** Run a workout on the phone end to end (Today → start → log → finish), then confirm history/adherence/review populate. Fix whatever real use surfaces.
2. Old Phase 5 (modification system: modify-don't-fail flows beyond skip) remains unbuilt by scope decision; `status: modified` is supported in types/queries everywhere, no UI produces it yet. Most likely next build phase.
3. Deferred list in CLAUDE.md non-negotiable 23 still stands (no AI analysis, no HYROX phase, etc.).

## Open decisions / blockers

- Multi-word target durations like "65-70 minutes" parse as the lower bound only (65). Cosmetic; owner has not objected.
- Substitution beyond program-defined "or" pairs: deliberately not built (program defines valid alternatives).
- Block 1 program title contains an em dash ("Athletic Muscle Base — Block 1") — owner-authored text, stored verbatim; the NO DASHES rule applies to copy drafted in the owner's voice, not to the owner's own words.

## Where everything lives

| Path | What it is |
|---|---|
| `programs/` | Owner's real programs in paste format, verbatim (`block-1-athletic-muscle-base.md`) |
| `lib/program/` | Types, parser, resolved-program helpers, sample program, exercise catalog (58, 47 with guidance), rest guidance, progression chains |
| `lib/workout-session/` | Session types (jsonb shape incl. snapshots), slot flattening, factory, completion stats, localStorage mirror, resumable-session rules |
| `lib/progression/` | Deterministic progression engine + strip formatting |
| `lib/history/` · `lib/benchmarks/` | Calendar/adherence (pure); benchmark definitions (config) + formatting |
| `app/page.tsx` + `app/today/` | Home: check-in prompt, Today card, readiness strip, Start/Resume button |
| `app/workout/` | Active workout (immersive, no site header) + session server actions |
| `app/program/` | Paste, preview, "Your programs" switcher + program server actions |
| `app/history/` · `app/progress/` · `app/exercises/` · `app/readiness/` · `app/review/` | Feature routes, each with its own actions.ts following the same typed-result degrade pattern |
| `app/site-header.tsx` | Shared nav (8 destinations; More disclosure on mobile) |
| `app/body/` · `app/unlock/` · `proxy.ts` · `lib/auth/` · `lib/supabase/` · `lib/date/` | Unchanged roles from earlier phases |
| `supabase/schema.sql` | Idempotent schema, fully applied 2026-08-26 |
| `scripts/validate-program.ts` | Validates the built-in sample program (card-type coverage) |
| `scripts/validate-program-file.ts` | Parses ANY program file through the real parser; run before pasting a new program |
| `scripts/test-progression.ts` | 34 pre-registered progression assertions |
| `scripts/test-resumable-session.ts` | 18 assertions for resume-vs-discard rules |
| `PROGRAM_FORMAT.md` | Owner-facing paste format with full example week |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16, revised).
2. Sunday always rest; parser coerces pasted Sunday workouts to rest with a warning (non-negotiables 11/20). Any weekday can be rest — never hardcode "Sunday" in rest-day copy.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap, real failure 2026-08-25).
4. **(revised 2026-08-26)** `clearLocalSession()` now has exactly three call sites: (a) after a server save guarded by `result.ok`, and (b)/(c) the active-screen init discarding a NON-RESUMABLE leftover (sample session, or untouched previous-day session — see `resumable-session.ts`). Never add a clear site that can drop a session with logged work whose server save hasn't succeeded.
5. Next 16: `proxy.ts` not `middleware.ts`; new routes are gated automatically.
6. Vercel MCP plugin unreliable for this team — use the CLI. `vercel env add ... preview` loops; workaround: REST API with the CLI token.
7. No `ANTHROPIC_API_KEY` in any env (root CLAUDE.md rule).
8. RLS has no policies BY DESIGN (service-role only) on ALL tables. Don't add anon policies.
9. Owner's NO DASHES rule applies to user-facing UI strings and owner-facing docs. Code comments exempt. Owner-authored program text is stored verbatim, dashes included.
10. Coaching/guidance text lives ONLY in `lib/program/exercise-catalog.ts` fields — never hardcoded in components.
11. Session template ids must stay bare weekday slugs across parser changes, or previous-performance/history lookups silently break.
12. `next dev` auto-appends a `nextjs-agent-rules` block to CLAUDE.md; commit it, don't fight it. (Its build/dev flip-flop of `next-env.d.ts` import paths is churn — leave uncommitted.)
13. Sample sessions (`workout_template_id` prefix `sample-`) must stay excluded from adherence, history states, reviews, AND the Today Resume state / program-workout resume (2026-08-26 fix).
14. React StrictMode in `next dev` can double-fire the active-workout init effect and create two session rows locally; does not happen in production builds. Clean up any dev-created rows.
15. Scratchpad tsx scripts can't resolve the project's `node_modules` — put runnable checks in `scripts/`, or use dependency-free `fetch` against Supabase REST with `npx tsx --env-file=.env` from the repo root. Never read/print `.env` itself.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\test-progression.ts"
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\test-resumable-session.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ clean tree, 34 passed, 18 passed, URL returns 307 (gate working). In-app: unlock → Today shows the current Block 1 day (or REST DAY) with "Start workout" unless a real session is genuinely in flight.
