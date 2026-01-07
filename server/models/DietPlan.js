const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Breakfast"
  description: { type: String, required: true }, // e.g. "Oats with whey protein"
  calories: { type: Number },
  protein: { type: Number }, // in grams
  carbs: { type: Number },
  fats: { type: Number }
});

const DietPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dailyCalories: { type: Number, required: true },
  macros: {
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true }
  },
  waterIntake: { type: Number }, // in liters
  meals: [MealSchema], // Keep for backward compatibility / current day view
  weeklySchedule: [{
    day: { type: String }, // Monday, Tuesday...
    meals: [MealSchema]
  }],
  budgetLevel: { type: String, default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DietPlan', DietPlanSchema);
