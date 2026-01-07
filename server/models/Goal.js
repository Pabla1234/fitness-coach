const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  primaryGoal: { 
    type: String, 
    enum: ['Weight Gain', 'Bodybuilding', 'Cutting', 'Athletic Physique', 'Fat Loss'], 
    required: true 
  },
  targetWeight: { type: Number }, // in kg
  timeframe: { type: String }, // e.g., "3 months"
  injuries: { type: String, default: 'None' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Goal', GoalSchema);
