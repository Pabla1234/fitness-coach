const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, default: 'Guest User' },
  email: { type: String, unique: true, sparse: true }, // sparse allows multiple null/undefined
  password: { type: String }, 
  isGuest: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
