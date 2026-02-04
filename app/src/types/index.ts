export interface User {
  id: string;
  email: string;
  username: string | null;
  is_premium: boolean;
  streak_current: number;
  streak_best: number;
  total_questions_answered: number;
  total_correct: number;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  quiz_interval_minutes: number;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  vibrate_enabled: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source: string;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface NoteQuestion {
  id: string;
  note_id: string;
  user_id: string;
  question: string;
  correct_answer: string;
  wrong_answer_1: string;
  wrong_answer_2: string;
  wrong_answer_3: string;
  times_shown: number;
  times_correct: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  question_id: string;
  note_id: string;
  selected_answer: string;
  was_correct: boolean;
  answered_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  correctIndex: number;
  source: 'note';
  sourceName: string;
}
