const FITNESS_KNOWLEDGE = {
  principles: {
    progressiveOverload: "The most critical driver of growth. You must increase weight, reps, or improve form every week.",
    caloricBalance: "You cannot out-train a bad diet. Weight loss = Deficit. Weight gain = Surplus.",
    consistency: "A mediocre plan followed consistently beats a perfect plan followed sporadically."
  },
  
  dietRules: {
    Cutting: {
      calories: "Deficit of 300-500 kcal below TDEE.",
      macros: "High Protein (2.2g/kg), Moderate Fat (0.8g/kg), Lower Carbs (fill rest).",
      tips: "Focus on volume foods (veggies, lean meats) to stay full. Time carbs around workouts."
    },
    Bulking: {
      calories: "Surplus of 300-500 kcal above TDEE.",
      macros: "High Protein (2g/kg), Moderate Fat (1g/kg), High Carbs.",
      tips: "Don't 'dirty bulk'. Aim for 0.5% body weight gain per week to minimize fat gain."
    },
    Maintenance: {
      calories: "At TDEE.",
      macros: "Balanced approach. Focus on performance and strength gains."
    }
  },

  workoutSplits: {
    "Push/Pull/Legs": "Frequency: 6x/week. Best for intermediate/advanced. Splits body by movement pattern.",
    "Bro Split": "Frequency: 5x/week. Good for focusing on specific muscle groups per session. Lower frequency per muscle.",
    "Upper/Lower": "Frequency: 4x/week. Great balance of recovery and frequency. Ideal for most busy people.",
    "Full Body": "Frequency: 3x/week. Best for beginners or those with limited time. Hits every muscle frequently."
  },

  genderSpecifics: {
    Female: "Women typically recover faster than men and can handle more volume per session. Glute/Hamstring focus is often prioritized.",
    Male: "Men typically have more upper body strength potential initially. Often prioritize chest/arms/shoulders."
  }
};

const getContextForUser = (profile, goal, prefs) => {
  const goalKey = ['Weight Gain', 'Bodybuilding'].includes(goal.primaryGoal) ? 'Bulking' : 'Cutting';
  const dietAdvice = FITNESS_KNOWLEDGE.dietRules[goalKey] || FITNESS_KNOWLEDGE.dietRules.Maintenance;
  const splitAdvice = FITNESS_KNOWLEDGE.workoutSplits[prefs.split];
  const genderAdvice = FITNESS_KNOWLEDGE.genderSpecifics[profile.gender] || "Focus on balanced development.";

  return `
    EXPERT KNOWLEDGE BASE (USE THIS TO GUIDE YOUR ANSWER):
    
    1. CORE PRINCIPLES:
    - ${FITNESS_KNOWLEDGE.principles.progressiveOverload}
    - ${FITNESS_KNOWLEDGE.principles.caloricBalance}
    
    2. DIET STRATEGY (${goal.primaryGoal}):
    - Calories: ${dietAdvice.calories}
    - Macros: ${dietAdvice.macros}
    - Pro Tip: ${dietAdvice.tips}
    
    3. TRAINING STRATEGY (${prefs.split}):
    - ${splitAdvice}
    - Gender Specific Tip: ${genderAdvice}
  `;
};

export { getContextForUser };
