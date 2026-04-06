const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize SQLite DB — creates all tables on first run
require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('AI Fitness Coach API is running...');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const onboardingRoutes = require('./routes/onboarding');
const workoutRoutes = require('./routes/workout');
const dietRoutes = require('./routes/diet');
const aiRoutes = require('./routes/ai');
const progressRoutes = require('./routes/progress');
const exerciseRoutes = require('./routes/exercise');

app.use('/api/onboarding', onboardingRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/exercise', exerciseRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (SQLite)`);
});
