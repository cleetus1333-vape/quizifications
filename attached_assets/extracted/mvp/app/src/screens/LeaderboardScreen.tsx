// src/screens/LeaderboardScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LeaderboardEntry } from '../types';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

type Tab = 'global' | 'friends';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('global');
  const [globalData, setGlobalData] = useState<LeaderboardEntry[]>([]);
  const [friendsData, setFriendsData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load global leaderboard
      const { data: global } = await supabase.rpc('get_global_leaderboard', { p_limit: 50 });
      if (global) setGlobalData(global);

      // Load friends leaderboard
      const { data: friends } = await supabase.rpc('get_friend_leaderboard', { p_user_id: user.id });
      if (friends) setFriendsData(friends);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const data = activeTab === 'global' ? globalData : friendsData;
  const userRank = data.findIndex(entry => entry.user_id === user?.id) + 1;

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1;
    const isCurrentUser = item.user_id === user?.id;

    return (
      <View style={[styles.row, isCurrentUser && styles.rowHighlighted]}>
        <View style={styles.rankContainer}>
          {rank <= 3 ? (
            <Text style={styles.rankEmoji}>
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </Text>
          ) : (
            <Text style={styles.rankNumber}>{rank}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.username, isCurrentUser && styles.usernameHighlighted]}>
            @{item.username}
            {isCurrentUser && ' (you)'}
          </Text>
          {activeTab === 'friends' && item.accuracy !== undefined && (
            <Text style={styles.accuracy}>{item.accuracy}% accuracy</Text>
          )}
        </View>

        <View style={styles.streakContainer}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{item.streak_current}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'global' && styles.tabActive]}
          onPress={() => setActiveTab('global')}
        >
          <Text style={[styles.tabText, activeTab === 'global' && styles.tabTextActive]}>
            🌍 Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            👥 Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Your rank */}
      {userRank > 0 && (
        <View style={styles.yourRank}>
          <Text style={styles.yourRankText}>
            Your rank: #{userRank}
          </Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>
            {activeTab === 'friends' ? '👥' : '🏆'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'friends' 
              ? 'Add friends to see them here!' 
              : 'No one on the leaderboard yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.user_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  tabTextActive: {
    color: colors.background,
  },
  yourRank: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  yourRankText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  row: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowHighlighted: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  username: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  usernameHighlighted: {
    color: colors.accent,
  },
  accuracy: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakNumber: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
});
