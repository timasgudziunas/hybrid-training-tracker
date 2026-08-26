/**
 * The exercise catalog: every exercise referenced anywhere in the weekly
 * program, defined exactly once. Day seed files reference these by id —
 * never redefine an exercise inline.
 *
 * Naming/category notes (decisions made where TRAINING_SYSTEM.md doesn't
 * spell out taxonomy explicitly):
 * - "Standing Calf Raise" (Tuesday) and "Calf Raise" (Thursday/Friday) are
 *   kept as separate catalog entries because TRAINING_SYSTEM.md names them
 *   differently in different places; not force-merged.
 * - "Calf Raise" (Thursday's Resilience/Control table, Friday's Strength
 *   table) uses one shared id since both instances use the identical name.
 * - Instructional fields (instructions, cues, commonMistakes,
 *   intendedFeeling) and `substitutions` are intentionally left unfilled —
 *   that's Phase 8 exercise-library content, not invented here.
 */

import type { Exercise } from './program-types';

export const EXERCISE_CATALOG: Exercise[] = [
  // --- Monday: Planche Foundation ---
  {
    id: 'wrist-preparation',
    name: 'Wrist Preparation',
    category: 'mobility',
    primaryMuscles: ['wrists', 'forearms'],
    secondaryMuscles: [],
    progressionType: 'none',
  },
  {
    id: 'scapular-push-up',
    name: 'Scapular Push-Up',
    category: 'calisthenics',
    primaryMuscles: ['serratus anterior', 'scapular stabilizers'],
    secondaryMuscles: ['shoulders'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel this between and under your shoulder blades as they spread apart and pull back together, not in your arms or chest.',
    cues: [
      'Keep elbows locked straight throughout',
      'Let your shoulder blades do all the moving',
      'Push the floor away until your upper back rounds',
      'Pull shoulder blades together at the bottom without bending elbows',
    ],
    commonMistakes: [
      'Bending the elbows turns it into a mini push up',
      'Moving too fast to feel the shoulder blades work',
      'Shrugging the shoulders up toward the ears',
    ],
  },
  {
    id: 'planche-lean',
    name: 'Planche Lean',
    category: 'calisthenics',
    primaryMuscles: ['shoulders', 'chest', 'core'],
    secondaryMuscles: ['wrists', 'triceps'],
    progressionType: 'progression-chain',
    progressionChainId: 'planche-progression',
    intendedFeeling:
      'You should feel constant tension through your shoulders and upper chest as they support your bodyweight, with your core braced to hold a slight posterior pelvic tilt.',
    cues: [
      'Lock your elbows and keep them locked the entire hold',
      'Actively push your shoulder blades away from each other',
      'Tuck your pelvis under slightly and squeeze your glutes',
      'Lean only as far forward as you can hold with control',
    ],
    commonMistakes: [
      'Letting the elbows bend under load',
      'Allowing the lower back to sag or arch',
      'Leaning further forward than current strength allows just to chase a number',
    ],
  },
  {
    id: 'hollow-body-hold',
    name: 'Hollow-Body Hold',
    category: 'calisthenics',
    primaryMuscles: ['rectus abdominis', 'deep core'],
    secondaryMuscles: ['hip flexors'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your entire abdominal wall braced hard, with your lower back pressed flat and no strain in your neck or hip flexors.',
    cues: [
      'Press your lower back into the floor',
      'Keep your ribs pulled down, not flared',
      'Extend arms and legs only as far as you can hold the brace',
      'Breathe while keeping the brace, do not hold your breath',
    ],
    commonMistakes: [
      'Letting the lower back arch off the floor',
      'Pulling on the neck instead of bracing the abs',
      'Extending the legs too low too soon and losing the hollow position',
    ],
  },

  // --- Monday: Hypertrophy ---
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'hypertrophy',
    primaryMuscles: ['upper chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel the stretch and squeeze concentrated across your upper chest, with your shoulders and triceps assisting but not taking over.',
    cues: [
      'Set the bench so you feel the incline in your upper chest, not your front delts',
      'Lower the dumbbells under control until you feel a stretch across the chest',
      'Drive the dumbbells up and slightly together at the top',
      'Keep shoulder blades pulled back and down into the bench',
    ],
    commonMistakes: [
      'Flaring the elbows so the front delts take over',
      'Bouncing the dumbbells at the bottom of the stretch',
      'Pressing with an arched back to move more weight',
    ],
  },
  {
    id: 'seated-dumbbell-shoulder-press',
    name: 'Seated Dumbbell Shoulder Press',
    category: 'hypertrophy',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel the load across the front and side of your shoulders through the whole range, with your torso staying still.',
    cues: [
      'Brace your core before you press',
      'Press the dumbbells up and slightly inward, not straight out to the sides',
      'Lower until your upper arms are about level with your shoulders',
      'Keep your ribs down, do not lean back to finish the rep',
    ],
    commonMistakes: [
      'Leaning back and turning it into an incline press',
      'Using leg drive or a bounce out of the bottom',
      'Only pressing through the top half of the range',
    ],
  },
  {
    id: 'cable-fly',
    name: 'Cable Fly',
    category: 'hypertrophy',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel a stretch and squeeze across the middle of your chest as your hands sweep together, not tension in your front delts.',
    cues: [
      'Set a slight forward lean and soft bend in the elbows',
      'Let the cables pull your arms back until you feel a stretch in the chest',
      'Bring your hands together in an arcing path, like hugging a barrel',
      'Squeeze your chest at the finish rather than just moving the handles',
    ],
    commonMistakes: [
      'Turning the arc into a straight press with the shoulders',
      'Using so much weight that the stretch gets cut short',
      'Letting the elbows lock straight and shift work to the shoulders',
    ],
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    category: 'hypertrophy',
    primaryMuscles: ['lateral deltoid'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel tension on the side of your shoulder through the whole arc, not in your traps or forearm.',
    cues: [
      'Set the cable low and stand side on to it',
      'Lead with your elbow, not your hand',
      'Raise only to about shoulder height',
      'Keep a slight bend in the elbow and control the lowering phase',
    ],
    commonMistakes: [
      'Shrugging the traps to help lift the weight',
      'Swinging the torso to generate momentum',
      'Raising too high so the trap takes over at the top',
    ],
  },
  {
    id: 'overhead-cable-triceps-extension',
    name: 'Overhead Cable Triceps Extension',
    category: 'hypertrophy',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel the stretch and contraction concentrated in your triceps, with your upper arms staying still.',
    cues: [
      'Pin your upper arms close to your head and keep them still',
      'Lower the weight until you feel a full stretch in the triceps',
      'Extend through the elbows only, straightening fully at the top',
      'Keep your core braced so your torso does not sway',
    ],
    commonMistakes: [
      'Letting the elbows drift forward or flare out',
      'Using the shoulders to help swing the weight',
      'Stopping short of full elbow extension at the top',
    ],
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    category: 'hypertrophy',
    primaryMuscles: ['rear deltoid', 'upper back'],
    secondaryMuscles: ['rotator cuff'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your rear shoulders and upper back working as you pull, with a slight external rotation at the end, not your arms doing the pulling.',
    cues: [
      'Pull to about eye or forehead height',
      'Lead with your elbows and pull them high and wide',
      'Finish by rotating your hands back like showing your palms behind you',
      'Keep your chest up and shoulder blades pulling together at the finish',
    ],
    commonMistakes: [
      'Pulling low toward the chest like a row instead of the face',
      'Using the biceps to yank the weight rather than the rear delts',
      'Shrugging the shoulders up toward the ears',
    ],
  },
  {
    id: 'reverse-cable-fly',
    name: 'Reverse Cable Fly',
    category: 'hypertrophy',
    primaryMuscles: ['rear deltoid', 'upper back'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your rear delts and upper back doing the work as your arms sweep apart, not your arms or lower back.',
    cues: [
      'Cross the cables and take a slight forward hinge',
      'Lead the movement with your elbows, not your hands',
      'Sweep your arms out and back in a wide arc',
      'Squeeze your shoulder blades together at the finish',
    ],
    commonMistakes: [
      'Bending the elbows heavily and turning it into a row',
      'Using momentum from the lower back to swing the arms',
      'Cutting the range short instead of finishing with the blades squeezed',
    ],
  },

  // --- Tuesday: Dynamic Warm-Up ---
  {
    id: 'dynamic-warm-up',
    name: 'Dynamic Warm-Up',
    category: 'mobility',
    primaryMuscles: ['full body'],
    secondaryMuscles: [],
    progressionType: 'none',
  },

  // --- Tuesday: Speed ---
  {
    id: 'acceleration-10m',
    name: '10 m Acceleration',
    category: 'speed',
    primaryMuscles: ['hamstrings', 'glutes', 'calves'],
    secondaryMuscles: ['hip flexors'],
    progressionType: 'none',
  },
  {
    id: 'acceleration-20m',
    name: '20 m Acceleration',
    category: 'speed',
    primaryMuscles: ['hamstrings', 'glutes', 'calves'],
    secondaryMuscles: ['hip flexors'],
    progressionType: 'none',
  },
  {
    id: 'sprint-30m',
    name: '30 m Sprint',
    category: 'speed',
    primaryMuscles: ['hamstrings', 'glutes', 'calves'],
    secondaryMuscles: ['hip flexors'],
    progressionType: 'none',
  },

  // --- Tuesday: Adductor Preparation / Thursday: Resilience-Control ---
  {
    id: 'short-lever-copenhagen-plank',
    name: 'Short-Lever Copenhagen Plank',
    category: 'rehabilitation-prehab',
    primaryMuscles: ['adductors'],
    secondaryMuscles: ['obliques'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel steady tension along the inner thigh of your top leg, with your hips staying level and controlled.',
    cues: [
      'Stack your hips and shoulders in a straight line',
      'Rest your top foot on the bench and lift your bottom leg to hold position',
      'Keep your hips square, do not let them rotate open',
      'Work within a comfortable range and only extend it gradually',
    ],
    commonMistakes: [
      'Letting the hips sag or rotate to compensate',
      'Rushing to a longer lever before the current one feels controlled',
      'Holding the breath instead of breathing through the hold',
    ],
  },

  // --- Tuesday: Strength ---
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel the load across your quads through the full range, especially near the bottom of the movement.',
    cues: [
      'Keep your feet flat and your back against the pad',
      'Lower until your thighs are at least parallel, under control',
      'Drive through the middle of your foot to stand up',
      'Keep your knees tracking over your toes',
    ],
    commonMistakes: [
      'Only squatting through a short partial range',
      'Letting the knees cave inward on the way up',
      'Bouncing out of the bottom instead of controlling the descent',
    ],
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'hypertrophy',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['lower back'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel a strong stretch through your hamstrings as you hinge, with your glutes finishing the rep.',
    cues: [
      'Push your hips back first, knees stay soft, not bent further',
      'Keep the bar or dumbbells close to your legs',
      'Lower only until you feel a full hamstring stretch',
      'Drive your hips forward to stand, squeezing the glutes',
    ],
    commonMistakes: [
      'Rounding the lower back to reach further down',
      'Bending the knees like a squat instead of hinging',
      'Standing up by leaning back with the shoulders instead of the hips',
    ],
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    progressionType: 'double-progression',
    intendedFeeling:
      "You should feel your front leg's quad and glute working through the whole range, with your back leg only there for balance.",
    cues: [
      'Keep most of your weight on your front foot',
      'Lower straight down until your back knee nearly touches the floor',
      'Keep your torso upright for more quad, lean forward slightly for more glute',
      'Drive through your front heel to stand',
    ],
    commonMistakes: [
      'Letting the back leg push and take over the work',
      'Only descending part way',
      'Letting the front knee cave inward',
    ],
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    category: 'hypertrophy',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel the contraction concentrated in your hamstrings through the full range, from full stretch to full squeeze.',
    cues: [
      'Adjust the pad so it sits just above your heels',
      'Curl through a full range without lifting your hips off the seat',
      'Squeeze hard at the bottom of the curl',
      'Control the return back to the stretched position',
    ],
    commonMistakes: [
      'Using short, bouncy partial reps',
      'Lifting the hips or back off the pad to move more weight',
      'Letting the weight drop instead of controlling the negative',
    ],
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    category: 'hypertrophy',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your hamstrings doing the work through the full curl, without your hips lifting off the bench.',
    cues: [
      'Keep your hips pressed into the bench throughout',
      'Curl your heels toward your glutes through a full range',
      'Squeeze at the top of the curl before lowering',
      'Control the eccentric rather than letting the weight drop',
    ],
    commonMistakes: [
      'Lifting the hips to help finish the rep',
      'Using momentum instead of a controlled curl',
      'Cutting the range short at either end',
    ],
  },
  {
    id: 'adductor-machine',
    name: 'Adductor Machine',
    category: 'hypertrophy',
    primaryMuscles: ['adductors'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel steady tension along your inner thighs as your legs squeeze together, without strain anywhere else.',
    cues: [
      'Set the range so your legs start comfortably open',
      'Squeeze your legs together under control',
      'Pause briefly at full squeeze',
      'Keep the range within what feels controlled, and increase it gradually',
    ],
    commonMistakes: [
      'Starting from an aggressively wide range before it feels ready',
      'Using momentum to slam the pads together',
      'Rushing the return instead of controlling it',
    ],
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'hypertrophy',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your calves stretch fully at the bottom and squeeze hard at the top of every rep.',
    cues: [
      'Lower your heels until you feel a full stretch',
      'Rise as high onto your toes as possible',
      'Pause briefly at the top and squeeze',
      'Control the descent rather than dropping down',
    ],
    commonMistakes: [
      'Bouncing at the bottom instead of pausing',
      'Only using a short partial range',
      'Rushing reps so momentum replaces the calf squeeze',
    ],
  },

  // --- Tuesday / Friday: Core ---
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    category: 'hypertrophy',
    primaryMuscles: ['rectus abdominis'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your abs crunching and shortening through the range, not your hip flexors or shoulders pulling the weight.',
    cues: [
      'Kneel with the cable at your head or upper back',
      'Round your spine and crunch down using your abs',
      'Keep your hips still, do not sit back onto your heels',
      'Squeeze your abs hard at the bottom before returning',
    ],
    commonMistakes: [
      'Pulling with the arms instead of crunching with the abs',
      'Moving the hips back like a hip hinge rather than curling the spine',
      'Using so much weight the range gets cut short',
    ],
  },
  {
    id: 'hanging-knee-raise',
    name: 'Hanging Knee/Leg Raise',
    category: 'hypertrophy',
    primaryMuscles: ['rectus abdominis', 'hip flexors'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your lower abs curling your hips up, not just your hip flexors swinging your legs.',
    cues: [
      'Hang with a slight hollow position before you start',
      'Curl your hips up and back rather than just swinging the legs forward',
      'Raise your knees as high as you can control',
      'Lower with control instead of letting the legs drop and swing',
    ],
    commonMistakes: [
      'Using momentum and swinging instead of curling the hips',
      'Only lifting the legs from the hip flexors without curling the pelvis',
      'Kipping the whole body to move more reps',
    ],
  },

  // --- Wednesday: Upper B ---
  {
    id: 'pull-up',
    name: 'Pull-Up',
    category: 'strength',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper back'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your lats stretching at the bottom and driving your elbows down on the way up, with your biceps assisting.',
    cues: [
      'Start from a full hang with shoulder blades relaxed',
      'Initiate the pull by driving your elbows down and back',
      'Pull until your chin clears the bar',
      'Lower under control back to a full stretch',
    ],
    commonMistakes: [
      'Kipping or swinging to get the chin over the bar',
      'Only using a partial range at the top or bottom',
      'Letting the shoulders shrug up instead of the lats initiating',
    ],
  },
  {
    id: 'assisted-pull-up',
    name: 'Assisted Pull-Up',
    category: 'strength',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper back'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel the same lat stretch and pull as a standard pull up, just with the assistance taking the load off at the sticking points.',
    cues: [
      'Use only as much assistance as needed to complete full range reps',
      'Start from a full hang each rep',
      'Drive your elbows down and back to initiate the pull',
      'Lower under control rather than letting the assistance do the negative',
    ],
    commonMistakes: [
      'Using more assistance than needed and short changing the range',
      'Bouncing off the bottom of the assist platform',
      'Letting momentum from the platform substitute for the pull',
    ],
  },
  {
    id: 'chest-supported-row',
    name: 'Chest-Supported Row',
    category: 'hypertrophy',
    primaryMuscles: ['upper back', 'lats'],
    secondaryMuscles: ['biceps'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your upper back and lats squeezing the weight in, with no help from body swing since your chest is braced against the pad.',
    cues: [
      'Keep your chest pressed into the pad the entire set',
      'Row your elbows back and let your shoulder blades come together',
      'Pause briefly when the elbows reach your torso',
      'Control the weight back out to a full stretch',
    ],
    commonMistakes: [
      'Lifting the chest off the pad to use momentum',
      'Shrugging the shoulders instead of pulling with the back',
      'Cutting the stretch short on the way out',
    ],
  },
  {
    id: 'neutral-grip-lat-pulldown',
    name: 'Neutral-Grip Lat Pulldown',
    category: 'hypertrophy',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your lats stretching overhead and driving the pull down, not your arms doing most of the work.',
    cues: [
      'Lean back only slightly and keep your chest up',
      'Pull your elbows down toward your hips',
      'Drive the bar to your upper chest, squeezing your lats',
      'Let the weight rise under control to a full overhead stretch',
    ],
    commonMistakes: [
      'Leaning back excessively and turning it into a row',
      'Pulling mainly with the arms instead of the lats',
      'Using momentum from the torso to yank the bar down',
    ],
  },
  {
    id: 'single-arm-cable-row',
    name: 'Single-Arm Cable Row',
    category: 'hypertrophy',
    primaryMuscles: ['upper back', 'lats'],
    secondaryMuscles: ['biceps'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel one side of your back working through a full stretch and squeeze, without your torso rotating to help.',
    cues: [
      'Keep your torso square, resist rotating toward the cable',
      'Row your elbow back past your ribs',
      'Squeeze your shoulder blade at the end of the pull',
      'Return under control to a full stretch',
    ],
    commonMistakes: [
      'Rotating the torso to add momentum',
      'Using a short range instead of a full stretch and squeeze',
      'Letting the shoulder shrug up toward the ear',
    ],
  },
  {
    id: 'reverse-pec-deck',
    name: 'Reverse Pec Deck',
    category: 'hypertrophy',
    primaryMuscles: ['rear deltoid', 'upper back'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your rear delts and upper back squeezing together as your arms sweep back, not your arms pushing the pads.',
    cues: [
      'Set the seat so your arms start level with your shoulders',
      'Lead the movement with your elbows',
      'Sweep your arms back until your shoulder blades squeeze together',
      'Control the return to the stretched position',
    ],
    commonMistakes: [
      'Using so much weight the range shortens',
      'Pushing with straight, locked arms instead of leading with the elbows',
      'Letting momentum carry the arms instead of a controlled squeeze',
    ],
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    category: 'hypertrophy',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel a deep stretch in your biceps at the bottom and a full squeeze at the top.',
    cues: [
      'Let your arms hang straight down from the incline bench',
      'Curl without swinging your elbows forward',
      'Squeeze the biceps hard at the top of the curl',
      'Lower slowly to feel the full stretch',
    ],
    commonMistakes: [
      'Letting the elbows drift forward to reduce the stretch',
      'Using body momentum to swing the weight up',
      'Rushing the lowering phase and skipping the stretch',
    ],
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    category: 'hypertrophy',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel constant tension in your biceps through the whole range, since the cable never lets the weight rest.',
    cues: [
      'Keep your elbows pinned at your sides',
      'Curl up under control without swinging',
      'Squeeze at the top of the movement',
      'Lower slowly rather than letting the cable snap back',
    ],
    commonMistakes: [
      'Swinging the torso to help lift the weight',
      'Letting the elbows drift forward or back',
      'Only working the top half of the range',
    ],
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    category: 'hypertrophy',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your biceps stretch fully at the bottom and contract fully at the top of each rep.',
    cues: [
      'Keep your elbows close to your torso throughout',
      'Curl the dumbbells up without swinging your shoulders',
      'Squeeze the biceps at the top',
      'Lower under control to a full stretch',
    ],
    commonMistakes: [
      'Using body swing or momentum to move the weight',
      'Letting the elbows drift forward as the weight gets heavy',
      'Cutting the bottom stretch short',
    ],
  },
  {
    id: 'ab-wheel',
    name: 'Ab Wheel',
    category: 'hypertrophy',
    primaryMuscles: ['rectus abdominis', 'deep core'],
    secondaryMuscles: ['shoulders'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your entire ab wall bracing hard to control the rollout and pull you back, with no strain in your lower back.',
    cues: [
      'Brace your abs hard before you start rolling',
      'Roll out only as far as you can keep your lower back from sagging',
      'Keep your hips from arching down as you extend',
      'Pull back in using your abs, not just momentum',
    ],
    commonMistakes: [
      'Letting the lower back sag or arch during the rollout',
      'Rolling out further than current strength allows',
      'Using the hip flexors to yank back in instead of the abs',
    ],
  },

  // --- Thursday: Easy Aerobic Warm-Up ---
  {
    id: 'easy-aerobic-warm-up',
    name: 'Easy Aerobic Warm-Up (Cycling)',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['legs'],
    progressionType: 'none',
  },

  // --- Thursday: Mobility ---
  {
    id: 'mobility-flow',
    name: 'Mobility Flow',
    category: 'mobility',
    primaryMuscles: ['hips', 'ankles', 'shoulders', 'thoracic spine', 'wrists'],
    secondaryMuscles: [],
    progressionType: 'none',
  },

  // --- Thursday: Resilience / Control ---
  {
    id: 'single-leg-glute-bridge',
    name: 'Single-Leg Glute Bridge',
    category: 'rehabilitation-prehab',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your glute driving the lift on the working leg, with your hips staying level and square.',
    cues: [
      'Keep your working foot flat and drive through the heel',
      'Squeeze the glute hard at the top',
      'Keep your hips level, do not let the free side drop or rotate',
      'Lower under control rather than dropping down',
    ],
    commonMistakes: [
      'Letting the hips rotate or tilt toward the non working side',
      'Overarching the lower back to gain height',
      'Pushing through the toes instead of the heel',
    ],
  },
  {
    id: 'tibialis-raise',
    name: 'Tibialis Raise',
    category: 'rehabilitation-prehab',
    primaryMuscles: ['tibialis anterior'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel the front of your shin working as your toes pull up toward your knee.',
    cues: [
      'Keep your heel planted and pull your toes up',
      'Move through a full range you can control',
      'Pause briefly at the top of each rep',
      'Lower slowly rather than letting the foot drop',
    ],
    commonMistakes: [
      'Using only a small, rushed range of motion',
      'Letting the heel roll or lift off the ground',
      'Moving too fast to control the lowering phase',
    ],
  },
  {
    id: 'calf-raise',
    name: 'Calf Raise',
    category: 'hypertrophy',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your calves stretch at the bottom and squeeze fully at the top of every rep.',
    cues: [
      'Lower your heels until you feel a full stretch',
      'Push up as high onto your toes as possible',
      'Pause and squeeze at the top',
      'Control the descent instead of dropping',
    ],
    commonMistakes: [
      'Bouncing out of the bottom stretch',
      'Using a short, partial range',
      'Rushing reps so the calf never fully contracts',
    ],
  },
  {
    id: 'scapular-pull-up',
    name: 'Scapular Pull-Up',
    category: 'calisthenics',
    primaryMuscles: ['scapular stabilizers', 'lats'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your shoulder blades doing the work as they pull down and together, with your arms staying essentially straight.',
    cues: [
      'Hang with arms straight from the bar',
      'Pull your shoulder blades down and together without bending your elbows',
      'Let your body rise slightly from the scapular movement alone',
      'Lower under control back to a full hang',
    ],
    commonMistakes: [
      'Bending the elbows and turning it into a small pull up',
      'Moving too fast to feel the shoulder blades work',
      'Shrugging up toward the ears instead of pulling down',
    ],
  },
  {
    id: 'dead-hang',
    name: 'Dead Hang',
    category: 'calisthenics',
    primaryMuscles: ['forearms', 'grip'],
    secondaryMuscles: ['lats', 'shoulders'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your grip and forearms working to hold on, with a light stretch through your lats and shoulders.',
    cues: [
      'Hang with a relaxed but full grip on the bar',
      'Let your shoulders stretch, but keep them gently engaged, not fully collapsed',
      'Breathe steadily throughout the hold',
      'Build hang time gradually rather than forcing a longer hold',
    ],
    commonMistakes: [
      'Fully collapsing the shoulders into the joint',
      'Holding the breath instead of breathing through it',
      'Chasing a longer time than the grip can control',
    ],
  },

  // --- Thursday: L-Sit Practice ---
  {
    id: 'l-sit',
    name: 'L-Sit',
    category: 'calisthenics',
    primaryMuscles: ['hip flexors', 'core'],
    secondaryMuscles: ['shoulders', 'triceps'],
    progressionType: 'progression-chain',
    progressionChainId: 'l-sit-progression',
    intendedFeeling:
      'You should feel your core and hip flexors holding your legs up while your shoulders stay depressed and compressed, not shrugged toward your ears.',
    cues: [
      'Push down hard through your hands to depress your shoulders',
      'Keep your shoulder blades pulled down, away from your ears',
      'Brace your abs and keep a posterior pelvic tilt',
      'Work the easiest progression that still challenges the hold, and progress only when it is controlled',
    ],
    commonMistakes: [
      'Shrugging the shoulders up instead of depressing them',
      'Letting the lower back arch to help lift the legs',
      'Jumping to a harder progression before the current one is controlled',
    ],
  },

  // --- Friday: Power ---
  {
    id: 'pogos',
    name: 'Pogos',
    category: 'power',
    primaryMuscles: ['calves'],
    secondaryMuscles: ['ankles'],
    progressionType: 'none',
  },
  {
    id: 'box-jump',
    name: 'Box Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
  },
  {
    id: 'standing-broad-jump',
    name: 'Standing Broad Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
  },

  // --- Friday: Strength ---
  {
    id: 'trap-bar-deadlift',
    name: 'Trap-Bar Deadlift',
    category: 'hypertrophy',
    primaryMuscles: ['glutes', 'hamstrings', 'quadriceps'],
    secondaryMuscles: ['lower back'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your glutes, hamstrings, and quads driving the lift together, with your torso staying rigid throughout.',
    cues: [
      'Set your hips and shoulders in position before you pull',
      'Push the floor away with your legs to start the lift',
      'Keep the bar close to your body throughout',
      'Stand tall at the top, squeezing your glutes, without leaning back',
    ],
    commonMistakes: [
      'Rounding the lower back to start the pull',
      'Letting the hips shoot up first, turning it into a stiff leg pull',
      'Hyperextending the lower back at lockout',
    ],
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your quads and glutes working through a deep, controlled range, especially near the bottom.',
    cues: [
      'Lower the sled until your knees reach a deep, controlled range',
      'Keep your lower back flat against the pad',
      'Drive through your whole foot to press back up',
      'Avoid locking your knees out hard at the top',
    ],
    commonMistakes: [
      'Only using a short partial range',
      'Letting the lower back round off the pad at the bottom',
      'Slamming the knees straight and locking out hard at the top',
    ],
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse Lunge',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    progressionType: 'double-progression',
    intendedFeeling:
      "You should feel your front leg's quad and glute controlling the descent and driving you back up.",
    cues: [
      'Step back and lower your back knee toward the floor under control',
      'Keep your front shin close to vertical',
      'Drive through your front heel to return to standing',
      'Keep your torso upright throughout',
    ],
    commonMistakes: [
      'Letting the front knee cave inward',
      'Pushing off the back leg instead of the front',
      'Taking too short a step and cutting the range short',
    ],
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    category: 'hypertrophy',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    progressionType: 'double-progression',
    intendedFeeling:
      "You should feel your front leg's quad and glute doing the work on each step, with your torso staying upright and controlled.",
    cues: [
      'Step far enough forward that your front shin stays close to vertical',
      'Lower your back knee toward the floor under control',
      'Drive through your front heel to stand and step into the next rep',
      'Keep your torso tall rather than leaning forward',
    ],
    commonMistakes: [
      'Taking short, choppy steps that limit range',
      'Letting the front knee cave inward',
      'Bouncing off the back leg instead of pressing through the front',
    ],
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    category: 'hypertrophy',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your hamstrings contracting through the full range, from full stretch to full squeeze.',
    cues: [
      'Set the pad position so it contacts just above your heels',
      'Curl through a full range under control',
      'Squeeze hard at the top of the curl',
      'Control the return to the stretch rather than letting it drop',
    ],
    commonMistakes: [
      'Using short, bouncy partial reps',
      'Lifting the hips to move more weight',
      'Letting the weight drop on the way back instead of controlling it',
    ],
  },
  {
    id: 'hip-abduction',
    name: 'Hip Abduction',
    category: 'hypertrophy',
    primaryMuscles: ['glute medius'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel the side of your hip working as your legs press outward, not your lower back or inner thigh.',
    cues: [
      'Sit tall with your back flat against the pad',
      'Press your knees outward under control',
      'Pause briefly at the widest point',
      'Return slowly rather than letting the pads snap back',
    ],
    commonMistakes: [
      'Leaning the torso to help push the weight',
      'Using a fast, bouncing motion instead of a controlled press',
      'Only using a short range of motion',
    ],
  },

  // --- Saturday: Planche ---
  {
    id: 'pseudo-planche-push-up',
    name: 'Pseudo-Planche Push-Up',
    category: 'calisthenics',
    primaryMuscles: ['chest', 'shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your chest and shoulders taking on extra load as your hands sit back near your hips, with your core braced throughout.',
    cues: [
      'Position your hands back near your hip line, fingers pointing toward your feet',
      'Lean your shoulders forward past your hands',
      'Keep your core braced and body in a straight line',
      'Lower under control and press back up without losing the lean',
    ],
    commonMistakes: [
      'Not leaning forward enough to load the chest and shoulders',
      'Letting the hips sag instead of staying braced',
      'Flaring the elbows out wide instead of keeping them controlled',
    ],
  },

  // --- Saturday: Hypertrophy ---
  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    category: 'hypertrophy',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your shoulders driving the press through the full range, with your triceps assisting at lockout.',
    cues: [
      'Set the seat so the handles start level with your shoulders',
      'Press up without shrugging your shoulders toward your ears',
      'Extend fully at the top without locking out aggressively',
      'Lower under control to a full stretch',
    ],
    commonMistakes: [
      'Shrugging the traps to help start the press',
      'Only using the top half of the range',
      'Rushing the lowering phase',
    ],
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'hypertrophy',
    primaryMuscles: ['upper back', 'lats'],
    secondaryMuscles: ['biceps'],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your upper back and lats squeezing together as you row, with your torso staying upright and still.',
    cues: [
      'Sit tall with a slight forward lean at the start',
      'Row your elbows back and squeeze your shoulder blades together',
      'Keep your torso still, do not rock back and forth',
      'Control the return to a full stretch',
    ],
    commonMistakes: [
      'Rocking the torso to add momentum',
      'Shrugging the shoulders instead of pulling with the back',
      'Cutting the stretch short at the front of the movement',
    ],
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear-Delt Fly',
    category: 'hypertrophy',
    primaryMuscles: ['rear deltoid'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel your rear delts working as your arms sweep back and out, not your traps or lower back.',
    cues: [
      'Hinge forward slightly and let your arms hang',
      'Lead the movement with your elbows',
      'Sweep your arms out and back until your shoulder blades come together',
      'Control the return rather than letting the weight drop',
    ],
    commonMistakes: [
      'Using momentum from the lower back to swing the weight',
      'Shrugging the traps instead of isolating the rear delts',
      'Cutting the range short at the top',
    ],
  },
  {
    id: 'triceps-pressdown',
    name: 'Triceps Pressdown',
    category: 'hypertrophy',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    intendedFeeling:
      'You should feel the stretch and contraction concentrated in your triceps as your forearms extend.',
    cues: [
      'Pin your elbows at your sides and keep them still',
      'Press down until your arms are fully extended',
      'Squeeze the triceps hard at full extension',
      'Control the return to a full stretch',
    ],
    commonMistakes: [
      'Letting the elbows drift away from the body',
      'Using the shoulders to help push the weight down',
      'Cutting the stretch short at the top of the movement',
    ],
  },

  // --- Saturday: Optional Zone 2 ---
  {
    id: 'zone-2-cardio',
    name: 'Zone 2 Cardio (Cycling Preferred)',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['legs'],
    progressionType: 'none',
  },
];

export function findExerciseById(exerciseId: string): Exercise | undefined {
  return EXERCISE_CATALOG.find((exercise) => exercise.id === exerciseId);
}
