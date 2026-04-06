-- Add password_hash to users (replaces plain password)
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Add diet preference columns to training_preferences
ALTER TABLE training_preferences ADD COLUMN diet_type TEXT DEFAULT 'Non-Veg';
ALTER TABLE training_preferences ADD COLUMN cuisine TEXT DEFAULT 'International';
ALTER TABLE training_preferences ADD COLUMN budget TEXT DEFAULT 'Budget';

-- Add name column to workout_plans
ALTER TABLE workout_plans ADD COLUMN name TEXT;

-- Add budget_level to diet_plans
ALTER TABLE diet_plans ADD COLUMN budget_level TEXT DEFAULT 'Budget';
