// src/screens/NotesScreen.tsx

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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Note } from '../types';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export default function NotesScreen() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSyllabus, setIsSyllabus] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user?.is_premium) {
      loadNotes();
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
            Create custom notes and let AI generate quiz questions from them. 
            Upgrade to premium to unlock this feature.
          </Text>
        </View>
      </View>
    );
  }

  const loadNotes = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setNotes(data || []);
    setLoading(false);
  };

  const generateQuestions = async (noteId: string, content: string) => {
    if (!user || !CLAUDE_API_KEY) return;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `Generate 10 multiple choice quiz questions from these notes. Focus on key concepts, definitions, and important relationships.

Return ONLY a valid JSON array with no other text, no markdown, no explanation:
[
  {
    "question": "...",
    "correct_answer": "...",
    "wrong_answer_1": "...",
    "wrong_answer_2": "...",
    "wrong_answer_3": "..."
  }
]

NOTES:
${content}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const questionsText = data.content[0].text;
      const questions = JSON.parse(questionsText);

      // Insert questions
      const questionInserts = questions.map((q: any) => ({
        note_id: noteId,
        user_id: user.id,
        question: q.question,
        correct_answer: q.correct_answer,
        wrong_answer_1: q.wrong_answer_1,
        wrong_answer_2: q.wrong_answer_2,
        wrong_answer_3: q.wrong_answer_3,
      }));

      await supabase.from('note_questions').insert(questionInserts);

      // Update note question count
      await supabase
        .from('notes')
        .update({ question_count: questions.length })
        .eq('id', noteId);

      return questions.length;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  };

  const createNote = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return;
    setGenerating(true);

    try {
      // Insert note
      const { data: note, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          content: newContent.trim(),
          is_syllabus: isSyllabus,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate questions
      const count = await generateQuestions(note.id, newContent);

      Alert.alert('Success!', `Created ${count} questions from your notes`);

      // Reset and reload
      setNewTitle('');
      setNewContent('');
      setIsSyllabus(false);
      setModalVisible(false);
      loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to create note. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const deleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"? This will also delete all associated questions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('notes').delete().eq('id', note.id);
            loadNotes();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyText}>No notes yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first note and we'll generate quiz questions from it
          </Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.noteCard}
              onLongPress={() => deleteNote(item)}
            >
              <View style={styles.noteHeader}>
                <Text style={styles.noteIcon}>
                  {item.is_syllabus ? '📋' : '📄'}
                </Text>
                <View style={styles.noteInfo}>
                  <Text style={styles.noteTitle}>{item.title}</Text>
                  <Text style={styles.noteCount}>
                    {item.question_count} questions
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

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Notes</Text>
      </TouchableOpacity>

      {/* Add Note Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Notes</Text>
            <TouchableOpacity 
              onPress={createNote}
              disabled={generating || !newTitle.trim() || !newContent.trim()}
            >
              {generating ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={[
                  styles.saveText,
                  (!newTitle.trim() || !newContent.trim()) && styles.saveTextDisabled
                ]}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder="Title (e.g., Bio Chapter 3)"
            placeholderTextColor={colors.textSecondary}
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <TextInput
            style={styles.contentInput}
            placeholder="Paste your notes here..."
            placeholderTextColor={colors.textSecondary}
            value={newContent}
            onChangeText={setNewContent}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={styles.syllabusToggle}
            onPress={() => setIsSyllabus(!isSyllabus)}
          >
            <View style={[
              styles.checkbox,
              isSyllabus && styles.checkboxSelected
            ]}>
              {isSyllabus && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.syllabusLabel}>This is a syllabus</Text>
          </TouchableOpacity>

          {generating && (
            <View style={styles.generatingOverlay}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.generatingText}>Generating questions...</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
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
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
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
    marginBottom: spacing.sm,
  },
  noteIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  noteCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notePreview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  addButtonText: {
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
  titleInput: {
    backgroundColor: colors.card,
    margin: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contentInput: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    maxHeight: 300,
  },
  syllabusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.background,
    fontWeight: '700',
  },
  syllabusLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 11, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingText: {
    color: colors.text,
    fontSize: fontSize.md,
    marginTop: spacing.md,
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
