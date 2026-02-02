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
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Note } from '../types';
import { trialCopy } from '../lib/config';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export default function NotesScreen({ navigation }: any) {
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
        <View style={styles.trialGate}>
          <View style={styles.trialIconContainer}>
            <Text style={styles.trialIcon}>📝</Text>
          </View>
          <Text style={styles.trialTitle}>Smart Notes</Text>
          <Text style={styles.trialSubtitle}>
            Add your study notes and let AI generate quiz questions automatically.
          </Text>
          
          <View style={styles.featureList}>
            {['AI-generated quiz questions', 'Unlimited notes', 'Syllabus support'].map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.trialButton} 
            activeOpacity={0.9}
            onPress={() => navigation?.navigate?.('Settings')}
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
    if (!user) return;
    if (!CLAUDE_API_KEY) {
      Alert.alert('Configuration Error', 'AI question generation is not configured.');
      return;
    }

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

      const count = await generateQuestions(note.id, newContent);

      Alert.alert('Success!', `Created ${count} questions from your notes`);

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

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyEmoji}>📝</Text>
          </View>
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
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.noteCard, shadows.md]}
              onLongPress={() => deleteNote(item)}
              activeOpacity={0.8}
            >
              <View style={styles.noteHeader}>
                <View style={[styles.noteIconBg, item.is_syllabus ? { backgroundColor: colors.goldGlow } : { backgroundColor: colors.accentGlow }]}>
                  <Text style={styles.noteIcon}>
                    {item.is_syllabus ? '📋' : '📄'}
                  </Text>
                </View>
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

      <TouchableOpacity 
        style={[styles.addButton, shadows.lg]}
        onPress={() => setModalVisible(true)}
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
                <ActivityIndicator color={colors.primary} size="small" />
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
            placeholderTextColor={colors.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <TextInput
            style={styles.contentInput}
            placeholder="Paste your notes here..."
            placeholderTextColor={colors.textMuted}
            value={newContent}
            onChangeText={setNewContent}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={styles.syllabusToggle}
            onPress={() => setIsSyllabus(!isSyllabus)}
            activeOpacity={0.7}
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
              <View style={styles.generatingCard}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.generatingText}>Generating questions...</Text>
                <Text style={styles.generatingSubtext}>This may take a moment</Text>
              </View>
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
  noteCount: {
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
    borderRadius: borderRadius.xs,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.text,
    fontWeight: '700',
  },
  syllabusLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 18, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.lg,
  },
  generatingText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  generatingSubtext: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
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
