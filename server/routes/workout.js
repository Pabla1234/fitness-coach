const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Goal = require('../models/Goal');
const TrainingPreference = require('../models/TrainingPreference');
const WorkoutPlan = require('../models/WorkoutPlan');
const { generateWorkoutPlan } = require('../services/workoutGenerator');

const UserProfile = require('../models/UserProfile');

// Generate Workout Plan
router.post('/generate', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Fetch User Context
    const goal = await Goal.findOne({ user: userId });
    const prefs = await TrainingPreference.findOne({ user: userId });
    const profile = await UserProfile.findOne({ user: userId });
    
    if (!goal || !prefs || !profile) {
      return res.status(400).json({ msg: 'Please complete onboarding first' });
    }

    // Generate Logic
    const schedule = generateWorkoutPlan(goal, prefs, profile);

    // Save to DB
    // Check if plan exists for this week, if so update, else create
    let plan = await WorkoutPlan.findOne({ user: userId, weekNumber: 1 });
    
    if (plan) {
       plan.schedule = schedule;
       plan.name = `${prefs.split} - Week 1`;
       await plan.save();
    } else {
       plan = new WorkoutPlan({
         user: userId,
         name: `${prefs.split} - Week 1`,
         weekNumber: 1,
         schedule
       });
       await plan.save();
    }

    res.json(plan);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Get Current Workout Plan
router.get('/:userId', async (req, res) => {
    try {
        const plan = await WorkoutPlan.findOne({ user: req.params.userId }).sort({ createdAt: -1 });
        if (!plan) return res.status(404).json({ msg: 'No plan found' });
        res.json(plan);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
