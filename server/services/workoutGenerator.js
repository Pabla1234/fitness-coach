const EXERCISE_DETAILS = {
  "Squat": {
    basics: [
      "Stand with feet shoulder-width apart",
      "Push hips back and bend knees",
      "Lower until thighs are parallel to the ground",
      "Push through heels to stand back up"
    ],
    cues: "Chest up, spine neutral, knees aligned with toes"
  },
  "Push-Up": {
    basics: [
      "Hands slightly wider than shoulders",
      "Body in straight line from head to heels",
      "Lower chest toward the floor",
      "Push back up to starting position"
    ],
    cues: "Tight core, controlled movement"
  },
  "Bench Press": {
    basics: [
      "Lie flat on bench with feet planted",
      "Lower weight to mid-chest",
      "Press upward until arms are extended"
    ],
    cues: "Controlled descent, elbows not flared"
  },
  "Deadlift": {
    basics: [
      "Bar close to shins",
      "Hinge at hips with flat back",
      "Drive hips forward to stand"
    ],
    cues: "Lift with legs and hips, not lower back"
  },
  "Pull-Up": {
    basics: [
      "Grip bar wider than shoulders",
      "Pull chest toward bar",
      "Lower slowly with control"
    ],
    cues: "Squeeze shoulder blades, avoid swinging"
  },
  "Shoulder Press": {
    basics: [
      "Start with weights at shoulder level",
      "Press upward until arms are extended",
      "Lower back under control"
    ],
    cues: "Core tight, avoid lower-back arch"
  },
  "Bicep Curl": {
    basics: [
      "Elbows close to torso",
      "Curl weight upward",
      "Lower slowly"
    ],
    cues: "No momentum, full range of motion"
  },
  "Tricep": {
    basics: [
      "Keep elbows tucked",
      "Extend arms fully",
      "Control the return"
    ],
    cues: "Move only forearms"
  },
  "Lunge": {
    basics: [
        "Step forward with one leg",
        "Lower hips until both knees are bent at 90 degrees",
        "Push off front foot to return to start"
    ],
    cues: "Keep torso upright, don't let front knee pass toes"
  },
  "Plank": {
    basics: [
        "Start in push-up position or on forearms",
        "Keep body in straight line from head to heels",
        "Hold position"
    ],
    cues: "Engage glutes and core, don't let hips sag"
  },
  "Row": {
     basics: [
        "Hinge at hips or support on bench",
        "Pull weight towards hip/lower ribcage",
        "Squeeze back at the top"
     ],
     cues: "Keep back flat, lead with elbows"
  }
};

const getExerciseDetails = (name) => {
  const n = name.toLowerCase();
  if (n.includes('squat')) return EXERCISE_DETAILS["Squat"];
  if (n.includes('push-up') || n.includes('push up')) return EXERCISE_DETAILS["Push-Up"];
  if (n.includes('bench press') || n.includes('chest press')) return EXERCISE_DETAILS["Bench Press"];
  if (n.includes('deadlift')) return EXERCISE_DETAILS["Deadlift"];
  if (n.includes('pull-up') || n.includes('chin-up') || n.includes('pulldown')) return EXERCISE_DETAILS["Pull-Up"];
  if (n.includes('overhead') || n.includes('shoulder press') || n.includes('military')) return EXERCISE_DETAILS["Shoulder Press"];
  if (n.includes('curl') && !n.includes('leg')) return EXERCISE_DETAILS["Bicep Curl"];
  if (n.includes('tricep') || n.includes('dip') || n.includes('skullcrusher')) return EXERCISE_DETAILS["Tricep"];
  if (n.includes('lunge')) return EXERCISE_DETAILS["Lunge"];
  if (n.includes('plank')) return EXERCISE_DETAILS["Plank"];
  if (n.includes('row')) return EXERCISE_DETAILS["Row"];
  
  return { basics: [], cues: "Maintain good form" };
};

const EXERCISE_DB = {
  // --- Warm Up (Standard for all) ---
  WarmUp: [
    { name: 'Light Cardio (Brisk Walk/Jog)', sets: '1', reps: '5-10 mins', notes: 'Raise body temp' },
    { name: 'Dynamic Stretches', sets: '1', reps: '5 mins', notes: 'Arm circles, leg swings' },
    { name: 'Bodyweight Squats', sets: '1', reps: '8-10', notes: 'Warm up hips/legs' }
  ],
  
  // --- Cool Down (Standard for all) ---
  CoolDown: [
    { name: 'Light Cardio', sets: '1', reps: '5-10 mins', notes: 'Clear metabolic byproducts' },
    { name: 'Static Stretching', sets: '1', reps: '15-30s hold', notes: 'Calf, quad, hip, shoulder stretches' }
  ],

  // --- Beginner (Full Body) ---
  BeginnerFullBody: [
    { name: 'Bodyweight Squat', sets: '2', reps: '10-15', notes: 'Knees track over toes' },
    { name: 'Push-Ups (or Knee Push-ups)', sets: '2', reps: '8-12', notes: 'Keep core tight' },
    { name: 'Dumbbell Row or Band Pull', sets: '2', reps: '10-15', notes: 'Back focus' },
    { name: 'Overhead Press', sets: '2', reps: '8-12', notes: 'Shoulders' },
    { name: 'Lunges', sets: '2', reps: '10-12 per leg', notes: 'Legs/Glutes' },
    { name: 'Plank', sets: '2', reps: '20-60s', notes: 'Core stability' }
  ],

  // --- Intermediate PPL ---
  Push: [
    { name: 'Barbell Bench Press', sets: '3', reps: '8-12', notes: 'Compound chest' },
    { name: 'Dumbbell Shoulder Press', sets: '3', reps: '8-12', notes: 'Shoulders' },
    { name: 'Triceps Dips', sets: '3', reps: '8-12', notes: 'Triceps' },
    { name: 'Lateral Raises', sets: '3', reps: '12-15', notes: 'Side delts' }
  ],
  Pull: [
    { name: 'Deadlift (or RDL)', sets: '3', reps: '6-10', notes: 'Posterior chain' },
    { name: 'Pull-Ups (or Rows)', sets: '3', reps: 'AMRAP/8-12', notes: 'Back width/thickness' },
    { name: 'Bicep Curls', sets: '3', reps: '10-12', notes: 'Isolation' },
    { name: 'Face Pulls', sets: '3', reps: '12-15', notes: 'Rear delts/Rotator cuff' }
  ],
  Legs: [
    { name: 'Squats (or Leg Press)', sets: '3-4', reps: '6-12', notes: 'Quad focus' },
    { name: 'Lunges', sets: '3', reps: '10-12', notes: 'Unilateral leg work' },
    { name: 'Calf Raises', sets: '3', reps: '12-15', notes: 'Calves' },
    { name: 'Plank / Crunches', sets: '2', reps: '1 min', notes: 'Core finisher' }
  ],

  // --- Advanced Upper/Lower ---
  UpperHeavy: [
    { name: 'Bench Press', sets: '4', reps: '4-8', notes: 'Heavy Compound' },
    { name: 'Pull-Ups (Weighted if able)', sets: '4', reps: '6-8', notes: 'Vertical Pull' },
    { name: 'Overhead Press', sets: '4', reps: '6-8', notes: 'Heavy Shoulders' },
    { name: 'Barbell Rows', sets: '4', reps: '6-8', notes: 'Horizontal Pull' },
    { name: 'Arms Supersets', sets: '2', reps: '10-12', notes: 'Biceps/Triceps' }
  ],
  LowerHeavy: [
    { name: 'Squat', sets: '4', reps: '4-8', notes: 'Heavy Compound' },
    { name: 'Romanian Deadlift', sets: '4', reps: '6-8', notes: 'Heavy Hinge' },
    { name: 'Lunges', sets: '3', reps: '8-10', notes: 'Accessory' },
    { name: 'Calf Raises', sets: '4', reps: '8-10', notes: 'Heavy Calves' }
  ],
  
  // --- Bro Split (Body Part) ---
  ChestTriceps: [
    { name: 'Bench Press', sets: '4', reps: '8-12', notes: 'Main mover' },
    { name: 'Incline Dumbbell Press', sets: '3', reps: '8-12', notes: 'Upper chest' },
    { name: 'Flyes', sets: '3', reps: '12-15', notes: 'Isolation' },
    { name: 'Tricep Pushdowns', sets: '4', reps: '12-15', notes: 'Isolation' }
  ],
  BackBiceps: [
    { name: 'Deadlift', sets: '3', reps: '5-8', notes: 'Heavy' },
    { name: 'Pull-Ups', sets: '3', reps: '8-12', notes: 'Width' },
    { name: 'Rows', sets: '4', reps: '8-12', notes: 'Thickness' },
    { name: 'Barbell Curls', sets: '3', reps: '10-12', notes: 'Biceps' }
  ],
  ShouldersAbs: [
    { name: 'Overhead Press', sets: '4', reps: '8-12', notes: 'Compound' },
    { name: 'Lateral Raises', sets: '4', reps: '12-15', notes: 'Width' },
    { name: 'Rear Delt Flyes', sets: '3', reps: '15', notes: 'Posture' },
    { name: 'Hanging Leg Raises', sets: '3', reps: '10-15', notes: 'Core' }
  ],
  Arms: [
    { name: 'Barbell Curls', sets: '3', reps: '8-12', notes: 'Biceps' },
    { name: 'Skullcrushers', sets: '3', reps: '8-12', notes: 'Triceps' },
    { name: 'Hammer Curls', sets: '3', reps: '10-12', notes: 'Brachialis' },
    { name: 'Dips', sets: '3', reps: 'AMRAP', notes: 'Compound finisher' }
  ]
};

const generateWorkoutPlan = (goal, preferences, profile) => {
  const split = preferences.split;
  const daysPerWeek = preferences.days_per_week || preferences.daysPerWeek || 4;
  const experience = profile.experience_level || profile.experienceLevel || 'Intermediate';
  let schedule = [];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper to build a day
  const createDay = (dayName, focus, exercisesList, isRest = false) => {
    if (isRest) {
      return { 
        day: dayName, 
        focus: 'Rest & Recovery', 
        exercises: [{ name: 'Light Walk/Stretch', sets: '1', reps: '30 mins', notes: 'Active Recovery' }], 
        isRestDay: true 
      };
    }
    const enrichedExercises = [
        ...EXERCISE_DB.WarmUp,
        ...exercisesList,
        ...EXERCISE_DB.CoolDown
      ].map(ex => ({
        ...ex,
        details: getExerciseDetails(ex.name)
      }));

    return {
      day: dayName,
      focus,
      exercises: enrichedExercises,
      isRestDay: false
    };
  };

  // --- LOGIC TREE BASED ON PDF ---

  // 1. BEGINNERS (<= 6 months)
  // PDF: "Full-body routines 2-3 days/week... 5-8 basic exercises"
  if (experience === 'Beginner') {
    // Force Full Body regardless of split preference initially, as recommended by PDF
    const trainingDays = [0, 2, 4]; // Mon, Wed, Fri
    
    for (let i = 0; i < 7; i++) {
      if (trainingDays.includes(i) && i < daysPerWeek * 2) { // Limit by their daysPerWeek pref
        schedule.push(createDay(daysOfWeek[i], 'Full Body Basic', EXERCISE_DB.BeginnerFullBody));
      } else {
        schedule.push(createDay(daysOfWeek[i], 'Rest', [], true));
      }
    }
    return schedule;
  }

  // 2. INTERMEDIATE (Split/Weights)
  // PDF: "3-4 workouts/week... PPL or Upper/Lower"
  if (experience === 'Intermediate') {
     if (split === 'Push/Pull/Legs') {
        // Mon: Push, Wed: Pull, Fri: Legs (3 day example from PDF)
        const rotation = ['Push', 'Rest', 'Pull', 'Rest', 'Legs', 'Rest', 'Rest'];
        
        // If they want more days (4-5), we compress: Push, Pull, Rest, Legs, Upper...
        // For MVP simplicity, we map loosely to their daysPerWeek
        let pattern = [];
        if (daysPerWeek === 3) pattern = ['Push', 'Rest', 'Pull', 'Rest', 'Legs', 'Rest', 'Rest'];
        else if (daysPerWeek >= 4) pattern = ['Push', 'Pull', 'Rest', 'Legs', 'Push', 'Pull', 'Rest']; // 5-6 day
        
        // Fill schedule
        for (let i = 0; i < 7; i++) {
            const focus = pattern[i] || 'Rest';
            if (focus === 'Rest') schedule.push(createDay(daysOfWeek[i], 'Rest', [], true));
            else schedule.push(createDay(daysOfWeek[i], focus, EXERCISE_DB[focus] || EXERCISE_DB.BeginnerFullBody));
        }
     } else {
        // Default Intermediate to Upper/Lower if not PPL
        const pattern = ['UpperHeavy', 'Rest', 'LowerHeavy', 'Rest', 'UpperHeavy', 'LowerHeavy', 'Rest'];
        for (let i = 0; i < 7; i++) {
            const focus = pattern[i];
            if (focus === 'Rest' || i >= daysPerWeek + 2) schedule.push(createDay(daysOfWeek[i], 'Rest', [], true));
            else schedule.push(createDay(daysOfWeek[i], 'Upper/Lower', EXERCISE_DB[focus] || EXERCISE_DB.UpperHeavy));
        }
     }
     return schedule;
  }

  // 3. ADVANCED (High Intensity/Volume)
  // PDF: "4-6 days/week... PPL, Upper/Lower or Bro Split"
  if (experience === 'Advanced') {
      let pattern = [];
      
      if (split === 'Push/Pull/Legs') {
          pattern = ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'];
      } else if (split === 'Bro Split') {
          // PDF: Mon: Chest/Tri, Tue: Back/Bi, Wed: Legs, Thu: Shoulders/Abs, Fri: Arms
          pattern = ['ChestTriceps', 'BackBiceps', 'Legs', 'ShouldersAbs', 'Arms', 'Rest', 'Rest'];
      } else {
          // Upper/Lower 4 day split
          pattern = ['UpperHeavy', 'LowerHeavy', 'Rest', 'UpperHeavy', 'LowerHeavy', 'Rest', 'Rest'];
      }

      for (let i = 0; i < 7; i++) {
          const focus = pattern[i];
           // Adjust for daysPerWeek (if user selected 3 days but is advanced, we truncate the pattern)
          if (focus === 'Rest' || i >= daysPerWeek) {
              schedule.push(createDay(daysOfWeek[i], 'Rest', [], true));
          } else {
              schedule.push(createDay(daysOfWeek[i], focus, EXERCISE_DB[focus] || EXERCISE_DB.UpperHeavy));
          }
      }
      return schedule;
  }

  return schedule;
};

module.exports = { generateWorkoutPlan };
