const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateWorkoutPlan } = require('../services/workoutGenerator');

// POST /api/workout/generate
router.post('/generate', (req, res) => {
  try {
    const { userId } = req.body;

    const goal = db.getGoal(userId);
    const prefs = db.getPreferences(userId);
    const profile = db.getProfile(userId);

    if (!goal || !prefs || !profile) {
      return res.status(400).json({ msg: 'Please complete onboarding first' });
    }

    const schedule = generateWorkoutPlan(goal, prefs, profile);
    const plan = db.upsertWorkoutPlan(userId, {
      name: `${prefs.split} - Week 1`,
      weekNumber: 1,
      schedule,
    });

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET /api/workout/:userId
router.get('/:userId', (req, res) => {
  try {
    const plan = db.getWorkoutPlan(req.params.userId);
    if (!plan) return res.status(404).json({ msg: 'No plan found' });
    res.json(plan);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
