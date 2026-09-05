import type { CatalogExercise } from '../program-types';

/**
 * Cardio exercise library (R10). Preserves "Easy Aerobic Warm-Up (Cycling)"
 * and "Zone 2 Cardio (Cycling Preferred)" from the pre-R10 catalog (name/
 * category/muscles/progression untouched, no guidance existed before so it
 * is written fresh here), adding muscleGroup, equipment, and
 * defaultPrescription. Every other entry is new library content: machine
 * cardio and swimming. No running, jogging, treadmill, or walking entries
 * live here or anywhere in the catalog; the paste-format program's own
 * "Easy Cycling" line matches the entry below by name.
 */
export const CARDIO_EXERCISES: CatalogExercise[] = [
  // --- Preserved ---
  {
    id: 'easy-aerobic-warm-up-cycling',
    name: 'Easy Aerobic Warm-Up (Cycling)',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['quadriceps', 'calves'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Easy, conversational pace cycling to raise heart rate and blood flow before training.',
      approxMinMinutes: 6,
      approxMaxMinutes: 10,
    },
    intendedFeeling:
      'You should feel your legs and heart rate gradually warming up at a completely conversational pace, never breathless or fatigued going into the workout.',
    cues: [
      'Keep the effort easy enough to hold a full conversation',
      'Use a light resistance, this is a warm-up, not a workout',
      'Let your pace build gradually rather than starting hard',
      'Finish feeling warm and loose, not fatigued',
    ],
    commonMistakes: [
      'Riding hard enough to create real fatigue before training',
      'Using heavy resistance instead of an easy spin',
      'Skipping it and going straight into loaded work cold',
    ],
  },
  {
    id: 'zone-2-cardio-cycling-preferred',
    name: 'Zone 2 Cardio (Cycling Preferred)',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['quadriceps', 'calves'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Steady, conversational-pace aerobic work, cycling preferred, to build aerobic capacity without adding leg fatigue.',
      approxMinMinutes: 30,
      approxMaxMinutes: 45,
    },
    intendedFeeling:
      'You should feel a steady, sustainable effort you could hold for a long time, breathing comfortably through your nose or in full sentences, with your legs finishing fresh rather than fatigued.',
    cues: [
      'Keep the effort conversational throughout, not breathless',
      'Cycling is preferred over other modalities to keep leg fatigue low',
      'Hold a steady, even effort rather than surging',
      'Only add this session when recovery from lifting and Ultimate is good',
    ],
    commonMistakes: [
      'Riding hard enough to add meaningful leg fatigue for the next session',
      'Letting the pace drift up out of conversational effort',
      'Adding this on a day when recovery is already compromised',
    ],
  },

  // --- Required named entry ---
  {
    id: 'easy-cycling',
    name: 'Easy Cycling',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['quadriceps', 'calves'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Comfortable, conversational-pace cycling to support recovery and aerobic base.',
      approxMinMinutes: 15,
      approxMaxMinutes: 30,
    },
    intendedFeeling:
      'You should feel a light, comfortable spin that leaves your legs feeling refreshed rather than fatigued, breathing easily the entire time.',
    cues: [
      'Keep the effort at a fully conversational pace',
      'Use a light resistance rather than grinding against a heavy gear',
      'Keep cadence smooth and relaxed',
      'Stop before any real fatigue sets into the legs',
    ],
    commonMistakes: [
      'Letting the pace creep up past a conversational effort',
      'Using resistance heavy enough to fatigue the legs',
      'Turning an easy session into unplanned interval work',
    ],
  },

  // --- Machine cardio ---
  {
    id: 'stationary-bike',
    name: 'Stationary Bike',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['quadriceps', 'calves'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Steady-state cycling at a self-selected, sustainable effort.',
      approxMinMinutes: 15,
      approxMaxMinutes: 30,
    },
    intendedFeeling:
      'You should feel a smooth, sustainable effort through your legs and lungs that you could maintain for the full duration without straining.',
    cues: [
      'Set the seat height so your knee has a slight bend at full extension',
      'Keep your effort steady rather than surging up and down',
      'Maintain a smooth, relaxed cadence',
      'Keep your upper body relaxed rather than gripping the handlebars hard',
    ],
    commonMistakes: [
      'Setting resistance so high the effort becomes strength work instead of cardio',
      'Letting effort spike well beyond the intended intensity',
      'Slouching heavily over the handlebars for the whole session',
    ],
    substitutions: ['assault-bike', 'easy-cycling'],
  },
  {
    id: 'assault-bike',
    name: 'Assault Bike',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['quadriceps', 'shoulders'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Steady-state pace using both arms and legs at a sustainable, controlled effort.',
      approxMinMinutes: 10,
      approxMaxMinutes: 20,
    },
    intendedFeeling:
      'You should feel your legs and arms sharing the workload at a pace you can sustain smoothly for the intended duration.',
    cues: [
      'Drive with both arms and legs together in a smooth rhythm',
      'Keep your chest relatively tall rather than hunching forward',
      'Hold a steady, sustainable pace rather than starting too hard',
      'Breathe rhythmically with the pedal stroke',
    ],
    commonMistakes: [
      'Starting too hard and fading well before the intended duration',
      'Letting the arms go passive and relying only on the legs',
      'Gripping the handles so tightly it fatigues the forearms unnecessarily',
    ],
    substitutions: ['stationary-bike'],
  },
  {
    id: 'rowing-machine',
    name: 'Rowing Machine',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['upper back', 'quadriceps', 'lats'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Steady-state rowing at a sustainable pace with clean stroke mechanics.',
      approxMinMinutes: 15,
      approxMaxMinutes: 25,
    },
    intendedFeeling:
      'You should feel a smooth sequence of legs, then hips, then arms on every stroke, with your cardiovascular system working steadily rather than your arms burning out.',
    cues: [
      'Drive with your legs first, then hinge your hips, then pull with your arms',
      'Reverse the order on the way back: arms, hips, then legs',
      'Keep the stroke rate controlled rather than rushed',
      'Keep your back flat rather than rounding through the stroke',
    ],
    commonMistakes: [
      'Pulling mainly with the arms instead of sequencing from the legs',
      'Rounding the lower back at the catch position',
      'Rushing the stroke rate at the expense of clean mechanics',
    ],
    substitutions: ['ski-erg', 'zone-2-rowing'],
  },
  {
    id: 'ski-erg',
    name: 'Ski Erg',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['lats', 'triceps', 'core'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Steady-state pulling at a sustainable pace using the full body.',
      approxMinMinutes: 10,
      approxMaxMinutes: 20,
    },
    intendedFeeling:
      'You should feel your lats and core driving each pull in a smooth rhythm with your legs, at an effort you could sustain for the full duration.',
    cues: [
      'Hinge from the hips and drive down through your lats on each pull',
      'Let your legs assist by bending slightly on the pull',
      'Keep the rhythm steady rather than rushing the cadence',
      'Stand tall and reset fully at the top of each stroke',
    ],
    commonMistakes: [
      'Pulling only with the arms instead of the lats and hips',
      'Rushing the cadence and losing a full range of motion',
      'Rounding the lower back heavily on every pull',
    ],
    substitutions: ['rowing-machine'],
  },
  {
    id: 'elliptical',
    name: 'Elliptical',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['quadriceps', 'glutes'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Low-impact steady-state cardio at a sustainable, conversational effort.',
      approxMinMinutes: 15,
      approxMaxMinutes: 30,
    },
    intendedFeeling:
      'You should feel a smooth, low-impact effort through your legs at a pace you could sustain for the full session without joint discomfort.',
    cues: [
      'Keep an upright posture rather than leaning heavily on the handles',
      'Use a smooth, even stride rather than short choppy steps',
      'Engage the arms lightly if the machine has moving handles',
      'Keep effort steady rather than spiking it repeatedly',
    ],
    commonMistakes: [
      'Leaning most of your bodyweight onto the handles',
      'Letting resistance or incline turn the session into strength work',
      'Using a stride length that feels unnatural or forced',
    ],
  },
  {
    id: 'stair-climber',
    name: 'Stair Climber',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['quadriceps', 'glutes', 'calves'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Steady-state stepping at a sustainable, controlled pace.',
      approxMinMinutes: 12,
      approxMaxMinutes: 20,
    },
    intendedFeeling:
      'You should feel a steady effort through your legs with each step under control, standing tall rather than hunched over the rails.',
    cues: [
      'Stand upright and avoid leaning heavily on the rails',
      'Take full steps rather than short, rapid ones',
      'Keep a steady pace you can sustain for the full duration',
      'Use the rails for light balance only, not to take weight off your legs',
    ],
    commonMistakes: [
      'Leaning on the rails and taking load off the legs',
      'Taking short, rushed steps that reduce the range of motion',
      'Starting at a pace too fast to sustain for the intended duration',
    ],
  },
  {
    id: 'swimming',
    name: 'Swimming',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['lats', 'shoulders', 'core'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['other'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Continuous, easy-paced swimming to build aerobic capacity with minimal joint impact.',
      approxMinMinutes: 20,
      approxMaxMinutes: 30,
    },
    intendedFeeling:
      'You should feel a steady, rhythmic effort through your whole body with controlled breathing, never gasping or straining for air.',
    cues: [
      'Keep your stroke rate steady and controlled rather than rushed',
      'Breathe on a consistent, comfortable rhythm',
      'Keep your body position long and relatively flat in the water',
      'Choose a stroke you can sustain smoothly for the full session',
    ],
    commonMistakes: [
      'Starting too fast and losing form in the back half of the session',
      'Holding the breath instead of exhaling steadily underwater',
      'Letting the hips sink instead of maintaining a long body line',
    ],
  },
  {
    id: 'zone-2-rowing',
    name: 'Zone 2 Rowing',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['upper back', 'quadriceps', 'lats'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Extended, conversational-pace rowing to build aerobic capacity without excess fatigue.',
      approxMinMinutes: 25,
      approxMaxMinutes: 40,
    },
    intendedFeeling:
      'You should feel a steady, sustainable effort with clean stroke mechanics throughout, breathing comfortably at a conversational pace the entire time.',
    cues: [
      'Keep the pace conversational throughout, never approaching a sprint effort',
      'Maintain the same clean leg, hip, arm sequence for every stroke',
      'Hold a consistent split rather than surging',
      'Finish feeling like you could have continued, not depleted',
    ],
    commonMistakes: [
      'Letting the pace drift into a harder effort than intended',
      'Letting stroke mechanics break down as duration increases',
      'Turning it into interval work instead of one steady effort',
    ],
    substitutions: ['rowing-machine'],
  },
  {
    id: 'bike-intervals',
    name: 'Bike Intervals',
    category: 'cardio',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['quadriceps', 'calves'],
    progressionType: 'none',
    muscleGroup: 'cardio',
    equipment: ['cardio-machine'],
    defaultPrescription: {
      type: 'qualitative',
      description: 'Easy work-to-recovery intervals on the bike, moderately harder efforts with full recovery between, not maximal sprints.',
      approxMinMinutes: 15,
      approxMaxMinutes: 25,
    },
    intendedFeeling:
      'You should feel your effort rise in a controlled way during each work interval and drop back to easy during recovery, never gasping or grinding to failure.',
    cues: [
      'Raise effort to a moderately hard, controlled pace, not an all-out sprint',
      'Take full recovery at an easy pace between work intervals',
      'Keep every work interval at a similar, repeatable effort',
      'Stop the session if effort quality clearly starts declining',
    ],
    commonMistakes: [
      'Treating the work intervals as maximal sprints',
      'Cutting recovery short between intervals',
      'Letting the last few intervals fall apart instead of stopping the session',
    ],
    substitutions: ['stationary-bike'],
  },
];
