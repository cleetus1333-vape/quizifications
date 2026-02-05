import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const COLORS = {
  bg: '#0a0a0b',
  card: '#141416',
  primary: '#c8ff00',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#2a2a2e',
  success: '#10b981',
  error: '#ef4444',
};

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctIndex: number;
  noteTitle: string;
}

export default function QuizScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, []);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadQuestion = async () => {
    if (!user) return;
    setLoading(true);
    setSelectedIndex(null);
    setAnswered(false);

    try {
      const { data } = await supabase
        .from('note_questions')
        .select('id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, note_id, notes(title)')
        .eq('user_id', user.id)
        .order('times_shown', { ascending: true })
        .limit(10);

      if (!data || data.length === 0) {
        setQuestion(null);
        setLoading(false);
        return;
      }

      const q = data[Math.floor(Math.random() * data.length)];
      const answers = shuffleArray([q.correct_answer, q.wrong_answer_1, q.wrong_answer_2, q.wrong_answer_3]);

      setQuestion({
        id: q.id,
        question: q.question,
        answers,
        correctIndex: answers.indexOf(q.correct_answer),
        noteTitle: (q as any).notes?.title || 'Your Notes',
      });
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (index: number) => {
    if (answered || !question || !user) return;

    setSelectedIndex(index);
    setAnswered(true);

    const wasCorrect = index === question.correctIndex;

    try {
      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        question_id: question.id,
        note_id: '',
        selected_answer: question.answers[index],
        was_correct: wasCorrect,
      });

      try {
        await supabase.rpc('increment_question_stats', { q_id: question.id, was_correct: wasCorrect });
      } catch {}
      await refreshUser();
    } catch (error) {
      console.error('Error recording attempt:', error);
    }
  };

  const getButtonStyle = (index: number) => {
    if (!answered) return styles.answerBtn;

    if (index === question?.correctIndex) {
      return [styles.answerBtn, styles.correctBtn];
    }
    if (index === selectedIndex && index !== question?.correctIndex) {
      return [styles.answerBtn, styles.wrongBtn];
    }
    return styles.answerBtn;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No questions available</Text>
        <Text style={styles.emptySubtext}>Add notes to generate quiz questions</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.source}>From: {question.noteTitle}</Text>
      <Text style={styles.question}>{question.question}</Text>

      <View style={styles.answers}>
        {question.answers.map((answer, index) => (
          <TouchableOpacity key={index} style={getButtonStyle(index)} onPress={() => handleAnswer(index)} disabled={answered}>
            <Text style={styles.answerLetter}>{String.fromCharCode(65 + index)}</Text>
            <Text style={styles.answerText}>{answer}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {answered && (
        <TouchableOpacity style={styles.nextBtn} onPress={loadQuestion}>
          <Text style={styles.nextBtnText}>Next Question</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  centerContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  emptySubtext: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 24 },
  source: { fontSize: 14, color: COLORS.primary, marginBottom: 12 },
  question: { fontSize: 22, fontWeight: '600', color: COLORS.text, marginBottom: 24, lineHeight: 30 },
  answers: { gap: 12 },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  correctBtn: { borderColor: COLORS.success, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  wrongBtn: { borderColor: COLORS.error, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  answerLetter: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginRight: 12, width: 24 },
  answerText: { fontSize: 16, color: COLORS.text, flex: 1 },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  nextBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
  },
  primaryBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: '700' },
});
