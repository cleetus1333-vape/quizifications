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
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MAX_GROUP_MEMBERS } from '../types';
import { config, trialCopy } from '../lib/config';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';

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
        <View style={styles.trialGate}>
          <View style={styles.trialIconContainer}>
            <Text style={styles.trialIcon}>👥</Text>
          </View>
          <Text style={styles.trialTitle}>Study Groups</Text>
          <Text style={styles.trialSubtitle}>
            Create groups, share notes, and compete on leaderboards with classmates.
          </Text>
          
          <View style={styles.featureList}>
            {['Up to 20 members per group', 'Share notes & questions', 'Weekly leaderboards'].map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.trialButton} 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Settings')}
          >
            <LinearGradient
              colors={gradients.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trialButtonGradient}
            >
              <Text style={styles.trialButtonText}>{trialCopy.cta}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.trialPricing}>{trialCopy.pricing}</Text>
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
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.actionButtonText}>+ Create</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButtonSecondary, shadows.sm]}
          onPress={() => setJoinModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonTextSecondary}>Join Group</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyEmoji}>👥</Text>
          </View>
          <Text style={styles.emptyText}>No groups yet</Text>
          <Text style={styles.emptySubtext}>
            Create a study group or join one with an invite code
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.groupCard, shadows.md]}
              onPress={() => navigation.navigate('GroupDetail', { group: item })}
              activeOpacity={0.8}
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
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCodeLabel}>Code:</Text>
                  <Text style={styles.inviteCode}>{item.invite_code}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={() => shareGroup(item)}
                >
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
                <ActivityIndicator color={colors.primary} size="small" />
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
              placeholderTextColor={colors.textMuted}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="e.g., Study group for Professor Smith's class"
              placeholderTextColor={colors.textMuted}
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
                <ActivityIndicator color={colors.primary} size="small" />
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
              placeholderTextColor={colors.textMuted}
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
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    padding: spacing.md,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  actionButtonTextSecondary: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
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
    padding: spacing.xxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
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
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  adminBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
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
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inviteCodeLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  inviteCode: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  shareButton: {
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  shareText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
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
    color: colors.primary,
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
    backgroundColor: colors.primaryGlow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tipTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  trialGate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  trialIconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  trialIcon: {
    fontSize: 48,
  },
  trialTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  trialSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  featureList: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureCheck: {
    fontSize: fontSize.md,
    color: colors.success,
    marginRight: spacing.md,
    fontWeight: '700',
  },
  featureText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  trialButton: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  trialButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  trialButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  trialPricing: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
