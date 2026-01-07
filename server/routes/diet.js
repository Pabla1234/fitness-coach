const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Goal = require('../models/Goal');
const TrainingPreference = require('../models/TrainingPreference');
const DietPlan = require('../models/DietPlan');
const { generateDietPlan } = require('../services/dietGenerator');

router.post('/generate', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const profile = await UserProfile.findOne({ user: userId });
    const goal = await Goal.findOne({ user: userId });
    const prefs = await TrainingPreference.findOne({ user: userId });

    if (!profile || !goal || !prefs) {
      return res.status(400).json({ msg: 'Incomplete user profile' });
    }

    const planData = generateDietPlan(profile, goal, prefs);
    
    let diet = await DietPlan.findOne({ user: userId });
    if (diet) {
      diet = await DietPlan.findOneAndUpdate({ user: userId }, planData, { new: true });
    } else {
      diet = new DietPlan({
        user: userId,
        ...planData
      });
      await diet.save();
    }

    res.json(diet);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const diet = await DietPlan.findOne({ user: req.params.userId });
    if (!diet) return res.status(404).json({ msg: 'No diet plan found' });
    res.json(diet);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
