-- =============================================
-- POPQUIZ GROUPS SCHEMA
-- Run this AFTER the main schema
-- =============================================

-- =============================================
-- GROUPS
-- =============================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  member_count INT DEFAULT 1,
  question_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-generate invite code
CREATE OR REPLACE FUNCTION generate_group_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invite_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_group_invite_code
  BEFORE INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION generate_group_invite_code();

-- =============================================
-- GROUP MEMBERS
-- =============================================
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- admin, member
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- =============================================
-- GROUP NOTES (shared notes pool)
-- =============================================
CREATE TABLE group_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES users(id) ON DELETE SET NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, note_id)
);

-- =============================================
-- GROUP QUIZ SETTINGS (per user)
-- =============================================
CREATE TABLE user_group_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE, -- quiz from this group?
  UNIQUE(user_id, group_id)
);

-- =============================================
-- GROUP WEEKLY STATS
-- =============================================
CREATE TABLE group_weekly_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  questions_answered INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  UNIQUE(group_id, user_id, week_start)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_weekly_stats ENABLE ROW LEVEL SECURITY;

-- Groups: members can view, creator can update
CREATE POLICY "Anyone can view public groups" ON groups
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Members can view their groups" ON groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin')
  );

-- Group members
CREATE POLICY "Members can view group members" ON group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
  );

CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Group notes
CREATE POLICY "Members can view group notes" ON group_notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_notes.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can share notes" ON group_notes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_notes.group_id AND user_id = auth.uid())
  );

-- User group settings
CREATE POLICY "Users manage own group settings" ON user_group_settings
  FOR ALL USING (auth.uid() = user_id);

-- Group weekly stats
CREATE POLICY "Members can view group stats" ON group_weekly_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_weekly_stats.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own group stats" ON group_weekly_stats
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Get random question from group's note pool
CREATE OR REPLACE FUNCTION get_random_group_question(p_group_id UUID)
RETURNS TABLE (
  id UUID,
  question TEXT,
  correct_answer TEXT,
  wrong_answer_1 TEXT,
  wrong_answer_2 TEXT,
  wrong_answer_3 TEXT,
  note_title TEXT,
  author_username TEXT
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
    n.title as note_title,
    u.username as author_username
  FROM note_questions nq
  JOIN notes n ON nq.note_id = n.id
  JOIN group_notes gn ON n.id = gn.note_id
  JOIN users u ON n.user_id = u.id
  WHERE gn.group_id = p_group_id
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get random question from user's active groups
CREATE OR REPLACE FUNCTION get_random_question_from_groups(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  question TEXT,
  correct_answer TEXT,
  wrong_answer_1 TEXT,
  wrong_answer_2 TEXT,
  wrong_answer_3 TEXT,
  note_title TEXT,
  group_name TEXT,
  author_username TEXT
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
    n.title as note_title,
    g.name as group_name,
    u.username as author_username
  FROM note_questions nq
  JOIN notes n ON nq.note_id = n.id
  JOIN group_notes gn ON n.id = gn.note_id
  JOIN groups g ON gn.group_id = g.id
  JOIN group_members gm ON g.id = gm.group_id
  JOIN users u ON n.user_id = u.id
  LEFT JOIN user_group_settings ugs ON g.id = ugs.group_id AND ugs.user_id = p_user_id
  WHERE gm.user_id = p_user_id
    AND (ugs.is_active IS NULL OR ugs.is_active = TRUE)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get group leaderboard
CREATE OR REPLACE FUNCTION get_group_leaderboard(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  questions_this_week INT,
  correct_this_week INT,
  accuracy NUMERIC,
  streak_current INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.username,
    u.avatar_url,
    COALESCE(gws.questions_answered, 0) as questions_this_week,
    COALESCE(gws.correct_answers, 0) as correct_this_week,
    CASE WHEN COALESCE(gws.questions_answered, 0) > 0 
      THEN ROUND((gws.correct_answers::NUMERIC / gws.questions_answered) * 100, 1)
      ELSE 0 
    END as accuracy,
    u.streak_current
  FROM group_members gm
  JOIN users u ON gm.user_id = u.id
  LEFT JOIN group_weekly_stats gws ON gws.group_id = p_group_id 
    AND gws.user_id = u.id 
    AND gws.week_start = DATE_TRUNC('week', CURRENT_DATE)
  WHERE gm.group_id = p_group_id
  ORDER BY COALESCE(gws.correct_answers, 0) DESC, u.streak_current DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Update member count trigger
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

CREATE TRIGGER on_group_member_change
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- Update question count when note shared to group
CREATE OR REPLACE FUNCTION update_group_question_count()
RETURNS TRIGGER AS $$
DECLARE
  v_question_count INT;
BEGIN
  SELECT COALESCE(SUM(n.question_count), 0) INTO v_question_count
  FROM group_notes gn
  JOIN notes n ON gn.note_id = n.id
  WHERE gn.group_id = NEW.group_id;
  
  UPDATE groups SET question_count = v_question_count WHERE id = NEW.group_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_note_change
  AFTER INSERT OR DELETE ON group_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_group_question_count();

-- =============================================
-- DONE! Groups are ready.
-- =============================================
