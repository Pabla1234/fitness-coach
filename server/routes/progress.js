const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/progress/add
router.post('/add', (req, res) => {
  try {
    const { userId, weight, bodyFat, chest, waist, arms, legs, photoUrl, notes } = req.body;

    const log = db.addProgressLog(userId, { weight, bodyFat, chest, waist, arms, legs, photoUrl, notes });

    // Update current weight in profile
    const profile = db.getProfile(userId);
    if (profile) {
      db.upsertProfile(userId, {
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        currentWeight: weight,
        bodyFatPercentage: bodyFat ?? profile.body_fat_percentage,
        experienceLevel: profile.experience_level,
      });
    }

    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET /api/progress/:userId
router.get('/:userId', (req, res) => {
  try {
    const logs = db.getProgressLogs(req.params.userId);
    res.json(logs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
