const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-coach';

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Falling back to Local In-Memory MongoDB (PERSISTENT)...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbPath: './data/db',
          storageEngine: 'wiredTiger'
        }
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('✅ Local Persistent MongoDB connected successfully at ' + uri);
    } catch (innerErr) {
       console.error('❌ In-Memory MongoDB connection error:', innerErr);
    }
  }
};

connectDB();

// Routes
app.get('/', (req, res) => {
  res.send('AI Fitness Coach API is running...');
});

// Import Routes
const onboardingRoutes = require('./routes/onboarding');
const workoutRoutes = require('./routes/workout');
const dietRoutes = require('./routes/diet');
const aiRoutes = require('./routes/ai');
const progressRoutes = require('./routes/progress');

app.use('/api/onboarding', onboardingRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/progress', progressRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
