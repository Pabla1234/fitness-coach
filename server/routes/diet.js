const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateDietPlan } = require('../services/dietGenerator');

// POST /api/diet/generate
router.post('/generate', (req, res) => {
  try {
    const { userId } = req.body;

    const profile = db.getProfile(userId);
    const goal = db.getGoal(userId);
    const prefs = db.getPreferences(userId);

    if (!profile || !goal || !prefs) {
      return res.status(400).json({ msg: 'Incomplete user profile' });
    }

    const planData = generateDietPlan(profile, goal, prefs);
    const diet = db.upsertDietPlan(userId, planData);

    res.json(diet);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET /api/diet/:userId
router.get('/:userId', (req, res) => {
  try {
    const diet = db.getDietPlan(req.params.userId);
    if (!diet) return res.status(404).json({ msg: 'No diet plan found' });
    res.json(diet);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
