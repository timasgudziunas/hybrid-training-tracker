# HANDOFF.md — Session Handoff (updated 2026-11-07 ~21:15 UTC, supersedes all 2026-11-06 and earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, non-negotiables), then `PLAN.md` (R12 Make-up sessions is the newest completed block). `PRODUCT_SPEC.md` is the product source of truth; `TRAINING_SYSTEM.md` is programming rules/philosophy only; `PROGRAM_FORMAT.md` is the owner-facing paste format; `PROGRAM_BRIEF.md` is the one file the owner pastes to an LLM to get a new block written.

## Current state (as of 2026-11-07 ~21:15 UTC)

**Head is `15cfd87` "Installable iOS home-screen web app" (owner decision 2026-11-07: option 1, Safari Add to Home Screen, over bookmarks, Shortcuts, Web Clip profiles, or a sideloaded native wrapper), pushed.** Its Vercel production build FAILED at 20:46 UTC with the landmine-31 signature (`errorCode ENOENT`, "npm run build exited with 1", 12 s; deployment `dpl_A4oXr3x8oJUA42t28FndbhfMm3dW`). The same tree builds green locally (`next build`, foreground) and `next start -p 3100` served `/manifest.webmanifest` 200 `application/manifest+json`, `/icon` and `/apple-icon` 200 `image/png`, and the apple web app meta tags on `/sign-in` with no session cookie. The landmine-31 retry push (`cd433bb`, handoff refresh) built READY and **production verified live at 21:12 UTC**: manifest 200 `application/manifest+json`, `/icon` and `/apple-icon` 200 `image/png`, apple web app meta tags present on `/sign-in`. The phone install (Next steps 2) has not been done yet.

- **Active program is Block 4 `ff5e6593` "Three-Day Strength, Calisthenics and Mobility"** (Mon, Tue, Thu; Wed, Fri, Sat, Sun rest), file `programs/block-4-three-day-athletic-strength-and-skills.md`, activated 2026-11-06, PATCHed in place after two renames. All 34 slots have catalog guidance. Block 3 `045c959d` deactivated, kept as history. The program's description carries a deload week (Dec 7 to 13, halve sets) and a race week (skip lower-body lifting) that the app does not enforce.
- **Verification state (this tree):** `npx tsc --noEmit` clean; `npx eslint app lib scripts proxy.ts` clean; `next build` green (foreground, see landmine 27). Test suites and headless drive were not rerun for `15cfd87` (no logic touched: metadata, CSS padding, matcher exclusions, two generated-image routes). The 2026-11-06 feedback batch (`c212be8`) remains verified on production 23/23.

## Just completed (this session, 2026-11-07)

iOS home-screen web app support, no new dependencies, Sonnet subagent implemented, orchestrator verified against `next start`:

1. `app/manifest.ts`: name, short_name "Training", `start_url: "/"`, `display: "standalone"`, background and theme `#0a0a0a`, icon `/icon` 512.
2. `app/icon.tsx` (512) and `app/apple-icon.tsx` (180): `ImageResponse` from `next/og`, accent `#2e5fdb` square with "HT" in `#f8faff`, no rounded corners (iOS masks its own).
3. `app/layout.tsx`: `metadata.appleWebApp` (capable, title "Training", status bar `black`) and `export const viewport` (device-width, `viewportFit: "cover"`, theme color).
4. `app/globals.css`: `body { padding-bottom: env(safe-area-inset-bottom) }` for the home indicator.
5. `proxy.ts` matcher exempts `manifest.webmanifest`, `icon`, `apple-icon` so iOS can fetch them at install time without a session.

## In progress / where it stopped

Nothing mid-flight. Owner's phone install is the next action.

## Next steps (priority order)

1. **Confirm production serves the new build**: `curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app/manifest.webmanifest` must be 200 (307 means still the old build or another failed deploy; follow landmine 31). Deploy status: `gh api repos/timasgudziunas/hybrid-training-tracker/commits/<sha>/status`.
2. **Owner, on the iPhone (Safari only, Chrome will not install standalone):** open https://hybrid-training-tracker.vercel.app, tap Share, "Add to Home Screen", keep the name "Training", tap Add. Open the new icon, sign in once (the installed app has its own cookie jar, separate from Safari). It should open full screen with a black status bar and no browser bars. If the icon is the old favicon or it opens inside Safari, the install happened against the old build: delete the icon and redo after step 1 is 200.
3. **Owner: gym verification** of the 2026-11-06 batch on the phone on the next Block 4 day, now inside the installed app, plus the still-unconfirmed 2026-09-17 and 2026-09-27 items (blank inputs, timer survives leaving, Unskip, swap panel, Undo, superset handoffs, make-up flow). "Timer survives leaving" matters more in standalone mode, where returning to the app can reload the page.
4. Optional hygiene from the 2026-09-27 list: backfill row `f793ce6e` with `performance.makeUpForDate = "2026-09-25"`; delete stray active row `52b05e65`; rows `a871f121` (Nov 4) and `7970ac5a` (Oct 30) are still `active` (unfinished Block 3 sessions; harmless).
5. Next build block: the in-app program builder (PLAN R10 deferred item), needs a superset control.
6. Optional: a pasted reduced variant for the Dec 7 to 13 deload and race week; optional cosmetic dashes in `lib/program/rest-guidance.ts`, `app/today/format-prescription.ts`, entry card range labels.
7. Later, if wanted: web push for a "today's session" reminder now that the site installs as a web app (iOS 16.4+), no native code needed.

## Open decisions / blockers

- Adherence window is 28 days trailing; a make-up performed after the window's start for a missed date before it is credited outside the window. Edge case, acceptable.
- Superset rest line is template-order based; acceptable.
- `getAthleteContext()` calls `supabase.auth.getUser()` once per server action or page fetch. Fine at this scale.
- If `APP_PASSPHRASE` is ever removed from Vercel env, sign-up becomes open to anyone.
- Benchmarks and readiness may return later: tables and PRODUCT_SPEC sections retained; they would need `user_id` + an `own rows` policy.
- The notes log fetch has no row limit; about 150 rows a year of `performance` jsonb per workout start. Revisit with a limit or a dedicated notes table if it ever feels slow.

## Where everything lives

| Path | What it is |
|---|---|
| `app/manifest.ts` · `app/icon.tsx` · `app/apple-icon.tsx` · `app/layout.tsx` (`appleWebApp`, `viewport`) · `proxy.ts` matcher | iOS/Android installable web app (2026-11-07): manifest, generated 512 and 180 icons, standalone meta, public manifest/icon routes |
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
32. **(new 2026-11-07)** `manifest.webmanifest`, `icon`, `apple-icon` are public routes by design (matcher exclusions); any new route starting with `icon` is also public. Vercel MCP `list_deployments` returns 403 when `teamId` is passed and works without it; `get_deployment` works either way. Icons are generated by `next/og` at build time (static routes), so an icon change needs a redeploy, and iOS caches the home-screen icon at install time (reinstall to see a new one).

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
npx tsx --env-file=.env "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker\scripts\check-db-state.ts"
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app/manifest.webmanifest
```
Healthy ≈ clean tree, head pushed, every table `0 without user_id`, root URL returns 307 to `/sign-in`, manifest URL returns 200 (the installable build is live).
