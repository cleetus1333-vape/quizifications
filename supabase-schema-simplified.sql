-- =============================================
-- QUIZIFICATIONS SIMPLIFIED SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak_current INT DEFAULT 0,
  streak_best INT DEFAULT 0,
  last_quiz_date DATE,
  total_questions_answered INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  push_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USER SETTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  quiz_interval_minutes INT DEFAULT 60,
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibrate_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  active_hours_start TIME DEFAULT '09:00',
  active_hours_end TIME DEFAULT '21:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTES
-- =============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'typed',
  question_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTE QUESTIONS (AI-generated)
-- =============================================
CREATE TABLE IF NOT EXISTS note_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answer_1 TEXT NOT NULL,
  wrong_answer_2 TEXT NOT NULL,
  wrong_answer_3 TEXT NOT NULL,
  times_shown INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- QUIZ ATTEMPTS
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES note_questions(id) ON DELETE CASCADE,
  was_correct BOOLEAN,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User settings
CREATE POLICY "Users manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Notes
CREATE POLICY "Users manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Note questions
CREATE POLICY "Users manage own note questions" ON note_questions
  FOR ALL USING (auth.uid() = user_id);

-- Quiz attempts
CREATE POLICY "Users manage own attempts" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get random question from user's notes
CREATE OR REPLACE FUNCTION get_random_note_question(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  question TEXT,
  correct_answer TEXT,
  wrong_answer_1 TEXT,
  wrong_answer_2 TEXT,
  wrong_answer_3 TEXT,
  note_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nq.id,
    nq.question,
    nq.correct_answer,
    nq.wrong_answer_1,
    nq.wrong_answer_2,
    nq.wrong_answer_3,
    n.title as note_title
  FROM note_questions nq
  JOIN notes n ON nq.note_id = n.id
  WHERE nq.user_id = p_user_id
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
  v_current_streak INT;
  v_best_streak INT;
BEGIN
  SELECT last_quiz_date, streak_current, streak_best 
  INTO v_last_date, v_current_streak, v_best_streak
  FROM users WHERE id = p_user_id;
  
  IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
    v_current_streak := 1;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
  END IF;
  
  IF v_current_streak > v_best_streak THEN
    v_best_streak := v_current_streak;
  END IF;
  
  UPDATE users 
  SET streak_current = v_current_streak,
      streak_best = v_best_streak,
      last_quiz_date = v_today
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record quiz attempt and update stats
CREATE OR REPLACE FUNCTION record_quiz_attempt(
  p_user_id UUID,
  p_question_id UUID,
  p_was_correct BOOLEAN
)
RETURNS void AS $$
BEGIN
  INSERT INTO quiz_attempts (user_id, question_id, was_correct)
  VALUES (p_user_id, p_question_id, p_was_correct);
  
  UPDATE note_questions 
  SET times_shown = times_shown + 1,
      times_correct = times_correct + CASE WHEN p_was_correct THEN 1 ELSE 0 END
  WHERE id = p_question_id;
  
  UPDATE users 
  SET total_questions_answered = total_questions_answered + 1,
      total_correct = total_correct + CASE WHEN p_was_correct THEN 1 ELSE 0 END
  WHERE id = p_user_id;
  
  PERFORM update_user_streak(p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to increment question stats (called from app)
CREATE OR REPLACE FUNCTION increment_question_stats(q_id UUID, was_correct BOOLEAN)
RETURNS void AS $$
BEGIN
  UPDATE note_questions
  SET times_shown = times_shown + 1,
      times_correct = times_correct + CASE WHEN was_correct THEN 1 ELSE 0 END
  WHERE id = q_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DONE!
-- =============================================
