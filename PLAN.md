# PLAN.md: hybrid-training-tracker

Phased build plan. Work top to bottom. Each phase should end in a working, manually verified state before moving to the next. See `CLAUDE.md` for non-negotiables and `PRODUCT_SPEC.md` / `TRAINING_SYSTEM.md` for source-of-truth requirements.

## Phase 0: Stack decision + scaffold

Confirm the tech stack with the owner before writing any code, then scaffold the app and its deploy pipeline.

- [ ] Confirm stack with owner (proposed default: Next.js + Tailwind v4 + Vercel; storage: Supabase vs local-first SQLite/IndexedDB with export).
- [ ] Scaffold the application skeleton.
- [ ] Add `.gitignore` covering node_modules, env files, build output, and data files.
- [ ] Set up the deploy pipeline (Vercel).

**Done when:** a hello-world version of the app deploys successfully.

## Phase 1: Program data model + canonical seed data

Turn the full weekly program in `TRAINING_SYSTEM.md` into structured seed data. One canonical program definition; UI renders from it, nothing is hardcoded into page components.

- [ ] Implement the domain model (or a simpler equivalent) from `CLAUDE.md`: Exercise, WorkoutTemplate, WorkoutSection, PrescribedExercise.
- [ ] Support all section types used in the program: warmup, speed, power, calisthenics, strength, core, mobility, recovery, cardio.
- [ ] Support all prescription types: repetitions, duration, distance, timed sprint, hold, qualitative completion.
- [ ] Encode the full week (Monday through Sunday, including Ultimate practice days and Sunday rest) as seed data.

**Done when:** the entire weekly program can be loaded and inspected as structured data, with no workout content duplicated in UI code.

## Phase 2: Today screen

- [ ] Detect current weekday.
- [ ] Load and render the corresponding workout: date, workout name, target duration, sections, exercises, sets/reps, relevant notes.
- [ ] Show an Ultimate practice indicator on Monday, Wednesday, Thursday.
- [ ] Sunday renders REST DAY, never a manufactured workout.

**Done when:** opening the app on any day of the week shows the correct session (or REST DAY on Sunday) sourced entirely from seed data.

## Phase 3: Active workout

- [ ] Start workout: persist start time, create a workout session, load prescriptions and previous performance for each exercise.
- [ ] Fast inline set logging: weight, reps, RIR per set.
- [ ] Add/remove a set.
- [ ] Skip or substitute an exercise.
- [ ] Continuous autosave so the session survives a browser refresh or accidental close.
- [ ] Completion summary: duration, exercises completed, sets completed, exercises progressed, with optional session difficulty and note.

**Done when:** the athlete can run and log a real session start to finish on a phone with near-zero friction, and a refresh mid-workout never loses data. The app is genuinely usable at this point, not just at the end of the plan.

## Phase 4: Progression engine

- [ ] Implement double progression as transparent, deterministic logic (no AI model).
- [ ] Recommendation considers prescribed rep range, actual reps, RIR, and whether all prescribed sets were completed.
- [ ] Never auto-increase load simply because a workout was completed; require the full rep-range/RIR condition.
- [ ] Show the athlete the stated reason behind every recommendation.

**Done when:** after logging a session, the next exposure to that exercise shows a load/rep suggestion with a visible reason, and repeated non-qualifying sessions do not trigger an increase.

## Phase 5: Modification system

- [ ] "Modify Workout" flow during an active session: reduce sets, skip exercise, substitute exercise, lower target load, convert to recovery session, stop early.
- [ ] Store modifications against the session.
- [ ] Modified status is distinct from both completed and missed ("modify, don't fail").

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
