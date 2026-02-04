import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';
import { config, trialCopy } from '../lib/config';

export default function HomeScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    notesCount: 0,
    questionsCount: 0,
    todayAnswered: 0,
    todayCorrect: 0,
  });

  const loadStats = useCallback(async () => {
    if (!user) return;

    const [notesResult, questionsResult, attemptsResult] = await Promise.all([
      supabase.from('notes').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('note_questions').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase
        .from('quiz_attempts')
        .select('was_correct')
        .eq('user_id', user.id)
        .gte('answered_at', new Date().toISOString().split('T')[0]),
    ]);

    const todayAttempts = attemptsResult.data || [];
    const todayCorrect = todayAttempts.filter((a) => a.was_correct).length;

    setStats({
      notesCount: notesResult.count || 0,
      questionsCount: questionsResult.count || 0,
      todayAnswered: todayAttempts.length,
      todayCorrect,
    });
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    await loadStats();
    setRefreshing(false);
  }, [refreshUser, loadStats]);

  const accuracy = stats.todayAnswered > 0
    ? Math.round((stats.todayCorrect / stats.todayAnswered) * 100)
    : 0;

  const totalAccuracy = user?.total_questions_answered && user.total_questions_answered > 0
    ? Math.round((user.total_correct / user.total_questions_answered) * 100)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.streakCard}>
        <LinearGradient
          colors={gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakGradient}
        >
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{user?.streak_current || 0}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
          {user?.streak_best && user.streak_best > 0 && (
            <Text style={styles.streakBest}>Personal best: {user.streak_best} days</Text>
          )}
        </LinearGradient>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, shadows.md]}>
            <Text style={styles.statNumber}>{stats.todayAnswered}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={[styles.statCard, shadows.md]}>
            <Text style={styles.statNumber}>{stats.todayCorrect}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={[styles.statCard, shadows.md]}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Study Material</Text>
        <View style={styles.materialGrid}>
          <View style={[styles.materialCard, shadows.md]}>
            <Text style={styles.materialEmoji}>📝</Text>
            <Text style={styles.materialNumber}>{stats.notesCount}</Text>
            <Text style={styles.materialLabel}>Notes</Text>
          </View>
          <View style={[styles.materialCard, shadows.md]}>
            <Text style={styles.materialEmoji}>❓</Text>
            <Text style={styles.materialNumber}>{stats.questionsCount}</Text>
            <Text style={styles.materialLabel}>Questions</Text>
          </View>
        </View>
      </View>

      {stats.notesCount === 0 ? (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('AddNote')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaButtonText}>📝 Add Your First Notes</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Quiz')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={gradients.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>🎯 Start Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, shadows.sm]}
            onPress={() => navigation.navigate('AddNote')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>+ Add Notes</Text>
          </TouchableOpacity>
        </View>
      )}

      {!user?.is_premium && (
        <TouchableOpacity
          style={[styles.trialCard, shadows.lg]}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1e1e28', '#252532']}
            style={styles.trialGradient}
          >
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>✨ {config.trialDays}-DAY TRIAL</Text>
            </View>
            <Text style={styles.trialTitle}>{trialCopy.title}</Text>
            <Text style={styles.trialSubtitle}>{trialCopy.subtitle}</Text>
            <View style={styles.trialCta}>
              <Text style={styles.trialCtaText}>{trialCopy.cta}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={styles.overallStats}>
        <Text style={styles.overallTitle}>Overall Stats</Text>
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Total questions answered</Text>
          <Text style={styles.overallValue}>{user?.total_questions_answered || 0}</Text>
        </View>
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Overall accuracy</Text>
          <Text style={styles.overallValue}>{totalAccuracy}%</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  streakCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  streakGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -2,
  },
  streakLabel: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  streakBest: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  materialGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  materialCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  materialEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  materialNumber: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  materialLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ctaButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  ctaGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  actionButtons: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  primaryGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  trialCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  trialGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  trialBadge: {
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  trialBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  trialTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  trialSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  trialCta: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  trialCtaText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  overallStats: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overallTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  overallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  overallLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  overallValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
});
