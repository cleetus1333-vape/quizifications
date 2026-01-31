import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { QuizQuestion } from '../types';

export function useQuiz() {
  const { user } = useAuth();
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
      let question: QuizQuestion | null = null;

      if (user.is_premium) {
        const { data: groupQ } = await supabase
          .rpc('get_random_question_from_groups', { p_user_id: user.id });

        if (groupQ && groupQ.length > 0) {
          const q = groupQ[0];
          const answers = shuffleArray([
            q.correct_answer,
            q.wrong_answer_1,
            q.wrong_answer_2,
            q.wrong_answer_3,
          ]);
          
          question = {
            id: q.id,
            question: q.question,
            answers,
            correctIndex: answers.indexOf(q.correct_answer),
            source: 'group',
            sourceName: q.group_name || q.note_title,
          };
        }

        if (!question) {
          const { data: noteQ } = await supabase
            .rpc('get_random_note_question', { p_user_id: user.id });

          if (noteQ && noteQ.length > 0) {
            const q = noteQ[0];
            const answers = shuffleArray([
              q.correct_answer,
              q.wrong_answer_1,
              q.wrong_answer_2,
              q.wrong_answer_3,
            ]);
            
            question = {
              id: q.id,
              question: q.question,
              answers,
              correctIndex: answers.indexOf(q.correct_answer),
              source: 'note',
              sourceName: q.note_title,
            };
          }
        }
      }

      if (!question) {
        const { data: catQ } = await supabase
          .rpc('get_random_category_question', { p_user_id: user.id });

        if (catQ && catQ.length > 0) {
          const q = catQ[0];
          const answers = shuffleArray([
            q.correct_answer,
            q.wrong_answer_1,
            q.wrong_answer_2,
            q.wrong_answer_3,
          ]);
          
          question = {
            id: q.id,
            question: q.question,
            answers,
            correctIndex: answers.indexOf(q.correct_answer),
            source: 'category',
            sourceName: q.category_name,
          };
        }
      }

      return question;
    } catch (error) {
      console.error('Error fetching question:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recordAttempt = useCallback(async (
    questionId: string,
    source: 'category' | 'note' | 'group',
    wasCorrect: boolean,
    wasDodged: boolean = false
  ) => {
    if (!user) return;

    try {
      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        question_id: questionId,
        question_source: source,
        was_correct: wasCorrect,
        was_dodged: wasDodged,
      });

      await supabase.rpc('update_user_streak', { p_user_id: user.id });

      const weekStart = getWeekStart();
      const { data: existingStats } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      if (existingStats) {
        await supabase
          .from('weekly_stats')
          .update({
            questions_answered: existingStats.questions_answered + 1,
            correct_answers: existingStats.correct_answers + (wasCorrect ? 1 : 0),
          })
          .eq('id', existingStats.id);
      } else {
        await supabase.from('weekly_stats').insert({
          user_id: user.id,
          week_start: weekStart,
          questions_answered: 1,
          correct_answers: wasCorrect ? 1 : 0,
        });
      }
    } catch (error) {
      console.error('Error recording attempt:', error);
    }
  }, [user]);

  const getTodayStats = useCallback(async () => {
    if (!user) return { answered: 0, correct: 0, dodged: 0 };

    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('quiz_attempts')
      .select('was_correct, was_dodged')
      .eq('user_id', user.id)
      .gte('answered_at', `${today}T00:00:00`)
      .lt('answered_at', `${today}T23:59:59`);

    if (!data) return { answered: 0, correct: 0, dodged: 0 };

    return {
      answered: data.filter(d => !d.was_dodged).length,
      correct: data.filter(d => d.was_correct).length,
      dodged: data.filter(d => d.was_dodged).length,
    };
  }, [user]);

  return {
    loading,
    getRandomQuestion,
    recordAttempt,
    getTodayStats,
  };
}

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek;
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}
