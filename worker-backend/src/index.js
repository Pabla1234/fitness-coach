
const { AutoRouter, cors } = require('itty-router');
const mongoose = require('mongoose');

// Models
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');
const Goal = require('./models/Goal');
const TrainingPreference = require('./models/TrainingPreference');
const DietPlan = require('./models/DietPlan');
const WorkoutPlan = require('./models/WorkoutPlan');
const ProgressLog = require('./models/ProgressLog');

// Services
const { getCoachResponse } = require('./services/aiCoach');
const { generateDietPlan } = require('./services/dietGenerator');
const { generateWorkoutPlan } = require('./services/workoutGenerator');

const { preflight, corsify } = cors();

const router = AutoRouter({
  before: [preflight],
  finally: [corsify]
});

// Database Connection
let isConnected = false;
const connectDB = async (env) => {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return;
  }
  try {
    // Polyfill process.env for the services/libraries that depend on it
    if (!globalThis.process) globalThis.process = { env: {} };
    Object.assign(globalThis.process.env, env);

    await mongoose.connect(env.MONGO_URI, {
      bufferCommands: false, // Disable buffering
      serverSelectionTimeoutMS: 5000 
    });
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};

// Middleware to ensure DB connection
const withDB = async (request, env) => {
    await connectDB(env);
};

// --- ROUTES ---

// Onboarding: Register
router.post('/api/onboarding/register', withDB, async (request) => {
    const { name, email, password } = await request.json();
    let user = await User.findOne({ email });
    if (user) return Response.json({ msg: 'User already exists' }, { status: 400 });

    user = new User({ name, email, password });
    await user.save();
    return Response.json({ user });
});

// Onboarding: Guest
router.post('/api/onboarding/guest', withDB, async () => {
    const user = new User({ name: 'Guest Athlete', isGuest: true });
    await user.save();
    return Response.json({ user });
});

// Onboarding: Profile
router.post('/api/onboarding/profile', withDB, async (request) => {
    const body = await request.json();
    const { userId } = body;
    if (!userId) return Response.json({ msg: 'Missing User ID' }, { status: 400 });

    let profile = await UserProfile.findOneAndUpdate({ user: userId }, body, { new: true, upsert: true });
    return Response.json(profile);
});

// Onboarding: Goal
router.post('/api/onboarding/goal', withDB, async (request) => {
    const body = await request.json();
    const { userId } = body;
    let goal = await Goal.findOneAndUpdate({ user: userId }, body, { new: true, upsert: true });
    return Response.json(goal);
});

// Onboarding: Preferences
router.post('/api/onboarding/preferences', withDB, async (request) => {
    const body = await request.json();
    const { userId } = body;
    let prefs = await TrainingPreference.findOneAndUpdate({ user: userId }, body, { new: true, upsert: true });
    return Response.json(prefs);
});

// Get User Data
router.get('/api/onboarding/:userId', withDB, async (request) => {
    const { userId } = request.params;
    const user = await User.findById(userId);
    const profile = await UserProfile.findOne({ user: userId });
    const goal = await Goal.findOne({ user: userId });
    const preferences = await TrainingPreference.findOne({ user: userId });
    return Response.json({ user, profile, goal, preferences });
});

// --- WORKOUT ROUTES ---
router.post('/api/workout/generate', withDB, async (request) => {
    const { userId } = await request.json();
    
    // Fetch context
    const profile = await UserProfile.findOne({ user: userId });
    const goal = await Goal.findOne({ user: userId });
    const prefs = await TrainingPreference.findOne({ user: userId });

    if (!profile || !goal || !prefs) {
        return Response.json({ msg: 'Complete onboarding first' }, { status: 400 });
    }

    const schedule = generateWorkoutPlan(goal, prefs, profile);

    // Save Week 1 Plan
    const workoutPlan = await WorkoutPlan.findOneAndUpdate(
        { user: userId },
        { 
            user: userId,
            weekNumber: 1,
            schedule: schedule,
            generatedAt: Date.now()
        },
        { new: true, upsert: true }
    );
    return Response.json(workoutPlan);
});

router.get('/api/workout/:userId', withDB, async (request) => {
    const { userId } = request.params;
    const plan = await WorkoutPlan.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!plan) return Response.json({ msg: 'No plan found' }, { status: 404 });
    return Response.json(plan);
});

// --- DIET ROUTES ---
router.post('/api/diet/generate', withDB, async (request) => {
    const { userId } = await request.json();
    
    const profile = await UserProfile.findOne({ user: userId });
    const goal = await Goal.findOne({ user: userId });
    const prefs = await TrainingPreference.findOne({ user: userId });

    if (!profile || !goal || !prefs) {
        return Response.json({ msg: 'Complete onboarding first' }, { status: 400 });
    }

    const dietData = generateDietPlan(profile, goal, prefs);

    const dietPlan = await DietPlan.findOneAndUpdate(
        { user: userId },
        {
            user: userId,
            dailyCalories: dietData.dailyCalories,
            macros: dietData.macros,
            waterIntake: dietData.waterIntake,
            weeklySchedule: dietData.weeklySchedule,
            meals: dietData.meals, // Legacy support
            generatedAt: Date.now()
        },
        { new: true, upsert: true }
    );
    return Response.json(dietPlan);
});

router.get('/api/diet/:userId', withDB, async (request) => {
    const { userId } = request.params;
    const plan = await DietPlan.findOne({ user: userId });
    if (!plan) return Response.json({ msg: 'No plan found' }, { status: 404 });
    return Response.json(plan);
});

// --- AI COACH ROUTES ---
router.post('/api/ai/ask', withDB, async (request) => {
    const { userId, message } = await request.json();
    if (!userId || !message) return Response.json({ msg: 'Missing data' }, { status: 400 });
    
    // Note: getCoachResponse relies on process.env which we polyfilled in connectDB
    const answer = await getCoachResponse(userId, message);
    return Response.json({ answer });
});

// --- PROGRESS ROUTES ---
router.post('/api/progress/add', withDB, async (request) => {
    const body = await request.json();
    const { userId, weight, bodyFat } = body;
    
    const log = new ProgressLog({
        user: userId,
        ...body,
        date: Date.now()
    });
    await log.save();

    // Update profile stats
    if (weight || bodyFat) {
        const update = {};
        if (weight) update.currentWeight = weight;
        if (bodyFat) update.bodyFatPercentage = bodyFat;
        await UserProfile.findOneAndUpdate({ user: userId }, update);
    }

    return Response.json(log);
});

router.get('/api/progress/:userId', withDB, async (request) => {
    const { userId } = request.params;
    const logs = await ProgressLog.find({ user: userId }).sort({ date: 1 });
    return Response.json(logs);
});

router.get('/', () => new Response("AI Fitness Coach Worker API Running"));

export default {
    fetch: router.fetch
};
