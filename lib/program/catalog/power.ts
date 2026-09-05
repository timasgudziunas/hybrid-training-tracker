import type { CatalogExercise } from '../program-types';

/**
 * Power exercise library (R10). Preserves Box Jump and Standing Broad Jump
 * from the pre-R10 catalog verbatim (name/category/muscles/progression/
 * guidance untouched), adding only muscleGroup, equipment, and
 * defaultPrescription. "Pogos" is renamed to "Pogo Jump" (id pogo-jump)
 * per the R10 authoring brief, keeping its other fields. Every other entry
 * is new library content: jumps, bounds, and medicine ball throws. Power
 * work is never a fatigue-chasing exercise (TRAINING_SYSTEM.md), so every
 * default prescription here is low volume with full recovery implied.
 * No sprints, accelerations, shuttles, or running drills live here or
 * anywhere in the catalog.
 */
export const POWER_EXERCISES: CatalogExercise[] = [
  // --- Preserved / renamed ---
  {
    id: 'pogo-jump',
    name: 'Pogo Jump',
    category: 'power',
    primaryMuscles: ['calves'],
    secondaryMuscles: ['ankles'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['bodyweight'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel quick, elastic bounces off the ground through your calves and ankles, with almost no time spent on the ground and no bend in your knees.',
    cues: [
      'Keep your legs mostly straight and bounce from the ankles',
      'Minimize ground contact time on every bounce',
      'Stay tall through your torso',
      'Keep the bounces light and quick rather than trying to jump high',
    ],
    commonMistakes: [
      'Bending the knees and turning it into a squat jump',
      'Spending too long on the ground between bounces',
      'Letting the bounces get sloppy as fatigue sets in',
    ],
  },
  {
    id: 'box-jump',
    name: 'Box Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['box'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel a forceful, coordinated extension through your hips, knees, and ankles as you leave the ground, landing softly on top of the box.',
    cues: [
      'Swing your arms and load your hips before jumping',
      'Jump explosively and land softly with knees slightly bent',
      'Land in a position you could immediately jump again from',
      'Step down between reps rather than jumping back off the box',
    ],
    commonMistakes: [
      'Choosing a box height that requires excessive knee tucking',
      'Landing stiff legged instead of absorbing the landing',
      'Jumping down off the box, adding unnecessary landing stress',
    ],
    substitutions: ['seated-box-jump'],
  },
  {
    id: 'standing-broad-jump',
    name: 'Standing Broad Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['bodyweight'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel your hips and legs driving forward and up together, finishing in a stable, controlled landing rather than stumbling forward.',
    cues: [
      'Swing your arms back and load your hips before jumping',
      'Drive forward and up, extending fully through the hips',
      'Land with knees bent and absorb the landing quietly',
      'Reset fully and rest between every rep',
    ],
    commonMistakes: [
      'Rushing the landing and stumbling forward out of position',
      'Only using the legs without the arm swing to help drive the jump',
      'Chaining jumps together without resetting, turning it into conditioning',
    ],
  },

  // --- Required named entries ---
  {
    id: 'lateral-bound',
    name: 'Lateral Bound',
    category: 'power',
    primaryMuscles: ['glutes', 'quadriceps'],
    secondaryMuscles: ['adductors', 'calves'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['bodyweight'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5, perSide: true },
    intendedFeeling:
      'You should feel your hip and outer leg driving you sideways and your landing leg absorbing the force under control, sticking the landing before bounding back.',
    cues: [
      'Push powerfully off the outside leg to drive sideways',
      'Land on the opposite leg and stick it under control',
      'Keep your chest up rather than collapsing forward on landing',
      'Pause and reset before bounding back the other direction',
    ],
    commonMistakes: [
      'Landing with a stiff knee instead of absorbing the impact',
      'Rushing straight into the next bound without resetting',
      'Turning it into a hop with minimal sideways distance',
    ],
  },
  {
    id: 'dynamic-power-warm-up',
    name: 'Dynamic Power Warm-Up',
    category: 'power',
    primaryMuscles: ['full body'],
    secondaryMuscles: [],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['bodyweight'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Prepare ankles, hips, knees, and the nervous system for explosive jumping.',
      items: ['Skips', 'Pogo hops', 'Hip openers', 'A few progressive practice jumps'],
      approxMinMinutes: 8,
      approxMaxMinutes: 10,
    },
    intendedFeeling:
      'You should feel your ankles, hips, and nervous system progressively waking up, finishing the warm-up feeling springy and ready to jump, not fatigued.',
    cues: [
      'Start easy and build intensity gradually through the warm-up',
      'Use the pogo hops to prime quick, elastic ground contacts',
      'Finish with a couple of progressively harder practice jumps',
      'Stop once you feel springy, do not turn this into conditioning',
    ],
    commonMistakes: [
      'Going near maximal effort too early in the warm-up',
      'Skipping straight to full-effort jumps with no gradual build',
      'Doing so much volume that it fatigues the legs before the working sets',
    ],
  },

  // --- Jumps ---
  {
    id: 'depth-jump',
    name: 'Depth Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['box'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel a fast, reactive transition from landing straight into a jump, with minimal time spent absorbing the drop before exploding upward.',
    cues: [
      'Step off the box, do not jump off it',
      'Land and immediately explode back upward',
      'Minimize ground contact time between the landing and the jump',
      'Use a modest box height that keeps the contact fast and reactive',
    ],
    commonMistakes: [
      'Using a box too high, turning the landing into a slow absorption',
      'Pausing on the ground before jumping instead of reacting immediately',
      'Jumping off the box rather than stepping off',
    ],
  },
  {
    id: 'seated-box-jump',
    name: 'Seated Box Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: [],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['box'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel your hips and quads producing force from a dead stop, with no countermovement or stretch reflex to rely on.',
    cues: [
      'Sit tall on a low box or bench with feet flat',
      'Swing your arms and jump explosively from a complete stop',
      'Avoid rocking forward before the jump initiates',
      'Land softly with knees bent on the target box',
    ],
    commonMistakes: [
      'Rocking forward to build momentum before the jump',
      'Choosing a landing box too high for a controlled landing',
      'Standing up slightly before jumping instead of exploding from seated',
    ],
  },
  {
    id: 'hurdle-hop',
    name: 'Hurdle Hop',
    category: 'power',
    primaryMuscles: ['calves', 'quadriceps'],
    secondaryMuscles: ['glutes'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['other'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel quick, elastic hops clearing each hurdle with minimal ground contact time, staying tall rather than collapsing at the hips.',
    cues: [
      'Keep ground contact time short between hurdles',
      'Stay tall through your torso rather than folding at the hips',
      'Use your arms to help drive the rhythm',
      'Reset and rest fully between sets of hurdles',
    ],
    commonMistakes: [
      'Spending too long on the ground between each hop',
      'Bending at the hips to clear the hurdle instead of jumping cleanly',
      'Chaining too many hurdles together and turning it into conditioning',
    ],
  },
  {
    id: 'single-leg-hop',
    name: 'Single-Leg Hop',
    category: 'power',
    primaryMuscles: ['calves', 'quadriceps'],
    secondaryMuscles: ['glutes'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['bodyweight'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5, perSide: true },
    intendedFeeling:
      'You should feel one leg producing and absorbing all the force, with your hip and ankle staying stable rather than wobbling on landing.',
    cues: [
      'Hop forward on one leg and stick the landing under control',
      'Keep your hips square rather than rotating on landing',
      'Reset fully between reps rather than chaining hops together',
      'Match volume evenly across both legs',
    ],
    commonMistakes: [
      'Letting the landing knee cave inward',
      'Chaining hops together instead of resetting each rep',
      'Favoring one leg with noticeably more volume than the other',
    ],
  },
  {
    id: 'tuck-jump',
    name: 'Tuck Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['core'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['bodyweight'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel a forceful vertical extension followed by a quick knee tuck, landing softly and under control each rep.',
    cues: [
      'Jump straight up and drive your knees toward your chest',
      'Extend your legs back out before landing',
      'Land softly with knees bent, absorbing the impact',
      'Reset fully between reps',
    ],
    commonMistakes: [
      'Leaning forward excessively to help tuck the knees',
      'Landing stiff legged instead of absorbing the impact',
      'Chaining reps rapidly instead of resetting each one',
    ],
  },
  {
    id: 'squat-jump',
    name: 'Squat Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['bodyweight'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel your quads and glutes driving a full, explosive extension from a squat position, with a soft, controlled landing.',
    cues: [
      'Lower to a comfortable squat depth before exploding upward',
      'Extend fully through the hips, knees, and ankles',
      'Land softly back into the same squat depth',
      'Reset fully between reps rather than bouncing continuously',
    ],
    commonMistakes: [
      'Only using a shallow dip before jumping, losing power output',
      'Landing with locked knees instead of absorbing the impact',
      'Turning it into continuous bouncing instead of discrete reps',
    ],
    substitutions: ['countermovement-jump'],
  },
  {
    id: 'countermovement-jump',
    name: 'Countermovement Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['bodyweight'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel a quick, elastic dip immediately followed by a maximal upward jump, using the stretch reflex rather than a slow controlled squat.',
    cues: [
      'Use a quick, shallow dip rather than a slow deep squat',
      'Swing your arms up as you jump',
      'Jump for maximum height each rep',
      'Land softly and reset fully before the next rep',
    ],
    commonMistakes: [
      'Turning the dip into a slow squat instead of a quick countermovement',
      'Skipping the arm swing, which reduces jump height',
      'Rushing between reps instead of resetting fully',
    ],
    substitutions: ['squat-jump'],
  },
  {
    id: 'split-jump',
    name: 'Split Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hip flexors'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['bodyweight'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5, perSide: true },
    intendedFeeling:
      'You should feel both legs producing force explosively from a split stance, landing back in the same split with control, front leg leading the drive.',
    cues: [
      'Start in a staggered split stance',
      'Jump explosively straight up, keeping the same split in the air',
      'Land back in the same split stance under control',
      'Swap the lead leg between sets',
    ],
    commonMistakes: [
      'Switching legs in the air instead of landing in the same split',
      'Leaning too far forward and losing balance on landing',
      'Only training one lead leg and neglecting the other',
    ],
  },
  {
    id: 'trap-bar-jump',
    name: 'Trap Bar Jump',
    category: 'power',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['calves'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['trap-bar'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel your hips and legs driving an explosive jump against light external load, feeling powerful rather than heavy or grinding.',
    cues: [
      'Use a light load that does not slow the jump down',
      'Set up the same way you would for a trap bar deadlift',
      'Drive through the floor explosively and let your feet leave the ground',
      'Land softly with the bar under control',
    ],
    commonMistakes: [
      'Loading the bar too heavy, turning it into a slow grinding lift',
      'Landing stiff legged with the added load',
      'Rushing the setup between reps instead of resetting position',
    ],
  },

  // --- Medicine ball throws ---
  {
    id: 'medicine-ball-chest-pass',
    name: 'Medicine Ball Chest Pass',
    category: 'power',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps', 'core'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['medicine-ball'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 3, maxReps: 5 },
    intendedFeeling:
      'You should feel a fast, forceful extension through your chest and arms as you release the ball explosively away from your body.',
    cues: [
      'Hold the ball at chest height before the throw',
      'Extend your arms explosively and release the ball forcefully',
      'Follow through fully with your arms after release',
      'Reset fully and rest between every throw',
    ],
    commonMistakes: [
      'Pushing the ball slowly instead of releasing it explosively',
      'Using mostly the arms without any chest and torso drive',
      'Rushing between throws without full recovery',
    ],
  },
  {
    id: 'medicine-ball-slam',
    name: 'Medicine Ball Slam',
    category: 'power',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders', 'lats'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['medicine-ball'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
    intendedFeeling:
      'You should feel your core and shoulders driving a full, forceful extension overhead before slamming down explosively through your torso.',
    cues: [
      'Raise the ball fully overhead before the slam',
      'Drive through your core and lats to slam the ball down forcefully',
      'Let your knees bend to absorb the finish rather than staying rigid',
      'Reset your stance between every rep',
    ],
    commonMistakes: [
      'Slamming mostly with the arms instead of the torso',
      'Rounding the lower back excessively on the follow through',
      'Rushing reps without resetting between each one',
    ],
  },
  {
    id: 'medicine-ball-rotational-throw',
    name: 'Medicine Ball Rotational Throw',
    category: 'power',
    primaryMuscles: ['obliques'],
    secondaryMuscles: ['shoulders', 'hips'],
    progressionType: 'none',
    muscleGroup: 'full-body',
    equipment: ['medicine-ball'],
    defaultPrescription: { type: 'repetitions', sets: 3, minReps: 4, maxReps: 6, perSide: true },
    intendedFeeling:
      'You should feel a fast rotation driven from your hips through your obliques, finishing with an explosive release out to the side.',
    cues: [
      'Start rotated away from the target direction to load the hips',
      'Rotate explosively through your hips and torso',
      'Release the ball at the point of maximum rotational speed',
      'Train both directions evenly across sets',
    ],
    commonMistakes: [
      'Rotating only through the arms without hip drive',
      'Releasing too early before reaching full rotational speed',
      'Only training one throwing direction',
    ],
  },
];
