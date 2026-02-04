import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';

interface Note {
  id: string;
  title: string;
  content: string;
  source: string;
  question_count: number;
  created_at: string;
}

export default function NotesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notes:', error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotes();
    });
    return unsubscribe;
  }, [navigation, loadNotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  const deleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"? This will also delete all quiz questions from this note.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('notes').delete().eq('id', note.id);
              loadNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyEmoji}>📝</Text>
          </View>
          <Text style={styles.emptyText}>No notes yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first note and AI will generate quiz questions from it
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('AddNote')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={gradients.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyButtonGradient}
            >
              <Text style={styles.emptyButtonText}>+ Add Notes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.noteCard, shadows.md]}
              onLongPress={() => deleteNote(item)}
              activeOpacity={0.8}
            >
              <View style={styles.noteHeader}>
                <View style={[styles.noteIconBg, { backgroundColor: item.source === 'scanned' ? colors.accentGlow : colors.primaryGlow }]}>
                  <Text style={styles.noteIcon}>
                    {item.source === 'scanned' ? '📷' : '📄'}
                  </Text>
                </View>
                <View style={styles.noteInfo}>
                  <Text style={styles.noteTitle}>{item.title}</Text>
                  <Text style={styles.noteMeta}>
                    {item.question_count} questions • {formatDate(item.created_at)}
                  </Text>
                </View>
              </View>
              <Text style={styles.notePreview} numberOfLines={2}>
                {item.content}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {notes.length > 0 && (
        <TouchableOpacity
          style={[styles.addButton, shadows.lg]}
          onPress={() => navigation.navigate('AddNote')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>+ Add Notes</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    marginBottom: spacing.xl,
  },
  emptyButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  emptyButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  noteCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  noteIconBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  noteIcon: {
    fontSize: 22,
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
    marginTop: 2,
  },
  notePreview: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  addButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
});
