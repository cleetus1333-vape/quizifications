export interface User {
  id: string;
  email: string;
  username: string | null;
  is_premium: boolean;
  streak_current: number;
  streak_best: number;
  total_questions: number;
  total_correct: number;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  quiz_interval_minutes: number;
  sound_enabled: boolean;
  vibrate_enabled: boolean;
  created_at: string;
}

export interface StudyWindow {
  id: string;
  user_id: string;
  label: string;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  subject: string;
  name: string;
  icon: string;
  question_count: number;
  is_active: boolean;
  created_at: string;
}

export interface UserCategory {
  id: string;
  user_id: string;
  category_id: string;
  created_at: string;
}

export interface Question {
  id: string;
  question: string;
  correct_answer: string;
  wrong_answer_1: string;
  wrong_answer_2: string;
  wrong_answer_3: string;
}

export interface CategoryQuestion extends Question {
  category_id: string;
  difficulty: number;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_syllabus: boolean;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface NoteQuestion extends Question {
  note_id: string;
  user_id: string;
  created_at: string;
}

export interface QuizResponse {
  id: string;
  user_id: string;
  question_type: 'category' | 'note' | 'group';
  question_id: string;
  is_correct: boolean;
  was_dodged: boolean;
  answered_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  member_count: number;
  question_count: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface GroupNote {
  id: string;
  group_id: string;
  note_id: string;
  shared_by: string;
  shared_at: string;
}

export interface GroupLeaderboard {
  id: string;
  group_id: string;
  user_id: string;
  week_start: string;
  questions_answered: number;
  questions_correct: number;
  updated_at: string;
}

export interface GroupLeaderboardEntry {
  user_id: string;
  username: string;
  streak_current: number;
  questions_this_week: number;
  correct_this_week: number;
  accuracy: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  correctIndex: number;
  source: 'category' | 'note' | 'group';
  sourceName: string;
}

export const MAX_GROUP_MEMBERS = 20;
