const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  height: { type: Number, required: true }, // in cm
  currentWeight: { type: Number, required: true }, // in kg
  bodyFatPercentage: { type: Number },
  experienceLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
