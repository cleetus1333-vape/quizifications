// src/screens/FriendsScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

interface Friend {
  id: string;
  username: string;
  streak_current: number;
  status: string;
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get accepted friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          user_id,
          friend_id
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendships) {
        const friendIds = friendships.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        if (friendIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, username, streak_current')
            .in('id', friendIds);

          if (users) {
            setFriends(users.map(u => ({ ...u, status: 'accepted' })));
          }
        }
      }

      // Get pending requests (where you are the friend_id)
      const { data: pending } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (pending && pending.length > 0) {
        const requesterIds = pending.map(p => p.user_id);
        const { data: requesters } = await supabase
          .from('users')
          .select('id, username, streak_current')
          .in('id', requesterIds);

        if (requesters) {
          setPendingRequests(requesters.map(u => ({ ...u, status: 'pending' })));
        }
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchUsername.trim() || !user) return;
    setSearching(true);

    try {
      const { data: foundUser } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', searchUsername.toLowerCase().trim())
        .single();

      if (!foundUser) {
        Alert.alert('Not Found', 'No user found with that username');
        return;
      }

      if (foundUser.id === user.id) {
        Alert.alert('Oops', "That's you!");
        return;
      }

      // Check if already friends or pending
      const { data: existing } = await supabase
        .from('friendships')
        .select('status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${foundUser.id}),and(user_id.eq.${foundUser.id},friend_id.eq.${user.id})`)
        .single();

      if (existing) {
        Alert.alert('Already Connected', `You're already ${existing.status === 'accepted' ? 'friends' : 'pending'} with @${foundUser.username}`);
        return;
      }

      // Send friend request
      const { error } = await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: foundUser.id,
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert('Sent!', `Friend request sent to @${foundUser.username}`);
      setSearchUsername('');
    } catch (error) {
      console.error('Error searching user:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSearching(false);
    }
  };

  const acceptRequest = async (friendId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', friendId)
        .eq('friend_id', user.id);

      loadFriends();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const declineRequest = async (friendId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('friendships')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user.id);

      loadFriends();
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const shareInvite = async () => {
    if (!user?.referral_code) return;

    try {
      await Share.share({
        message: `Join me on PopQuiz! Get randomly quizzed throughout the day and actually remember what you study 🧠\n\nhttps://getpopquiz.app/join/${user.referral_code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username"
          placeholderTextColor={colors.textSecondary}
          value={searchUsername}
          onChangeText={setSearchUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={searchUser}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Invite button */}
      <TouchableOpacity style={styles.inviteButton} onPress={shareInvite}>
        <Text style={styles.inviteButtonText}>📤 Share Invite Link</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={[
            ...(pendingRequests.length > 0 ? [{ type: 'header', title: 'PENDING REQUESTS' }] : []),
            ...pendingRequests.map(f => ({ type: 'pending', ...f })),
            { type: 'header', title: `FRIENDS (${friends.length})` },
            ...friends.map(f => ({ type: 'friend', ...f })),
          ]}
          keyExtractor={(item, index) => item.type === 'header' ? `header-${index}` : item.id}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <Text style={styles.sectionTitle}>{item.title}</Text>;
            }

            if (item.type === 'pending') {
              return (
                <View style={styles.friendRow}>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendUsername}>@{item.username}</Text>
                    <Text style={styles.friendStreak}>wants to be friends</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity 
                      style={styles.acceptButton}
                      onPress={() => acceptRequest(item.id)}
                    >
                      <Text style={styles.acceptButtonText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.declineButton}
                      onPress={() => declineRequest(item.id)}
                    >
                      <Text style={styles.declineButtonText}>✗</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return (
              <View style={styles.friendRow}>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendUsername}>@{item.username}</Text>
                  <Text style={styles.friendStreak}>🔥 {item.streak_current} day streak</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Search by username or share your invite link</Text>
            </View>
          }
          contentContainerStyle={styles.list}
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
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.background,
  },
  inviteButton: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  inviteButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  friendRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  friendStreak: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.success,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  declineButton: {
    backgroundColor: colors.error,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
