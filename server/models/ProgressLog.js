const mongoose = require('mongoose');

const ProgressLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  weight: { type: Number, required: true }, // kg
  bodyFat: { type: Number }, // %
  chest: { type: Number }, // cm
  waist: { type: Number }, // cm
  arms: { type: Number }, // cm
  legs: { type: Number }, // cm
  photoUrl: { type: String }, // URL to image (mocked for now)
  notes: { type: String }
});

module.exports = mongoose.model('ProgressLog', ProgressLogSchema);
