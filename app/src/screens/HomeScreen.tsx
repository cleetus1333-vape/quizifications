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
import { useQuiz } from '../hooks/useQuiz';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';
import { config, trialCopy } from '../lib/config';

export default function HomeScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const { getTodayStats } = useQuiz();
  const [stats, setStats] = useState({ answered: 0, correct: 0, dodged: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const todayStats = await getTodayStats();
    setStats(todayStats);
  }, [getTodayStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    await loadStats();
    setRefreshing(false);
  }, [refreshUser, loadStats]);

  const accuracy = stats.answered > 0 
    ? Math.round((stats.correct / stats.answered) * 100) 
    : 0;

  const handleTrialPress = () => {
    navigation.navigate('Settings');
  };

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
            <Text style={styles.statNumber}>{stats.answered}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={[styles.statCard, shadows.md]}>
            <Text style={styles.statNumber}>{stats.dodged}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </View>
          <View style={[styles.statCard, shadows.md]}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, shadows.md]}
            onPress={() => navigation.navigate('Categories')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: colors.primaryGlow }]}>
              <Text style={styles.actionIcon}>📚</Text>
            </View>
            <Text style={styles.actionLabel}>Topics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, shadows.md]}
            onPress={() => navigation.navigate('Notes')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: colors.accentGlow }]}>
              <Text style={styles.actionIcon}>📝</Text>
            </View>
            <Text style={styles.actionLabel}>Notes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, shadows.md]}
            onPress={() => navigation.navigate('Groups')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: colors.successGlow }]}>
              <Text style={styles.actionIcon}>👥</Text>
            </View>
            <Text style={styles.actionLabel}>Groups</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, shadows.md]}
            onPress={() => navigation.navigate('Quiz')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: colors.goldGlow }]}>
              <Text style={styles.actionIcon}>🎯</Text>
            </View>
            <Text style={styles.actionLabel}>Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.practiceButton}
        onPress={() => navigation.navigate('Quiz')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.practiceGradient}
        >
          <Text style={styles.practiceButtonText}>Start Practice Session</Text>
        </LinearGradient>
      </TouchableOpacity>

      {!user?.is_premium && (
        <TouchableOpacity 
          style={[styles.trialCard, shadows.lg]}
          onPress={handleTrialPress}
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

      {user?.username && (
        <Text style={styles.username}>@{user.username}</Text>
      )}
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  practiceButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  practiceGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  practiceButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
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
  username: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
