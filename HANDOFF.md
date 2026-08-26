# HANDOFF.md — Session Handoff (updated 2026-08-26 ~15:25 UTC, supersedes all earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables), then `PLAN.md` (the "Rework plan" section reflects current reality; older phases are historical). `PRODUCT_SPEC.md` is the product source of truth; `TRAINING_SYSTEM.md` is programming rules/philosophy only (its weekly program was removed from the app); `PROGRAM_FORMAT.md` is the owner-facing paste format.

## Current state (as of 2026-08-26 ~15:10 UTC)

**The app is live and in real use.** Deployed at **https://hybrid-training-tracker.vercel.app** behind the passphrase gate. The owner ran his first real workout 2026-08-26 (Wednesday Pull day of "Athletic Muscle Base — Block 1"), hit a save-loss bug at Finish, reported four findings, and all four were fixed this session. Commit `fd21d22` is pushed and **its production deploy is confirmed complete** (Vercel commit status on GitHub: success, ~15:20 UTC).

- **Supabase** (ref `woawbkhcoegvwrsfgbix`, service-role only, RLS no-policies by design). Rows as of ~14:55 UTC: `body_checkins` 2, `training_programs` 1 (active, Block 1), `workout_sessions` 1 (the owner's 2026-08-26 Pull session, **repaired to status completed**: 9 exercises, 24 sets, 8,460 lb tonnage; completed_at/duration_seconds left null because the true finish time is unknown — UI handles null duration), `athletic_benchmarks` 0, `readiness_entries` 0.
- **Verification state:** `npm run build` green; `npx eslint app lib scripts` 0 errors; `scripts/test-progression.ts` 34/34; `scripts/test-resumable-session.ts` 18/18; `scripts/test-save-queue.ts` 16/16.

## Just completed (this session, 2026-08-26 afternoon)

**Incident root cause (SETTLED — do not re-litigate): the 2026-08-26 lost "Finish workout".** The DB row proved every debounced autosave landed (all sets, note, difficulty) but status stayed 'active'. Cause: `handleFinish` never cancelled the pending 2.5s debounce timer, and the debounce closure captured its record at schedule time — so a stale pre-finish autosave landed AFTER the finish save and reverted the row to 'active', while the client (finish save returned ok) had already cleared the localStorage mirror. Neither side then knew the workout finished.

Fixes shipped in `fd21d22`:

1. **Serialized save queue** (`lib/workout-session/save-queue.ts`): every save (autosave, visibility flush, initial, Finish, retry) funnels through one queue per mount — at most one upsert in flight, latest-wins coalescing, saves never reordered. Debounce now reads `sessionRef.current` at fire time; `handleFinish` cancels the pending debounce first. 16 pre-registered assertions in `scripts/test-save-queue.ts`.
2. **Pending-sync stash** (`lib/workout-session/pending-sync-store.ts`, key `htt-pending-sync-sessions`): a finished-but-unsynced session is stashed before the single-slot mirror gets overwritten by a new session, and retried on later active-screen mounts. A finished workout can no longer be lost.
3. **Honest save-state UI**: completion screen now shows Finish workout / Saving / Saved to your history / a failure panel with "Retry save" (old code showed "Saved" even on failure).
4. **Home "Completed today" panel** (`app/today/start-workout-button.tsx` + new `fetchLatestSessionSummaryForDate` action): once today's session is completed, Home shows Completed today + duration + View session instead of prompting Start. Server confirmation is preferred over local signals; local mirror/pending-stash fall back to "Saved on this device, sync pending."
5. **Edit a previous set** (owner item 2): committed sets render as tappable rows in the entry card; tapping opens an inline `EditSetForm` (own state, never clobbers the current-set draft), Save rewrites that set without advancing.
6. **Draft persistence** (owner item 3, the "changed weight didn't stick" bug): uncommitted input values persist as `ExerciseSlotLog.draft` on every change; leaving an exercise or refreshing no longer loses typed values. Draft clears only when the current new set is committed, not on edits of earlier sets.
7. **Per-exercise timer** (owner item 1): small tertiary timer next to the session timer, resets on slot change, deliberately not persisted.
8. **Data repair**: `scripts/mark-session-completed.ts` (generic tool, computes stats via the real `computeCompletionStats`) run against row `bffbde24-...` — now status completed with stats. Also added ops tools `scripts/check-db-state.ts` (row counts) and `scripts/inspect-session-row.ts` (one row's performance blob).

Settled decisions from the rework (do not re-derive): parser is pure/deterministic with line-numbered errors; day template ids are bare weekday slugs; exercise id = slugified name matched to catalog by normalized name; Sunday coerced to rest with warning; sessions snapshot template+exercises at start; `recommendProgression` is the single progression entry point; adherence = (completed+modified)/scheduled non-rest days over 28 days, samples and pre-program days excluded; multiple programs + one-tap switching on `/program` is a finished feature.

## In progress / where it stopped

Nothing mid-flight. Session closed cleanly with this handoff's commit.

## Next steps (priority order)

1. **Owner: next real session** end to end on the phone — confirm finish saves, Saved state shows, Home flips to Completed today, and the three new interactions (exercise timer, set editing, draft weights) feel right. Home should already show "Completed today" for 2026-08-26 (repaired row).
2. Old Phase 5 (modification system: modify-don't-fail flows beyond skip) remains unbuilt by scope decision; `status: modified` is supported everywhere in types/queries, no UI produces it yet. Most likely next build phase.
3. Deferred list in CLAUDE.md non-negotiable 23 still stands (no AI analysis, no HYROX phase, etc.).

## Open decisions / blockers

- The repaired 2026-08-26 session has null completed_at/duration_seconds (true finish time unknown). Owner may set real values by hand in Supabase if he remembers; UI is fine either way.
- Multi-word target durations like "65-70 minutes" parse as the lower bound only (65). Cosmetic; owner has not objected.
- Substitution beyond program-defined "or" pairs: deliberately not built (program defines valid alternatives).
- Block 1 program title contains an em dash — owner-authored text, stored verbatim; the NO DASHES rule applies to copy drafted in the owner's voice, not the owner's own words.

## Where everything lives

| Path | What it is |
|---|---|
| `programs/` | Owner's real programs in paste format, verbatim (`block-1-athletic-muscle-base.md`) |
| `lib/program/` | Types, parser, resolved-program helpers, sample program, exercise catalog (58, 47 with guidance), rest guidance, progression chains |
| `lib/workout-session/` | Session types (incl. `draft`), slot flattening, factory, completion stats, localStorage mirror, resumable-session rules, **save-queue.ts**, **pending-sync-store.ts** |
| `lib/progression/` | Deterministic progression engine + strip formatting |
| `lib/history/` · `lib/benchmarks/` | Calendar/adherence (pure); benchmark definitions (config) + formatting |
| `app/page.tsx` + `app/today/` | Home: check-in prompt, Today card, readiness strip, Start/Resume/Completed-today button |
| `app/workout/` | Active workout (immersive) + session server actions; `active/exercise-timer.tsx`; `active/exercise-entry-card.tsx` holds EditSetForm |
| `app/program/` | Paste, preview, "Your programs" switcher + program server actions |
| `app/history/` · `app/progress/` · `app/exercises/` · `app/readiness/` · `app/review/` | Feature routes, each with its own actions.ts following the same typed-result degrade pattern |
| `app/site-header.tsx` | Shared nav (8 destinations; More disclosure on mobile) |
| `app/body/` · `app/unlock/` · `proxy.ts` · `lib/auth/` · `lib/supabase/` · `lib/date/` | Unchanged roles from earlier phases |
| `supabase/schema.sql` | Idempotent schema, fully applied 2026-08-26 |
| `scripts/validate-program.ts` · `validate-program-file.ts` | Sample-program validation; parse ANY program file before pasting |
| `scripts/test-progression.ts` · `test-resumable-session.ts` · `test-save-queue.ts` | 34 + 18 + 16 pre-registered assertions |
| `scripts/check-db-state.ts` · `inspect-session-row.ts` · `mark-session-completed.ts` | Ops tools: row counts, one row's performance blob, repair a stuck row |
| `PROGRAM_FORMAT.md` | Owner-facing paste format with full example week |

## Operational landmines

1. UI renders from the ACTIVE PASTED PROGRAM (or sample) only — never hardcode workout content (non-negotiable 16, revised).
2. Sunday always rest; parser coerces pasted Sunday workouts to rest with a warning (non-negotiables 11/20). Any weekday can be rest — never hardcode "Sunday" in rest-day copy.
3. Progress photos: private bucket, signed URLs only; `SUPABASE_SERVICE_ROLE_KEY` server-only. Photo bytes never through server actions (~4.5 MB cap, real failure 2026-08-25).
4. **(revised 2026-08-26 save-queue rework)** ALL session saves must go through the mount's `createSessionSaveQueue` instance — never call `saveWorkoutSession` directly for the active session (pending-sync retries of OTHER session ids are the one exception). Never capture a session record in a delayed closure; read `sessionRef.current` at fire time. `clearLocalSession()` call sites: after a queue-confirmed ok save at Finish/retry, and the active-screen init discarding a NON-RESUMABLE leftover. Never add a clear site that can drop a session with logged work whose server save hasn't succeeded.
5. Next 16: `proxy.ts` not `middleware.ts`; new routes are gated automatically.
6. Vercel MCP plugin unreliable for this team (env add loops; list_deployments 403s and get_project 404s even with the correct ids from .vercel/project.json, re-verified 2026-08-26). CLI not installed; no stored CLI token on this machine. **Reliable deploy verification:** `gh api repos/timasgudziunas/hybrid-training-tracker/commits/<sha>/status` — the Vercel GitHub integration posts success/failure there, immediately and authoritatively. Watching `/unlock` asset fingerprints works as a positive signal (fd21d22's change showed up ~6 min after push) but is slow and a no-change result proves nothing; prefer the gh status.
7. No `ANTHROPIC_API_KEY` in any env (root CLAUDE.md rule).
8. RLS has no policies BY DESIGN (service-role only) on ALL tables. Don't add anon policies.
9. Owner's NO DASHES rule applies to user-facing UI strings and owner-facing docs. Code comments exempt. Owner-authored program text is stored verbatim, dashes included.
10. Coaching/guidance text lives ONLY in `lib/program/exercise-catalog.ts` fields — never hardcoded in components.
11. Session template ids must stay bare weekday slugs across parser changes, or previous-performance/history lookups silently break.
12. `next dev` auto-appends a `nextjs-agent-rules` block to CLAUDE.md; commit it, don't fight it. (Its build/dev flip-flop of `next-env.d.ts` import paths is churn — leave uncommitted.)
13. Sample sessions (`workout_template_id` prefix `sample-`) must stay excluded from adherence, history states, reviews, the Today Resume state, AND the Completed-today panel (`fetchLatestSessionSummaryForDate` filters them).
14. React StrictMode in `next dev` can double-fire the active-workout init effect and create two session rows locally; does not happen in production builds. Clean up any dev-created rows.
15. Scratchpad tsx scripts can't resolve the project's `node_modules` — put runnable checks in `scripts/`, or use dependency-free `fetch` against Supabase REST with `npx tsx --env-file=.env` from the repo root. Never read/print `.env` itself. New `scripts/` files without imports need a trailing `export {}` or their top-level consts collide under the build's whole-program typecheck.
16. This repo's ESLint runs React Compiler-era rules (`react-hooks/refs`, `react-hooks/purity`, `react-hooks/set-state-in-effect`): no ref reads or `Date.now()` during render, setState in effects nested inside an inner function (see the timer effect in active-workout-screen.tsx for the pattern).

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\test-save-queue.ts"
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ clean tree with `fd21d22`+ at head, 16 passed, workout_sessions shows the 2026-08-26 row as completed, URL returns 307 (gate working). In-app: unlock → Home shows "Completed today" for a finished day, or the current Block 1 day with "Start workout".
