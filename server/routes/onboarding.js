const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/onboarding/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (db.findUserByEmail(email)) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    const user = db.createUser({ name, email, password, isGuest: false });
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ msg: 'Server Error during registration', error: err.message });
  }
});

// POST /api/onboarding/guest
router.post('/guest', (req, res) => {
  try {
    const user = db.createUser({ name: 'Guest Athlete', isGuest: true });
    res.json({ user: { id: user.id, name: user.name, isGuest: true } });
  } catch (err) {
    console.error('Guest Login Error:', err);
    res.status(500).send('Server Error');
  }
});

// POST /api/onboarding/profile
router.post('/profile', (req, res) => {
  try {
    const { userId, age, gender, height, currentWeight, bodyFatPercentage, experienceLevel } = req.body;
    if (!userId) return res.status(400).json({ msg: 'Missing User ID' });
    const profile = db.upsertProfile(userId, { age, gender, height, currentWeight, bodyFatPercentage, experienceLevel });
    res.json(profile);
  } catch (err) {
    console.error('Profile Save Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// POST /api/onboarding/goal
router.post('/goal', (req, res) => {
  try {
    const { userId, primaryGoal, targetWeight, timeframe, injuries } = req.body;
    const goal = db.upsertGoal(userId, { primaryGoal, targetWeight, timeframe, injuries });
    res.json(goal);
  } catch (err) {
    console.error('Goal Save Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// POST /api/onboarding/preferences
router.post('/preferences', (req, res) => {
  try {
    const { userId, environment, daysPerWeek, split, trainingTime, cardioPreference, dietType, cuisine, budget } = req.body;
    const prefs = db.upsertPreferences(userId, { environment, daysPerWeek, split, trainingTime, cardioPreference, dietType, cuisine, budget });
    res.json(prefs);
  } catch (err) {
    console.error('Preferences Save Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// GET /api/onboarding/:userId
router.get('/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const user = db.getUser(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const profile = db.getProfile(userId);
    const goal = db.getGoal(userId);
    const preferences = db.getPreferences(userId);

    res.json({ user: { id: user.id, name: user.name, email: user.email }, profile, goal, preferences });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
