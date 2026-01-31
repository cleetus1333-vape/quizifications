import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../hooks/useQuiz';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakNumber}>{user?.streak_current || 0}</Text>
        <Text style={styles.streakLabel}>day streak</Text>
        {user?.streak_best && user.streak_best > 0 && (
          <Text style={styles.streakBest}>Best: {user.streak_best} days</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TODAY</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.answered}</Text>
            <Text style={styles.statLabel}>answered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.dodged}</Text>
            <Text style={styles.statLabel}>dodged</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{accuracy}%</Text>
            <Text style={styles.statLabel}>correct</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionLabel}>Study Topics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, !user?.is_premium && styles.actionCardLocked]}
            onPress={() => {
              if (user?.is_premium) {
                navigation.navigate('Notes');
              }
            }}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionLabel}>My Notes</Text>
            {!user?.is_premium && <Text style={styles.proBadge}>PRO</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, !user?.is_premium && styles.actionCardLocked]}
            onPress={() => {
              if (user?.is_premium) {
                navigation.navigate('Groups');
              }
            }}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionLabel}>Study Groups</Text>
            {!user?.is_premium && <Text style={styles.proBadge}>PRO</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Quiz')}
          >
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionLabel}>Quick Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.practiceButton}
        onPress={() => navigation.navigate('Quiz')}
      >
        <Text style={styles.practiceButtonText}>Practice Now</Text>
      </TouchableOpacity>

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
    padding: spacing.lg,
  },
  streakCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.accent,
  },
  streakLabel: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  streakBest: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
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
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionCardLocked: {
    opacity: 0.7,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  proBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: colors.accentGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  practiceButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  practiceButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
  },
  username: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xl,
  },
});
