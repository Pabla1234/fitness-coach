const Database = require('better-sqlite3');
const path = require('path');
const { randomUUID } = require('crypto');

// On Render, use the persistent disk mount; locally use data/fitness.db
const DB_PATH = process.env.RENDER
  ? '/data/fitness.db'
  : path.join(__dirname, 'data', 'fitness.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Create Tables ───────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL DEFAULT 'Guest User',
    email       TEXT UNIQUE,
    password    TEXT,
    is_guest    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    id                    TEXT PRIMARY KEY,
    user_id               TEXT UNIQUE NOT NULL REFERENCES users(id),
    age                   INTEGER,
    gender                TEXT,
    height                REAL,
    current_weight        REAL,
    body_fat_percentage   REAL,
    experience_level      TEXT,
    updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS goals (
    id             TEXT PRIMARY KEY,
    user_id        TEXT UNIQUE NOT NULL REFERENCES users(id),
    primary_goal   TEXT,
    target_weight  REAL,
    timeframe      TEXT,
    injuries       TEXT DEFAULT 'None',
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS training_preferences (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT UNIQUE NOT NULL REFERENCES users(id),
    environment         TEXT,
    days_per_week       INTEGER,
    split               TEXT,
    training_time       TEXT,
    cardio_preference   TEXT DEFAULT 'None',
    diet_type           TEXT DEFAULT 'Non-Veg',
    cuisine             TEXT DEFAULT 'International',
    budget              TEXT DEFAULT 'Budget',
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workout_plans (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id),
    name         TEXT,
    week_number  INTEGER DEFAULT 1,
    schedule     TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS diet_plans (
    id               TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL REFERENCES users(id),
    daily_calories   INTEGER,
    macros           TEXT,
    water_intake     REAL,
    meals            TEXT,
    weekly_schedule  TEXT,
    budget_level     TEXT DEFAULT 'Medium',
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS progress_logs (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id),
    date       TEXT NOT NULL DEFAULT (datetime('now')),
    weight     REAL,
    body_fat   REAL,
    chest      REAL,
    waist      REAL,
    arms       REAL,
    legs       REAL,
    photo_url  TEXT,
    notes      TEXT
  );
`);

// ─── Users ───────────────────────────────────────────────────────────────────

// Ensure a user row exists for auth-backend UUIDs (no-op if already present)
function ensureUser(id) {
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, is_guest) VALUES (?, 'User', 0)
  `).run(id);
}

function getUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
}

function createUser({ name = 'Guest User', email = null, password = null, isGuest = false }) {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO users (id, name, email, password, is_guest)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, email, password, isGuest ? 1 : 0);
  return getUser(id);
}

// ─── Profiles ────────────────────────────────────────────────────────────────

function getProfile(userId) {
  return db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId) || null;
}

function upsertProfile(userId, { age, gender, height, currentWeight, bodyFatPercentage, experienceLevel }) {
  ensureUser(userId);
  const existing = getProfile(userId);
  if (existing) {
    db.prepare(`
      UPDATE user_profiles SET age=?, gender=?, height=?, current_weight=?, body_fat_percentage=?,
        experience_level=?, updated_at=datetime('now')
      WHERE user_id=?
    `).run(age, gender, height, currentWeight, bodyFatPercentage, experienceLevel, userId);
  } else {
    db.prepare(`
      INSERT INTO user_profiles (id, user_id, age, gender, height, current_weight, body_fat_percentage, experience_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, age, gender, height, currentWeight, bodyFatPercentage, experienceLevel);
  }
  return getProfile(userId);
}

// ─── Goals ───────────────────────────────────────────────────────────────────

function getGoal(userId) {
  return db.prepare('SELECT * FROM goals WHERE user_id = ?').get(userId) || null;
}

function upsertGoal(userId, { primaryGoal, targetWeight, timeframe, injuries }) {
  ensureUser(userId);
  const existing = getGoal(userId);
  if (existing) {
    db.prepare(`
      UPDATE goals SET primary_goal=?, target_weight=?, timeframe=?, injuries=?, updated_at=datetime('now')
      WHERE user_id=?
    `).run(primaryGoal, targetWeight, timeframe, injuries || 'None', userId);
  } else {
    db.prepare(`
      INSERT INTO goals (id, user_id, primary_goal, target_weight, timeframe, injuries)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, primaryGoal, targetWeight, timeframe, injuries || 'None');
  }
  return getGoal(userId);
}

// ─── Training Preferences ────────────────────────────────────────────────────

function getPreferences(userId) {
  return db.prepare('SELECT * FROM training_preferences WHERE user_id = ?').get(userId) || null;
}

function upsertPreferences(userId, { environment, daysPerWeek, split, trainingTime, cardioPreference, dietType, cuisine, budget }) {
  ensureUser(userId);
  const existing = getPreferences(userId);
  if (existing) {
    db.prepare(`
      UPDATE training_preferences
      SET environment=?, days_per_week=?, split=?, training_time=?, cardio_preference=?,
          diet_type=?, cuisine=?, budget=?, updated_at=datetime('now')
      WHERE user_id=?
    `).run(environment, daysPerWeek, split, trainingTime, cardioPreference || 'None',
           dietType || 'Non-Veg', cuisine || 'International', budget || 'Budget', userId);
  } else {
    db.prepare(`
      INSERT INTO training_preferences (id, user_id, environment, days_per_week, split, training_time, cardio_preference, diet_type, cuisine, budget)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, environment, daysPerWeek, split, trainingTime,
           cardioPreference || 'None', dietType || 'Non-Veg', cuisine || 'International', budget || 'Budget');
  }
  return getPreferences(userId);
}

// ─── Workout Plans ───────────────────────────────────────────────────────────

function getWorkoutPlan(userId) {
  const row = db.prepare('SELECT * FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId);
  if (!row) return null;
  return { ...row, schedule: JSON.parse(row.schedule || '[]') };
}

function upsertWorkoutPlan(userId, { name, weekNumber, schedule }) {
  ensureUser(userId);
  const existing = db.prepare('SELECT id FROM workout_plans WHERE user_id = ? AND week_number = ?').get(userId, weekNumber || 1);
  if (existing) {
    db.prepare(`
      UPDATE workout_plans SET name=?, schedule=?, created_at=datetime('now') WHERE id=?
    `).run(name, JSON.stringify(schedule), existing.id);
    return getWorkoutPlan(userId);
  } else {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO workout_plans (id, user_id, name, week_number, schedule)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, name, weekNumber || 1, JSON.stringify(schedule));
    return getWorkoutPlan(userId);
  }
}

// ─── Diet Plans ──────────────────────────────────────────────────────────────

function getDietPlan(userId) {
  const row = db.prepare('SELECT * FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId);
  if (!row) return null;
  return {
    ...row,
    macros: JSON.parse(row.macros || '{}'),
    meals: JSON.parse(row.meals || '[]'),
    weekly_schedule: JSON.parse(row.weekly_schedule || '[]'),
  };
}

function upsertDietPlan(userId, { dailyCalories, macros, waterIntake, meals, weeklySchedule, budgetLevel }) {
  ensureUser(userId);
  const existing = db.prepare('SELECT id FROM diet_plans WHERE user_id = ?').get(userId);
  if (existing) {
    db.prepare(`
      UPDATE diet_plans SET daily_calories=?, macros=?, water_intake=?, meals=?, weekly_schedule=?, budget_level=?, created_at=datetime('now')
      WHERE id=?
    `).run(dailyCalories, JSON.stringify(macros), waterIntake, JSON.stringify(meals),
           JSON.stringify(weeklySchedule || []), budgetLevel || 'Medium', existing.id);
  } else {
    db.prepare(`
      INSERT INTO diet_plans (id, user_id, daily_calories, macros, water_intake, meals, weekly_schedule, budget_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, dailyCalories, JSON.stringify(macros), waterIntake,
           JSON.stringify(meals), JSON.stringify(weeklySchedule || []), budgetLevel || 'Medium');
  }
  return getDietPlan(userId);
}

// ─── Progress Logs ───────────────────────────────────────────────────────────

function addProgressLog(userId, { weight, bodyFat, chest, waist, arms, legs, photoUrl, notes }) {
  ensureUser(userId);
  const id = randomUUID();
  db.prepare(`
    INSERT INTO progress_logs (id, user_id, weight, body_fat, chest, waist, arms, legs, photo_url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, weight, bodyFat, chest, waist, arms, legs, photoUrl, notes);
  return db.prepare('SELECT * FROM progress_logs WHERE id = ?').get(id);
}

function getProgressLogs(userId) {
  return db.prepare('SELECT * FROM progress_logs WHERE user_id = ? ORDER BY date ASC').all(userId);
}

module.exports = {
  getUser, findUserByEmail, createUser,
  getProfile, upsertProfile,
  getGoal, upsertGoal,
  getPreferences, upsertPreferences,
  getWorkoutPlan, upsertWorkoutPlan,
  getDietPlan, upsertDietPlan,
  addProgressLog, getProgressLogs,
};
