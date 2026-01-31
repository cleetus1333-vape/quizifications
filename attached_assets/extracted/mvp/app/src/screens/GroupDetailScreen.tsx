// src/screens/GroupDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Note } from '../types';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  questions_this_week: number;
  correct_this_week: number;
  accuracy: number;
  streak_current: number;
}

interface SharedNote {
  id: string;
  title: string;
  question_count: number;
  shared_by_username: string;
}

export default function GroupDetailScreen({ route, navigation }: any) {
  const { group } = route.params;
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'notes'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load leaderboard
      const { data: lb } = await supabase.rpc('get_group_leaderboard', { 
        p_group_id: group.id 
      });
      if (lb) setLeaderboard(lb);

      // Load shared notes
      const { data: notes } = await supabase
        .from('group_notes')
        .select(`
          id,
          notes (
            id,
            title,
            question_count,
            user_id
          ),
          shared_by
        `)
        .eq('group_id', group.id);

      if (notes) {
        // Get usernames for shared notes
        const userIds = [...new Set(notes.map((n: any) => n.notes.user_id))];
        const { data: users } = await supabase
          .from('users')
          .select('id, username')
          .in('id', userIds);

        const userMap = new Map(users?.map(u => [u.id, u.username]) || []);

        setSharedNotes(notes.map((n: any) => ({
          id: n.notes.id,
          title: n.notes.title,
          question_count: n.notes.question_count,
          shared_by_username: userMap.get(n.notes.user_id) || 'Unknown',
        })));
      }

      // Load my notes (for sharing)
      const { data: myNotesData } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (myNotesData) setMyNotes(myNotesData);

    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareNotes = async () => {
    if (selectedNotes.size === 0 || !user) return;
    setSharing(true);

    try {
      const inserts = Array.from(selectedNotes).map(noteId => ({
        group_id: group.id,
        note_id: noteId,
        shared_by: user.id,
      }));

      const { error } = await supabase
        .from('group_notes')
        .upsert(inserts, { onConflict: 'group_id,note_id' });

      if (error) throw error;

      Alert.alert('Shared!', `${selectedNotes.size} note(s) added to the group`);
      setSelectedNotes(new Set());
      setShareModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Error sharing notes:', error);
      Alert.alert('Error', 'Failed to share notes');
    } finally {
      setSharing(false);
    }
  };

  const copyInviteCode = async () => {
    await Clipboard.setStringAsync(group.invite_code);
    Alert.alert('Copied!', 'Invite code copied to clipboard');
  };

  const shareGroup = async () => {
    await Share.share({
      message: `Join my study group "${group.name}" on BrainBuzz!\n\nCode: ${group.invite_code}\n\nhttps://quizifications.com/join/${group.invite_code}`,
    });
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const userRank = leaderboard.findIndex(e => e.user_id === user?.id) + 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupStats}>
          {group.member_count} members · {group.question_count} questions
        </Text>
        
        <View style={styles.inviteRow}>
          <TouchableOpacity style={styles.inviteButton} onPress={copyInviteCode}>
            <Text style={styles.inviteCode}>{group.invite_code}</Text>
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={shareGroup}>
            <Text style={styles.shareButtonText}>📤 Invite</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
            🏆 Leaderboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
            📝 Notes ({sharedNotes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : activeTab === 'leaderboard' ? (
        <>
          {userRank > 0 && (
            <View style={styles.yourRank}>
              <Text style={styles.yourRankText}>Your rank: #{userRank}</Text>
            </View>
          )}
          <FlatList
            data={leaderboard}
            keyExtractor={item => item.user_id}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => {
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
                    <Text style={styles.stats}>
                      {item.questions_this_week} answered · {item.accuracy}% accuracy
                    </Text>
                  </View>

                  <View style={styles.streakContainer}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={styles.streakNumber}>{item.streak_current}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyText}>No quiz activity this week</Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          <FlatList
            data={sharedNotes}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <View style={styles.noteInfo}>
                  <Text style={styles.noteTitle}>{item.title}</Text>
                  <Text style={styles.noteMeta}>
                    {item.question_count} questions · by @{item.shared_by_username}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyEmoji}>📝</Text>
                <Text style={styles.emptyText}>No notes shared yet</Text>
                <Text style={styles.emptySubtext}>Be the first to contribute!</Text>
              </View>
            }
          />
          <TouchableOpacity 
            style={styles.addNotesButton}
            onPress={() => setShareModalVisible(true)}
          >
            <Text style={styles.addNotesButtonText}>+ Share My Notes</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Share Notes Modal */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShareModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share Notes</Text>
            <TouchableOpacity 
              onPress={shareNotes}
              disabled={sharing || selectedNotes.size === 0}
            >
              {sharing ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={[
                  styles.saveText,
                  selectedNotes.size === 0 && styles.saveTextDisabled
                ]}>
                  Share ({selectedNotes.size})
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {myNotes.length === 0 ? (
            <View style={styles.emptyModal}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>No notes yet</Text>
              <Text style={styles.emptySubtext}>Create notes first, then share them here</Text>
              <TouchableOpacity 
                style={styles.createNotesButton}
                onPress={() => {
                  setShareModalVisible(false);
                  navigation.navigate('Notes');
                }}
              >
                <Text style={styles.createNotesButtonText}>Create Notes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={myNotes}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const isSelected = selectedNotes.has(item.id);
                const isAlreadyShared = sharedNotes.some(n => n.id === item.id);

                return (
                  <TouchableOpacity 
                    style={[
                      styles.selectableNote,
                      isSelected && styles.selectableNoteSelected,
                      isAlreadyShared && styles.selectableNoteDisabled,
                    ]}
                    onPress={() => !isAlreadyShared && toggleNoteSelection(item.id)}
                    disabled={isAlreadyShared}
                  >
                    <View style={styles.noteInfo}>
                      <Text style={styles.noteTitle}>{item.title}</Text>
                      <Text style={styles.noteMeta}>
                        {item.question_count} questions
                        {isAlreadyShared && ' · Already shared'}
                      </Text>
                    </View>
                    {!isAlreadyShared && (
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected
                      ]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  groupStats: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  inviteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteCode: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },
  copyText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
  },
  shareButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.background,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourRank: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  yourRankText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
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
  stats: {
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
  emptyList: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  noteCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  noteMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addNotesButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  addNotesButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  saveText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  emptyModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  createNotesButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  createNotesButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.background,
  },
  selectableNote: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectableNoteSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  selectableNoteDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
});
