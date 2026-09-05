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
- `+ Ultimate practice later` if Ultimate practice happens later that day (`+ Frisbee practice later` and `+ Ultimate frisbee practice later` mean the same thing). This line can actually appear anywhere within the day, not only at the top. It only marks the day as scheduled. Actual attendance is checked off in the app on the day.

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

### Cardio blocks

A cycling, rowing, running, or similar block is written like any qualitative or duration line. The app recognizes it as cardio when the section type is cardio, when the exercise name contains a cardio word (cycling, bike, row, run, jog, treadmill, elliptical, stair, ski, swim, walk), or when the exercise is a cardio entry in the exercise library.

```
### Easy Aerobic Warm-Up (cardio)
- Easy Cycling: Comfortable conversational cycling. (~8-10 min)
```

In the workout, a cardio block does not start on its own. You enter the resistance, tap Start, and a timer runs until you tap Stop. Then you log the time, average watts, average speed, and optional distance. Those numbers show up as Last time the next time the same block comes up.

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

## Exercise names in the library

<!-- library-names:start (generated by scripts/generate-program-format-library.ts, do not edit by hand) -->

The library holds 265 exercises. Use these names exactly as written (case and punctuation are ignored when matching, but spelling is not) so the workout shows the entry's coaching guidance and history stays connected. Each name is followed by its logging preset, which is what a swap or "Add exercise" mid-workout would prescribe; a pasted program can prescribe something different. Nothing on foot is in the library (no running or sprinting), but distance lines like `3 x 20m` still parse.

**Chest** (27)

- Archer Push-Up: 3 sets of 4 to 8 reps each side
- Barbell Bench Press: 3 sets of 6 to 10 reps
- Cable Fly: 3 sets of 10 to 15 reps
- Decline Barbell Bench Press: 3 sets of 6 to 10 reps
- Decline Dumbbell Press: 3 sets of 8 to 12 reps
- Deficit Push-Up: 3 sets of 8 to 15 reps
- Dip: 3 sets of 8 to 15 reps
- Dumbbell Bench Press: 3 sets of 8 to 12 reps
- Dumbbell Fly: 3 sets of 10 to 15 reps
- Floor Press: 3 sets of 6 to 10 reps
- High to Low Cable Fly: 3 sets of 10 to 15 reps
- Incline Barbell Bench Press: 3 sets of 6 to 10 reps
- Incline Dumbbell Press: 3 sets of 8 to 12 reps
- Incline Machine Press: 3 sets of 8 to 12 reps
- Low to High Cable Fly: 3 sets of 10 to 15 reps
- Machine Chest Press: 3 sets of 8 to 12 reps
- One-Arm Push-Up Progression: 3 sets of 3 to 6 reps each side
- Pec Deck: 3 sets of 10 to 15 reps
- Planche Push-Up: 3 sets of 3 to 6 reps
- Pseudo-Planche Push-Up: 3 sets of 5 to 10 reps
- Push-Up: 3 sets of 10 to 20 reps
- Ring Dip: 3 sets of 5 to 10 reps
- Ring Push-Up: 3 sets of 8 to 15 reps
- Single-Arm Cable Fly: 3 sets of 10 to 15 reps each side
- Smith Machine Bench Press: 3 sets of 8 to 12 reps
- Straight Bar Dip: 3 sets of 6 to 12 reps
- Svend Press: 3 sets of 12 to 20 reps

**Back** (42)

- Advanced Tuck Front Lever: 3 holds of 5 to 12 sec
- Archer Pull-Up: 3 sets of 3 to 6 reps each side
- Assisted Pull-Up: 3 sets of 6 to 12 reps
- Back Extension: 3 sets of 10 to 15 reps
- Band Pull-Apart: 2 sets of 15 to 25 reps
- Barbell Row: 3 sets of 6 to 10 reps
- Barbell Shrug: 3 sets of 10 to 15 reps
- Bodyweight Row (Feet Elevated): 3 sets of 8 to 15 reps
- Cat Cow: 2 sets of 8 to 12 reps
- Chest-Supported Row: 3 sets of 8 to 12 reps
- Chin-Up: 3 sets of 6 to 10 reps
- Dead Hang: 3 holds of 20 to 40 sec
- Dumbbell Row: 3 sets of 8 to 12 reps each side
- Dumbbell Shrug: 3 sets of 10 to 15 reps
- Front Lever Row: 3 sets of 4 to 8 reps
- Hanging Decompression: 2 holds of 20 to 40 sec
- Inverted Row: 3 sets of 8 to 15 reps
- Jefferson Curl: 2 sets of 6 to 10 reps
- Machine Row: 3 sets of 8 to 12 reps
- Meadows Row: 3 sets of 8 to 12 reps each side
- Muscle-Up (Bar): 3 sets of 2 to 5 reps
- Neutral-Grip Lat Pulldown: 3 sets of 8 to 12 reps
- Open Book Rotation: 2 sets of 8 to 10 reps each side
- Pendlay Row: 3 sets of 5 to 8 reps
- Prone T Raise: 2 sets of 10 to 15 reps
- Prone Y Raise: 2 sets of 10 to 15 reps
- Pull-Up: 3 sets of 6 to 10 reps
- Pulling Preparation: 5 to 7 min
- Rack Pull: 3 sets of 4 to 8 reps
- Reverse Hyper: 3 sets of 10 to 15 reps
- Ring Row: 3 sets of 8 to 15 reps
- Scapular Pull-Up: 3 sets of 8 to 12 reps
- Seated Cable Row: 3 sets of 8 to 12 reps
- Single-Arm Cable Row: 3 sets of 8 to 12 reps each side
- Single-Arm Lat Pulldown: 3 sets of 8 to 12 reps each side
- Skin the Cat: 3 sets of 3 to 6 reps
- Straight-Arm Pulldown: 3 sets of 10 to 15 reps
- T-Bar Row: 3 sets of 8 to 12 reps
- Thoracic Extension Over Foam Roller: 2 sets of 8 to 12 reps
- Tuck Front Lever: 3 holds of 8 to 15 sec
- Typewriter Pull-Up: 3 sets of 4 to 8 reps each side
- Wide-Grip Lat Pulldown: 3 sets of 8 to 12 reps

**Shoulders** (35)

- Advanced Tuck Planche: 3 holds of 5 to 12 sec
- Arnold Press: 3 sets of 8 to 12 reps
- Band Face Pull: 2 sets of 15 to 25 reps
- Cable Lateral Raise: 3 sets of 12 to 20 reps
- Cable Y Raise: 3 sets of 12 to 15 reps
- Dumbbell Lateral Raise: 3 sets of 12 to 20 reps
- Elevated Pike Push-Up: 3 sets of 6 to 10 reps
- External Rotation (Band): 2 sets of 12 to 20 reps each side
- External Rotation (Cable): 2 sets of 12 to 20 reps each side
- Face Pull: 3 sets of 12 to 20 reps
- Front Raise: 2 sets of 12 to 15 reps
- Handstand Push-Up (Wall): 3 sets of 3 to 8 reps
- Landmine Press: 3 sets of 8 to 12 reps each side
- Leaning Cable Lateral Raise: 3 sets of 12 to 20 reps
- Machine Lateral Raise: 3 sets of 12 to 20 reps
- Machine Shoulder Press: 3 sets of 8 to 12 reps
- Overhead Barbell Press: 3 sets of 5 to 8 reps
- Parallette Support Hold: 3 holds of 15 to 30 sec
- Pike Push-Up: 3 sets of 8 to 12 reps
- Planche Lean: 4 holds of 10 to 20 sec
- Rear-Delt Fly: 3 sets of 12 to 20 reps
- Rear-Delt Row: 3 sets of 12 to 20 reps
- Reverse Cable Fly: 3 sets of 12 to 20 reps
- Reverse Pec Deck: 3 sets of 12 to 20 reps
- Ring Support Hold: 3 holds of 15 to 30 sec
- Scaption Raise: 2 sets of 12 to 20 reps
- Scapular Push-Up: 3 sets of 10 to 15 reps
- Seated Dumbbell Shoulder Press: 3 sets of 8 to 12 reps
- Shoulder Dislocates (Band or Stick): 2 sets of 10 to 15 reps
- Standing Dumbbell Press: 3 sets of 8 to 12 reps
- Tuck Planche: 3 holds of 8 to 15 sec
- Upper Body Preparation: 6 to 8 min
- Upright Row: 3 sets of 10 to 15 reps
- Wall Handstand Hold: 3 holds of 20 to 45 sec
- Wall Slide: 2 sets of 10 to 15 reps

**Biceps** (12)

- Barbell Curl: 3 sets of 8 to 12 reps
- Bayesian Cable Curl: 3 sets of 10 to 15 reps each side
- Cable Curl: 3 sets of 10 to 15 reps
- Concentration Curl: 3 sets of 10 to 15 reps each side
- Dumbbell Curl: 3 sets of 8 to 12 reps
- EZ Bar Curl: 3 sets of 8 to 12 reps
- Hammer Curl: 3 sets of 8 to 12 reps
- Incline Dumbbell Curl: 3 sets of 8 to 12 reps
- Machine Curl: 3 sets of 8 to 12 reps
- Preacher Curl: 3 sets of 8 to 12 reps
- Reverse Curl: 3 sets of 10 to 15 reps
- Spider Curl: 3 sets of 10 to 15 reps

**Triceps** (10)

- Bench Dip: 3 sets of 10 to 20 reps
- Close-Grip Bench Press: 3 sets of 6 to 10 reps
- Dumbbell Overhead Extension: 3 sets of 8 to 12 reps
- JM Press: 3 sets of 6 to 10 reps
- Kickback: 2 sets of 12 to 20 reps each side
- Machine Triceps Extension: 3 sets of 10 to 15 reps
- Overhead Cable Triceps Extension: 3 sets of 10 to 15 reps
- Single-Arm Cable Pressdown: 3 sets of 10 to 15 reps each side
- Skull Crusher: 3 sets of 8 to 12 reps
- Triceps Pressdown: 3 sets of 10 to 15 reps

**Forearms and grip** (7)

- Farmer Hold: 3 x 30 to 60 sec
- Plate Pinch Hold: 3 x 20 to 40 sec
- Reverse Wrist Curl: 3 sets of 12 to 20 reps
- Wrist Curl: 3 sets of 12 to 20 reps
- Wrist Flexor Stretch: 2 holds of 20 to 30 sec each side
- Wrist Preparation: 1 x 120 to 180 sec
- Wrist Push-Up Progression: 2 sets of 8 to 12 reps

**Quads** (21)

- Back Squat: 3 sets of 5 to 8 reps
- Belt Squat: 3 sets of 8 to 12 reps
- Bulgarian Split Squat: 3 sets of 8 to 12 reps each side
- Front Squat: 3 sets of 5 to 8 reps
- Goblet Squat: 3 sets of 10 to 15 reps
- Hack Squat: 3 sets of 8 to 12 reps
- Heel-Elevated Squat: 3 sets of 10 to 15 reps
- Lateral Lunge: 3 sets of 8 to 12 reps each side
- Leg Extension: 3 sets of 12 to 15 reps
- Leg Press: 3 sets of 8 to 12 reps
- Pendulum Squat: 3 sets of 8 to 12 reps
- Reverse Lunge: 3 sets of 8 to 12 reps each side
- Safety Bar Squat: 3 sets of 6 to 10 reps
- Single-Leg Leg Extension: 3 sets of 12 to 15 reps each side
- Single-Leg Leg Press: 3 sets of 8 to 12 reps each side
- Sissy Squat: 3 sets of 6 to 12 reps
- Smith Machine Squat: 3 sets of 8 to 12 reps
- Split Squat: 3 sets of 8 to 12 reps each side
- Step-Up: 3 sets of 8 to 12 reps each side
- Walking Lunge: 3 sets of 10 to 12 reps each side
- Wall Sit: 3 holds of 30 to 60 sec

**Hamstrings** (10)

- Conventional Deadlift: 3 sets of 5 to 8 reps
- Dumbbell Romanian Deadlift: 3 sets of 8 to 12 reps
- Glute-Ham Raise: 3 sets of 6 to 10 reps
- Good Morning: 3 sets of 8 to 12 reps
- Lying Leg Curl: 3 sets of 10 to 15 reps
- Nordic Hamstring Curl: 3 sets of 4 to 8 reps
- Romanian Deadlift: 3 sets of 8 to 10 reps
- Seated Leg Curl: 3 sets of 10 to 15 reps
- Single-Leg Romanian Deadlift: 3 sets of 8 to 12 reps each side
- Stiff-Leg Deadlift: 3 sets of 8 to 12 reps

**Glutes** (12)

- 45 Degree Hip Extension: 3 sets of 10 to 15 reps
- Barbell Glute Bridge: 3 sets of 10 to 15 reps
- Cable Kickback: 3 sets of 12 to 15 reps each side
- Cable Pull-Through: 3 sets of 10 to 15 reps
- Frog Pump: 3 sets of 15 to 20 reps
- Glute Bridge: 3 sets of 12 to 20 reps
- Hip Thrust: 3 sets of 8 to 12 reps
- Kettlebell Swing: 3 sets of 12 to 20 reps
- Machine Hip Thrust: 3 sets of 10 to 15 reps
- Single-Leg Glute Bridge: 3 sets of 10 to 15 reps each side
- Sumo Deadlift: 3 sets of 5 to 8 reps
- Trap-Bar Deadlift: 3 sets of 5 to 8 reps

**Hips and adductors** (19)

- 90/90 Hip Switch: 2 sets of 8 to 10 reps
- Adductor Machine: 3 sets of 12 to 15 reps
- Adductor Rock Back: 2 sets of 10 to 15 reps each side
- Banded Hip Distraction: 2 holds of 30 to 45 sec each side
- Banded Lateral Walk: 3 sets of 10 to 15 reps each side
- Cable Hip Adduction: 3 sets of 12 to 15 reps each side
- Cable Hip Flexion: 3 sets of 12 to 15 reps each side
- Clamshell: 3 sets of 15 to 20 reps each side
- Couch Stretch: 2 holds of 30 to 60 sec each side
- Deep Squat Hold: 2 holds of 30 to 60 sec
- Glute Bridge March: 2 sets of 8 to 12 reps each side
- Hamstring Floss: 2 sets of 8 to 12 reps each side
- Hip Abduction: 3 sets of 12 to 15 reps
- Hip Flexor Stretch: 2 holds of 20 to 40 sec each side
- Long-Lever Copenhagen Plank: 3 holds of 15 to 30 sec each side
- Pigeon Stretch: 2 holds of 30 to 60 sec each side
- Short-Lever Copenhagen Plank: 3 holds of 15 to 30 sec each side
- Side-Lying Hip Abduction: 3 sets of 12 to 20 reps each side
- Standing Banded Hip Flexor March: 3 sets of 10 to 15 reps each side

**Calves and lower legs** (10)

- Ankle Alphabet: 1 x 30 to 60 sec each side
- Ankle Dorsiflexion Rock: 2 sets of 10 to 15 reps each side
- Calf Stretch (Wall): 2 holds of 20 to 30 sec each side
- Donkey Calf Raise: 3 sets of 12 to 15 reps
- Leg Press Calf Raise: 3 sets of 12 to 15 reps
- Seated Calf Raise: 3 sets of 12 to 20 reps
- Single-Leg Calf Raise: 3 sets of 10 to 15 reps each side
- Smith Machine Calf Raise: 3 sets of 10 to 15 reps
- Standing Calf Raise: 3 sets of 10 to 15 reps
- Tibialis Raise: 3 sets of 15 to 20 reps

**Core** (26)

- Ab Rollout From Feet: 3 sets of 6 to 10 reps
- Ab Wheel: 3 sets of 8 to 12 reps
- Bird Dog: 3 sets of 8 to 12 reps each side
- Cable Crunch: 3 sets of 12 to 15 reps
- Cable Woodchop: 3 sets of 10 to 15 reps each side
- Captain's Chair Knee Raise: 3 sets of 10 to 15 reps
- Dead Bug: 3 sets of 8 to 12 reps each side
- Decline Sit-Up: 3 sets of 12 to 15 reps
- Dragon Flag: 3 sets of 4 to 8 reps
- Hanging Knee Raise: 3 sets of 8 to 12 reps
- Hanging Leg Raise: 3 sets of 8 to 12 reps
- Hollow Body Rock: 3 sets of 10 to 20 reps
- Hollow-Body Hold: 3 holds of 20 to 40 sec
- L-Sit: 3 holds of 10 to 20 sec
- Landmine Rotation: 3 sets of 10 to 15 reps
- Machine Crunch: 3 sets of 12 to 15 reps
- One-Leg L-Sit: 3 holds of 8 to 18 sec
- Pallof Press: 3 sets of 10 to 12 reps each side
- Reverse Crunch: 3 sets of 12 to 15 reps
- Russian Twist: 3 sets of 16 to 20 reps
- Side Plank: 3 holds of 20 to 40 sec each side
- Toes to Bar: 3 sets of 6 to 10 reps
- Tuck L-Sit: 3 holds of 10 to 20 sec
- V-Sit: 3 holds of 5 to 12 sec
- V-Up: 3 sets of 10 to 15 reps
- Weighted Plank: 3 holds of 30 to 45 sec

**Full body** (27)

- Box Jump: 3 sets of 3 to 5 reps
- Countermovement Jump: 3 sets of 3 to 5 reps
- Depth Jump: 3 sets of 3 to 5 reps
- Dynamic Power Warm-Up: 8 to 10 min
- Dynamic Warm-Up: 6 to 10 min
- Farmer Carry: 3 x 30 m
- Foam Rolling: 5 to 10 min
- Hurdle Hop: 3 sets of 3 to 5 reps
- Lateral Bound: 3 sets of 3 to 5 reps each side
- Medicine Ball Chest Pass: 3 sets of 3 to 5 reps
- Medicine Ball Rotational Throw: 3 sets of 4 to 6 reps each side
- Medicine Ball Slam: 3 sets of 5 to 8 reps
- Mobility Flow: 12 to 15 min
- Overhead Carry: 3 x 30 m
- Pogo Jump: 3 sets of 3 to 5 reps
- Seated Box Jump: 3 sets of 3 to 5 reps
- Single-Leg Balance: 2 holds of 20 to 30 sec each side
- Single-Leg Hop: 3 sets of 3 to 5 reps each side
- Sled Drag: 3 x 20 m
- Sled Push: 3 x 20 m
- Split Jump: 3 sets of 3 to 5 reps each side
- Squat Jump: 3 sets of 3 to 5 reps
- Standing Broad Jump: 3 sets of 3 to 5 reps
- Suitcase Carry: 3 x 30 m
- Trap Bar Jump: 3 sets of 3 to 5 reps
- Tuck Jump: 3 sets of 3 to 5 reps
- World's Greatest Stretch: 2 sets of 5 to 8 reps each side

**Cardio** (7)

- Assault Bike: 10 to 20 min
- Elliptical: 15 to 30 min
- Rowing Machine: 15 to 25 min
- Ski Erg: 10 to 20 min
- Stair Climber: 12 to 20 min
- Stationary Bike: 15 to 30 min
- Swimming: 20 to 30 min

<!-- library-names:end -->

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
