import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const COLORS = {
  bg: '#0a0a0b',
  card: '#141416',
  primary: '#c8ff00',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#2a2a2e',
  error: '#ef4444',
};

interface Note {
  id: string;
  title: string;
  content: string;
  question_count: number;
  created_at: string;
}

export default function NotesScreen() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotes(data || []);
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const deleteNote = (noteId: string) => {
    Alert.alert('Delete Note', 'This will also delete all questions for this note.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('note_questions').delete().eq('note_id', noteId);
          await supabase.from('notes').delete().eq('id', noteId);
          loadNotes();
        },
      },
    ]);
  };

  const renderNote = ({ item }: { item: Note }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => deleteNote(item.id)}>
          <Text style={styles.deleteBtn}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.notePreview} numberOfLines={2}>{item.content}</Text>
      <Text style={styles.noteInfo}>{item.question_count} questions</Text>
    </View>
  );

  if (notes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No notes yet</Text>
        <Text style={styles.emptySubtext}>Add your first note to start learning</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      renderItem={renderNote}
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16 },
  emptyContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  emptySubtext: { fontSize: 16, color: COLORS.textSecondary },
  noteCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, flex: 1 },
  deleteBtn: { color: COLORS.error, fontSize: 14, fontWeight: '600' },
  notePreview: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  noteInfo: { fontSize: 12, color: COLORS.primary },
});
