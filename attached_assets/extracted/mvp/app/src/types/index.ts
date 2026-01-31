// types/index.ts

export interface User {
  id: string;
  email: string;
  username: string | null;
  referral_code: string;
  avatar_url: string | null;
  is_premium: boolean;
  premium_expires_at: string | null;
  streak_current: number;
  streak_best: number;
  last_quiz_date: string | null;
  push_token: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  quiz_interval_minutes: number;
  sound_enabled: boolean;
  vibrate_enabled: boolean;
}

export interface StudyWindow {
  id: string;
  user_id: string;
  label: string | null;
  start_time: string;
  end_time: string;
  days_active: number[];
  is_enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  subject: string;
  icon: string | null;
  question_count: number;
  is_active: boolean;
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
  category_name?: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_syllabus: boolean;
  question_count: number;
  created_at: string;
}

export interface NoteQuestion extends Question {
  note_id: string;
  user_id: string;
  note_title?: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  question_id: string;
  question_source: 'category' | 'note';
  was_correct: boolean | null;
  was_dodged: boolean;
  answered_at: string;
}

export interface WeeklyStats {
  id: string;
  user_id: string;
  week_start: string;
  questions_answered: number;
  correct_answers: number;
  streak_days: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  streak_current: number;
  questions_this_week?: number;
  accuracy?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  correctIndex: number;
  source: 'category' | 'note';
  sourceName: string;
}
