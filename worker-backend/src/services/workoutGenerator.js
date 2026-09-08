const EXERCISE_DETAILS = {
  "Squat": {
    basics: ["Stand with feet shoulder-width apart","Push hips back and bend knees","Lower until thighs parallel to the floor","Drive through heels to stand"],
    cues: "Chest up, spine neutral, knees track over toes"
  },
  "Push-Up": {
    basics: ["Hands slightly wider than shoulders","Body in a straight line head to heels","Lower chest to floor","Push explosively back up"],
    cues: "Tight core, elbows at 45°, full range"
  },
  "Bench Press": {
    basics: ["Lie flat, feet planted, slight arch","Unrack and lower bar to mid-chest","Press up and in slightly","Lock out at top"],
    cues: "Retract shoulder blades, control the descent"
  },
  "Incline Press": {
    basics: ["Set bench to 30-45°","Lower dumbbells/bar to upper chest","Press up until arms fully extend"],
    cues: "Keep upper-chest contact, don't flare elbows wide"
  },
  "Chest Fly": {
    basics: ["Lie on bench with dumbbells above chest","Open arms in wide arc until chest stretches","Squeeze pecs to bring weights back"],
    cues: "Slight bend in elbows throughout, feel the stretch"
  },
  "Cable Crossover": {
    basics: ["Set cables at high pulley","Step forward, arms extended wide","Bring hands together in front of chest","Control the return"],
    cues: "Lean slightly forward, squeeze at the bottom"
  },
  "Deadlift": {
    basics: ["Bar over mid-foot, hip-width stance","Hinge — push hips back, flat back","Grip just outside legs","Drive floor away, hips and shoulders rise together","Lock out hips at top"],
    cues: "Bar stays close to body, brace core before pulling"
  },
  "Romanian Deadlift": {
    basics: ["Stand with barbell at hip level","Hinge hips back, lower bar along legs","Keep back flat and knees soft","Drive hips forward to stand"],
    cues: "Feel hamstring stretch, don't round lower back"
  },
  "Pull-Up": {
    basics: ["Dead hang with overhand grip","Retract shoulder blades","Pull until chin clears bar","Lower slowly with control"],
    cues: "No swinging, lead with chest not chin"
  },
  "Lat Pulldown": {
    basics: ["Sit with thighs under pads","Grip wide, lean back slightly","Pull bar to upper chest","Control the return overhead"],
    cues: "Drive elbows down and back, squeeze lats at bottom"
  },
  "Barbell Row": {
    basics: ["Hinge forward ~45°","Grip bar shoulder-width","Row bar to lower chest/belly button","Lower under control"],
    cues: "Keep back rigid, elbows graze the sides"
  },
  "Seated Cable Row": {
    basics: ["Sit upright, feet on platform","Grip handle, arms extended","Pull to lower abs","Hold 1s, return slowly"],
    cues: "Don't lean back excessively, squeeze shoulder blades"
  },
  "Shoulder Press": {
    basics: ["Weights at shoulder level","Press overhead until arms extend","Lower back to shoulders"],
    cues: "Core tight, avoid lower-back arch"
  },
  "Lateral Raise": {
    basics: ["Dumbbells at sides","Raise arms to shoulder height with slight elbow bend","Lower slowly — 3 seconds down"],
    cues: "Lead with elbows not wrists, no shrugging"
  },
  "Front Raise": {
    basics: ["Dumbbells at thighs","Raise one/both arms to shoulder height","Lower under control"],
    cues: "Keep torso still, no momentum"
  },
  "Rear Delt Fly": {
    basics: ["Bend over 90° or on incline bench","Arms hanging down with slight bend","Raise dumbbells to sides","Squeeze shoulder blades"],
    cues: "Imagine spreading wings, control the descent"
  },
  "Face Pull": {
    basics: ["Set cable at face height","Pull rope toward face, elbows high","External rotate at the end"],
    cues: "High elbows, great for shoulder health"
  },
  "Arnold Press": {
    basics: ["Start with palms facing you at chin level","Press up while rotating palms outward","Reverse on the way down"],
    cues: "Smooth rotation, hits all three delt heads"
  },
  "Bicep Curl": {
    basics: ["Elbows pinned to sides","Curl weight upward","Squeeze bicep at top","Lower slowly"],
    cues: "No swinging, full range of motion"
  },
  "Hammer Curl": {
    basics: ["Neutral grip (palms facing each other)","Curl up without rotating wrist","Lower slowly"],
    cues: "Targets brachialis for overall arm thickness"
  },
  "Preacher Curl": {
    basics: ["Rest upper arms on preacher pad","Curl from full extension","Squeeze at top, lower slowly"],
    cues: "Eliminates cheating, great bicep peak builder"
  },
  "Tricep": {
    basics: ["Keep elbows tucked and stationary","Extend arms fully","Control the return"],
    cues: "Only forearms move"
  },
  "Skullcrusher": {
    basics: ["Lie on bench, barbell above forehead","Lower bar by bending elbows only","Press back up","Keep upper arms vertical"],
    cues: "Don't let elbows flare, controlled movement"
  },
  "Tricep Dip": {
    basics: ["Grip parallel bars, arms locked","Lower body by bending elbows to 90°","Drive back up to lockout"],
    cues: "Stay upright for tricep focus, lean forward for chest"
  },
  "Lunge": {
    basics: ["Step forward, lower rear knee toward floor","Both knees at 90°","Push off front foot to return"],
    cues: "Upright torso, front knee doesn't pass toes"
  },
  "Bulgarian Split Squat": {
    basics: ["Rear foot elevated on bench","Lower front leg until thigh is parallel","Drive through front heel to stand"],
    cues: "Hardest leg exercise — builds quads and glutes unilaterally"
  },
  "Leg Press": {
    basics: ["Feet shoulder-width on platform","Lower sled until knees at 90°","Press through heels to extend"],
    cues: "Don't lock knees fully, keep tension on quads"
  },
  "Leg Curl": {
    basics: ["Lie face-down on machine","Curl heels toward glutes","Lower slowly"],
    cues: "Squeeze hamstrings at peak, don't use momentum"
  },
  "Leg Extension": {
    basics: ["Sit on machine, back supported","Extend legs until straight","Lower under control"],
    cues: "Great quad finisher, control the negative"
  },
  "Calf Raise": {
    basics: ["Stand on edge of step or flat","Rise onto toes as high as possible","Hold 1s, lower fully"],
    cues: "Full range — all the way up, all the way down"
  },
  "Hip Thrust": {
    basics: ["Upper back on bench, bar over hips","Drive hips up until body is horizontal","Squeeze glutes at top","Lower hips to floor"],
    cues: "Chin tucked, posterior pelvic tilt at the top"
  },
  "Plank": {
    basics: ["Forearms or hands on floor","Body straight from head to heels","Hold position"],
    cues: "Squeeze glutes and core, don't hold breath"
  },
  "Hanging Leg Raise": {
    basics: ["Dead hang from bar","Raise straight legs to 90° (or bent knees to chest)","Lower slowly"],
    cues: "No swinging — controlled movement"
  },
  "Cable Crunch": {
    basics: ["Kneel facing cable machine, rope at neck","Crunch down contracting abs","Hold 1s at bottom"],
    cues: "Round the spine — don't hip-flex"
  },
  "Ab Rollout": {
    basics: ["Kneel with ab wheel on floor","Roll forward until body nearly parallel","Contract abs to roll back"],
    cues: "Advanced core — keep hips inline"
  },
  "Russian Twist": {
    basics: ["Sit with knees bent, lean back 45°","Hold weight and rotate side to side","Touch the floor on each side"],
    cues: "Slow and controlled, great for obliques"
  },
  "Row": {
    basics: ["Hinge at hips or support on bench","Pull weight toward hip/ribcage","Squeeze back at the top"],
    cues: "Keep back flat, lead with elbows"
  }
};

const getExerciseDetails = (name) => {
  const n = name.toLowerCase();
  if (n.includes('squat') && !n.includes('bulgarian')) return EXERCISE_DETAILS["Squat"];
  if (n.includes('bulgarian')) return EXERCISE_DETAILS["Bulgarian Split Squat"];
  if (n.includes('push-up') || n.includes('push up')) return EXERCISE_DETAILS["Push-Up"];
  if (n.includes('incline') && n.includes('press')) return EXERCISE_DETAILS["Incline Press"];
  if (n.includes('bench press') || n.includes('chest press')) return EXERCISE_DETAILS["Bench Press"];
  if (n.includes('cable crossover')) return EXERCISE_DETAILS["Cable Crossover"];
  if (n.includes('fly') || n.includes('flye') || n.includes('pec deck')) return EXERCISE_DETAILS["Chest Fly"];
  if (n.includes('romanian') || n.includes(' rdl')) return EXERCISE_DETAILS["Romanian Deadlift"];
  if (n.includes('deadlift')) return EXERCISE_DETAILS["Deadlift"];
  if (n.includes('pulldown') || n.includes('pull-down') || n.includes('lat pull')) return EXERCISE_DETAILS["Lat Pulldown"];
  if (n.includes('pull-up') || n.includes('chin-up') || n.includes('pull up')) return EXERCISE_DETAILS["Pull-Up"];
  if (n.includes('barbell row') || n.includes('bent over row')) return EXERCISE_DETAILS["Barbell Row"];
  if (n.includes('seated cable row') || n.includes('cable row')) return EXERCISE_DETAILS["Seated Cable Row"];
  if (n.includes('row')) return EXERCISE_DETAILS["Row"];
  if (n.includes('overhead') || n.includes('shoulder press') || n.includes('military') || n.includes('ohp')) return EXERCISE_DETAILS["Shoulder Press"];
  if (n.includes('arnold')) return EXERCISE_DETAILS["Arnold Press"];
  if (n.includes('lateral raise')) return EXERCISE_DETAILS["Lateral Raise"];
  if (n.includes('front raise')) return EXERCISE_DETAILS["Front Raise"];
  if (n.includes('rear delt') || n.includes('reverse fly')) return EXERCISE_DETAILS["Rear Delt Fly"];
  if (n.includes('face pull')) return EXERCISE_DETAILS["Face Pull"];
  if (n.includes('hammer curl')) return EXERCISE_DETAILS["Hammer Curl"];
  if (n.includes('preacher curl')) return EXERCISE_DETAILS["Preacher Curl"];
  if (n.includes('curl') && !n.includes('leg')) return EXERCISE_DETAILS["Bicep Curl"];
  if (n.includes('skullcrusher') || n.includes('skull crusher')) return EXERCISE_DETAILS["Skullcrusher"];
  if (n.includes('tricep') && n.includes('dip')) return EXERCISE_DETAILS["Tricep Dip"];
  if (n.includes('dip')) return EXERCISE_DETAILS["Tricep Dip"];
  if (n.includes('tricep')) return EXERCISE_DETAILS["Tricep"];
  if (n.includes('hip thrust')) return EXERCISE_DETAILS["Hip Thrust"];
  if (n.includes('leg press')) return EXERCISE_DETAILS["Leg Press"];
  if (n.includes('leg curl')) return EXERCISE_DETAILS["Leg Curl"];
  if (n.includes('leg extension')) return EXERCISE_DETAILS["Leg Extension"];
  if (n.includes('calf')) return EXERCISE_DETAILS["Calf Raise"];
  if (n.includes('lunge')) return EXERCISE_DETAILS["Lunge"];
  if (n.includes('hanging leg') || n.includes('leg raise')) return EXERCISE_DETAILS["Hanging Leg Raise"];
  if (n.includes('cable crunch')) return EXERCISE_DETAILS["Cable Crunch"];
  if (n.includes('ab rollout') || n.includes('ab wheel')) return EXERCISE_DETAILS["Ab Rollout"];
  if (n.includes('russian twist')) return EXERCISE_DETAILS["Russian Twist"];
  if (n.includes('plank')) return EXERCISE_DETAILS["Plank"];
  return { basics: [], cues: "Maintain good form throughout" };
};

const EXERCISE_DB = {
  WarmUp: [
    { name: 'Light Cardio (Brisk Walk/Jog)', sets: '1', reps: '5 mins', notes: 'Raise core temp' },
    { name: 'Dynamic Stretches', sets: '1', reps: '5 mins', notes: 'Arm circles, leg swings, hip rotations' },
  ],
  CoolDown: [
    { name: 'Static Stretching', sets: '1', reps: '5-10 mins', notes: 'Hold each stretch 20-30s' },
  ],

  // ═══ BEGINNER — Full Body ════════════════════════════════════════════════════
  BeginnerFullBody: [
    { name: 'Bodyweight Squat', sets: '3', reps: '12-15', notes: 'Knees track over toes' },
    { name: 'Push-Ups (or Knee Push-ups)', sets: '3', reps: '8-12', notes: 'Full ROM' },
    { name: 'Dumbbell Row', sets: '3', reps: '10-12', notes: 'One arm at a time' },
    { name: 'Dumbbell Shoulder Press', sets: '3', reps: '10-12', notes: 'Core braced' },
    { name: 'Lunges', sets: '3', reps: '10 each leg', notes: 'Controlled step' },
    { name: 'Plank', sets: '3', reps: '30-60s', notes: 'Don\'t hold breath' },
    { name: 'Crunches', sets: '3', reps: '15-20', notes: 'Slow and controlled' },
  ],

  // ═══ PPL — Push ══════════════════════════════════════════════════════════════
  PPL_Push: [
    { name: 'Barbell Bench Press', sets: '4', reps: '6-10', notes: 'Main chest compound' },
    { name: 'Incline Dumbbell Press', sets: '3', reps: '8-12', notes: 'Upper chest focus' },
    { name: 'Cable Crossover', sets: '3', reps: '12-15', notes: 'Chest isolation, squeeze at bottom' },
    { name: 'Overhead Press', sets: '4', reps: '6-10', notes: 'Standing for core activation' },
    { name: 'Lateral Raises', sets: '4', reps: '12-15', notes: 'Slow negatives — 3s down' },
    { name: 'Tricep Pushdown', sets: '3', reps: '12-15', notes: 'Cable or band' },
    { name: 'Skullcrushers', sets: '3', reps: '10-12', notes: 'EZ bar preferred' },
  ],

  // ═══ PPL — Pull ══════════════════════════════════════════════════════════════
  PPL_Pull: [
    { name: 'Deadlift', sets: '4', reps: '4-6', notes: 'Heavy compound — warm up well' },
    { name: 'Pull-Ups', sets: '4', reps: '6-10', notes: 'Add weight if >10 reps is easy' },
    { name: 'Barbell Row', sets: '4', reps: '8-10', notes: 'Hinge 45°, row to belly' },
    { name: 'Seated Cable Row', sets: '3', reps: '10-12', notes: 'Full stretch at the front' },
    { name: 'Face Pulls', sets: '3', reps: '15-20', notes: 'Essential for shoulder health' },
    { name: 'Barbell Curl', sets: '3', reps: '8-12', notes: 'Slow on the way down' },
    { name: 'Hammer Curls', sets: '3', reps: '10-12', notes: 'Neutral grip for brachialis' },
  ],

  // ═══ PPL — Legs ══════════════════════════════════════════════════════════════
  PPL_Legs: [
    { name: 'Back Squat', sets: '4', reps: '6-10', notes: 'King of leg exercises' },
    { name: 'Romanian Deadlift', sets: '4', reps: '8-10', notes: 'Hamstring stretch at the bottom' },
    { name: 'Leg Press', sets: '3', reps: '10-15', notes: 'Feet high for hamstrings, low for quads' },
    { name: 'Leg Curl', sets: '3', reps: '10-15', notes: 'Full extension at the start' },
    { name: 'Bulgarian Split Squat', sets: '3', reps: '10 each leg', notes: 'Rear foot elevated on bench' },
    { name: 'Calf Raises', sets: '4', reps: '15-20', notes: 'Full stretch at the bottom' },
    { name: 'Ab Rollout', sets: '3', reps: '10-15', notes: 'Core finisher' },
  ],

  // ═══ BRO SPLIT — Chest ═══════════════════════════════════════════════════════
  BroChest: [
    { name: 'Barbell Bench Press', sets: '4', reps: '6-10', notes: 'Retract shoulder blades, arch slightly' },
    { name: 'Incline Dumbbell Press', sets: '4', reps: '8-12', notes: '30-45° incline for upper chest' },
    { name: 'Flat Dumbbell Fly', sets: '3', reps: '12-15', notes: 'Feel the stretch, slight elbow bend' },
    { name: 'Cable Crossover', sets: '3', reps: '12-15', notes: 'High cable for lower chest' },
    { name: 'Decline Push-Ups', sets: '3', reps: '15-20', notes: 'Feet elevated, finisher' },
    { name: 'Dumbbell Pullover', sets: '3', reps: '12-15', notes: 'Stretches chest and lats' },
  ],

  // ═══ BRO SPLIT — Back ════════════════════════════════════════════════════════
  BroBack: [
    { name: 'Deadlift', sets: '4', reps: '4-6', notes: 'Full back development compound' },
    { name: 'Pull-Ups', sets: '4', reps: '6-10', notes: 'Wide grip for lat width' },
    { name: 'Barbell Row', sets: '4', reps: '6-10', notes: 'Back thickness builder' },
    { name: 'Lat Pulldown', sets: '3', reps: '10-12', notes: 'Underhand grip for more bicep activation' },
    { name: 'Seated Cable Row', sets: '3', reps: '10-12', notes: 'Pause and squeeze at the end' },
    { name: 'Straight Arm Pulldown', sets: '3', reps: '12-15', notes: 'Cable, stretches lats fully' },
  ],

  // ═══ BRO SPLIT — Shoulders ═══════════════════════════════════════════════════
  BroShoulders: [
    { name: 'Overhead Press', sets: '4', reps: '6-10', notes: 'Standing or seated barbell/dumbbell' },
    { name: 'Arnold Press', sets: '3', reps: '10-12', notes: 'Hits all 3 delt heads' },
    { name: 'Lateral Raises', sets: '4', reps: '12-15', notes: '3-second negative for maximum growth' },
    { name: 'Front Raises', sets: '3', reps: '12-15', notes: 'Alternate arms, cable for constant tension' },
    { name: 'Rear Delt Fly', sets: '4', reps: '12-15', notes: 'Bent-over or incline bench' },
    { name: 'Face Pulls', sets: '3', reps: '15-20', notes: 'Rope cable, high elbows' },
    { name: 'Shrugs', sets: '3', reps: '12-15', notes: 'Barbell or dumbbell, hold at top' },
  ],

  // ═══ BRO SPLIT — Arms ════════════════════════════════════════════════════════
  BroArms: [
    { name: 'Barbell Curl', sets: '4', reps: '8-12', notes: 'Bicep mass builder' },
    { name: 'Incline Dumbbell Curl', sets: '3', reps: '10-12', notes: 'Full stretch at the bottom' },
    { name: 'Preacher Curl', sets: '3', reps: '10-12', notes: 'Eliminates cheating, great peak builder' },
    { name: 'Hammer Curls', sets: '3', reps: '10-12', notes: 'Brachialis thickness' },
    { name: 'Skullcrushers', sets: '4', reps: '8-12', notes: 'EZ bar or dumbbells' },
    { name: 'Tricep Pushdown', sets: '3', reps: '12-15', notes: 'Rope for more range of motion' },
    { name: 'Tricep Dips', sets: '3', reps: '10-15', notes: 'Body-weight finisher' },
  ],

  // ═══ BRO SPLIT — Legs ════════════════════════════════════════════════════════
  BroLegs: [
    { name: 'Back Squat', sets: '4', reps: '6-10', notes: 'Go deep — below parallel' },
    { name: 'Romanian Deadlift', sets: '4', reps: '8-10', notes: 'Heavy hamstring focus' },
    { name: 'Leg Press', sets: '4', reps: '10-15', notes: 'High foot placement for glutes' },
    { name: 'Leg Curl', sets: '3', reps: '10-15', notes: 'Lying or seated machine' },
    { name: 'Leg Extension', sets: '3', reps: '12-15', notes: 'Quad isolation finisher' },
    { name: 'Bulgarian Split Squat', sets: '3', reps: '10 each', notes: 'Most effective unilateral leg exercise' },
    { name: 'Calf Raises', sets: '5', reps: '15-20', notes: 'Full stretch, slow negative' },
  ],

  // ═══ BRO SPLIT — Abs ═════════════════════════════════════════════════════════
  BroAbs: [
    { name: 'Hanging Leg Raises', sets: '4', reps: '10-15', notes: 'Full range, no swinging' },
    { name: 'Cable Crunch', sets: '4', reps: '12-15', notes: 'Round the spine — not a hip flex' },
    { name: 'Ab Rollout', sets: '3', reps: '10-12', notes: 'Advanced, use knees if needed' },
    { name: 'Plank', sets: '3', reps: '45-60s', notes: 'Squeeze every muscle' },
    { name: 'Russian Twists', sets: '3', reps: '20 total', notes: 'Hold weight, feet off floor' },
    { name: 'Crunches', sets: '3', reps: '20-25', notes: 'Slow and controlled' },
  ],
};

const generateWorkoutPlan = (goal, preferences, profile) => {
  const { split, daysPerWeek } = preferences;
  const experience = profile.experienceLevel || 'Intermediate';
  let schedule = [];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const createDay = (dayName, focus, exercisesList, isRest = false) => {
    if (isRest) {
      return { day: dayName, focus: 'Rest & Recovery', exercises: [], isRestDay: true };
    }
    const enrichedExercises = [
      ...EXERCISE_DB.WarmUp,
      ...exercisesList,
      ...EXERCISE_DB.CoolDown,
    ].map(ex => ({ ...ex, details: getExerciseDetails(ex.name) }));
    return { day: dayName, focus, exercises: enrichedExercises, isRestDay: false };
  };

  // ─── BEGINNER: 3-day Full Body ────────────────────────────────────────────
  if (experience === 'Beginner') {
    const trainingDays = [0, 2, 4]; // Mon, Wed, Fri
    for (let i = 0; i < 7; i++) {
      if (trainingDays.includes(i)) {
        schedule.push(createDay(daysOfWeek[i], 'Full Body', EXERCISE_DB.BeginnerFullBody));
      } else {
        schedule.push(createDay(daysOfWeek[i], 'Rest', [], true));
      }
    }
    return schedule;
  }

  // ─── INTERMEDIATE & ADVANCED: PPL or Bro Split ───────────────────────────
  const isBroSplit = split === 'Bro Split' || split === 'Body Part';

  if (isBroSplit) {
    // 6-day Bro Split: Chest → Back → Shoulders → Arms → Legs → Abs → Rest
    const broPattern = [
      { key: 'BroChest',     focus: 'Chest' },
      { key: 'BroBack',      focus: 'Back' },
      { key: 'BroShoulders', focus: 'Shoulders' },
      { key: 'BroArms',      focus: 'Arms' },
      { key: 'BroLegs',      focus: 'Legs' },
      { key: 'BroAbs',       focus: 'Abs' },
    ];

    // Limit to daysPerWeek, rest fills the remaining days
    for (let i = 0; i < 7; i++) {
      if (i < Math.min(daysPerWeek, 6)) {
        const p = broPattern[i];
        schedule.push(createDay(daysOfWeek[i], p.focus, EXERCISE_DB[p.key]));
      } else {
        schedule.push(createDay(daysOfWeek[i], 'Rest', [], true));
      }
    }
    return schedule;
  }

  // Default: PPL (3, 4, 5, or 6 days)
  let pplPattern = [];
  if (daysPerWeek <= 3) {
    pplPattern = ['PPL_Push', 'PPL_Pull', 'PPL_Legs', 'Rest', 'Rest', 'Rest', 'Rest'];
  } else if (daysPerWeek === 4) {
    pplPattern = ['PPL_Push', 'PPL_Pull', 'Rest', 'PPL_Legs', 'PPL_Push', 'Rest', 'Rest'];
  } else if (daysPerWeek === 5) {
    pplPattern = ['PPL_Push', 'PPL_Pull', 'PPL_Legs', 'Rest', 'PPL_Push', 'PPL_Pull', 'Rest'];
  } else {
    // 6 days — full PPL twice
    pplPattern = ['PPL_Push', 'PPL_Pull', 'PPL_Legs', 'PPL_Push', 'PPL_Pull', 'PPL_Legs', 'Rest'];
  }

  const focusMap = {
    PPL_Push: 'Push (Chest / Shoulders / Triceps)',
    PPL_Pull: 'Pull (Back / Biceps)',
    PPL_Legs: 'Legs (Quads / Hamstrings / Calves)',
  };

  for (let i = 0; i < 7; i++) {
    const key = pplPattern[i];
    if (!key || key === 'Rest') {
      schedule.push(createDay(daysOfWeek[i], 'Rest', [], true));
    } else {
      schedule.push(createDay(daysOfWeek[i], focusMap[key] || key, EXERCISE_DB[key]));
    }
  }
  return schedule;
};

export { generateWorkoutPlan };
