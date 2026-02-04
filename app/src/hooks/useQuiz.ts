import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { QuizQuestion } from '../types';

export function useQuiz() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getRandomQuestion = useCallback(async (): Promise<QuizQuestion | null> => {
    if (!user) return null;
    setLoading(true);

    try {
      const { data: questions, error } = await supabase
        .from('note_questions')
        .select(`
          id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, note_id,
          notes!inner(title)
        `)
        .eq('user_id', user.id)
        .order('times_shown', { ascending: true })
        .limit(10);

      if (error || !questions || questions.length === 0) {
        return null;
      }

      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      const answers = shuffleArray([
        randomQ.correct_answer,
        randomQ.wrong_answer_1,
        randomQ.wrong_answer_2,
        randomQ.wrong_answer_3,
      ]);

      return {
        id: randomQ.id,
        question: randomQ.question,
        answers,
        correctIndex: answers.indexOf(randomQ.correct_answer),
        source: 'note',
        sourceName: (randomQ as any).notes?.title || 'Your Notes',
      };
    } catch (error) {
      console.error('Error fetching question:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recordAttempt = useCallback(async (
    questionId: string,
    source: 'note',
    wasCorrect: boolean
  ) => {
    if (!user) return;

    try {
      const { data: question } = await supabase
        .from('note_questions')
        .select('note_id')
        .eq('id', questionId)
        .single();

      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        question_id: questionId,
        note_id: question?.note_id || '',
        selected_answer: '',
        was_correct: wasCorrect,
      });

      try {
        await supabase.rpc('increment_question_stats', {
          q_id: questionId,
          was_correct: wasCorrect,
        });
      } catch {
        // Stats update failed, ignore
      }

      await refreshUser();
    } catch (error) {
      console.error('Error recording attempt:', error);
    }
  }, [user, refreshUser]);

  const getTodayStats = useCallback(async () => {
    if (!user) return { answered: 0, correct: 0 };

    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('quiz_attempts')
      .select('was_correct')
      .eq('user_id', user.id)
      .gte('answered_at', `${today}T00:00:00`)
      .lt('answered_at', `${today}T23:59:59`);

    if (!data) return { answered: 0, correct: 0 };

    return {
      answered: data.length,
      correct: data.filter(d => d.was_correct).length,
    };
  }, [user]);

  return {
    loading,
    getRandomQuestion,
    recordAttempt,
    getTodayStats,
  };
}
