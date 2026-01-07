const mongoose = require('mongoose');

const TrainingPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  environment: { type: String, enum: ['Gym', 'Home', 'Both'], required: true },
  daysPerWeek: { type: Number, min: 3, max: 7, required: true },
  split: { 
    type: String, 
    enum: ['Push/Pull/Legs', 'Bro Split', 'Upper/Lower', 'Full Body'], 
    required: true 
  },
  trainingTime: { type: String, enum: ['Morning', 'Evening'], required: true },
  cardioPreference: { type: String, enum: ['HIIT', 'LISS', 'Sports', 'None'], default: 'None' },
  // Diet Preferences
  dietType: { type: String, enum: ['Veg', 'Non-Veg', 'Vegan'], default: 'Non-Veg' },
  cuisine: { type: String, enum: ['Indian', 'International'], default: 'International' },
  budget: { type: String, enum: ['Budget', 'Premium'], default: 'Budget' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrainingPreference', TrainingPreferenceSchema);
