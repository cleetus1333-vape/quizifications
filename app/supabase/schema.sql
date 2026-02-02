-- Quizifications Simplified Database Schema
-- MVP: Notes, Quiz, Groups (premium 1-20 members), no social features

-- Users table (extended from Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_interval_minutes INTEGER DEFAULT 30,
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibrate_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study windows (when user wants to receive quizzes)
CREATE TABLE IF NOT EXISTS study_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (pre-populated study topics)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📚',
  question_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User selected categories
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Category questions (pre-made questions)
CREATE TABLE IF NOT EXISTS category_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answer_1 TEXT NOT NULL,
  wrong_answer_2 TEXT NOT NULL,
  wrong_answer_3 TEXT NOT NULL,
  difficulty INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes (user-created study material, premium feature)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_syllabus BOOLEAN DEFAULT FALSE,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note questions (AI-generated from user notes)
CREATE TABLE IF NOT EXISTS note_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answer_1 TEXT NOT NULL,
  wrong_answer_2 TEXT NOT NULL,
  wrong_answer_3 TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts (tracks user answers)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_source TEXT NOT NULL CHECK (question_source IN ('category', 'note', 'group')),
  question_id UUID NOT NULL,
  was_correct BOOLEAN NOT NULL,
  was_dodged BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (premium feature, max 20 members)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(gen_random_uuid()::text from 1 for 6)),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 1,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group shared notes
CREATE TABLE IF NOT EXISTS group_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, note_id)
);

-- Group leaderboard (weekly stats)
CREATE TABLE IF NOT EXISTS group_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id, week_start)
);

-- Weekly stats (for leaderboards)
CREATE TABLE IF NOT EXISTS weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_note_questions_note_id ON note_questions(note_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_answered_at ON quiz_attempts(answered_at);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code);

-- Trigger to update member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_member_count ON group_members;
CREATE TRIGGER trigger_update_group_member_count
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Function to get group leaderboard
CREATE OR REPLACE FUNCTION get_group_leaderboard(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  questions_this_week INTEGER,
  correct_this_week INTEGER,
  accuracy INTEGER,
  streak_current INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.user_id,
    u.username,
    COALESCE(gl.questions_answered, 0)::INTEGER as questions_this_week,
    COALESCE(gl.questions_correct, 0)::INTEGER as correct_this_week,
    CASE 
      WHEN COALESCE(gl.questions_answered, 0) > 0 
      THEN ((COALESCE(gl.questions_correct, 0)::FLOAT / gl.questions_answered) * 100)::INTEGER
      ELSE 0
    END as accuracy,
    u.streak_current
  FROM group_members gm
  JOIN users u ON u.id = gm.user_id
  LEFT JOIN group_leaderboard gl ON gl.group_id = gm.group_id 
    AND gl.user_id = gm.user_id
    AND gl.week_start = date_trunc('week', NOW())::date
  WHERE gm.group_id = p_group_id
  ORDER BY COALESCE(gl.questions_correct, 0) DESC, u.streak_current DESC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own account" ON users FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own study windows" ON study_windows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own note questions" ON note_questions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quiz attempts" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own weekly stats" ON weekly_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view all stats for leaderboard" ON weekly_stats FOR SELECT USING (true);

-- Group policies
CREATE POLICY "Users can view groups they belong to" ON groups FOR SELECT 
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update groups" ON groups FOR UPDATE 
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete groups" ON groups FOR DELETE 
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view group members" ON group_members FOR SELECT 
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view group notes" ON group_notes FOR SELECT 
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can share notes to groups" ON group_notes FOR INSERT 
  WITH CHECK (auth.uid() = shared_by AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view group leaderboard" ON group_leaderboard FOR SELECT 
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

-- Categories are public
CREATE POLICY "Categories are public" ON categories FOR SELECT USING (true);
CREATE POLICY "Category questions are public" ON category_questions FOR SELECT USING (true);
CREATE POLICY "Users can select categories" ON user_categories FOR ALL USING (auth.uid() = user_id);
