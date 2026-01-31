-- =============================================
-- POPQUIZ SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  referral_code TEXT UNIQUE,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  streak_current INT DEFAULT 0,
  streak_best INT DEFAULT 0,
  last_quiz_date DATE,
  push_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := LOWER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- =============================================
-- USER SETTINGS
-- =============================================
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  quiz_interval_minutes INT DEFAULT 30,
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibrate_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STUDY WINDOWS
-- =============================================
CREATE TABLE study_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  label TEXT, -- "Morning", "Afternoon", etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_active INT[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Sun, 7=Sat
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PRE-BUILT CATEGORIES (Free tier)
-- =============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  icon TEXT,
  question_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's selected categories
CREATE TABLE user_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Pre-built questions
CREATE TABLE category_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answer_1 TEXT NOT NULL,
  wrong_answer_2 TEXT NOT NULL,
  wrong_answer_3 TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USER NOTES (Paid tier)
-- =============================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_syllabus BOOLEAN DEFAULT FALSE,
  question_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI-generated questions from notes
CREATE TABLE note_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answer_1 TEXT NOT NULL,
  wrong_answer_2 TEXT NOT NULL,
  wrong_answer_3 TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FRIENDSHIPS
-- =============================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- =============================================
-- REFERRALS
-- =============================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- QUIZ ATTEMPTS
-- =============================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  question_source TEXT NOT NULL, -- 'category' or 'note'
  was_correct BOOLEAN,
  was_dodged BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- WEEKLY STATS (for leaderboards)
-- =============================================
CREATE TABLE weekly_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  questions_answered INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;

-- Users: can read own, update own
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users: can view others for leaderboard/friends
CREATE POLICY "Users can view others for social" ON users
  FOR SELECT USING (true);

-- User settings
CREATE POLICY "Users manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Study windows
CREATE POLICY "Users manage own windows" ON study_windows
  FOR ALL USING (auth.uid() = user_id);

-- Categories: everyone can read
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- User categories
CREATE POLICY "Users manage own categories" ON user_categories
  FOR ALL USING (auth.uid() = user_id);

-- Category questions: everyone can read
CREATE POLICY "Anyone can view category questions" ON category_questions
  FOR SELECT USING (true);

-- Notes
CREATE POLICY "Users manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Note questions
CREATE POLICY "Users manage own note questions" ON note_questions
  FOR ALL USING (auth.uid() = user_id);

-- Friendships
CREATE POLICY "Users manage own friendships" ON friendships
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Referrals
CREATE POLICY "Users view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Quiz attempts
CREATE POLICY "Users manage own attempts" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Weekly stats
CREATE POLICY "Users manage own stats" ON weekly_stats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all stats for leaderboard" ON weekly_stats
  FOR SELECT USING (true);

-- =============================================
-- SEED DATA: Categories + Sample Questions
-- =============================================

-- Categories
INSERT INTO categories (name, subject, icon, question_count) VALUES
  ('SAT Math', 'Test Prep', '📐', 50),
  ('SAT Reading', 'Test Prep', '📖', 50),
  ('Biology Basics', 'Science', '🧬', 40),
  ('Chemistry 101', 'Science', '⚗️', 40),
  ('US History', 'History', '🇺🇸', 45),
  ('World History', 'History', '🌍', 45),
  ('Spanish Vocab', 'Language', '🇪🇸', 60),
  ('French Vocab', 'Language', '🇫🇷', 60),
  ('Psychology 101', 'Social Science', '🧠', 35),
  ('Economics Basics', 'Social Science', '📈', 35);

-- Sample questions for Biology Basics
INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is the powerhouse of the cell?', 'Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'
FROM categories WHERE name = 'Biology Basics';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What molecule carries genetic information?', 'DNA', 'RNA', 'Protein', 'Lipid'
FROM categories WHERE name = 'Biology Basics';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is the process by which plants make food?', 'Photosynthesis', 'Respiration', 'Fermentation', 'Digestion'
FROM categories WHERE name = 'Biology Basics';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What type of cell has no nucleus?', 'Prokaryotic', 'Eukaryotic', 'Plant cell', 'Animal cell'
FROM categories WHERE name = 'Biology Basics';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What organelle is responsible for protein synthesis?', 'Ribosome', 'Mitochondria', 'Lysosome', 'Vacuole'
FROM categories WHERE name = 'Biology Basics';

-- Sample questions for US History
INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What year did the American Revolution begin?', '1775', '1776', '1783', '1765'
FROM categories WHERE name = 'US History';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'Who wrote the Declaration of Independence?', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin', 'John Adams'
FROM categories WHERE name = 'US History';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What amendment abolished slavery?', '13th Amendment', '14th Amendment', '15th Amendment', '19th Amendment'
FROM categories WHERE name = 'US History';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'Who was the first President of the United States?', 'George Washington', 'John Adams', 'Thomas Jefferson', 'Benjamin Franklin'
FROM categories WHERE name = 'US History';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What year did World War II end?', '1945', '1944', '1946', '1943'
FROM categories WHERE name = 'US History';

-- Sample questions for SAT Math
INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is the value of x if 2x + 5 = 15?', '5', '10', '7.5', '4'
FROM categories WHERE name = 'SAT Math';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is the slope of the line y = 3x + 2?', '3', '2', '5', '1'
FROM categories WHERE name = 'SAT Math';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is 15% of 80?', '12', '15', '8', '10'
FROM categories WHERE name = 'SAT Math';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'If a triangle has angles of 60° and 80°, what is the third angle?', '40°', '50°', '60°', '30°'
FROM categories WHERE name = 'SAT Math';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is the square root of 144?', '12', '14', '11', '13'
FROM categories WHERE name = 'SAT Math';

-- Sample questions for Spanish Vocab
INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What does "hola" mean?', 'Hello', 'Goodbye', 'Please', 'Thank you'
FROM categories WHERE name = 'Spanish Vocab';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What does "gracias" mean?', 'Thank you', 'Please', 'Sorry', 'Hello'
FROM categories WHERE name = 'Spanish Vocab';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is "water" in Spanish?', 'Agua', 'Leche', 'Jugo', 'Vino'
FROM categories WHERE name = 'Spanish Vocab';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What does "libro" mean?', 'Book', 'Library', 'Free', 'Read'
FROM categories WHERE name = 'Spanish Vocab';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is "house" in Spanish?', 'Casa', 'Carro', 'Cama', 'Calle'
FROM categories WHERE name = 'Spanish Vocab';

-- Sample questions for Psychology 101
INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'Who is known as the father of psychoanalysis?', 'Sigmund Freud', 'Carl Jung', 'B.F. Skinner', 'Ivan Pavlov'
FROM categories WHERE name = 'Psychology 101';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is classical conditioning associated with?', 'Ivan Pavlov', 'B.F. Skinner', 'Carl Rogers', 'Abraham Maslow'
FROM categories WHERE name = 'Psychology 101';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What does the "id" represent in Freud''s theory?', 'Primitive desires', 'Moral conscience', 'Rational thought', 'Social norms'
FROM categories WHERE name = 'Psychology 101';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What is the top of Maslow''s hierarchy of needs?', 'Self-actualization', 'Safety', 'Love', 'Esteem'
FROM categories WHERE name = 'Psychology 101';

INSERT INTO category_questions (category_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3)
SELECT id, 'What type of memory holds information temporarily?', 'Short-term memory', 'Long-term memory', 'Sensory memory', 'Procedural memory'
FROM categories WHERE name = 'Psychology 101';

-- Update question counts
UPDATE categories SET question_count = (
  SELECT COUNT(*) FROM category_questions WHERE category_id = categories.id
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get random question from user's categories
CREATE OR REPLACE FUNCTION get_random_category_question(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  question TEXT,
  correct_answer TEXT,
  wrong_answer_1 TEXT,
  wrong_answer_2 TEXT,
  wrong_answer_3 TEXT,
  category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cq.id,
    cq.question,
    cq.correct_answer,
    cq.wrong_answer_1,
    cq.wrong_answer_2,
    cq.wrong_answer_3,
    c.name as category_name
  FROM category_questions cq
  JOIN categories c ON cq.category_id = c.id
  JOIN user_categories uc ON c.id = uc.category_id
  WHERE uc.user_id = p_user_id
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

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
    -- Streak broken or first quiz
    v_current_streak := 1;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  END IF;
  -- If same day, streak stays the same
  
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

-- Function to get friend leaderboard
CREATE OR REPLACE FUNCTION get_friend_leaderboard(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  streak_current INT,
  questions_this_week INT,
  accuracy NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH friends AS (
    SELECT friend_id FROM friendships 
    WHERE user_id = p_user_id AND status = 'accepted'
    UNION
    SELECT user_id FROM friendships 
    WHERE friend_id = p_user_id AND status = 'accepted'
    UNION
    SELECT p_user_id -- Include self
  ),
  week_stats AS (
    SELECT 
      ws.user_id,
      ws.questions_answered,
      CASE WHEN ws.questions_answered > 0 
        THEN ROUND((ws.correct_answers::NUMERIC / ws.questions_answered) * 100, 1)
        ELSE 0 
      END as accuracy
    FROM weekly_stats ws
    WHERE ws.week_start = DATE_TRUNC('week', CURRENT_DATE)
  )
  SELECT 
    u.id as user_id,
    u.username,
    u.avatar_url,
    u.streak_current,
    COALESCE(ws.questions_answered, 0) as questions_this_week,
    COALESCE(ws.accuracy, 0) as accuracy
  FROM users u
  JOIN friends f ON u.id = f.friend_id
  LEFT JOIN week_stats ws ON u.id = ws.user_id
  ORDER BY u.streak_current DESC, ws.questions_answered DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to get global leaderboard
CREATE OR REPLACE FUNCTION get_global_leaderboard(p_limit INT DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  streak_current INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.username,
    u.avatar_url,
    u.streak_current
  FROM users u
  WHERE u.username IS NOT NULL
  ORDER BY u.streak_current DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DONE! Your database is ready.
-- =============================================
