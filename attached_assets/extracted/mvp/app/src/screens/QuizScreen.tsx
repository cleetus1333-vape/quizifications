// src/screens/QuizScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useQuiz } from '../hooks/useQuiz';
import { QuizQuestion } from '../types';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

export default function QuizScreen({ navigation, route }: any) {
  const { getRandomQuestion, recordAttempt, loading } = useQuiz();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Check if question was passed from notification
  const notificationQuestion = route.params?.question;

  useEffect(() => {
    if (notificationQuestion) {
      setQuestion(notificationQuestion);
    } else {
      loadQuestion();
    }
  }, [notificationQuestion]);

  const loadQuestion = async () => {
    setSelectedIndex(null);
    setShowResult(false);
    const q = await getRandomQuestion();
    setQuestion(q);
  };

  const handleAnswer = async (index: number) => {
    if (showResult || !question) return;

    setSelectedIndex(index);
    setShowResult(true);

    const isCorrect = index === question.correctIndex;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    await recordAttempt(question.id, question.source, isCorrect);
  };

  const getAnswerStyle = (index: number) => {
    if (!showResult) {
      return selectedIndex === index ? styles.answerSelected : styles.answer;
    }

    if (index === question?.correctIndex) {
      return styles.answerCorrect;
    }

    if (index === selectedIndex && index !== question?.correctIndex) {
      return styles.answerWrong;
    }

    return styles.answer;
  };

  if (loading || !question) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading question...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Source badge */}
      <View style={styles.sourceBadge}>
        <Text style={styles.sourceText}>
          {question.source === 'note' ? '📝' : '📚'} {question.sourceName}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      {/* Answers */}
      <View style={styles.answersContainer}>
        {question.answers.map((answer, index) => (
          <TouchableOpacity
            key={index}
            style={getAnswerStyle(index)}
            onPress={() => handleAnswer(index)}
            disabled={showResult}
          >
            <Text style={[
              styles.answerText,
              showResult && index === question.correctIndex && styles.answerTextCorrect,
              showResult && index === selectedIndex && index !== question.correctIndex && styles.answerTextWrong,
            ]}>
              {answer}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Result & Next */}
      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={[
            styles.resultText,
            selectedIndex === question.correctIndex ? styles.resultCorrect : styles.resultWrong
          ]}>
            {selectedIndex === question.correctIndex ? '✓ Correct!' : '✗ Wrong'}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={loadQuestion}
            >
              <Text style={styles.nextButtonText}>Next Question</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourceText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionText: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '600',
    lineHeight: 32,
  },
  answersContainer: {
    gap: spacing.md,
  },
  answer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerSelected: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  answerCorrect: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.success,
  },
  answerWrong: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.error,
  },
  answerText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  answerTextCorrect: {
    color: colors.success,
  },
  answerTextWrong: {
    color: colors.error,
  },
  resultContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  resultText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  resultCorrect: {
    color: colors.success,
  },
  resultWrong: {
    color: colors.error,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  doneButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
