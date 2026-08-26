# PROGRAM_FORMAT.md

How to write a program so the app can paste it in. Paste your program text into the paste screen at /program. The parser reads it and shows you a preview before anything is saved, with any errors or warnings listed in plain language.

The format is forgiving. You do not need to be exact. If something cannot be understood, the preview tells you which line and why, so you can fix it and paste again.

Any day of the week you leave out is simply a rest day. Sunday is always a complete rest day. If you write a Sunday session anyway, it is ignored and the preview tells you so.

## The shape of a paste

```
# Program Name

## Monday: Day Title
An optional line or two describing the day.
Target duration: 60 minutes
+ Ultimate practice later

### Section Name (type)
- Exercise Name: prescription
```

That is the whole shape. Everything below explains each piece.

### Program title

One line at the top, a single hash and a space, then the name.

```
# Fall Strength Block
```

Optional. If left out, the program is saved as "Untitled Program" and you can rename it later.

### Day headers

Two hashes, a space, the weekday, and optionally a colon and a title for the day.

```
## Tuesday: Speed and Lower Body
```

Full weekday names or common short forms both work (Mon, Tue, Wed, Thu, Fri, Sat, Sun). Any weekday not written anywhere in the paste is a rest day with no further setup needed.

Right under a day header, before the first section, you can write:

- Any plain sentence, which becomes the day's description.
- `Target duration: 60 minutes` for the day's target length.
- `+ Ultimate practice later` if Ultimate practice happens later that day. This line can actually appear anywhere within the day, not only at the top.

### Sections

Three hashes, the section name, and the section's type in parentheses.

```
### Planche Foundation (calisthenics)
```

The type must be one of: warmup, speed, power, calisthenics, strength, core, mobility, recovery, cardio.

Add `, optional` inside the parentheses for a section that is not required, such as an optional conditioning add on.

```
### Zone 2 Cardio (cardio, optional)
```

A line starting with `>` right after a section header becomes a note shown with that section, for example a coaching emphasis for the whole section.

```
> Emphasize locked elbows and quality over fatigue.
```

### Exercises

Each exercise is a line starting with a dash, in the form `Name: prescription`. Add optional clauses after a prescription with a pipe character, for rest guidance and for notes.

```
- Back Squat: 3 x 6-10 | rest: heavy compound | notes: brace before every rep
```

Rest guidance is one of these categories, matched loosely (spaces or a single joining hyphen both work): heavy compound, moderate compound, isolation, sprint, jump, calisthenics skill.

Notes can list more than one, separated by a semicolon.

```
- Face Pull: 2 x 15-20 | notes: pull to eye height; keep chest up
```

### Prescription formats

The number before the "x" is always the number of sets. What follows the "x" tells the parser what kind of work it is.

**Repetitions**, a plain rep range, no unit:

```
- Hack Squat: 3 x 6-10
```

**Duration**, a rep range followed by "s" for seconds, with no "hold":

```
- Wrist Preparation: 1 x 120-180s
```

**Hold**, the same seconds format with the word "hold" added:

```
- Planche Lean: 4 x 10-20s hold
```

**Distance** or sprint work, a rep range followed by "m" for meters:

```
- Acceleration: 3 x 20m
```

**Qualitative** work, anything descriptive that does not fit the patterns above, such as a warm up or a mobility flow. Write the description as plain text. Add an approximate time in parentheses with a tilde, and list any specific items as indented sub bullets underneath.

```
- Dynamic Warm-Up: Easy movement and light acceleration work. (~8-10 min)
  - Leg swings
  - Ankle preparation
  - A-skips
  - Progressive accelerations
```

A short qualitative line with no sub items works too:

```
- L-Sit Practice: Four to five high quality attempts.
```

### Per side work

Add "each side" or "per leg" to a repetitions, duration, or hold prescription for work performed on one side at a time.

```
- Bulgarian Split Squat: 2 x 8-12 each side
- Copenhagen Plank: 2 x 15-20s hold, each side
```

### Either or choices

Give two exercise names separated by a slash or the word "or" to offer a choice between them, exactly as the athlete will see it during the workout.

```
- Face Pull / Reverse Cable Fly: 2 x 15-20 | rest: isolation
- Seated Leg Curl or Lying Leg Curl: 3 x 10-15
```

### Exercise names and the exercise library

An exercise's name is its identity. The same name always resolves to the same exercise across every paste, so history stays connected even after you paste an updated program.

If a name matches something already in the app's exercise library (by name, ignoring case and punctuation), that entry's muscle and coaching guidance carries over automatically and shows up as "Help me feel it" during the workout. If it does not match anything, the exercise still works everywhere in the app, it simply has no extra guidance yet.

## A complete example week

Copy this whole block as a starting point and adjust it to your real program.

```
# Sample Strength Block

## Monday: Upper Body Push
Ultimate practice happens later today.
Target duration: 70 minutes
+ Ultimate practice later

### Warm-Up (warmup)
- Dynamic Warm-Up: Light cardio and shoulder preparation. (~8-10 min)
  - Arm circles
  - Band pull aparts
  - Incline push-ups

### Strength (strength)
- Incline Dumbbell Press: 3 x 6-10 | rest: moderate compound
- Face Pull / Reverse Cable Fly: 2 x 15-20 | rest: isolation | notes: pull to eye height

### Calisthenics (calisthenics)
> Quality over fatigue. Stop a set early if form breaks down.
- Planche Lean: 4 x 10-20s hold | rest: calisthenics skill
- Hollow-Body Hold: 2 x 20-30s hold

## Tuesday: Speed and Lower Body
### Dynamic Warm-Up (warmup)
- Dynamic Warm-Up: Easy movement and progressive accelerations. (~8-10 min)
  - Leg swings
  - A-skips
  - Progressive accelerations

### Speed (speed)
> Full recovery between reps. Quality over density, never chase fatigue.
- Acceleration: 3 x 20m | rest: sprint
- Sprint: 2 x 30m | rest: sprint

### Strength (strength)
- Hack Squat: 3 x 6-10 | rest: heavy compound
- Bulgarian Split Squat: 2 x 8-12 each side | rest: moderate compound
- Copenhagen Plank: 2 x 15-20s hold, each side | rest: calisthenics skill

### Core (core)
- Cable Crunch: 3 x 8-15 | rest: isolation
- Hanging Knee Raise: 3 x 8-15 | rest: isolation

## Thursday: Recovery and Mobility
Should leave you feeling better, not exhausted.
Target duration: 60 minutes
+ Ultimate practice later

### Easy Aerobic Warm-Up (cardio)
- Easy Cycling: Ten minutes of easy cycling. (~10 min)

### Mobility (mobility)
- Mobility Flow: Controlled mobility work through the hips and ankles. (~10 min)
  - 90/90 hip switches
  - Ankle preparation
  - Thoracic rotations

### L-Sit Practice (calisthenics)
- L-Sit Practice: Four to five high quality attempts.

## Saturday: Upper Body and Optional Cardio
### Strength (strength)
- Pull-Up: 3 x 6-10 | rest: heavy compound
- Seated Cable Row: 3 x 8-12 | rest: moderate compound

### Zone 2 Cardio (cardio, optional)
- Easy Cycling: Twenty to thirty minutes at an easy, conversational pace. (~20-30 min)
```

Wednesday, Friday, and Sunday are not written above, so all three are rest days.
