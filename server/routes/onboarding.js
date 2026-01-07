const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Goal = require('../models/Goal');
const TrainingPreference = require('../models/TrainingPreference');

// Create User (Step 0 - Mock Auth)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password });
    await user.save();
    res.json({ user });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ msg: 'Server Error during registration', error: err.message });
  }
});

// Create Guest User (No Auth)
router.post('/guest', async (req, res) => {
  try {
    const user = new User({ 
      name: 'Guest Athlete',
      isGuest: true 
    });
    await user.save();
    res.json({ user });
  } catch (err) {
    console.error("Guest Login Error:", err);
    res.status(500).send('Server Error');
  }
});

// Step 1: User Profile
router.post('/profile', async (req, res) => {
  try {
    console.log("Received Profile Data:", req.body); // Debug Log
    const { userId, age, gender, height, currentWeight, bodyFatPercentage, experienceLevel } = req.body;
    
    if (!userId) {
        return res.status(400).json({ msg: 'Missing User ID' });
    }

    // Upsert profile
    let profile = await UserProfile.findOne({ user: userId });
    if (profile) {
      // Update existing
      profile = await UserProfile.findOneAndUpdate({ user: userId }, req.body, { new: true });
    } else {
      profile = new UserProfile({ user: userId, age, gender, height, currentWeight, bodyFatPercentage, experienceLevel });
      await profile.save();
    }
    res.json(profile);
  } catch (err) {
    console.error("Profile Save Error:", err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Step 2: Goal
router.post('/goal', async (req, res) => {
  try {
    console.log("Received Goal Data:", req.body); // Debug Log
    const { userId, primaryGoal, targetWeight, timeframe, injuries } = req.body;
    
    let goal = await Goal.findOne({ user: userId });
    if (goal) {
      goal = await Goal.findOneAndUpdate({ user: userId }, req.body, { new: true });
    } else {
      goal = new Goal({ user: userId, primaryGoal, targetWeight, timeframe, injuries });
      await goal.save();
    }
    res.json(goal);
  } catch (err) {
    console.error("Goal Save Error:", err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Step 3: Preferences
router.post('/preferences', async (req, res) => {
  try {
    console.log("Received Preferences Data:", req.body); // Debug Log
    const { userId, environment, daysPerWeek, split, trainingTime, cardioPreference } = req.body;
    
    let prefs = await TrainingPreference.findOne({ user: userId });
    if (prefs) {
      prefs = await TrainingPreference.findOneAndUpdate({ user: userId }, req.body, { new: true });
    } else {
      prefs = new TrainingPreference({ user: userId, environment, daysPerWeek, split, trainingTime, cardioPreference });
      await prefs.save();
    }
    res.json(prefs);
  } catch (err) {
    console.error("Preferences Save Error:", err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get Full User Data (For debugging/dashboard)
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    const profile = await UserProfile.findOne({ user: userId });
    const goal = await Goal.findOne({ user: userId });
    const preferences = await TrainingPreference.findOne({ user: userId });
    
    res.json({ user, profile, goal, preferences });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
