import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MAX_GROUP_MEMBERS } from '../types';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  member_count: number;
  question_count: number;
  role: string;
}

export default function GroupsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (user?.is_premium) {
      loadGroups();
    } else {
      setLoading(false);
    }
  }, [user?.is_premium]);

  if (!user?.is_premium) {
    return (
      <View style={styles.container}>
        <View style={styles.premiumGate}>
          <Text style={styles.premiumEmoji}>⭐</Text>
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumText}>
            Study Groups are a premium feature. Upgrade to create and join groups, 
            share notes with classmates, and compete on leaderboards.
          </Text>
        </View>
      </View>
    );
  }

  const loadGroups = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: memberships } = await supabase
        .from('group_members')
        .select(`
          role,
          groups (
            id,
            name,
            description,
            invite_code,
            member_count,
            question_count
          )
        `)
        .eq('user_id', user.id);

      if (memberships) {
        const groupList = memberships.map((m: any) => ({
          ...m.groups,
          role: m.role,
        }));
        setGroups(groupList);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    setCreating(true);

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      Alert.alert('Success!', `Group "${group.name}" created!\n\nInvite code: ${group.invite_code}`);
      setNewGroupName('');
      setNewGroupDescription('');
      setCreateModalVisible(false);
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim() || !user) return;
    setJoining(true);

    try {
      const { data: group, error: findError } = await supabase
        .from('groups')
        .select('id, name, member_count')
        .eq('invite_code', joinCode.toUpperCase().trim())
        .single();

      if (findError || !group) {
        Alert.alert('Not Found', 'No group found with that code');
        setJoining(false);
        return;
      }

      if (group.member_count >= MAX_GROUP_MEMBERS) {
        Alert.alert('Group Full', `This group has reached the maximum of ${MAX_GROUP_MEMBERS} members`);
        setJoining(false);
        return;
      }

      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        Alert.alert('Already Joined', `You're already in "${group.name}"`);
        setJoining(false);
        return;
      }

      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      Alert.alert('Welcome!', `You joined "${group.name}"`);
      setJoinCode('');
      setJoinModalVisible(false);
      loadGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const shareGroup = async (group: Group) => {
    try {
      await Share.share({
        message: `Join my study group "${group.name}" on Quizifications!\n\nCode: ${group.invite_code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>+ Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => setJoinModalVisible(true)}
        >
          <Text style={styles.actionButtonTextSecondary}>Join Group</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memberLimitInfo}>
        <Text style={styles.memberLimitText}>Groups can have up to {MAX_GROUP_MEMBERS} members</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>No groups yet</Text>
          <Text style={styles.emptySubtext}>
            Create a group for your class or join one with an invite code
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetail', { group: item })}
            >
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.groupMeta}>
                    {item.member_count}/{MAX_GROUP_MEMBERS} members · {item.question_count} questions
                  </Text>
                </View>
                {item.role === 'admin' && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
              
              {item.description && (
                <Text style={styles.groupDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              <View style={styles.groupFooter}>
                <Text style={styles.inviteCode}>Code: {item.invite_code}</Text>
                <TouchableOpacity onPress={() => shareGroup(item)}>
                  <Text style={styles.shareText}>Share</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Group</Text>
            <TouchableOpacity 
              onPress={createGroup}
              disabled={creating || !newGroupName.trim()}
            >
              {creating ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={[
                  styles.saveText,
                  !newGroupName.trim() && styles.saveTextDisabled
                ]}>
                  Create
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., BIO 101 - Section 3"
              placeholderTextColor={colors.textSecondary}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="e.g., Study group for Professor Smith's class"
              placeholderTextColor={colors.textSecondary}
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              multiline
            />

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 Tip</Text>
              <Text style={styles.tipText}>
                Share the invite code with classmates. Everyone can contribute notes and get quizzed from the combined pool!
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={joinModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Join Group</Text>
            <TouchableOpacity 
              onPress={joinGroup}
              disabled={joining || !joinCode.trim()}
            >
              {joining ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={[
                  styles.saveText,
                  !joinCode.trim() && styles.saveTextDisabled
                ]}>
                  Join
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Invite Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="ABC123"
              placeholderTextColor={colors.textSecondary}
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
            />

            <Text style={styles.helperText}>
              Ask your classmate for their group's invite code
            </Text>
          </View>
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
  actionRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.background,
  },
  actionButtonTextSecondary: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  memberLimitInfo: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  memberLimitText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
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
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  groupMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  adminBadge: {
    backgroundColor: colors.accentGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  adminBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.accent,
  },
  groupDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inviteCode: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  shareText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
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
  modalContent: {
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  codeInput: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tipBox: {
    backgroundColor: colors.accentGlow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  tipTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  premiumGate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  premiumEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  premiumTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: spacing.md,
  },
  premiumText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
