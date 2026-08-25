# Claude Code Implementation Brief — Athlete Training System

You are helping build a personal athletic training application.

Before implementing major functionality, read the accompanying project documents:

1. `PRODUCT_SPEC.md`
2. `TRAINING_SYSTEM.md`

Treat these documents as the source of truth for product behavior and training philosophy.

Do not casually alter the training prescription while implementing product features.

---

# Objective

Build a polished, mobile-first web application that makes executing and tracking the prescribed training program extremely easy.

The application should feel like a **personal athlete operating system**, not a generic workout tracker.

The central philosophy is:

> **Build muscle. Keep your speed. Become stronger relative to your bodyweight. Move well.**

---

# First Development Principle

Do not attempt to build every feature simultaneously.

Start with the smallest version that is genuinely useful every morning.

The MVP loop is:

**Open app**
→ **See today's workout**
→ **Start workout**
→ **See previous performance**
→ **Log sets quickly**
→ **Complete workout**
→ **Persist results**
→ **Use results to inform next workout**

Everything else builds around this loop.

---

# Before Coding

Inspect the existing repository.

Determine:

- framework
- routing structure
- styling system
- database/storage setup
- authentication setup
- existing components
- dependencies
- deployment assumptions

Do not replace functioning architecture merely because you prefer another stack.

If the repository is essentially empty, propose a simple architecture appropriate for a personal web application before implementing it.

Favor maintainability and simplicity.

Avoid unnecessary infrastructure.

---

# Suggested Domain Model

The exact schema may change based on the existing stack, but the application should conceptually support:

## Exercise

Fields such as:

- id
- name
- category
- primaryMuscles
- secondaryMuscles
- instructions
- cues
- commonMistakes
- intendedFeeling
- progressionType
- substitutions

## WorkoutTemplate

- id
- name
- weekday
- description
- targetDuration
- sections

## WorkoutSection

- id
- name
- order
- type

Potential types:

- warmup
- speed
- power
- calisthenics
- strength
- core
- mobility
- recovery
- cardio

## PrescribedExercise

- exerciseId
- sets
- minReps
- maxReps
- duration
- rest
- notes
- progressionRule
- order

Not every exercise uses reps.

Support:

- repetitions
- duration
- distance
- timed sprint
- hold
- qualitative completion

## WorkoutSession

- id
- date
- workoutTemplateId
- startedAt
- completedAt
- status
- duration
- notes
- readinessData

Status should support:

- planned
- active
- completed
- modified
- missed

## ExercisePerformance

- workoutSessionId
- exerciseId
- sets
- notes
- substitution

## SetPerformance

Potential fields:

- setNumber
- weight
- reps
- rir
- duration
- distance
- time
- completed

## AthleticBenchmark

- benchmarkType
- date
- value
- unit
- notes

## BodyMetric

- date
- bodyweight
- optional measurements

## ReadinessEntry

- date
- sleepHours
- energy
- soreness
- groinStatus
- readiness
- notes

## UltimateSession

- date
- type
- duration
- intensity
- notes

Do not over-normalize prematurely if a simpler schema serves the current application.

---

# Seed Data

The prescribed training program in `TRAINING_SYSTEM.md` should become structured seed data rather than being duplicated throughout UI components.

There should be one canonical program definition.

UI should render from program data.

Avoid hardcoding Monday's workout directly into a page component.

---

# MVP — Phase 1

Build this first.

## Today

Determine current weekday.

Load corresponding workout.

Display:

- date
- workout name
- target duration
- sections
- exercises
- sets/reps
- relevant notes
- Ultimate practice indicator where appropriate

Sunday should clearly display:

# REST DAY

Do not manufacture a workout for Sunday.

---

# MVP — Active Workout

Create a focused workout mode.

When started:

- persist start time
- create workout session
- load prescriptions
- load previous exercise performance

For each strength exercise show:

### Exercise

Target:

**3 × 6–10**

Previous:

**70 × 10 / 70 × 9 / 70 × 8**

Suggested:

**70**

Provide inline set inputs.

Example:

| Set | Weight | Reps | RIR |
|---|---:|---:|---:|
| 1 | input | input | input |
| 2 | input | input | input |
| 3 | input | input | input |

On mobile this does not need to literally render as a table.

Optimize for touch interaction.

Allow previous values to be copied quickly.

Persist changes immediately.

---

# MVP — Workout Completion

When finishing:

Show a concise summary:

**Workout complete**

Duration  
Exercises completed  
Sets completed  
Exercises progressed

Allow optional:

- session difficulty
- note

Then save.

---

# Progression Logic

Implement progression as transparent deterministic logic.

Do not hide progression behind an AI model.

For a double-progression exercise:

If all prescribed sets reach the top of the rep range with acceptable RIR and technique, suggest a modest load increase next session.

Otherwise generally preserve the load and attempt additional quality repetitions.

Do not automatically increase load following every successful workout.

Show the athlete **why** a recommendation was made.

Example:

> You reached 10 reps on all three sets last session with 1–2 RIR. Increase the load slightly.

Or:

> Stay at 70 lb and aim to add 1–2 total repetitions.

Recommendations are suggestions, not mandatory commands.

---

# Phase 2 — History

Build a calendar/history view.

Represent:

- completed workouts
- modified workouts
- Ultimate practices
- rest days
- missed workouts

Selecting a date should show the complete historical workout.

Calculate adherence.

Prefer:

**92% adherence**

over streak-centric gamification.

---

# Phase 3 — Progress

Create dashboards for:

## Strength

Exercise-specific progression.

## Athleticism

Track:

- 10 m sprint
- 20 m sprint
- 30 m sprint
- broad jump
- vertical jump
- strict pull-ups
- strict dips

## Calisthenics

Track:

- L-sit progression
- planche progression

## Bodyweight

Show trend over time.

Allow athletic metrics to be viewed alongside bodyweight.

Do NOT manufacture a single arbitrary "athleticism score."

The underlying metrics are more meaningful.

---

# Phase 4 — Exercise Library

Build exercise pages containing:

- purpose
- target muscles
- setup
- execution
- technique cues
- common mistakes
- what the athlete may feel
- progression
- substitutions

Make exercise names throughout the workout UI link to their library entries without disrupting an active workout.

---

# Phase 5 — Readiness

Add an optional quick morning check-in.

Inputs:

**Sleep**  
numeric hours

**Energy**  
1–5

**Soreness**  
1–5

**Groin**  
0–5

**Readiness**  
Green / Yellow / Red

Keep this interaction extremely quick.

Do not generate fake scientific recovery precision.

---

# Phase 6 — Reviews

Create weekly and monthly summaries.

Weekly:

- planned/completed sessions
- Ultimate practices
- exercise progression
- speed/power exposures
- recovery
- groin trend

Monthly:

- adherence
- strength trends
- bodyweight
- athletic benchmarks
- calisthenics
- recovery

Keep interpretations conservative.

Do not present correlation as causation.

---

# Modification System

A critical workflow is:

# MODIFY, DON'T FAIL

During a workout allow:

**Modify Workout**

Potential actions:

- reduce sets
- skip exercise
- substitute exercise
- lower target load
- convert to recovery session
- stop session early

Store the modifications.

A modified session is distinct from both completed-as-planned and missed.

---

# Pain / Groin UX

The software is not a medical diagnostic system.

If the athlete records meaningful or increasing groin pain, display restrained messaging.

Example:

> Your groin symptoms have been elevated recently. Consider reducing provocative work and getting assessed by a sports medicine professional or physical therapist if symptoms persist or interfere with sprinting/cutting.

Do not provide diagnoses.

Do not automatically prescribe rehabilitation protocols based on symptom entries.

---

# Speed UX

Speed work should be represented differently from weightlifting.

Example:

## 20 m Acceleration

**3 reps**

Rep 1  
Time: optional  
Completed: yes

Rep 2  
Time: optional  
Completed: yes

Rep 3  
Time: optional  
Completed: yes

Include:

> Full recovery. Every rep should be fast. This is speed work, not conditioning.

The app should not encourage minimizing rest during sprint work.

---

# Power UX

For jumps, record:

- repetitions
- optional distance/height
- quality

Do not encourage chasing fatigue.

---

# Calisthenics UX

Calisthenics needs progression-oriented interfaces.

Example:

# Planche

Current progression:

**Planche Lean**

Best hold:

**22 seconds**

Next milestone:

**30 seconds with strong position**

Progression visualization:

Planche Lean  
→ Pseudo-Planche Push-Up  
→ Tuck Planche  
→ Advanced Tuck  
→ Straddle  
→ Full Planche

Do not automatically advance solely because a timer threshold was reached.

Technique quality matters.

---

# Mobile UX Requirements

The active workout experience should be designed for approximately phone-sized screens first.

Prioritize:

- large touch targets
- minimal typing
- numeric input modes
- sticky workout controls where useful
- rapid set completion
- previous-set autofill
- obvious current exercise
- strong information hierarchy
- persistent state

Avoid:

- dense desktop tables squeezed onto phones
- tiny controls
- nested modal flows
- excessive animation
- unnecessary confirmation dialogs

A set should take only a few seconds to log.

---

# Desktop UX

Desktop should emphasize:

- planning
- historical analysis
- charts
- program overview
- exercise library
- reviews

Maintain visual consistency with mobile.

---

# Visual Language

Aim for:

**modern athletic performance software**

rather than:

**bodybuilding app**

Use:

- strong typography
- whitespace
- clear hierarchy
- restrained visual accents
- useful charts
- compact data presentation

Avoid stereotypical fitness aesthetics.

The product should feel credible enough that it could be used by a collegiate athlete/performance staff while remaining personal and approachable.

---

# Dashboard Restraint

Do not put every metric on the homepage.

The homepage has one primary job:

> **Get today's training started.**

Secondary information might include:

- weekly schedule
- latest athletic trend
- current training phase

Everything else belongs deeper in the application.

---

# Error / Edge Cases

Account for:

- workout completed after midnight
- missed workout
- unscheduled workout
- substituted exercise
- partial workout
- duplicate workout
- browser refresh during workout
- changing weight units
- missing previous performance
- first-ever exercise exposure
- deload/reduced-volume sessions
- Ultimate practice cancellation
- Sunday rest
- manually edited historical data

Do not let edge-case handling overwhelm the MVP.

---

# Data Ownership

Training history is valuable personal data.

Structure storage so it can eventually support:

- export
- backup
- migration

Avoid locking important training history into opaque UI-only state.

---

# Future Features — Do Not Build Yet

Potential later features include:

- AI analysis of training trends
- automated program adjustments
- HYROX training phase
- richer Ultimate workload tracking
- wearable integration
- nutrition/body-composition integration
- advanced fatigue modeling
- video technique analysis

Do not let these delay the core training loop.

---

# Development Workflow

Work incrementally.

For each major feature:

1. Understand the relevant source-of-truth requirements.
2. Inspect existing implementation.
3. Propose the smallest coherent change.
4. Implement it.
5. Verify responsive behavior.
6. Test persistence and edge cases.
7. Avoid unrelated refactors.
8. Update documentation if architecture meaningfully changes.

When requirements are ambiguous, preserve the product principles rather than inventing complexity.

---

# Initial Implementation Order

Unless the existing repository strongly suggests otherwise, prioritize:

1. Program data model
2. Seed training program
3. Today screen
4. Active workout
5. Set logging
6. Persistent active workout
7. Workout completion
8. Previous-performance retrieval
9. Double-progression recommendations
10. History
11. Athletic benchmarks
12. Progress dashboards
13. Exercise library
14. Readiness
15. Reviews
16. Polish

The application should become **usable after step 6**, not only after step 16.

---

# Definition of Success

The application succeeds when the athlete can wake up on a Tuesday morning, open the website on his phone, immediately see:

**Speed + Lower A + Core**

walk into the gym, complete the entire prescribed session while logging it with almost no friction, and leave knowing that the next session will automatically incorporate today's performance.

Over subsequent months, the application should make it obvious whether the athlete is:

- gaining muscle
- getting stronger
- getting faster
- becoming more explosive
- improving relative strength
- progressing toward an L-sit and planche
- consistently training
- managing Ultimate workload
- maintaining healthy movement

The product exists to support training.

**Never allow tracking the workout to become harder than doing the workout.**
