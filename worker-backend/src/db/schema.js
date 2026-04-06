import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id:           text('id').primaryKey(),
  name:         text('name').default('Guest User'),
  email:        text('email').unique(),
  passwordHash: text('password_hash'),
  isGuest:      integer('is_guest', { mode: 'boolean' }).default(false),
  createdAt:    integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

export const userProfiles = sqliteTable('user_profiles', {
  id:                 integer('id').primaryKey({ autoIncrement: true }),
  userId:             text('user_id').references(() => users.id).notNull().unique(),
  age:                integer('age'),
  gender:             text('gender'),
  height:             real('height'),
  currentWeight:      real('current_weight'),
  bodyFatPercentage:  real('body_fat_percentage'),
  experienceLevel:    text('experience_level'),
  updatedAt:          integer('updated_at').default(sql`(strftime('%s', 'now'))`)
});

export const goals = sqliteTable('goals', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  userId:       text('user_id').references(() => users.id).notNull().unique(),
  primaryGoal:  text('primary_goal'),
  targetWeight: real('target_weight'),
  timeframe:    text('timeframe'),
  injuries:     text('injuries').default('None'),
  updatedAt:    integer('updated_at').default(sql`(strftime('%s', 'now'))`)
});

export const trainingPreferences = sqliteTable('training_preferences', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  userId:           text('user_id').references(() => users.id).notNull().unique(),
  environment:      text('environment'),
  daysPerWeek:      integer('days_per_week'),
  split:            text('split'),
  trainingTime:     text('training_time'),
  cardioPreference: text('cardio_preference').default('None'),
  dietType:         text('diet_type').default('Non-Veg'),
  cuisine:          text('cuisine').default('International'),
  budget:           text('budget').default('Budget'),
  updatedAt:        integer('updated_at').default(sql`(strftime('%s', 'now'))`)
});

export const workoutPlans = sqliteTable('workout_plans', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  userId:      text('user_id').references(() => users.id).notNull(),
  name:        text('name'),
  weekNumber:  integer('week_number').default(1),
  schedule:    text('schedule'),
  generatedAt: integer('generated_at').default(sql`(strftime('%s', 'now'))`)
});

export const dietPlans = sqliteTable('diet_plans', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  userId:         text('user_id').references(() => users.id).notNull().unique(),
  dailyCalories:  integer('daily_calories'),
  macros:         text('macros'),
  waterIntake:    real('water_intake'),
  weeklySchedule: text('weekly_schedule'),
  meals:          text('meals'),
  budgetLevel:    text('budget_level').default('Budget'),
  generatedAt:    integer('generated_at').default(sql`(strftime('%s', 'now'))`)
});

export const progressLogs = sqliteTable('progress_logs', {
  id:       integer('id').primaryKey({ autoIncrement: true }),
  userId:   text('user_id').references(() => users.id).notNull(),
  date:     integer('date').default(sql`(strftime('%s', 'now'))`),
  weight:   real('weight'),
  bodyFat:  real('body_fat'),
  chest:    real('chest'),
  waist:    real('waist'),
  arms:     real('arms'),
  legs:     real('legs'),
  photoUrl: text('photo_url'),
  notes:    text('notes')
});
