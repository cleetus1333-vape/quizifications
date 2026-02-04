import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';

type InputMode = 'select' | 'type';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;

async function generateQuestionsFromNotes(
  content: string,
  userId: string,
  noteId: string
): Promise<{ question: string }[] | null> {
  if (!CLAUDE_API_KEY) {
    console.error('Claude API key not configured');
    return null;
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
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Generate 10 multiple choice quiz questions from these study notes. Focus on key concepts, definitions, facts, and important relationships.

Return ONLY a valid JSON array with no markdown, no explanation:
[
  {
    "question": "The question text?",
    "correct_answer": "The correct answer",
    "wrong_answer_1": "First wrong answer",
    "wrong_answer_2": "Second wrong answer",
    "wrong_answer_3": "Third wrong answer"
  }
]

NOTES:
${content}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const questionsText = data.content?.[0]?.text;
    if (!questionsText) throw new Error('No content');

    const cleanedText = questionsText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const questions = JSON.parse(cleanedText);

    const questionInserts = questions.map((q: any) => ({
      note_id: noteId,
      user_id: userId,
      question: q.question,
      correct_answer: q.correct_answer,
      wrong_answer_1: q.wrong_answer_1,
      wrong_answer_2: q.wrong_answer_2,
      wrong_answer_3: q.wrong_answer_3,
    }));

    await supabase.from('note_questions').insert(questionInserts);
    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    return null;
  }
}

async function extractTextFromImage(base64Image: string): Promise<string | null> {
  if (!CLAUDE_API_KEY) return null;

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
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: 'Extract all the text from this image of handwritten or printed notes. Return only the extracted text, preserving the structure. If unclear, indicate with [unclear]. No commentary.',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (error) {
    console.error('Error extracting text:', error);
    return null;
  }
}

export default function AddNoteScreen({ navigation }: any) {
  const { user } = useAuth();
  const [mode, setMode] = useState<InputMode>('select');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to scan notes.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      processImage(result.assets[0].base64);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      processImage(result.assets[0].base64);
    }
  };

  const processImage = async (base64: string) => {
    setProcessing(true);
    try {
      const extractedText = await extractTextFromImage(base64);
      if (extractedText) {
        setContent(extractedText);
        setMode('type');
      } else {
        Alert.alert('Could not read text', 'Try taking a clearer photo of your notes.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process image.');
    } finally {
      setProcessing(false);
    }
  };

  const saveNote = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setGenerating(true);

    try {
      const { data: note, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          source: 'typed',
        })
        .select()
        .single();

      if (error) throw error;

      const questions = await generateQuestionsFromNotes(content, user.id, note.id);

      if (questions && questions.length > 0) {
        await supabase
          .from('notes')
          .update({ question_count: questions.length })
          .eq('id', note.id);

        Alert.alert('Success!', `Created ${questions.length} quiz questions from your notes`);
      } else {
        Alert.alert('Note Saved', 'Your note was saved but no questions could be generated.');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <View style={styles.selectContainer}>
          <Text style={styles.selectTitle}>Add Your Notes</Text>
          <Text style={styles.selectSubtitle}>
            Choose how you want to add your study material
          </Text>

          <TouchableOpacity
            style={[styles.optionCard, shadows.md]}
            onPress={() => setMode('type')}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.primaryGlow }]}>
              <Text style={styles.optionEmoji}>⌨️</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Type or Paste</Text>
              <Text style={styles.optionDesc}>Enter your notes manually or paste from clipboard</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, shadows.md]}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.accentGlow }]}>
              <Text style={styles.optionEmoji}>📷</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Scan Notes</Text>
              <Text style={styles.optionDesc}>Take a photo of handwritten or printed notes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, shadows.md]}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.successGlow }]}>
              <Text style={styles.optionEmoji}>🖼️</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>From Gallery</Text>
              <Text style={styles.optionDesc}>Select a photo of your notes from your gallery</Text>
            </View>
          </TouchableOpacity>
        </View>

        {processing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.processingText}>Reading your notes...</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.titleInput}
          placeholder="Title (e.g., Bio Chapter 3)"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Paste or type your notes here..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveNote}
          disabled={generating || !title.trim() || !content.trim()}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={generating || !title.trim() || !content.trim() 
              ? [colors.border, colors.border] 
              : gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {generating ? (
              <View style={styles.generatingRow}>
                <ActivityIndicator color={colors.text} size="small" />
                <Text style={styles.saveButtonText}>Generating Questions...</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Save & Generate Quiz</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          AI will analyze your notes and create quiz questions automatically
        </Text>
      </ScrollView>

      {processing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>Reading your notes...</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  selectTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  selectSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
  },
  titleInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  contentInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 200,
    marginBottom: spacing.lg,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  saveButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 18, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.lg,
  },
  processingText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
});
