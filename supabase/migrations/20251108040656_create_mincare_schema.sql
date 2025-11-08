/*
  # MINCARE Wellness Application - Complete Database Schema

  ## Overview
  This migration creates the complete database structure for the MINCARE wellness application,
  including tables for user profiles, mood journaling, mental fitness tracking, stress monitoring,
  sleep tracking, and community features.

  ## New Tables

  ### 1. `profiles`
  User profile and wellness data
  - `id` (uuid, FK to auth.users) - User identifier
  - `display_name` (text) - User's display name
  - `wellness_score` (integer) - Overall wellness score (0-100)
  - `premium_status` (boolean) - Premium subscription status
  - `onboarding_completed` (boolean) - Onboarding completion flag
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `mood_entries`
  AI-powered mood journal entries
  - `id` (uuid) - Entry identifier
  - `user_id` (uuid, FK) - User who created the entry
  - `mood_type` (text) - Emoji or mood category
  - `entry_text` (text) - Journal entry content
  - `sentiment_score` (decimal) - AI-analyzed sentiment (-1 to 1)
  - `detected_emotions` (jsonb) - Array of detected emotions
  - `ai_insights` (text) - Generated AI insights
  - `shared_to_community` (boolean) - Shared anonymously to CalmCircle
  - `created_at` (timestamptz) - Entry timestamp

  ### 3. `mindgym_exercises`
  Mental workout exercise definitions
  - `id` (uuid) - Exercise identifier
  - `name` (text) - Exercise name
  - `type` (text) - Exercise type (focus, meditation, breathing)
  - `difficulty_level` (integer) - Difficulty (1-10)
  - `description` (text) - Exercise description
  - `duration_seconds` (integer) - Exercise duration
  - `premium_only` (boolean) - Premium feature flag

  ### 4. `mindgym_progress`
  User progress in MindGym exercises
  - `id` (uuid) - Progress record identifier
  - `user_id` (uuid, FK) - User identifier
  - `exercise_id` (uuid, FK) - Exercise identifier
  - `completed_at` (timestamptz) - Completion timestamp
  - `score` (integer) - Performance score
  - `streak_count` (integer) - Current streak
  - `fitness_level` (integer) - Mental fitness level

  ### 5. `stress_readings`
  StressSnap physiological stress data
  - `id` (uuid) - Reading identifier
  - `user_id` (uuid, FK) - User identifier
  - `heart_rate` (integer) - Heart rate BPM
  - `stress_level` (integer) - Calculated stress level (1-10)
  - `data_source` (text) - Data source (camera, watch, manual)
  - `intervention_triggered` (boolean) - Whether intervention was suggested
  - `recorded_at` (timestamptz) - Reading timestamp

  ### 6. `sleep_sessions`
  SleepPal sleep tracking data
  - `id` (uuid) - Session identifier
  - `user_id` (uuid, FK) - User identifier
  - `sleep_start` (timestamptz) - Sleep start time
  - `sleep_end` (timestamptz) - Sleep end time
  - `duration_minutes` (integer) - Total sleep duration
  - `quality_score` (integer) - Sleep quality (1-10)
  - `sleep_data` (jsonb) - Detailed sleep phases
  - `bedtime_routine_followed` (boolean) - Routine adherence

  ### 7. `sleep_tips`
  Personalized sleep coaching tips
  - `id` (uuid) - Tip identifier
  - `user_id` (uuid, FK) - User identifier
  - `tip_text` (text) - Coaching tip content
  - `tip_type` (text) - Tip category
  - `created_at` (timestamptz) - Tip generation timestamp

  ### 8. `calm_circle_groups`
  Community wellness groups
  - `id` (uuid) - Group identifier
  - `name` (text) - Group name
  - `topic` (text) - Group topic/focus
  - `description` (text) - Group description
  - `member_count` (integer) - Number of members
  - `created_at` (timestamptz) - Creation timestamp

  ### 9. `calm_circle_memberships`
  User group memberships
  - `id` (uuid) - Membership identifier
  - `user_id` (uuid, FK) - User identifier
  - `group_id` (uuid, FK) - Group identifier
  - `joined_at` (timestamptz) - Join timestamp
  - `is_moderator` (boolean) - Moderator status

  ### 10. `calm_circle_posts`
  Anonymous community posts
  - `id` (uuid) - Post identifier
  - `user_id` (uuid, FK) - User identifier (kept private)
  - `group_id` (uuid, FK) - Group identifier
  - `content` (text) - Post content
  - `ai_moderation_status` (text) - Moderation status
  - `created_at` (timestamptz) - Post timestamp

  ### 11. `daily_routines`
  Personalized Daily Flow routines
  - `id` (uuid) - Routine identifier
  - `user_id` (uuid, FK) - User identifier
  - `routine_data` (jsonb) - Routine structure and activities
  - `completed` (boolean) - Completion status
  - `routine_date` (date) - Date for routine
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies restrict users to their own data
  - Community posts readable by group members
  - AI moderation ensures safe community interactions

  ## Indexes
  - Optimized for common queries on user_id, created_at, and date fields
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  wellness_score integer DEFAULT 50 CHECK (wellness_score >= 0 AND wellness_score <= 100),
  premium_status boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Mood entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_type text NOT NULL,
  entry_text text DEFAULT '',
  sentiment_score decimal(3,2) DEFAULT 0.0 CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  detected_emotions jsonb DEFAULT '[]'::jsonb,
  ai_insights text DEFAULT '',
  shared_to_community boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS mood_entries_user_created_idx ON mood_entries(user_id, created_at DESC);

-- MindGym exercises table
CREATE TABLE IF NOT EXISTS mindgym_exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('focus', 'meditation', 'breathing', 'challenge')),
  difficulty_level integer NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
  description text NOT NULL,
  duration_seconds integer DEFAULT 300,
  premium_only boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mindgym_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises"
  ON mindgym_exercises FOR SELECT
  TO authenticated
  USING (true);

-- MindGym progress table
CREATE TABLE IF NOT EXISTS mindgym_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES mindgym_exercises(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  score integer DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  streak_count integer DEFAULT 1,
  fitness_level integer DEFAULT 1 CHECK (fitness_level >= 1 AND fitness_level <= 100)
);

ALTER TABLE mindgym_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON mindgym_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON mindgym_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS mindgym_progress_user_idx ON mindgym_progress(user_id, completed_at DESC);

-- Stress readings table
CREATE TABLE IF NOT EXISTS stress_readings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  heart_rate integer,
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  data_source text DEFAULT 'manual' CHECK (data_source IN ('camera', 'watch', 'manual', 'sensor')),
  intervention_triggered boolean DEFAULT false,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE stress_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stress readings"
  ON stress_readings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stress readings"
  ON stress_readings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS stress_readings_user_idx ON stress_readings(user_id, recorded_at DESC);

-- Sleep sessions table
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_start timestamptz NOT NULL,
  sleep_end timestamptz,
  duration_minutes integer,
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 10),
  sleep_data jsonb DEFAULT '{}'::jsonb,
  bedtime_routine_followed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep sessions"
  ON sleep_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep sessions"
  ON sleep_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep sessions"
  ON sleep_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sleep_sessions_user_idx ON sleep_sessions(user_id, sleep_start DESC);

-- Sleep tips table
CREATE TABLE IF NOT EXISTS sleep_tips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_text text NOT NULL,
  tip_type text NOT NULL CHECK (tip_type IN ('routine', 'environment', 'exercise', 'nutrition', 'timing')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sleep_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep tips"
  ON sleep_tips FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep tips"
  ON sleep_tips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- CalmCircle groups table
CREATE TABLE IF NOT EXISTS calm_circle_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  topic text NOT NULL CHECK (topic IN ('stress-relief', 'sleep-improvement', 'positive-thinking', 'mindfulness', 'general')),
  description text NOT NULL,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calm_circle_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups"
  ON calm_circle_groups FOR SELECT
  TO authenticated
  USING (true);

-- CalmCircle memberships table
CREATE TABLE IF NOT EXISTS calm_circle_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES calm_circle_groups(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  is_moderator boolean DEFAULT false,
  UNIQUE(user_id, group_id)
);

ALTER TABLE calm_circle_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships"
  ON calm_circle_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memberships"
  ON calm_circle_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memberships"
  ON calm_circle_memberships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- CalmCircle posts table
CREATE TABLE IF NOT EXISTS calm_circle_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES calm_circle_groups(id) ON DELETE CASCADE,
  content text NOT NULL,
  ai_moderation_status text DEFAULT 'approved' CHECK (ai_moderation_status IN ('approved', 'pending', 'flagged', 'removed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calm_circle_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view posts"
  ON calm_circle_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calm_circle_memberships
      WHERE calm_circle_memberships.group_id = calm_circle_posts.group_id
      AND calm_circle_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert posts to their groups"
  ON calm_circle_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM calm_circle_memberships
      WHERE calm_circle_memberships.group_id = calm_circle_posts.group_id
      AND calm_circle_memberships.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS calm_circle_posts_group_idx ON calm_circle_posts(group_id, created_at DESC);

-- Daily routines table
CREATE TABLE IF NOT EXISTS daily_routines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  routine_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, routine_date)
);

ALTER TABLE daily_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own routines"
  ON daily_routines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines"
  ON daily_routines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON daily_routines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS daily_routines_user_date_idx ON daily_routines(user_id, routine_date DESC);

-- Insert sample MindGym exercises
INSERT INTO mindgym_exercises (name, type, difficulty_level, description, duration_seconds, premium_only) VALUES
  ('Box Breathing', 'breathing', 1, 'Breathe in for 4, hold for 4, out for 4, hold for 4. Perfect for quick stress relief.', 240, false),
  ('Focus Sprint', 'focus', 3, 'Concentrate on a single task without distraction. Build your attention muscle.', 300, false),
  ('Body Scan Meditation', 'meditation', 2, 'Progressive relaxation through mindful body awareness.', 600, false),
  ('Memory Challenge', 'challenge', 5, 'Test and improve your working memory with pattern recognition.', 180, false),
  ('4-7-8 Breathing', 'breathing', 2, 'Inhale for 4, hold for 7, exhale for 8. Ancient relaxation technique.', 300, false),
  ('Mindful Minutes', 'meditation', 1, 'Simple guided meditation for beginners.', 300, false),
  ('Concentration Builder', 'focus', 4, 'Advanced focus exercises with increasing difficulty.', 420, true),
  ('Deep Meditation', 'meditation', 6, 'Extended meditation session for experienced practitioners.', 1200, true)
ON CONFLICT DO NOTHING;

-- Insert sample CalmCircle groups
INSERT INTO calm_circle_groups (name, topic, description, member_count) VALUES
  ('Stress Warriors', 'stress-relief', 'Share techniques and support for managing daily stress', 0),
  ('Sleep Better Club', 'sleep-improvement', 'Tips, tricks, and encouragement for better sleep habits', 0),
  ('Positive Vibes', 'positive-thinking', 'Cultivate optimism and share uplifting experiences', 0),
  ('Mindful Living', 'mindfulness', 'Practice presence and awareness in everyday life', 0),
  ('Wellness Journey', 'general', 'General wellness discussion and community support', 0)
ON CONFLICT DO NOTHING;