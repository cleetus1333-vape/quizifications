import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useQuiz } from '../hooks/useQuiz';
import { QuizQuestion } from '../types';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';

export default function QuizScreen({ navigation, route }: any) {
  const { getRandomQuestion, recordAttempt, loading } = useQuiz();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

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
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.sourceBadge, shadows.sm]}>
        <Text style={styles.sourceText}>
          {question.source === 'note' ? '📝' : '📚'} {question.sourceName}
        </Text>
      </View>

      <View style={[styles.questionCard, shadows.md]}>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      <View style={styles.answersContainer}>
        {question.answers.map((answer, index) => (
          <TouchableOpacity
            key={index}
            style={[getAnswerStyle(index), shadows.sm]}
            onPress={() => handleAnswer(index)}
            disabled={showResult}
            activeOpacity={0.8}
          >
            <View style={styles.answerContent}>
              <View style={[
                styles.answerIndicator,
                showResult && index === question.correctIndex && styles.indicatorCorrect,
                showResult && index === selectedIndex && index !== question.correctIndex && styles.indicatorWrong,
              ]}>
                <Text style={styles.answerLetter}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={[
                styles.answerText,
                showResult && index === question.correctIndex && styles.answerTextCorrect,
                showResult && index === selectedIndex && index !== question.correctIndex && styles.answerTextWrong,
              ]}>
                {answer}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {showResult && (
        <View style={styles.resultContainer}>
          <View style={[
            styles.resultBadge,
            selectedIndex === question.correctIndex ? styles.resultBadgeCorrect : styles.resultBadgeWrong
          ]}>
            <Text style={styles.resultText}>
              {selectedIndex === question.correctIndex ? '✓ Correct!' : '✗ Incorrect'}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={loadQuestion}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>Next Question</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.doneButton, shadows.sm]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
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
    padding: spacing.lg,
  },
  loadingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    fontSize: fontSize.md,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourceText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
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
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  answerCorrect: {
    backgroundColor: colors.successGlow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.success,
  },
  answerWrong: {
    backgroundColor: colors.errorGlow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.error,
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerIndicator: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  indicatorCorrect: {
    backgroundColor: colors.success,
  },
  indicatorWrong: {
    backgroundColor: colors.error,
  },
  answerLetter: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  answerText: {
    flex: 1,
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
  resultBadge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  resultBadgeCorrect: {
    backgroundColor: colors.successGlow,
    borderWidth: 1,
    borderColor: colors.success,
  },
  resultBadgeWrong: {
    backgroundColor: colors.errorGlow,
    borderWidth: 1,
    borderColor: colors.error,
  },
  resultText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  nextButton: {
    flex: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    color: colors.text,
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
