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

export const exerciseLogs = sqliteTable('exercise_logs', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  userId:       text('user_id').references(() => users.id).notNull(),
  date:         text('date').notNull(),
  exerciseName: text('exercise_name').notNull(),
  workoutDay:   text('workout_day'),
  completed:    integer('completed', { mode: 'boolean' }).default(false),
  createdAt:    integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

// ─── Community ────────────────────────────────────────────────────────────────

export const communityPosts = sqliteTable('community_posts', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').references(() => users.id).notNull(),
  /** null for a root post; set for a reply in a thread */
  parentId:    text('parent_id'),
  body:        text('body'),
  imageKey:    text('image_key'),
  /** Cached vision-model description, so re-reviews don't re-caption */
  imageCaption: text('image_caption'),

  /** published | pending_review | blocked | removed */
  status:      text('status').notNull().default('published'),
  /** Which cascade stage decided: lexicon | embedding | adjudicator | safety | fallback */
  modStage:    text('mod_stage'),
  modScore:    real('mod_score'),
  modTopic:    text('mod_topic'),
  modReason:   text('mod_reason'),
  modDetail:   text('mod_detail'),

  likeCount:   integer('like_count').notNull().default(0),
  replyCount:  integer('reply_count').notNull().default(0),
  reportCount: integer('report_count').notNull().default(0),
  createdAt:   integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

export const postLikes = sqliteTable('post_likes', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  postId:    text('post_id').references(() => communityPosts.id).notNull(),
  userId:    text('user_id').references(() => users.id).notNull(),
  createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

export const postReports = sqliteTable('post_reports', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  postId:    text('post_id').references(() => communityPosts.id).notNull(),
  userId:    text('user_id').references(() => users.id).notNull(),
  reason:    text('reason'),
  createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

/** Per-user moderation history — strikes accumulate across posts. */
export const userModeration = sqliteTable('user_moderation', {
  userId:          text('user_id').primaryKey().references(() => users.id),
  /** Violations inside the current window; decays after QUIET_DAYS of good behaviour */
  strikes:         integer('strikes').notNull().default(0),
  blockedCount:    integer('blocked_count').notNull().default(0),
  reviewCount:     integer('review_count').notNull().default(0),
  publishedCount:  integer('published_count').notNull().default(0),
  /** ok | flagged | restricted */
  status:          text('status').notNull().default('ok'),
  lastViolationAt: integer('last_violation_at'),
  lastTopic:       text('last_topic'),
  updatedAt:       integer('updated_at').default(sql`(strftime('%s', 'now'))`)
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
