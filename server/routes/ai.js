const express = require('express');
const router = express.Router();
const { getCoachResponse } = require('../services/aiCoach');

router.post('/ask', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ msg: 'Missing userId or message' });
    }

    const answer = await getCoachResponse(userId, message);
    res.json({ answer });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
