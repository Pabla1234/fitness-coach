const calculateBMR = (weight, height, age, gender) => {
  // Mifflin-St Jeor Equation
  let s = gender === 'Male' ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + s;
};

const calculateTDEE = (bmr, activityLevel) => {
  if (activityLevel >= 6) return bmr * 1.725;
  if (activityLevel >= 4) return bmr * 1.55;
  return bmr * 1.375;
};

// Expanded Meal Database based on Weekly Plans
const WEEKLY_MEAL_DB = {
  // === VEG ===
  Veg: {
    Indian: {
      Budget: [
        // Day 1
        [
          { name: 'Breakfast', description: 'Vegetable poha + peanuts' },
          { name: 'Lunch', description: 'Dal, 2 rotis, salad' },
          { name: 'Snack', description: 'Roasted chana' },
          { name: 'Dinner', description: 'Vegetable sabzi + curd' }
        ],
        // Day 2
        [
          { name: 'Breakfast', description: 'Oats with milk' },
          { name: 'Lunch', description: 'Rajma + rice' },
          { name: 'Snack', description: 'Fruit (banana/apple)' },
          { name: 'Dinner', description: 'Paneer bhurji (small portion) + roti' }
        ],
        // Day 3
        [
          { name: 'Breakfast', description: 'Upma' },
          { name: 'Lunch', description: 'Chole + roti' },
          { name: 'Snack', description: 'Buttermilk' },
          { name: 'Dinner', description: 'Mixed veg + dal' }
        ],
        // Day 4
        [
          { name: 'Breakfast', description: '2 boiled potatoes + salt/pepper' },
          { name: 'Lunch', description: 'Curd rice + salad' },
          { name: 'Snack', description: 'Handful peanuts' },
          { name: 'Dinner', description: 'Lauki / tori sabzi + roti' }
        ],
        // Day 5
        [
          { name: 'Breakfast', description: 'Vegetable sandwich (brown bread)' },
          { name: 'Lunch', description: 'Dal khichdi' },
          { name: 'Snack', description: 'Fruit' },
          { name: 'Dinner', description: 'Paneer curry (light) + roti' }
        ],
        // Day 6
        [
          { name: 'Breakfast', description: 'Besan chilla' },
          { name: 'Lunch', description: 'Veg pulao + curd' },
          { name: 'Snack', description: 'Roasted makhana' },
          { name: 'Dinner', description: 'Dal + salad' }
        ],
        // Day 7
        [
          { name: 'Breakfast', description: 'Idli + sambar' },
          { name: 'Lunch', description: 'Veg thali (controlled oil)' },
          { name: 'Snack', description: 'Coconut water' },
          { name: 'Dinner', description: 'Light vegetable soup' }
        ]
      ],
      Premium: [
         // Generic Template repeated (Variations implied)
         [
            { name: 'Breakfast', description: 'Paneer paratha / oats with nuts' },
            { name: 'Lunch', description: 'Quinoa / brown rice + dal + paneer' },
            { name: 'Snack', description: 'Smoothie (milk + banana + nuts)' },
            { name: 'Dinner', description: 'Paneer tikka / tofu + vegetables' }
         ]
      ]
    },
    International: {
       Budget: [
          [
             { name: 'Breakfast', description: 'Peanut butter toast + milk' },
             { name: 'Lunch', description: 'Veg wrap / pasta (olive oil based)' },
             { name: 'Snack', description: 'Yogurt + fruits' },
             { name: 'Dinner', description: 'Stir-fried vegetables + tofu' }
          ]
       ],
       Premium: [
          [
             { name: 'Breakfast', description: 'Avocado Toast with Hemp Seeds' },
             { name: 'Lunch', description: 'Tofu Buddha Bowl with Quinoa' },
             { name: 'Snack', description: 'Plant Based Protein Shake' },
             { name: 'Dinner', description: 'Truffle Mushroom Risotto' }
          ]
       ]
    }
  },
  
  // === NON-VEG ===
  'Non-Veg': {
    Indian: {
      Budget: [
        // Day 1
        [
          { name: 'Breakfast', description: '2 boiled eggs + toast' },
          { name: 'Lunch', description: 'Egg curry + rice' },
          { name: 'Snack', description: 'Fruit' },
          { name: 'Dinner', description: 'Chicken curry (home style) + roti' }
        ],
        // Day 2
        [
          { name: 'Breakfast', description: 'Omelette + bread' },
          { name: 'Lunch', description: 'Chicken pulao' },
          { name: 'Snack', description: 'Roasted chana' },
          { name: 'Dinner', description: 'Dal + salad' }
        ],
        // Day 3
        [
          { name: 'Breakfast', description: 'Boiled eggs' },
          { name: 'Lunch', description: 'Fish curry + rice' },
          { name: 'Snack', description: 'Buttermilk' },
          { name: 'Dinner', description: 'Vegetable sabzi + roti' }
        ]
      ],
      Premium: [
        [
          { name: 'Breakfast', description: 'Egg whites + oats' },
          { name: 'Lunch', description: 'Grilled chicken + brown rice' },
          { name: 'Snack', description: 'Protein smoothie' },
          { name: 'Dinner', description: 'Fish / chicken tikka + veggies' }
        ]
      ]
    },
    International: {
      Budget: [
        [
          { name: 'Breakfast', description: 'Scrambled eggs + toast' },
          { name: 'Lunch', description: 'Chicken sandwich / wrap' },
          { name: 'Snack', description: 'Yogurt or nuts' },
          { name: 'Dinner', description: 'Grilled chicken/fish + salad' }
        ]
      ],
      Premium: [
        [
          { name: 'Breakfast', description: 'Smoked Salmon Benedict' },
          { name: 'Lunch', description: 'Grilled Salmon & Asparagus' },
          { name: 'Snack', description: 'Artisanal Beef Jerky' },
          { name: 'Dinner', description: 'Steak & Sweet Potato' }
        ]
      ]
    }
  }
};

const generateDietPlan = (profile, goal, preferences) => {
  // 1. Calculate Calories
  const bmr = calculateBMR(profile.currentWeight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, preferences.daysPerWeek);
  
  let targetCalories = tdee;
  const goalType = goal.primaryGoal; 

  if (['Weight Gain', 'Bodybuilding'].includes(goalType)) {
    targetCalories += 400; 
  } else if (['Cutting', 'Fat Loss'].includes(goalType)) {
    targetCalories -= 400; 
  }

  // 2. Calculate Macros
  const proteinGrams = Math.round(profile.currentWeight * 2.2); 
  const fatGrams = Math.round(profile.currentWeight * 0.9);
  
  const proteinCals = proteinGrams * 4;
  const fatCals = fatGrams * 9;
  const remainingCals = targetCalories - (proteinCals + fatCals);
  const carbGrams = Math.max(0, Math.round(remainingCals / 4));

  // 3. Select Meals based on Preferences
  const dietType = preferences.dietType || 'Non-Veg'; 
  const cuisine = preferences.cuisine || 'International'; 
  let budget = preferences.budget || 'Budget'; 
  
  // Map "Non-Budget" -> "Premium" from old code if needed, but strictly follow new naming
  // The user prompt used "Budget" and "Non-Budget" (Premium)
  if (budget === 'Non-Budget') budget = 'Premium'; // Handle potential mapping

  let selectedPlan = WEEKLY_MEAL_DB['Non-Veg']['International']['Budget']; // Fallback

  try {
     let typeKey = dietType === 'Vegan' ? 'Veg' : dietType; // Fallback Vegan to Veg
     let cuisineKey = cuisine === 'Indian' ? 'Indian' : 'International';
     let budgetKey = budget === 'Budget' ? 'Budget' : 'Premium';
     
     selectedPlan = WEEKLY_MEAL_DB[typeKey][cuisineKey][budgetKey];
  } catch (e) {
     console.warn("Preference combination not found, using fallback", e);
  }

  // Distribution: Breakfast 25%, Lunch 35%, Snack 10%, Dinner 30%
  const distribution = [0.25, 0.35, 0.10, 0.30];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const weeklySchedule = daysOfWeek.map((day, dayIndex) => {
      // Logic to rotate meals if the plan has fewer than 7 days
      // e.g. if plan has 3 days (index 0,1,2), Monday(0)->0, Tuesday(1)->1, Wed(2)->2, Thu(3)->0...
      const planDayIndex = dayIndex % selectedPlan.length;
      const rawMeals = selectedPlan[planDayIndex];
      
      const processedMeals = rawMeals.map((meal, mealIndex) => {
          return {
            name: meal.name,
            description: meal.description,
            calories: Math.round(targetCalories * distribution[mealIndex]),
            protein: Math.round(proteinGrams * distribution[mealIndex]),
            carbs: Math.round(carbGrams * distribution[mealIndex]),
            fats: Math.round(fatGrams * distribution[mealIndex])
          };
      });

      return {
          day: day,
          meals: processedMeals
      };
  });

  return {
    dailyCalories: Math.round(targetCalories),
    macros: {
      protein: proteinGrams,
      carbs: carbGrams,
      fats: fatGrams
    },
    waterIntake: 3.5, 
    weeklySchedule, // New Weekly Structure
    meals: weeklySchedule[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].meals, // Today's meals as default
    budgetLevel: budget
  };
};

module.exports = { generateDietPlan };
