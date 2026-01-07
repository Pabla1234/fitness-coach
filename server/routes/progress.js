const express = require('express');
const router = express.Router();
const ProgressLog = require('../models/ProgressLog');
const UserProfile = require('../models/UserProfile');

// Add a new log
router.post('/add', async (req, res) => {
  try {
    const { userId, weight, bodyFat, chest, waist, arms, legs, photoUrl, notes } = req.body;
    
    const log = new ProgressLog({
      user: userId,
      weight,
      bodyFat,
      chest, 
      waist, 
      arms, 
      legs, 
      photoUrl, 
      notes
    });
    
    await log.save();

    // Optionally update current weight in profile
    await UserProfile.findOneAndUpdate(
       { user: userId }, 
       { currentWeight: weight, bodyFatPercentage: bodyFat }
    );

    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Get all logs for a user (sorted by date)
router.get('/:userId', async (req, res) => {
  try {
    const logs = await ProgressLog.find({ user: req.params.userId }).sort({ date: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
