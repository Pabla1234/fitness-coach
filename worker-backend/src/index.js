import { AutoRouter, cors } from 'itty-router';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, and } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import * as schema from './db/schema';
import { getCoachResponse, streamCoachResponse, checkAIHealth } from './services/aiCoach';
import { generateDietPlan } from './services/dietGenerator';
import { generateWorkoutPlan } from './services/workoutGenerator';
import { moderatePost } from './services/contentModeration';
import {
  getStanding, recordVerdict, clearStrikes, restrictUser, standingMessage, STANDING,
} from './services/userStanding';

const { preflight, corsify } = cors({ origin: '*' });

const router = AutoRouter({
  before: [preflight],
  finally: [corsify]
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const withDB = (request, env) => {
  request.db  = drizzle(env.DB, { schema });
  request.env = env;
  if (!globalThis.process) globalThis.process = { env: {} };
  Object.assign(globalThis.process.env, env);
};

async function signToken(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(key);
}

async function verifyToken(token, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const { payload } = await jwtVerify(token, key);
  return payload;
}

async function authMiddleware(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return Response.json({ error: 'No token provided' }, { status: 401 });
  }
  try {
    const token = header.split(' ')[1];
    request.user = await verifyToken(token, env.JWT_SECRET || 'supersecretkey123');
  } catch {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

// ─── Health ───────────────────────────────────────────────────────────────────

router.get('/health', () => Response.json({ status: 'ok' }));
router.get('/',       () => new Response('Guripro Fitness Coach API'));

// ─── Auth Routes ──────────────────────────────────────────────────────────────

router.post('/api/auth/register', withDB, async (request) => {
  const { email, password } = await request.json();
  const db  = request.db;
  const env = request.env;

  if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 });
  if (password.length < 6)  return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

  const normalEmail = email.trim().toLowerCase();
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, normalEmail)).get();
  if (existing) return Response.json({ error: 'Email already registered' }, { status: 409 });

  const passwordHash = await bcryptjs.hash(password.trim(), 10);
  const id = crypto.randomUUID();
  await db.insert(schema.users).values({ id, email: normalEmail, passwordHash, isGuest: false }).run();

  return Response.json({ message: 'User registered', userId: id }, { status: 201 });
});

router.post('/api/auth/login', withDB, async (request) => {
  const { email, password } = await request.json();
  const db  = request.db;
  const env = request.env;

  if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 });

  const normalEmail = email.trim().toLowerCase();
  const user = await db.select().from(schema.users).where(eq(schema.users.email, normalEmail)).get();
  if (!user) return Response.json({ error: 'Invalid credentials' }, { status: 401 });

  const match = await bcryptjs.compare(password.trim(), user.passwordHash || '');
  if (!match) return Response.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = await signToken({ id: user.id, email: user.email }, env.JWT_SECRET || 'supersecretkey123');
  return Response.json({ token, user: { id: user.id, email: user.email } });
});

router.get('/api/auth/me', withDB, authMiddleware, async (request) => {
  return Response.json({ id: request.user.id, email: request.user.email });
});

router.post('/api/auth/logout', withDB, authMiddleware, async (request) => {
  return Response.json({ message: 'Logged out successfully' });
});

// ─── Onboarding Routes ────────────────────────────────────────────────────────

router.post('/api/onboarding/guest', withDB, async (request) => {
  const db = request.db;
  const id = crypto.randomUUID();
  const result = await db.insert(schema.users).values({ id, name: 'Guest Athlete', isGuest: true }).returning().get();
  return Response.json({ user: result });
});

router.post('/api/onboarding/profile', withDB, async (request) => {
  const body = await request.json();
  const { userId, age, gender, height, currentWeight, bodyFatPercentage, experienceLevel } = body;
  const db = request.db;
  if (!userId) return Response.json({ msg: 'Missing User ID' }, { status: 400 });

  // Ensure user row exists (for auth-registered users)
  const existing = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!existing) await db.insert(schema.users).values({ id: userId, name: 'User', isGuest: false }).run();

  const existingProfile = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId)).get();
  const values = { userId, age, gender, height, currentWeight, bodyFatPercentage, experienceLevel, updatedAt: Date.now() };
  let result;
  if (existingProfile) {
    result = await db.update(schema.userProfiles).set(values).where(eq(schema.userProfiles.userId, userId)).returning().get();
  } else {
    result = await db.insert(schema.userProfiles).values(values).returning().get();
  }
  return Response.json(result);
});

router.post('/api/onboarding/goal', withDB, async (request) => {
  const body = await request.json();
  const { userId, primaryGoal, targetWeight, timeframe, injuries } = body;
  const db = request.db;

  const existing = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId)).get();
  const values = { userId, primaryGoal, targetWeight, timeframe, injuries: injuries || 'None', updatedAt: Date.now() };
  let result;
  if (existing) {
    result = await db.update(schema.goals).set(values).where(eq(schema.goals.userId, userId)).returning().get();
  } else {
    result = await db.insert(schema.goals).values(values).returning().get();
  }
  return Response.json(result);
});

router.post('/api/onboarding/preferences', withDB, async (request) => {
  const body = await request.json();
  const { userId, environment, daysPerWeek, split, trainingTime, cardioPreference, dietType, cuisine, budget } = body;
  const db = request.db;

  const existing = await db.select().from(schema.trainingPreferences).where(eq(schema.trainingPreferences.userId, userId)).get();
  const values = {
    userId, environment, daysPerWeek, split, trainingTime,
    cardioPreference: cardioPreference || 'None',
    dietType: dietType || 'Non-Veg',
    cuisine: cuisine || 'International',
    budget: budget || 'Budget',
    updatedAt: Date.now()
  };
  let result;
  if (existing) {
    result = await db.update(schema.trainingPreferences).set(values).where(eq(schema.trainingPreferences.userId, userId)).returning().get();
  } else {
    result = await db.insert(schema.trainingPreferences).values(values).returning().get();
  }
  return Response.json(result);
});

router.get('/api/onboarding/:userId', withDB, async (request) => {
  const { userId } = request.params;
  const db = request.db;
  const user        = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  const profile     = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId)).get();
  const goal        = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId)).get();
  const preferences = await db.select().from(schema.trainingPreferences).where(eq(schema.trainingPreferences.userId, userId)).get();
  if (!user) return Response.json({ msg: 'User not found' }, { status: 404 });
  return Response.json({ user: { id: user.id, name: user.name, email: user.email }, profile, goal, preferences });
});

// ─── Workout Routes ───────────────────────────────────────────────────────────

router.post('/api/workout/generate', withDB, async (request) => {
  const { userId } = await request.json();
  const db = request.db;
  const profile = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId)).get();
  const goal    = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId)).get();
  const prefs   = await db.select().from(schema.trainingPreferences).where(eq(schema.trainingPreferences.userId, userId)).get();
  if (!profile || !goal || !prefs) return Response.json({ msg: 'Complete onboarding first' }, { status: 400 });

  const schedule = generateWorkoutPlan(goal, prefs, profile);
  const planName = `${prefs.split} - Week 1`;

  const existing = await db.select().from(schema.workoutPlans)
    .where(eq(schema.workoutPlans.userId, userId)).get();

  let result;
  const values = { userId, name: planName, weekNumber: 1, schedule: JSON.stringify(schedule), generatedAt: Date.now() };
  if (existing) {
    result = await db.update(schema.workoutPlans).set(values).where(eq(schema.workoutPlans.userId, userId)).returning().get();
  } else {
    result = await db.insert(schema.workoutPlans).values(values).returning().get();
  }
  return Response.json({ ...result, schedule: JSON.parse(result.schedule) });
});

router.get('/api/workout/:userId', withDB, async (request) => {
  const { userId } = request.params;
  const db = request.db;
  const plan = await db.select().from(schema.workoutPlans)
    .where(eq(schema.workoutPlans.userId, userId))
    .orderBy(desc(schema.workoutPlans.generatedAt)).get();
  if (!plan) return Response.json({ msg: 'No plan found' }, { status: 404 });
  return Response.json({ ...plan, schedule: JSON.parse(plan.schedule || '[]') });
});

// ─── Diet Routes ──────────────────────────────────────────────────────────────

router.post('/api/diet/generate', withDB, async (request) => {
  const { userId } = await request.json();
  const db = request.db;
  const profile = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId)).get();
  const goal    = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId)).get();
  const prefs   = await db.select().from(schema.trainingPreferences).where(eq(schema.trainingPreferences.userId, userId)).get();
  if (!profile || !goal || !prefs) return Response.json({ msg: 'Complete onboarding first' }, { status: 400 });

  const dietData = generateDietPlan(profile, goal, prefs);
  const values = {
    userId,
    dailyCalories:  dietData.dailyCalories,
    macros:         JSON.stringify(dietData.macros),
    waterIntake:    dietData.waterIntake,
    weeklySchedule: JSON.stringify(dietData.weeklySchedule),
    meals:          JSON.stringify(dietData.meals),
    budgetLevel:    dietData.budgetLevel || 'Budget',
    generatedAt:    Date.now()
  };

  const existing = await db.select().from(schema.dietPlans).where(eq(schema.dietPlans.userId, userId)).get();
  let result;
  if (existing) {
    result = await db.update(schema.dietPlans).set(values).where(eq(schema.dietPlans.userId, userId)).returning().get();
  } else {
    result = await db.insert(schema.dietPlans).values(values).returning().get();
  }
  return Response.json({
    ...result,
    macros:         JSON.parse(result.macros || '{}'),
    weeklySchedule: JSON.parse(result.weeklySchedule || '[]'),
    meals:          JSON.parse(result.meals || '[]'),
  });
});

// ─── Diet Alt (must be BEFORE /api/diet/:userId to avoid route collision) ────

router.get('/api/diet/alt', withDB, async (request) => {
  const url    = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const overrideDietType = url.searchParams.get('dietType') || 'Non-Veg';
  const db = request.db;
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const [profile, goal, prefs] = await Promise.all([
    db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId)).get(),
    db.select().from(schema.goals).where(eq(schema.goals.userId, userId)).get(),
    db.select().from(schema.trainingPreferences).where(eq(schema.trainingPreferences.userId, userId)).get(),
  ]);

  const safeProfile = profile || { currentWeight: 70, height: 170, age: 25, gender: 'Male' };
  const safeGoal    = goal    || { primaryGoal: 'Athletic Physique' };
  const safePrefs   = prefs   || { daysPerWeek: 4, cuisine: 'International', budget: 'Budget', dietType: 'Non-Veg' };

  const altPrefs = { ...safePrefs, dietType: overrideDietType };
  const plan = generateDietPlan(safeProfile, safeGoal, altPrefs);
  return Response.json({ weeklySchedule: plan.weeklySchedule });
});

router.get('/api/diet/:userId', withDB, async (request) => {
  const { userId } = request.params;
  const db = request.db;
  const plan = await db.select().from(schema.dietPlans).where(eq(schema.dietPlans.userId, userId)).get();
  if (!plan) return Response.json({ msg: 'No plan found' }, { status: 404 });
  return Response.json({
    ...plan,
    macros:         JSON.parse(plan.macros || '{}'),
    weeklySchedule: JSON.parse(plan.weeklySchedule || '[]'),
    meals:          JSON.parse(plan.meals || '[]'),
  });
});

// ─── Exercise GIF Route ───────────────────────────────────────────────────────

const EXERCISE_IMAGES = {
  'bench press':'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  'barbell bench press':'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  'dumbbell bench press':'https://wger.de/media/exercise-images/97/Dumbbell-bench-press-1.png',
  'incline bench press':'https://wger.de/media/exercise-images/41/Incline-bench-press-1.png',
  'decline bench press':'https://wger.de/media/exercise-images/100/Decline-bench-press-1.png',
  'close grip bench press':'https://wger.de/media/exercise-images/61/Close-grip-bench-press-1.png',
  'chest fly':'https://wger.de/media/exercise-images/98/Butterfly-machine-2.png',
  'cable fly':'https://wger.de/media/exercise-images/71/Cable-crossover-2.png',
  'push-up':'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  'push up':'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  'deadlift':'https://wger.de/media/exercise-images/161/Dead-lifts-2.png',
  'romanian deadlift':'https://wger.de/media/exercise-images/161/Dead-lifts-2.png',
  'pull-up':'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'pull up':'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'chin-up':'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'lat pulldown':'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'barbell row':'https://wger.de/media/exercise-images/70/Reverse-grip-bent-over-rows-1.png',
  'bent over row':'https://wger.de/media/exercise-images/70/Reverse-grip-bent-over-rows-1.png',
  'cable row':'https://wger.de/media/exercise-images/143/Cable-seated-rows-2.png',
  't-bar row':'https://wger.de/media/exercise-images/106/T-bar-row-1.png',
  'hyperextension':'https://wger.de/media/exercise-images/128/Hyperextensions-1.png',
  'good morning':'https://wger.de/media/exercise-images/116/Good-mornings-2.png',
  'overhead press':'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  'military press':'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  'shoulder press':'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  'dumbbell shoulder press':'https://wger.de/media/exercise-images/123/dumbbell-shoulder-press-large-1.png',
  'lateral raise':'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',
  'shrug':'https://wger.de/media/exercise-images/150/Barbell-shrugs-1.png',
  'barbell curl':'https://wger.de/media/exercise-images/81/Biceps-curl-1.png',
  'bicep curl':'https://wger.de/media/exercise-images/81/Biceps-curl-1.png',
  'biceps curl':'https://wger.de/media/exercise-images/129/Standing-biceps-curl-1.png',
  'dumbbell curl':'https://wger.de/media/exercise-images/74/Bicep-curls-1.png',
  'hammer curl':'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-1.png',
  'hammer curls':'https://wger.de/media/exercise-images/138/Hammer-curls-with-rope-1.png',
  'preacher curl':'https://wger.de/media/exercise-images/193/Preacher-curl-3-1.png',
  'skullcrusher':'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  'skullcrushers':'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  'skull crusher':'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  'tricep dip':'https://wger.de/media/exercise-images/83/Bench-dips-1.png',
  'dip':'https://wger.de/media/exercise-images/83/Bench-dips-1.png',
  'dips':'https://wger.de/media/exercise-images/83/Bench-dips-1.png',
  'squat':'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'back squat':'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'barbell squat':'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'front squat':'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'hack squat':'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png',
  'lunge':'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'walking lunge':'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'leg raise':'https://wger.de/media/exercise-images/125/Leg-raises-2.png',
  'crunch':'https://wger.de/media/exercise-images/91/Crunches-1.png',
  'crunches':'https://wger.de/media/exercise-images/91/Crunches-1.png',
  'sit-up':'https://wger.de/media/exercise-images/91/Crunches-1.png',
  'plank':'https://wger.de/media/exercise-images/125/Leg-raises-2.png',
  'light walk':'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'stretch':'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
};

router.get('/api/exercise/gif', async (request) => {
  const url  = new URL(request.url);
  const name = (url.searchParams.get('name') || '').trim().toLowerCase();
  if (!name) return Response.json({ error: 'name required' }, { status: 400 });

  // Try ExerciseDB if key is set
  const rapidKey = request.env?.RAPIDAPI_KEY;
  if (rapidKey) {
    try {
      const r = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}?limit=1`,
        { headers: { 'X-RapidAPI-Key': rapidKey, 'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com' } }
      );
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data[0]?.gifUrl) return Response.json({ gifUrl: data[0].gifUrl });
      }
    } catch {}
  }

  // Static fallback
  let gifUrl = EXERCISE_IMAGES[name] || null;
  if (!gifUrl) {
    for (const [k, v] of Object.entries(EXERCISE_IMAGES)) {
      if (name.includes(k) || k.includes(name)) { gifUrl = v; break; }
    }
  }
  return Response.json({ gifUrl });
});

// ─── YouTube Search Proxy ─────────────────────────────────────────────────────
// Keeps the API key server-side. Without a key we say so explicitly so the app
// can fall back to its curated library instead of showing an empty page.
router.get('/api/youtube/search', async (request, env) => {
  const url = new URL(request.url);
  const q   = (url.searchParams.get('q') || '').trim();
  const max = Math.min(Number(url.searchParams.get('max')) || 12, 25);

  if (!q) return Response.json({ items: [] });

  const key = env.YOUTUBE_API_KEY;
  if (!key) {
    return Response.json({
      unavailable: true,
      message: 'Live YouTube search is not configured on this server',
      items: [],
    });
  }

  const api = `https://www.googleapis.com/youtube/v3/search?key=${key}&part=snippet&type=video`
    + `&videoEmbeddable=true&maxResults=${max}&order=relevance&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(api);
    if (!res.ok) {
      return Response.json({ items: [], error: `YouTube API returned ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return Response.json({ items: data.items || [] });
  } catch (err) {
    return Response.json({ items: [], error: 'YouTube search failed' }, { status: 502 });
  }
});

// ─── AI Coach Route ───────────────────────────────────────────────────────────

const loadCoachContext = async (db, userId) => {
  const [profile, goal, prefs] = await Promise.all([
    db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId)).get(),
    db.select().from(schema.goals).where(eq(schema.goals.userId, userId)).get(),
    db.select().from(schema.trainingPreferences).where(eq(schema.trainingPreferences.userId, userId)).get(),
  ]);
  return { profile, goal, prefs };
};

router.post('/api/ai/ask', withDB, async (request) => {
  const { userId, message, history } = await request.json();
  const context = await loadCoachContext(request.db, userId);
  const meta    = {};
  const answer  = await getCoachResponse(userId, message, context, request.env, history, meta);
  return Response.json({ answer, source: meta.source });
});

// Which AI backend is actually answering? Useful when replies look generic.
router.get('/api/ai/health', async (request, env) => Response.json(await checkAIHealth(env)));

// Streaming coach — Server-Sent Events, so replies appear as they're generated
router.post('/api/ai/stream', withDB, async (request) => {
  const { userId, message, history } = await request.json();
  const context = await loadCoachContext(request.db, userId);
  return streamCoachResponse(userId, message, context, request.env, history);
});

// ─── Progress Routes ──────────────────────────────────────────────────────────

router.post('/api/progress/add', withDB, async (request) => {
  const body = await request.json();
  const { userId, weight, bodyFat } = body;
  const db = request.db;
  const result = await db.insert(schema.progressLogs).values({ ...body, userId, date: Date.now() }).returning().get();
  if (weight || bodyFat) {
    const update = {};
    if (weight)  update.currentWeight     = weight;
    if (bodyFat) update.bodyFatPercentage = bodyFat;
    await db.update(schema.userProfiles).set({ ...update, updatedAt: Date.now() }).where(eq(schema.userProfiles.userId, userId));
  }
  return Response.json(result);
});

router.get('/api/progress/:userId', withDB, async (request) => {
  const { userId } = request.params;
  const db = request.db;
  const logs = await db.select().from(schema.progressLogs)
    .where(eq(schema.progressLogs.userId, userId))
    .orderBy(schema.progressLogs.date).all();
  return Response.json(logs);
});

// ─── Update User Name ─────────────────────────────────────────────────────────

router.put('/api/auth/name', withDB, async (request) => {
  const { userId, name } = await request.json();
  const db = request.db;
  if (!userId || !name) return Response.json({ error: 'userId and name required' }, { status: 400 });
  await db.update(schema.users).set({ name: name.trim() }).where(eq(schema.users.id, userId));
  return Response.json({ ok: true });
});

// ─── Exercise Checkin Routes ──────────────────────────────────────────────────

router.get('/api/checkin/:userId/:date', withDB, async (request) => {
  const { userId, date } = request.params;
  const db = request.db;
  // Use raw SQL for AND filter since drizzle D1 .where chaining can be tricky
  const logs = await db.select().from(schema.exerciseLogs)
    .where(eq(schema.exerciseLogs.userId, userId))
    .all();
  return Response.json(logs.filter(l => l.date === date));
});

router.post('/api/checkin', withDB, async (request) => {
  const { userId, date, exerciseName, workoutDay, completed } = await request.json();
  const db = request.db;
  if (!userId || !date || !exerciseName) return Response.json({ error: 'Missing fields' }, { status: 400 });
  // Load only today's logs to find existing match
  const allLogs = await db.select().from(schema.exerciseLogs)
    .where(eq(schema.exerciseLogs.userId, userId))
    .all();
  const match = allLogs.find(l => l.date === date && l.exerciseName === exerciseName);
  if (match) {
    await db.update(schema.exerciseLogs)
      .set({ completed: completed ? 1 : 0 })
      .where(eq(schema.exerciseLogs.id, match.id));
  } else {
    await db.insert(schema.exerciseLogs)
      .values({ userId, date, exerciseName, workoutDay: workoutDay || '', completed: completed ? 1 : 0 })
      .run();
  }
  return Response.json({ ok: true });
});


// ─── Workout Reorder ──────────────────────────────────────────────────────────

router.put('/api/workout/reorder', withDB, async (request) => {
  const { userId, schedule } = await request.json();
  const db = request.db;
  if (!userId || !schedule) return Response.json({ error: 'userId and schedule required' }, { status: 400 });
  const existing = await db.select().from(schema.workoutPlans).where(eq(schema.workoutPlans.userId, userId)).get();
  if (!existing) return Response.json({ error: 'No workout plan found' }, { status: 404 });
  await db.update(schema.workoutPlans)
    .set({ schedule: JSON.stringify(schedule) })
    .where(eq(schema.workoutPlans.userId, userId));
  return Response.json({ ok: true, schedule });
});

// ─── Community ────────────────────────────────────────────────────────────────
// A fitness-only feed. Every post is judged by the moderation cascade before it
// becomes visible: clear off-topic content is refused at post time, borderline
// content publishes but is queued for a human.

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const postAuthor = async (db, userId) => {
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  return { id: userId, name: user?.name || 'Athlete' };
};

const shapePost = (row, author, likedByMe = false) => ({
  id: row.id,
  parentId: row.parentId,
  body: row.body,
  imageKey: row.imageKey,
  imageCaption: row.imageCaption,
  status: row.status,
  moderation: {
    stage: row.modStage,
    score: row.modScore,
    topic: row.modTopic,
    reason: row.modReason,
  },
  likeCount: row.likeCount,
  replyCount: row.replyCount,
  createdAt: row.createdAt,
  author,
  likedByMe,
});

/** Upload a photo. Moderation happens when the post is created, not here. */
router.post('/api/community/upload', async (request, env) => {
  if (!env.MEDIA) return Response.json({ error: 'Media storage is not configured' }, { status: 503 });
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    return Response.json({ error: 'Only image uploads are accepted' }, { status: 415 });
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return Response.json({ error: 'Image is larger than 6MB' }, { status: 413 });
  }
  const ext = contentType.split('/')[1]?.split('+')[0] || 'jpg';
  const key = `community/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType } });
  return Response.json({ key });
});

router.get('/api/community/media/:key+', async (request, env) => {
  if (!env.MEDIA) return new Response('Not found', { status: 404 });
  const key = decodeURIComponent(request.params.key);
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

/** Dry-run the classifier — lets the composer warn before the user hits post. */
router.post('/api/community/check', async (request, env) => {
  const { text } = await request.json();
  const result = await moderatePost({ text }, env);
  return Response.json(result);
});

router.post('/api/community/posts', withDB, async (request, env) => {
  const payload = await request.json();
  const { userId, body = '', imageKey = null } = payload;
  // An empty string here would silently turn a reply into a root post
  const parentId = payload.parentId ? String(payload.parentId) : null;
  const db = request.db;
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
  if (!body.trim() && !imageKey) {
    return Response.json({ error: 'Write something or add a photo' }, { status: 400 });
  }

  // Pull the image back out of R2 so the vision model can look at it
  let imageBytes = null;
  if (imageKey && env.MEDIA) {
    const object = await env.MEDIA.get(imageKey);
    if (object) imageBytes = await object.arrayBuffer();
  }

  const result = await moderatePost({ text: body, imageBytes }, env);

  // A restricted user's posts never go straight to the feed, however clean the
  // individual post looks — the person is on probation, not the post.
  const before = await getStanding(db, userId);
  if (before.status === 'restricted' && result.verdict === 'allow') {
    result.verdict = 'review';
    result.reason = 'Your posts are being reviewed before they appear.';
    result.detail = { ...(result.detail || {}), restrictedAuthor: true };
  }

  const standing = await recordVerdict(db, userId, result.verdict, result.topic);

  if (result.verdict === 'block') {
    // Don't keep media for a post that never existed
    if (imageKey && env.MEDIA) await env.MEDIA.delete(imageKey).catch(() => {});
    return Response.json({
      blocked: true,
      reason: result.reason,
      topic: result.topic,
      stage: result.stage,
      standing: {
        status: standing.status,
        strikes: standing.strikes,
        message: standingMessage(standing),
      },
    }, { status: 422 });
  }

  const id = crypto.randomUUID();
  await db.insert(schema.communityPosts).values({
    id,
    userId,
    parentId,
    body: body.trim(),
    imageKey,
    imageCaption: result.detail?.image?.caption || null,
    status: result.verdict === 'review' ? 'pending_review' : 'published',
    modStage: result.stage,
    modScore: result.score,
    modTopic: result.topic,
    modReason: result.reason,
    modDetail: JSON.stringify(result.detail || {}),
  }).run();

  if (parentId) {
    const parent = await db.select().from(schema.communityPosts)
      .where(eq(schema.communityPosts.id, parentId)).get();
    if (parent) {
      await db.update(schema.communityPosts)
        .set({ replyCount: (parent.replyCount || 0) + 1 })
        .where(eq(schema.communityPosts.id, parentId)).run();
    }
  }

  const row = await db.select().from(schema.communityPosts).where(eq(schema.communityPosts.id, id)).get();
  return Response.json({
    post: shapePost(row, await postAuthor(db, userId)),
    moderation: result,
    standing: {
      status: standing.status,
      strikes: standing.strikes,
      message: standingMessage(standing),
    },
  });
});

/**
 * Ranked feed. Engagement lifts a post, age pushes it down — the classic
 * gravity formula, computed in JS because D1 has no pow().
 */
router.get('/api/community/feed', withDB, async (request) => {
  const url = new URL(request.url);
  const viewerId = url.searchParams.get('userId') || '';
  const limit = Math.min(Number(url.searchParams.get('limit')) || 25, 50);
  const db = request.db;

  const rows = await db.select().from(schema.communityPosts)
    .where(eq(schema.communityPosts.status, 'published'))
    .orderBy(desc(schema.communityPosts.createdAt))
    .limit(200)
    .all();

  const now = Math.floor(Date.now() / 1000);
  const roots = rows.filter(r => !r.parentId);

  const ranked = roots
    .map(r => {
      const ageHours = Math.max(0, (now - (r.createdAt || now)) / 3600);
      const engagement = (r.likeCount || 0) * 3 + (r.replyCount || 0) * 2;
      const penalty = (r.reportCount || 0) * 4;
      const score = (engagement - penalty + 1) / Math.pow(ageHours + 2, 1.4);
      return { row: r, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const likedIds = new Set();
  if (viewerId) {
    const likes = await db.select().from(schema.postLikes)
      .where(eq(schema.postLikes.userId, viewerId)).all();
    for (const l of likes) likedIds.add(l.postId);
  }

  const authors = new Map();
  const posts = [];
  for (const { row } of ranked) {
    if (!authors.has(row.userId)) authors.set(row.userId, await postAuthor(db, row.userId));
    posts.push(shapePost(row, authors.get(row.userId), likedIds.has(row.id)));
  }

  return Response.json({ posts });
});

/** A single thread: the root post plus its replies, oldest first. */
router.get('/api/community/posts/:id', withDB, async (request) => {
  const db = request.db;
  const { id } = request.params;
  const url = new URL(request.url);
  const viewerId = url.searchParams.get('userId') || '';

  const root = await db.select().from(schema.communityPosts)
    .where(eq(schema.communityPosts.id, id)).get();
  if (!root) return Response.json({ error: 'Post not found' }, { status: 404 });

  const replies = await db.select().from(schema.communityPosts)
    .where(eq(schema.communityPosts.parentId, id))
    .orderBy(schema.communityPosts.createdAt)
    .all();

  const likedIds = new Set();
  if (viewerId) {
    const likes = await db.select().from(schema.postLikes)
      .where(eq(schema.postLikes.userId, viewerId)).all();
    for (const l of likes) likedIds.add(l.postId);
  }

  const authors = new Map();
  const withAuthor = async (row) => {
    if (!authors.has(row.userId)) authors.set(row.userId, await postAuthor(db, row.userId));
    return shapePost(row, authors.get(row.userId), likedIds.has(row.id));
  };

  return Response.json({
    post: await withAuthor(root),
    replies: await Promise.all(
      replies.filter(r => r.status === 'published' || r.userId === viewerId).map(withAuthor),
    ),
  });
});

router.post('/api/community/posts/:id/like', withDB, async (request) => {
  const { userId } = await request.json();
  const db = request.db;
  const { id } = request.params;
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const post = await db.select().from(schema.communityPosts)
    .where(eq(schema.communityPosts.id, id)).get();
  if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });

  const existing = await db.select().from(schema.postLikes)
    .where(and(eq(schema.postLikes.postId, id), eq(schema.postLikes.userId, userId))).get();

  if (existing) {
    await db.delete(schema.postLikes).where(eq(schema.postLikes.id, existing.id)).run();
    const likeCount = Math.max(0, (post.likeCount || 0) - 1);
    await db.update(schema.communityPosts).set({ likeCount })
      .where(eq(schema.communityPosts.id, id)).run();
    return Response.json({ liked: false, likeCount });
  }

  await db.insert(schema.postLikes).values({ postId: id, userId }).run();
  const likeCount = (post.likeCount || 0) + 1;
  await db.update(schema.communityPosts).set({ likeCount })
    .where(eq(schema.communityPosts.id, id)).run();
  return Response.json({ liked: true, likeCount });
});

router.post('/api/community/posts/:id/report', withDB, async (request) => {
  const { userId, reason = '' } = await request.json();
  const db = request.db;
  const { id } = request.params;
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const post = await db.select().from(schema.communityPosts)
    .where(eq(schema.communityPosts.id, id)).get();
  if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });

  const already = await db.select().from(schema.postReports)
    .where(and(eq(schema.postReports.postId, id), eq(schema.postReports.userId, userId))).get();
  if (already) return Response.json({ ok: true, alreadyReported: true });

  await db.insert(schema.postReports).values({ postId: id, userId, reason: reason.slice(0, 300) }).run();
  const reportCount = (post.reportCount || 0) + 1;

  // Enough independent reports pulls it from the feed pending review
  const status = reportCount >= 3 && post.status === 'published' ? 'pending_review' : post.status;
  await db.update(schema.communityPosts).set({ reportCount, status })
    .where(eq(schema.communityPosts.id, id)).run();

  return Response.json({ ok: true, reportCount, status });
});

/**
 * Moderation is admin-only. Set the secret first:
 *   npx wrangler secret put ADMIN_KEY
 * With no ADMIN_KEY configured these routes stay shut rather than open.
 */
const requireAdmin = (request, env) => {
  const provided = request.headers.get('X-Admin-Key') || '';
  if (!env.ADMIN_KEY) {
    return Response.json({ error: 'Moderation is disabled until ADMIN_KEY is set' }, { status: 503 });
  }
  if (provided !== env.ADMIN_KEY) {
    return Response.json({ error: 'Not authorised' }, { status: 401 });
  }
};

/** Posts the cascade wasn't sure about, newest first. */
router.get('/api/community/moderation/queue', requireAdmin, withDB, async (request) => {
  const db = request.db;
  const rows = await db.select().from(schema.communityPosts)
    .where(eq(schema.communityPosts.status, 'pending_review'))
    .orderBy(desc(schema.communityPosts.createdAt))
    .limit(50)
    .all();

  const authors = new Map();
  const posts = [];
  for (const row of rows) {
    if (!authors.has(row.userId)) authors.set(row.userId, await postAuthor(db, row.userId));
    posts.push({
      ...shapePost(row, authors.get(row.userId)),
      reportCount: row.reportCount,
      modDetail: safeParse(row.modDetail),
    });
  }
  return Response.json({ posts });
});

router.post('/api/community/moderation/:id', requireAdmin, withDB, async (request) => {
  const { action } = await request.json();
  const db = request.db;
  const { id } = request.params;
  if (!['approve', 'remove'].includes(action)) {
    return Response.json({ error: 'action must be approve or remove' }, { status: 400 });
  }
  await db.update(schema.communityPosts)
    .set({ status: action === 'approve' ? 'published' : 'removed' })
    .where(eq(schema.communityPosts.id, id)).run();
  return Response.json({ ok: true, status: action === 'approve' ? 'published' : 'removed' });
});

/** Users carrying strikes, worst first. */
router.get('/api/community/moderation/users', requireAdmin, withDB, async (request) => {
  const db = request.db;
  const rows = await db.select().from(schema.userModeration)
    .orderBy(desc(schema.userModeration.strikes))
    .limit(100)
    .all();

  const users = [];
  for (const row of rows) {
    // Read through getStanding so decayed strikes show as decayed here too,
    // rather than the admin seeing a stale 'restricted' badge.
    const effective = await getStanding(db, row.userId);
    if (effective.strikes === 0 && effective.status === 'ok') continue;

    const user = await db.select().from(schema.users).where(eq(schema.users.id, row.userId)).get();
    users.push({
      userId: row.userId,
      name: user?.name || 'Unknown',
      email: user?.email || null,
      strikes: effective.strikes,
      status: effective.status,
      blockedCount: row.blockedCount,
      reviewCount: row.reviewCount,
      publishedCount: row.publishedCount,
      lastTopic: row.lastTopic,
      lastViolationAt: row.lastViolationAt,
    });
  }
  return Response.json({ users, thresholds: STANDING });
});

router.post('/api/community/moderation/users/:id', requireAdmin, withDB, async (request) => {
  const { action } = await request.json();
  const db = request.db;
  const { id } = request.params;
  if (action === 'clear')    return Response.json({ standing: await clearStrikes(db, id) });
  if (action === 'restrict') return Response.json({ standing: await restrictUser(db, id) });
  return Response.json({ error: 'action must be clear or restrict' }, { status: 400 });
});

/** A user's own standing — drives the warning banner in the composer. */
router.get('/api/community/standing/:id', withDB, async (request) => {
  const standing = await getStanding(request.db, request.params.id);
  return Response.json({
    status: standing.status,
    strikes: standing.strikes,
    message: standingMessage(standing),
    thresholds: { flagAt: STANDING.flagAt, restrictAt: STANDING.restrictAt },
  });
});

function safeParse(json) {
  try { return JSON.parse(json || '{}'); } catch { return {}; }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default { fetch: router.fetch };
