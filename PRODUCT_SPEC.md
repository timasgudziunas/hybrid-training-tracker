# Athlete Training System: Product Specification

## 1. Product Vision

Build a personal training application designed around one central objective:

> Build muscle. Keep your speed. Become stronger relative to your bodyweight. Move well.

This is not a bodybuilding tracker, a generic workout logger, or currently a HYROX training application. It is a personal athletic development system.

The athlete wants to simultaneously:

- Build substantial muscle.
- Become faster and more explosive.
- Perform well in Ultimate frisbee.
- Develop excellent relative strength and body control.
- Progress in calisthenics, eventually toward a planche.
- Build visible, strong abs.
- Improve mobility and flexibility.
- Remain resilient and healthy enough to train consistently.
- Establish an athletic foundation that can later transition into HYROX-specific preparation.

Every product and programming decision should be evaluated against those goals.

## 2. Core Product Philosophy

The application should answer three questions extremely well: what do I need to do today, what did I do last time and how should I progress, and am I actually becoming a better athlete.

The primary experience is execution, not analysis. Opening the app in the gym should immediately tell the athlete what today's session is and allow the workout to begin with almost zero friction. Analytics and history are secondary experiences.

## 3. User Context

The initial application is being built for one athlete.

**Training availability.** Weekday mornings: 75 minutes available every morning. Saturday: available for training. Sunday: complete rest day.

**Ultimate schedule.** Team practices occur Monday, Wednesday, and Thursday. These practices already provide substantial sprinting, cutting, acceleration, deceleration, jumping, reactive movement, and repeated-sprint conditioning. The application should therefore not assume that more conditioning is always better.

**Training background.** Approximately four years of intermittent lifting experience. The athlete is familiar with training but does not consider himself technically advanced and sometimes has difficulty feeling the intended muscles during exercises. Technique education is therefore an important part of the product.

**Current calisthenics benchmarks.** Approximately 5 strict pull-ups, 10 dips, 25 push-ups, and previously capable of an L-sit.

**Physique priorities.** Overall balanced muscular development, with additional emphasis on shoulders, back, and abs.

**Athletic priorities.** The athlete explicitly does not want to become muscular at the expense of athleticism. The program must preserve and ideally improve acceleration, sprint speed, explosiveness, jumping, change-of-direction ability, relative strength, conditioning, and mobility.

**Groin consideration.** The athlete reports that the right groin/adductor region can feel weak and become aggravated with substantial movement. The program includes conservative adductor strengthening and mobility work, but the application must not diagnose injuries. Pain should be treated differently from normal muscular fatigue. If symptoms become persistent, worsening, or interfere with sprinting/cutting, the UI should recommend professional sports medicine or physical therapy evaluation rather than attempting to diagnose the problem.

## 4. Information Architecture

Primary navigation should remain simple. Do not overload the application with unnecessary sections.

| Section | Contents |
|---|---|
| Today | Today's prescribed workout. The application's most important screen. |
| Plan | Complete weekly training program and individual sessions. |
| Progress | Strength, physique, calisthenics, speed, power, and athletic benchmarks. |
| History | Calendar and historical workouts. |
| Exercises | Exercise library, technique guidance, and progression information. |
| Review | Weekly and monthly training summaries. |
| Settings | Program settings, units, benchmark configuration, etc. |

## 5. Today Screen

The Today screen should be optimized for opening the application immediately before training. Example:

```
TUESDAY
Speed + Lower A + Core
Target: 75 minutes

WARM-UP
SPEED
STRENGTH
CORE
COOLDOWN
```

Each exercise appears as a clear card, for example:

```
Hack Squat
3 x 6-10

Previous:
225 x 9
225 x 9
225 x 8

Suggested today: 225 lb

Set 1  [weight] [reps] [RIR]
Set 2  [weight] [reps] [RIR]
Set 3  [weight] [reps] [RIR]

[Complete Exercise]
```

Logging must be extremely fast. The user should not have to navigate through multiple modal windows to record a set.

## 6. Workout Execution

When the athlete presses Start Workout, record: workout start time, prescribed session, exercises, target sets, target reps.

During the session, allow: logging weight, logging reps, logging RIR, marking sets complete, adding/removing a set, skipping an exercise, substituting an exercise, adding a brief note, modifying the session.

At completion, record: duration, exercises completed, total sets, modifications, optional session difficulty, optional session note.

The application should automatically save continuously. A browser refresh or accidental close should never destroy an active workout.

## 7. Previous Performance

Previous performance should be highly visible. For every strength exercise, show "LAST TIME" with weight x reps for each set, for example:

```
70 x 10
70 x 9
70 x 8
```

This reduces cognitive load and makes progressive overload obvious. The athlete should almost never need to search workout history while actively training.

## 8. Progression Engine

The application should support double progression.

Example prescription: 3 x 6-10.

Suppose the athlete records:

| Week | Set 1 | Set 2 | Set 3 |
|---|---|---|---|
| 1 | 70 x 8 | 70 x 8 | 70 x 7 |
| 2 | 70 x 9 | 70 x 8 | 70 x 8 |
| 3 | 70 x 10 | 70 x 10 | 70 x 10 |

The application may then recommend increasing weight. The next session might become 75 x 6-10.

Do not automatically increase weight simply because a workout was completed. Progression should consider prescribed rep range, actual reps, RIR, technique, previous sessions, and whether all prescribed sets were completed.

Default hypertrophy effort: approximately 1-3 RIR. The system should generally favor high-quality repetitions over arbitrary load increases.

## 9. Athletic Performance

The application must explicitly measure athleticism. This is a fundamental product requirement.

| Benchmark area | Measures |
|---|---|
| Acceleration | 10 m sprint, 20 m sprint |
| Speed | 30 m sprint |
| Horizontal power | Standing broad jump |
| Vertical power | Vertical jump |
| Relative pulling strength | Strict pull-ups |
| Relative pushing strength | Strict dips |
| Calisthenics | L-sit progression, planche progression |

These benchmarks should be retested periodically, approximately every 4-6 weeks rather than constantly. Show trends over time.

## 10. Athleticism vs Bodyweight

One of the application's most useful analyses should answer: is the athlete gaining useful mass? Allow bodyweight tracking, then compare bodyweight trends against sprint performance, jump performance, pull-ups, dips, strength, and calisthenics progress.

Example:

```
Bodyweight     +4.2 lb
10 m sprint    -0.08 sec
Broad jump     +4 in
Pull-ups       5 -> 8
```

Interpretation: muscle/weight is increasing while athletic performance is improving.

Do not reduce this to a single scientifically dubious "athletic score." Show the underlying metrics.

### Daily body check-in (weight + photo)

On the first open of a new calendar day, the app prompts for a quick body check-in: current bodyweight in lbs, plus an optional progress photo picked from the camera roll (or taken directly). Rules:

- The prompt appears at most once per day and is dismissible in one tap. It must never block or delay getting to today's workout; if skipped, the entry can still be filled in later that day from the body tracking area.
- Weight entry uses a numeric keyboard and should take a couple of seconds. The photo is optional every day; skipping the photo must not feel like a failure.
- Entries are browsable as a history: a timeline of dated photos and weights so the athlete can look back over weeks and months, and a weight trend chart that feeds the athleticism-vs-bodyweight analysis above.
- Photos are private personal data: stored in a private Supabase Storage bucket, never public, and included in the export/backup story like all other training history.
- No body-composition estimates, no AI analysis of photos, no judgment copy. The check-in records data; interpretation stays with the athlete.

## 11. Calisthenics Tracking

Calisthenics progressions should be modeled differently from normal weight training.

**Planche progression.** Initial conceptual progression: scapular control, planche lean, pseudo-planche push-up, tuck planche, advanced tuck, straddle planche, full planche. Progress should include progression level, hold duration, number of quality sets, and technique notes. The goal is quality of position and increasing leverage, not merely exhaustion.

**L-sit progression.** Tuck support, tuck L-sit, one-leg L-sit, full L-sit. Track best hold duration and current progression.

## 12. Exercise Library

Each exercise should have a dedicated entry including: exercise name, category (hypertrophy, strength, speed, power, mobility, calisthenics, rehabilitation/prehab), primary muscles, secondary muscles, why this exercise is in the program, setup, execution, technique cues, common mistakes, what the athlete should generally feel, progression method, and appropriate substitutions.

The exercise library is particularly important because the athlete is still developing strong lifting technique and mind-muscle awareness. However, avoid suggesting that a muscle must produce a dramatic sensation for an exercise to be effective.

## 13. Readiness

Readiness tracking should remain intentionally lightweight. Optional morning check-in:

| Input | Scale |
|---|---|
| Sleep | Hours slept |
| Energy | 1-5 |
| General soreness | 1-5 |
| Groin/adductor status | 0-5 |
| Overall readiness | Green / Yellow / Red |

Do not create a fake physiologically precise recovery score. Use the data primarily for context.

## 14. Modify, Don't Fail

This principle should be deeply integrated into the UX. A planned workout should not only have Complete or Missed as outcomes. Allow Modified, for example: reduced sets, lighter load, recovery version, substituted exercise, stopped due to discomfort.

A modified session still counts as showing up. The application should encourage long-term adherence rather than perfectionism.

## 15. Training Calendar

Provide a calendar/history interface. Potential statuses: Completed, Modified, Ultimate practice, Rest, Missed. Clicking a day opens the workout record.

Show adherence metrics such as "22 / 24 planned sessions completed, 92% adherence." Prefer adherence over psychologically punishing streak mechanics. A streak may exist as secondary information but should not dominate the product.

## 16. Weekly Review

Generate a lightweight weekly summary. Example:

```
TRAINING
5 / 5 gym sessions completed
3 / 3 Ultimate practices

PROGRESSION
7 exercises improved
4 maintained
1 regressed

ATHLETIC WORK
1 speed session
1 power session
3 Ultimate practices

RECOVERY
Average sleep: 7.4 hours
Average energy: 4.0 / 5

GROIN
Average status: 1.2 / 5

SUMMARY
Training volume and recovery appear manageable.
```

Avoid pretending the system knows more than the data supports.

## 17. Monthly Review

Monthly reviews should emphasize trends: bodyweight trend, strength progression, training adherence, exercise volume, athletic benchmarks, pull-up/dip progress, planche progress, L-sit progress, recovery patterns, groin/adductor trend.

This should answer: am I becoming more muscular, stronger, and more athletic?

## 18. Goals

Create a Goals page.

**Current phase:** Muscle + Athletic Development.

Primary objectives: gain muscle, increase strength, increase speed, increase explosiveness, maintain Ultimate conditioning, develop calisthenics, improve mobility.

Physique priorities: shoulders, back, abs, balanced total-body muscular development.

Athletic priorities: acceleration, speed, power, relative strength, movement quality.

Calisthenics: 10+ strict pull-ups, full L-sit, long-term planche progression.

**Future:** HYROX competition next summer. Display as "future phase, not currently prioritized." Current training develops the strength, muscle, work capacity, and aerobic foundation that can later support HYROX-specific preparation.

## 19. Mobile-First Workout UX

Workout execution should be designed primarily for a phone. Assume the athlete is standing in a gym, one hand may be occupied, hands may be sweaty, and attention should remain on training.

Therefore: large tap targets, minimal typing, numeric keyboard for loads/reps, easy previous-set copying, quick RIR selection, minimal navigation, no unnecessary confirmations, active workout persists automatically.

Desktop can provide richer analytics and program editing.

## 20. Visual Direction

The product should feel like an athlete performance dashboard, not a bodybuilding app. Desired characteristics: clean, restrained, athletic, data-forward, highly legible, modern, fast, minimal clutter.

Avoid: excessive gradients, stereotypical gym imagery, flames, macho bodybuilding aesthetics, excessive gamification, meaningless badges, cluttered dashboards.

Information hierarchy matters more than decoration.

## 21. Product Non-Negotiables

The application must preserve these principles:

1. Muscle gain is currently the primary adaptation goal.
2. Athleticism must be maintained and preferably improved.
3. Ultimate practice counts as significant athletic workload.
4. More training is not automatically better.
5. Speed work requires quality and adequate recovery.
6. Power work should occur while relatively fresh.
7. Strength-to-weight ratio matters.
8. Calisthenics is a real training objective.
9. Abs are trained progressively like other muscles.
10. Mobility is integrated into training.
11. Pain is not treated as ordinary soreness.
12. Sunday remains a true rest day.
13. HYROX is a future phase, not the current training focus.
14. Adherence over months matters more than perfect individual workouts.
15. The app should reduce decision-making rather than create more of it.
16. The workout logging experience should never become harder than doing the workout.
