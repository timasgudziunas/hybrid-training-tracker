# HANDOFF.md — Session Handoff (updated 2026-08-26 ~01:30 UTC, supersedes all earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, domain model, non-negotiables), then `PLAN.md` (build order). `PRODUCT_SPEC.md` and `TRAINING_SYSTEM.md` are the product and program sources of truth; consult them per feature, don't read them wholesale.

## Current state (as of 2026-08-26 ~01:30 UTC)

**Phases 0, 0.5, 1, 2, and 3 complete** (Phase 3 code-complete and verified; its DB table is NOT yet applied — see Open decisions). Live at **https://hybrid-training-tracker.vercel.app** behind a passphrase gate. Deployed features: Today screen home page (workout from seed data, Ultimate badge, Sunday REST DAY) with a Start/Resume Workout button; full active-workout flow at `/workout/active` (linear slide-like card flow per PRODUCT_SPEC §6 "Linear execution flow" — session timer, last-time per-set display, weight prefill, RIR quick-select, choice cards for program "or" pairs, "Help me feel it" activation guidance, overview jump list, skip/add/remove set, completion summary with tonnage/sprint-distance/hold-time stats); daily body check-in with history + trend chart. Phase 1 data layer in `lib/program/` (7 day templates, 58-exercise catalog now including authored activation content for 47 exercises, rest guidance, progression chains).

- **Stack (settled, do not re-litigate):** Next.js 16.3.3 + Tailwind v4 (CSS-first) on Vercel; Supabase for data + private photo storage. Both owner-confirmed 2026-08-25.
- **Access gate:** single passphrase, no accounts. Env `APP_PASSPHRASE`; HMAC cookie verified by `proxy.ts` (Next 16 middleware convention) on every route except `/unlock` + static assets. Rotating the passphrase logs out all devices.
- **Supabase:** project ref `woawbkhcoegvwrsfgbix`. Table `body_checkins` (`supabase/schema.sql`), RLS on with NO policies on purpose (service-role only, verified). Private bucket `progress-photos`. Photos upload browser→Supabase via signed upload URLs; 30-min signed read URLs for display.
- **Vercel:** project `hybrid-training-tracker` (id `prj_fSTZkzjGFxGIm1CGjIU4AatxjuCU`, team `team_i8cG3o7fGYsBvbJWyyJ3AhKb`), auto-deploy on push to main (verified). All env vars in all three environments.
- **Local:** `.env` (gitignored) holds the three Supabase keys + `APP_PASSPHRASE`. `npm run build` + `npm run lint` green at this commit; `npx tsx scripts/validate-program.ts` prints VALIDATION PASSED.

## Just completed (this session)

Phase 3: active workout. Two Sonnet subagents in parallel (one built the flow, one authored the "Help me feel it" catalog content), then orchestrator QA found and fixed three real bugs before ship: (1) **finishing a workout while unsynced cleared localStorage — total data loss when the DB table is missing**; now the local record is kept unless the server save succeeds, and the next `/workout/active` visit retries syncing a leftover completed session; (2) completion-screen duration was frozen at page mount (showed ~0 min in the normal case); now computed when the completion screen appears, exact stored value after Finish — verified with a fabricated 45-min-old session rendering "45 min"; (3) completion stats dropped sets logged before a skip; now all logged sets count. Architecture decisions to treat as standing: dual-write persistence (synchronous localStorage mirror `htt-active-workout-session` + 2.5s-debounced full-row upsert + visibilitychange/pagehide flush); resume prefers localStorage over Supabase (local is always at least as fresh on-device); server actions in `app/workout/actions.ts` NEVER throw — typed `{ok:false, reason}` failures so a missing table degrades to local-only with a "Not synced" badge; the linear flow remounts the card via a React key on `${slotKey}:${chosenExerciseId}:${setsLogged}` so slide-in animation and fresh prefilled inputs come free (no reset effects); previous performance is keyed by the exercise actually performed (choice-aware). Headless-verified end-to-end (Edge, 390x844): start → qualitative → sprints → holds with prefill → strength with weight carry-forward → mid-session reload resumed exactly → skip → completion stats → Finish with failed sync kept the local record.

Phase 2 (same session): Today screen. Home page (`app/page.tsx`) now shows the daily check-in prompt + `app/today/today-workout.tsx`. Weekday detection is device-local in a client boundary using `useSyncExternalStore` (server snapshot is `null` → skeleton; client snapshot is the real weekday; avoids hydration mismatch and the `react-hooks/set-state-in-effect` lint error). No Start button and no week strip on purpose: PRODUCT_SPEC §5's Today screen has neither, and a Start button would be a dead control until Phase 3. Verified headlessly (Playwright + system Edge, mobile viewport, minted session cookie): real Tuesday renders the full correct session, forced-Sunday (stubbed `getDay`) renders REST DAY. Two QA fixes applied after the subagent build: qualitative descriptions no longer render in a `whitespace-nowrap` span (was a horizontal-overflow bug on phones), and an exercise whose name equals its section name (Dynamic Warm-Up) no longer prints twice. Note: `next dev` auto-appends a `nextjs-agent-rules` block to CLAUDE.md — it's vendor tooling, committed to keep the tree clean; it re-creates itself if removed.

Phase 1 (same session): program data model + canonical seed data. Built by a Sonnet subagent, QA'd file-by-file against `TRAINING_SYSTEM.md` (verdict: faithful, nothing altered in the prescription). Settled modeling decisions — treat these as standing, don't re-derive:

- `Prescription` is a discriminated union: `repetitions` / `duration` / `distance` (sprints, `timed: true`) / `hold` / `qualitative` (warm-ups, mobility flows, Zone 2, L-sit practice). String-literal unions everywhere, no enums (survives Node type stripping).
- Rest is a category (`heavy-compound`/`moderate-compound`/`isolation`/`sprint`/`jump`/`calisthenics-skill`) mapped once to §13 guidance text in `rest-guidance.ts`, never hardcoded seconds.
- "Or" choices (Face Pull or Reverse Cable Fly, etc.) = primary `exerciseId` + `alternativeExerciseIds`. Per-side work = `perSide: true`.
- Sunday is a `RestDayTemplate` with NO sections field at all — structurally cannot carry a workout.
- Planche progression chain intentionally has one level (Planche Lean): `TRAINING_SYSTEM.md` names no further levels; do not invent tuck/straddle/full stages until the doc does. L-sit chain has the four named levels.
- "Standing Calf Raise" (Tue) vs "Calf Raise" (Thu/Fri) kept as two catalog entries because the source names them differently; Tuesday/Friday "Hanging Knee/Leg Raise" share id `hanging-knee-raise`.
- Exercise instructional fields (cues, mistakes, etc.) exist on the type but are intentionally empty — Phase 8 content.

## In progress / where it stopped

Nothing mid-flight. Phase 1 closed with the phase-boundary commit (this handoff's commit).

## Next steps (priority order)

1. **Owner action: apply `supabase/schema.sql` in the Supabase SQL editor** (idempotent, safe to paste whole). Until then workouts persist only in the phone's localStorage: no cross-device sync, no last-week numbers next session, and a finished-but-unsynced workout survives locally only until something clears browser data.
2. After the owner applies it: verify end-to-end sync (finish a session → row in `workout_sessions`, "Not synced" badge gone, next session shows LAST TIME numbers).
3. Phase 4 (`PLAN.md`): progression engine — transparent, deterministic double progression with visible reasons (non-negotiable 17).

## Open decisions / blockers

- **`workout_sessions` table not yet applied** (owner-only step, see Next steps 1). All Phase 3 code degrades gracefully until then — this is expected, not a bug. PGRST205 errors in Vercel logs are this.
- Substitution beyond program-defined "or" pairs was deliberately not built (the program defines valid alternatives); revisit in Phase 5's modification flow.

## Where everything lives

| Path | What it is |
|---|---|
| `CLAUDE.md` / `PLAN.md` / `PRODUCT_SPEC.md` / `TRAINING_SYSTEM.md` | Governing docs (unchanged roles) |
| `lib/program/program-types.ts` | All program/domain types (Prescription union, WorkoutTemplate, Exercise, ...) |
| `lib/program/exercise-catalog.ts` | 58-exercise catalog, each exercise defined once |
| `lib/program/days/*.ts` | One WorkoutTemplate per weekday (7 files, Sunday = rest) |
| `lib/program/weekly-program.ts` | `WEEKLY_PROGRAM` record + `getWorkoutForWeekday()` — the canonical program entry point |
| `lib/program/rest-guidance.ts` | §13 rest table as data, keyed by RestCategory |
| `lib/program/progression-chains.ts` | L-sit + planche progression chains |
| `scripts/validate-program.ts` | Rerunnable integrity check + human-readable program printout (`npx tsx scripts/validate-program.ts`) |
| `proxy.ts` | Access gate (Next 16 — NOT `middleware.ts`) |
| `lib/auth/passphrase-cookie.ts` | HMAC cookie sign/verify (Web Crypto, Edge-safe) |
| `lib/supabase/server-client.ts` | Server-only service-role Supabase client |
| `lib/date/local-date-string.ts` | Device-local YYYY-MM-DD (check-in dates are device-local, never server UTC) |
| `app/page.tsx` + `app/today/` | Today screen: client weekday boundary, workout/rest cards, prescription formatting, Start/Resume button |
| `app/workout/actions.ts` | Server actions: session upsert, active-session lookup, previous performance (never throw; typed failures) |
| `app/workout/active/` | Active workout UI: orchestrator screen, timer, slot/entry/choice cards, guidance disclosure, overview, completion summary |
| `lib/workout-session/` | Session types (= `performance` jsonb shape), slot flattening, session factory, completion stats, localStorage mirror |
| `lib/date/weekday-from-date.ts` | Device-local weekday from a Date (same principle as local-date-string) |
| `app/unlock/` · `app/daily-checkin-prompt.tsx` · `app/body/` | Unlock flow, new-day prompt, body check-in pages |
| `supabase/schema.sql` | Idempotent DB schema (owner applies in Supabase SQL editor) |

## Operational landmines

1. Never hardcode a workout into a page component; UI renders from `WEEKLY_PROGRAM` only (non-negotiable 16). The seed data now exists — Phase 2 must import it, not copy it.
2. Sunday always renders REST DAY (non-negotiable 20). `RestDayTemplate` has no sections; narrow on `restDay` before touching `sections`.
3. Progress photos: private bucket only, signed URLs only. `SUPABASE_SERVICE_ROLE_KEY` is server-only — never `NEXT_PUBLIC_`, never in client components.
4. Photo bytes never go through server actions / Vercel functions (~4.5 MB payload cap; real failure 2026-08-25). Always signed-URL direct upload.
5. Next 16 uses `proxy.ts` with exported `proxy()` — a `middleware.ts` won't be picked up the same way. New routes are gated automatically; a public route needs an explicit matcher exclusion.
6. Vercel MCP plugin is unreliable for this team (stale project list, ghost-project 409s) — use the Vercel CLI. `vercel env add <name> preview` loops on `git_branch_required`; workaround: REST API `POST /v10/projects/{id}/env` with the CLI token from `AppData/Roaming/xdg.data/com.vercel.cli/auth.json`.
7. No `ANTHROPIC_API_KEY` in any env for personal automations (root CLAUDE.md standing rule).
8. `body_checkins` RLS has no policies BY DESIGN (service-role only). Don't "fix" it by adding anon policies.
9. Never casually alter the training prescription while implementing features — `TRAINING_SYSTEM.md` is the source; the seed data was verified against it 2026-08-25 and `scripts/validate-program.ts` re-checks integrity after any edit.
10. Never clear the localStorage session mirror unless the server save just succeeded — it can be the only copy of a workout (real bug caught pre-ship 2026-08-25). `clearLocalSession()` is called in exactly one place, guarded by `result.ok`.
11. Owner's NO DASHES rule applies to user-facing UI strings (em/en dashes and hyphens-as-punctuation banned; rewrite instead). Code comments are exempt.
12. Workout content copy in the app comes from seed data / the catalog; the "Help me feel it" content lives ONLY in `lib/program/exercise-catalog.ts` (intendedFeeling/cues/commonMistakes) — never hardcode coaching text in components.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\validate-program.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ latest commit is "Phase 1 complete...", clean tree, validator ends with VALIDATION PASSED, URL returns 307 (redirect to /unlock — gate working).
