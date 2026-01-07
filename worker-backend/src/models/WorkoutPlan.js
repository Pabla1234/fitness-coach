const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: String, required: true }, // e.g., "4" or "3-4"
  reps: { type: String, required: true }, // e.g., "8-12" or "AMRAP"
  notes: { type: String }
});

const DailyWorkoutSchema = new mongoose.Schema({
  day: { type: String, required: true }, // e.g., "Monday", "Day 1"
  focus: { type: String, required: true }, // e.g., "Push", "Legs"
  exercises: [ExerciseSchema],
  isRestDay: { type: Boolean, default: false }
});

const WorkoutPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // e.g., "Intermediate Push/Pull/Legs"
  weekNumber: { type: Number, default: 1 },
  schedule: [DailyWorkoutSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkoutPlan', WorkoutPlanSchema);
