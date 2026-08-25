# CLAUDE.md: hybrid-training-tracker

## What this project is

This is a personal athletic training web application built for one athlete: the owner. It is not a generic workout logger, not a bodybuilding tracker, and not (yet) a HYROX training app. It is a personal athlete operating system: a tool that tells the athlete what to do today, captures what he actually did, and uses that history to inform tomorrow's prescription.

The central philosophy governs every product and programming decision:

> Build muscle. Keep your speed. Become stronger relative to your bodyweight. Move well.

The primary experience is execution, not analysis. Opening the app in the gym should immediately show today's session and let the workout start with almost zero friction. Analytics, history, and review screens are secondary.

## Doc map

| Doc | Role |
|---|---|
| `PRODUCT_SPEC.md` | Source of truth for product behavior: screens, UX rules, non-negotiables. |
| `TRAINING_SYSTEM.md` | Source of truth for the training program and programming rules. Never casually alter the training prescription while implementing features. |
| `PLAN.md` | Phased build plan, top to bottom. |
| `HANDOFF.md` | Current session state. Read this first at the start of any session. |

## Repo structure

Current layout (docs only, no code yet):

```
hybrid-training-tracker/
  CLAUDE.md            governing doc (this file)
  PLAN.md              phased build plan
  PRODUCT_SPEC.md      product behavior source of truth
  TRAINING_SYSTEM.md   training program source of truth
  HANDOFF.md           current session state
  README.md            short repo pointer
  .gitignore
```

Code layout will be added here once the stack is chosen (Phase 0 of `PLAN.md`).

## Tech stack

The repo is empty of code. Stack is an open decision, not yet made.

Proposed default, per the owner's standing conventions, to confirm before scaffolding:

- Next.js + Tailwind v4, deployed on Vercel.
- Storage: either Supabase, or a local-first approach (SQLite/IndexedDB) with export support. Not yet decided.

This is an open decision. Confirm with the owner before scaffolding anything.

## Non-negotiables

1. Muscle gain is the primary adaptation goal right now.
2. Athleticism must be maintained and preferably improved, never sacrificed for size.
3. Ultimate practice (Mon/Wed/Thu) counts as significant athletic workload; the app must not assume more conditioning is always better.
4. Speed work requires quality and adequate recovery, not density.
5. Power work happens while relatively fresh, never chasing fatigue.
6. Strength-to-weight ratio (relative strength) matters, not just absolute load.
7. Calisthenics is a real training objective, not a side activity.
8. Abs are trained progressively like any other muscle group.
9. Mobility is integrated into training, not bolted on.
10. Pain is never treated as ordinary soreness.
11. Sunday is a true, complete rest day.
12. HYROX is a future phase only. Do not build HYROX-specific programming now.
13. Adherence over months matters more than any single perfect workout.
14. The app should reduce decision-making, not add to it.
15. The logging experience must never be harder than doing the workout.
16. There is one canonical seed program definition. Never hardcode a workout (e.g. Monday's session) directly into a page component; UI renders from program data.
17. Progression logic is transparent and deterministic. Never hide it behind an AI model. Always show the athlete why a recommendation was made.
18. No manufactured single "athleticism score." Show underlying metrics instead.
19. The software is not a medical diagnostic system. No diagnoses. Groin/pain symptoms get restrained messaging that recommends professional sports medicine or physical therapy assessment if they persist or interfere with sprinting or cutting; never an automatic rehab protocol.
20. Sunday always renders REST DAY. Never manufacture a workout for it.
21. A modified session is distinct from both completed and missed ("modify, don't fail").
22. Active workout state must survive a browser refresh or accidental close.
23. Deferred, do not build yet: AI analysis of training trends, automated program adjustments, a HYROX training phase, wearable integration, nutrition/body-composition integration, advanced fatigue modeling, video technique analysis.

## Domain model

Suggested, not final schema. Do not over-normalize prematurely if a simpler structure serves the current application.

| Entity | Fields |
|---|---|
| Exercise | id, name, category, primaryMuscles, secondaryMuscles, instructions, cues, commonMistakes, intendedFeeling, progressionType, substitutions |
| WorkoutTemplate | id, name, weekday, description, targetDuration, sections |
| WorkoutSection | id, name, order, type (warmup, speed, power, calisthenics, strength, core, mobility, recovery, cardio) |
| PrescribedExercise | exerciseId, sets, minReps, maxReps, duration, rest, notes, progressionRule, order |
| WorkoutSession | id, date, workoutTemplateId, startedAt, completedAt, status, duration, notes, readinessData |
| ExercisePerformance | workoutSessionId, exerciseId, sets, notes, substitution |
| SetPerformance | setNumber, weight, reps, rir, duration, distance, time, completed |
| AthleticBenchmark | benchmarkType, date, value, unit, notes |
| BodyMetric | date, bodyweight, optional measurements |
| ReadinessEntry | date, sleepHours, energy, soreness, groinStatus, readiness, notes |
| UltimateSession | date, type, duration, intensity, notes |

Notes:
- Not every exercise uses reps. Support repetitions, duration, distance, timed sprint, hold, and qualitative completion as prescription/performance types.
- WorkoutSession.status supports: planned, active, completed, modified, missed.

## UX principles

- Mobile-first active-workout screen: large touch targets, numeric keyboards for load/reps, previous-set autofill, sticky controls where useful. A set should take only a few seconds to log. No nested modals, no unnecessary confirmation dialogs.
- Desktop is for planning, historical analysis, charts, program overview, exercise library, and reviews. Keep visual consistency with mobile.
- Previous performance (weight x reps for each set) is always visible while lifting, so the athlete rarely needs to search history mid-session.
- Speed work UI frames quality and rest, not conditioning: full recovery between reps, every rep fast, no encouragement to minimize rest.
- Power work (jumps) never encourages chasing fatigue. Track reps, optional distance/height, and quality; stop or reduce volume when quality drops.
- Calisthenics uses progression-level UI: planche and L-sit progression chains, current level, best hold, next milestone. Do not auto-advance solely on a timer threshold; technique quality matters.
- Visual language is modern athletic performance software, credible enough for a collegiate athlete or performance staff, not a bodybuilding aesthetic: no flames, no badges, no streak gamification. Prefer adherence percent (e.g. "92% adherence") over streaks.
- Homepage has one job: get today's training started. Secondary info might include weekly schedule, latest athletic trend, current training phase. Everything else lives deeper in the app (dashboard restraint).

## Edge cases to account for

Workout completed after midnight; missed workout; unscheduled workout; substituted exercise; partial workout; duplicate workout; browser refresh during an active workout; changing weight units; missing previous performance; first-ever exercise exposure; deload/reduced-volume sessions; Ultimate practice cancellation; Sunday rest; manually edited historical data.

Do not let edge-case handling overwhelm the MVP.

## Code conventions

- TypeScript/React: Server Components by default, `"use client"` only when required.
- Tailwind only. Avoid new dependencies unless they clearly pay for their weight.
- Purpose-named files (what they do), no catch-alls like `helpers` or `utils`.
- Config over code: thresholds, program data, and parameters live in structured data, not magic numbers scattered through components.
- Data ownership: structure storage to support export, backup, and migration. Training history is valuable personal data; never lock it into opaque UI-only state.

## Secrets

Env vars only. `.env` is gitignored. Commit a `.env.example` template. Never hardcode a key to unblock something.

## Development workflow

Work incrementally. For each major feature:

1. Understand the relevant source-of-truth requirements (`PRODUCT_SPEC.md`, `TRAINING_SYSTEM.md`).
2. Inspect the existing implementation.
3. Propose the smallest coherent change.
4. Implement it.
5. Verify responsive behavior.
6. Test persistence and edge cases.
7. Avoid unrelated refactors.
8. Update documentation if architecture meaningfully changes.

When requirements are ambiguous, preserve the product principles rather than inventing complexity. The app must become genuinely usable after the active-workout phase (Phase 3 of `PLAN.md`), not only once every later phase is done.

## Definition of success

The athlete wakes up on a Tuesday morning, opens the app on his phone, and immediately sees "Speed + Lower A + Core." He walks into the gym, completes the entire prescribed session logging it with almost no friction, and leaves knowing the next session will automatically incorporate today's performance.

Over subsequent months it should be obvious from the app whether he is gaining muscle, getting stronger, getting faster, becoming more explosive, improving relative strength, progressing toward an L-sit and planche, training consistently, managing Ultimate workload, and maintaining healthy movement.

Never let tracking the workout become harder than doing the workout.
