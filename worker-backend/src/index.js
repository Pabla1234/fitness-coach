import { AutoRouter, cors } from 'itty-router';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import * as schema from './db/schema';
import { getCoachResponse } from './services/aiCoach';
import { generateDietPlan } from './services/dietGenerator';
import { generateWorkoutPlan } from './services/workoutGenerator';

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

// ─── AI Coach Route ───────────────────────────────────────────────────────────

router.post('/api/ai/ask', withDB, async (request) => {
  const { userId, message } = await request.json();
  const db = request.db;
  const profile = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId)).get();
  const goal    = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId)).get();
  const prefs   = await db.select().from(schema.trainingPreferences).where(eq(schema.trainingPreferences.userId, userId)).get();
  const answer  = await getCoachResponse(userId, message, { profile, goal, prefs }, request.env);
  return Response.json({ answer });
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

// ─── Export ───────────────────────────────────────────────────────────────────

export default { fetch: router.fetch };
