# PLAN.md: hybrid-training-tracker

Phased build plan. Work top to bottom. Each phase should end in a working, manually verified state before moving to the next. See `CLAUDE.md` for non-negotiables and `PRODUCT_SPEC.md` / `TRAINING_SYSTEM.md` for source-of-truth requirements.

## Phase 0: Stack decision + scaffold

Confirm the tech stack with the owner before writing any code, then scaffold the app and its deploy pipeline.

- [x] Confirm stack with owner. Storage is decided: Supabase, confirmed 2026-08-25 (see `CLAUDE.md` Tech stack). Web framework confirmed 2026-08-25: Next.js + Tailwind v4 + Vercel.
- [x] Create the Supabase project (database + private storage bucket for progress photos). Project `woawbkhcoegvwrsfgbix` created by owner; private `progress-photos` bucket created and verified `public: false`. Keys in local `.env` (gitignored) and in Vercel env (all three keys, Production/Preview/Development).
- [x] Scaffold the application skeleton. Next.js 16.3.3, TypeScript, App Router, Tailwind v4 CSS-first; local `npm run build` green.
- [x] Add `.gitignore` covering node_modules, env files, build output, and data files.
- [x] Set up the deploy pipeline (Vercel). Project linked to GitHub repo, auto-deploys on push to main.

**Done when:** a hello-world version of the app deploys successfully.

## Phase 0.5: Daily body check-in (weight + photo)

Owner-requested 2026-08-25. Independent of the program/workout engine, so it ships immediately after Phase 0. Behavior spec: `PRODUCT_SPEC.md` section 10, "Daily body check-in".

- [x] Supabase schema for body check-ins (date, bodyweight in lbs, photo reference) plus a private storage bucket for photos. `supabase/schema.sql` (RLS on, no policies, service-role only); applied by owner 2026-08-25.
- [x] New-day detection: on the first open of a new calendar day, prompt for current weight (lbs) and an optional photo from the camera roll. At most once per day, dismissible in one tap, never blocks reaching today's workout. Device-local date; dismissal in localStorage.
- [x] Late entry: a skipped check-in can be filled in later that day from the body tracking area. Card shows on `/body` only when today is unlogged; any history row is editable inline.
- [x] History view: browsable timeline of dated weights and photos (tap photo to enlarge), plus a weight trend chart (this becomes the data source for Phase 7's bodyweight trend).

Also shipped in this phase: passphrase access gate (owner decision 2026-08-25 — env `APP_PASSPHRASE`, HMAC cookie, `proxy.ts`) since the deployed app is public and photos are private; photos upload browser→Supabase via signed upload URLs because Vercel's ~4.5 MB function payload cap rejects photo bytes routed through a server action (hit in testing).

**Done when:** opening the deployed app on a new day prompts once, a weight + photo entry saves to Supabase from the phone, and past entries with photos are browsable on both phone and desktop.

## Phase 1: Program data model + canonical seed data

Turn the full weekly program in `TRAINING_SYSTEM.md` into structured seed data. One canonical program definition; UI renders from it, nothing is hardcoded into page components.

- [x] Implement the domain model (or a simpler equivalent) from `CLAUDE.md`: Exercise, WorkoutTemplate, WorkoutSection, PrescribedExercise. `lib/program/program-types.ts`; string-literal unions, no enums.
- [x] Support all section types used in the program: warmup, speed, power, calisthenics, strength, core, mobility, recovery, cardio.
- [x] Support all prescription types: repetitions, duration, distance, timed sprint, hold, qualitative completion. Discriminated `Prescription` union; sprints are `distance` with `timed: true`; per-side work flagged `perSide`.
- [x] Encode the full week (Monday through Sunday, including Ultimate practice days and Sunday rest) as seed data. `lib/program/days/*` + `weekly-program.ts`; 58-exercise catalog; rest guidance (§13) and L-sit/planche progression chains as data. Verified by `npx tsx scripts/validate-program.ts` (referential integrity + full printout eyeballed against `TRAINING_SYSTEM.md`).

**Done when:** the entire weekly program can be loaded and inspected as structured data, with no workout content duplicated in UI code.

## Phase 2: Today screen

- [x] Detect current weekday. Device-local via `lib/date/weekday-from-date.ts` in a client boundary (server never guesses a day; skeleton until hydration).
- [x] Load and render the corresponding workout: date, workout name, target duration, sections, exercises, sets/reps, relevant notes. Home page renders `app/today/*` entirely from `WEEKLY_PROGRAM` (non-negotiable 16).
- [x] Show an Ultimate practice indicator on Monday, Wednesday, Thursday. Driven by the template's `ultimatePracticeLater` flag, not a weekday list.
- [x] Sunday renders REST DAY, never a manufactured workout. `RestDayTemplate` has no sections; verified visually via forced-Sunday headless browser screenshot 2026-08-25.

**Done when:** opening the app on any day of the week shows the correct session (or REST DAY on Sunday) sourced entirely from seed data.

## Phase 3: Active workout

Owner vision recorded 2026-08-25 (see `PRODUCT_SPEC.md` §6 "Linear execution flow"): slide-like linear card flow, visible session timer, weight defaults to last week's, 1-of-2 choice cards for program-defined alternatives, fun completion stats.

- [ ] Supabase schema for workout sessions *(code shipped in `supabase/schema.sql`; blocked on owner pasting it into the Supabase SQL editor — app runs on localStorage-only until then)*.
- [x] Start workout: persist start time, create a workout session, load prescriptions and previous performance for each exercise. Visible running session timer.
- [x] Linear card flow: focused current-exercise card (last week's sets, prescribed range, today's weight defaulting to last week's), reps in, next set ready on tap, smooth slide-like transitions; overview jump list one tap away.
- [x] Choice cards where the program defines "or" alternatives: pick 1 of 2 in the moment.
- [x] "Help me feel it" on each exercise card: inline-expand activation guidance (intended feeling, cues, common mistakes) from the exercise catalog; content authored for 47 resistance/hold exercises (sprints/jumps/warm-ups intentionally excluded).
- [x] Fast inline set logging: weight, reps, RIR per set.
- [x] Add/remove a set.
- [x] Skip an exercise. *(Substitution beyond program-defined "or" pairs was resolved in Phase 5: catalog substitution, owner-approved 2026-08-26.)*
- [x] Continuous autosave so the session survives a browser refresh or accidental close. Dual-write: synchronous localStorage mirror + debounced Supabase upsert; verified by mid-session reload in a headless browser 2026-08-25.
- [x] Completion summary: duration, exercises completed, sets completed, with optional session difficulty and note, plus fun stats (total tonnage, sprint distance, hold time).

**Done when:** the athlete can run and log a real session start to finish on a phone with near-zero friction, and a refresh mid-workout never loses data. The app is genuinely usable at this point, not just at the end of the plan.

## Rework plan (owner pivot, 2026-08-25)

Owner decisions: (1) the seeded TRAINING_SYSTEM.md program is deleted from the app; a built-in sample workout demonstrates every card type instead, and the Today screen shows a waiting-for-program state; (2) programs enter the app through an in-app paste feature with a defined text format; (3) everything else in the app gets built now (the feature content of old Phases 4-10, restructured below); (4) full visual rework: elevated dark performance design, premium feel, pleasant daily use. Specific exercises/rep ranges arrive later in an owner-provided document.

- [x] **R1. Program pivot:** paste screen with defined text format (`PROGRAM_FORMAT.md`), deterministic parser with preview + clear errors, programs stored in `training_programs` (active + history), Today and active workout read the active program, sample program showcasing every card type (always starts its showcase day), seeded day files deleted, catalog retained as guidance knowledge base matched by normalized name, sessions snapshot their template at start so re-pastes never corrupt in-flight sessions.
- [x] **R2. Design system + restyle:** elevated dark performance system (tokens in `globals.css`, Big Shoulders display numerals + IBM Plex Sans, surface/line/ink/accent palette, refined motion), applied across every screen.
- [x] **R3. Progression engine:** deterministic double progression (`lib/progression/`, 34-assertion pre-registered test suite) surfaced on workout cards with a Why disclosure and explicit Use chips, never auto-applied.
- [x] **R4. History:** month calendar with day states, drill-down rendered from session snapshots, 28-day adherence percent; sample sessions excluded.
- [x] **R5. Benchmarks + progress dashboards:** 9 benchmark definitions as config, quick-log, SVG trends, planche level track, athleticism vs bodyweight with causation caveat, no composite score.
- [x] **R6. Exercise library:** index + per-exercise pages merging the 58-entry catalog with active-program exercises.
- [x] **R7. Readiness:** few-seconds check-in (sleep, energy, soreness, groin 0-5, readiness) with restrained groin messaging per non-negotiable 19.
- [x] **R8. Reviews + integration polish:** weekly/monthly reviews (conservative, windows labeled, honest empty states), app-wide nav (3 primary + More on mobile, all inline desktop), home readiness strip, integrated build + full-route headless drive green.

**Done when:** every screen exists, looks and feels premium, and the only missing ingredient is the owner's real program paste.

## R9. First real week of use: mechanics rework (owner feedback, 2026-09-04)

Owner ran Block 1 for a week (2026-08-26 to 2026-09-02) and listed what got in the way. All settled and shipped 2026-09-04; design summary in `PRODUCT_SPEC.md` §6 "Set editing, navigation, and cardio blocks".

- [x] Cardio blocks get a resistance field, an explicit Start, a running clock, Stop, then time / avg watts / avg speed / distance entry; readouts show as Last time on the next exposure. `lib/workout-session/cardio-slot.ts` + `app/workout/active/cardio-entry-card.tsx`.
- [x] Remove set removes the CURRENT unlogged set (target shrinks); any logged set can be deleted from its edit form. Pure reducers in `lib/workout-session/slot-set-edits.ts`.
- [x] Next skips exercises already completed or skipped; after the last exercise with anything left, the overview opens (Finish workout available there) instead of the completion screen. `nextUnfinishedSlotKey` in `flatten-template-slots.ts`.
- [x] Session timer freezes at Finish; primary button after save is Back to Today.
- [x] Per-exercise set inputs as config (`lib/program/set-entry-fields.ts`): box jump logs box height, broad jump logs distance, power work has no weight/RIR.
- [x] Last time is per exercise across all past sessions, not only the same weekday template.
- [x] Unfinished session from a previous day is auto-closed as Modified ("Left unfinished") instead of resuming the next day (`RESUME_ACROSS_MIDNIGHT_HOURS` window for late sessions).
- [x] Swap picker lists exercises targeting the same primary muscles first (`lib/program/rank-substitutes.ts`).
- [x] Program can be deactivated from the program page ("Stop using this program"); Block 1 deactivated 2026-09-04 at the owner's request.

**Done when:** verified headlessly end to end on the sample workout (34 checks) and by the owner in the gym on the next real session.

> The phases below predate the rework. Their FEATURE checklists remain the requirements source for R3-R8 above; their ordering and the assumption of a code-seeded program are superseded.

## Phase 4: Progression engine

- [ ] Implement double progression as transparent, deterministic logic (no AI model).
- [ ] Recommendation considers prescribed rep range, actual reps, RIR, and whether all prescribed sets were completed.
- [ ] Never auto-increase load simply because a workout was completed; require the full rep-range/RIR condition.
- [ ] Show the athlete the stated reason behind every recommendation.

**Done when:** after logging a session, the next exposure to that exercise shows a load/rep suggestion with a visible reason, and repeated non-qualifying sessions do not trigger an increase.

## Phase 5: Modification system

- [x] "Modify Workout" flow during an active session: reduce sets (fewer than prescribed, detected automatically), skip exercise, substitute exercise (catalog swap, not just program "or" pairs, owner decision 2026-08-26), lower target load (Going lighter toggle), convert to recovery session, stop early (End workout early, with an optional reason).
- [x] Store modifications against the session. Explicit inputs (`performance.modifications`) plus the slot logs; deviations are derived on demand by `detectSessionDeviations`, never stored themselves, so wording can change without a migration.
- [x] Modified status is distinct from both completed and missed ("modify, don't fail"). `modified` is assigned deterministically at Finish by `resolveFinishStatus`: any detected deviation means modified, otherwise completed. It is a terminal status, same as completed, never chosen mid-workout and never resumable.

**Done when:** a session can be modified mid-workout in any of the above ways and is correctly recorded as "modified" rather than completed or missed.

## Phase 6: History

- [ ] Calendar view showing completed, modified, Ultimate practice, rest, and missed days.
- [ ] Day drill-down shows the full historical workout record.
- [ ] Adherence percentage calculation and display, preferred over streak-centric gamification.

**Done when:** any past day can be inspected from the calendar and an adherence percentage is shown.

## Phase 7: Athletic benchmarks + progress dashboards

- [ ] Benchmark tracking: 10 m sprint, 20 m sprint, 30 m sprint, standing broad jump, vertical jump, strict pull-ups, strict dips.
- [ ] Calisthenics progression tracking: L-sit progression, planche progression.
- [ ] Bodyweight trend over time.
- [ ] Athleticism-vs-bodyweight view (e.g. bodyweight change alongside sprint/jump/pull-up/dip trends).
- [ ] No composite "athleticism score." Show the underlying metrics only.

**Done when:** all listed benchmarks can be recorded and viewed as trends, and bodyweight can be viewed alongside them.

## Phase 8: Exercise library

- [ ] Per-exercise pages: purpose, target muscles, setup, execution, technique cues, common mistakes, intended feeling, progression method, substitutions.
- [ ] Exercise names throughout the workout UI link to their library entries without disrupting an active workout.

**Done when:** every seeded exercise has a library entry and is linkable from the workout UI.

## Phase 9: Readiness

- [ ] Optional quick morning check-in: sleep hours, energy (1-5), soreness (1-5), groin status (0-5), overall readiness (green/yellow/red).
- [ ] Restrained messaging when groin symptoms are elevated or worsening: recommend professional sports medicine or physical therapy assessment, never a diagnosis or automatic rehab protocol.

**Done when:** the check-in can be completed in a few seconds and elevated groin symptoms trigger the restrained messaging.

## Phase 10: Reviews + polish

- [ ] Weekly summary per `PRODUCT_SPEC.md`: sessions completed, Ultimate practices, exercise progression, speed/power exposures, recovery, groin trend.
- [ ] Monthly summary: adherence, strength trends, bodyweight, athletic benchmarks, calisthenics, recovery.
- [ ] Keep interpretations conservative; never present correlation as causation.
- [ ] Final UX polish pass across mobile and desktop.

**Done when:** weekly and monthly reviews render from real logged data and the app has had a final polish pass.
