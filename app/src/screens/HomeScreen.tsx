import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const COLORS = {
  bg: '#0a0a0b',
  card: '#141416',
  primary: '#c8ff00',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#2a2a2e',
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [noteCount, setNoteCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    const { count: notes } = await supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: questions } = await supabase.from('note_questions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    setNoteCount(notes || 0);
    setQuestionCount(questions || 0);
  };

  const accuracy = user && user.total_questions_answered > 0
    ? Math.round((user.total_correct / user.total_questions_answered) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hey, {user?.username || 'there'}!</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user?.streak_current || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{accuracy}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{noteCount}</Text>
          <Text style={styles.statLabel}>Notes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{questionCount}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Quiz')}>
        <Text style={styles.primaryButtonText}>Start Quiz</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('AddNote')}>
        <Text style={styles.secondaryButtonText}>+ Add Notes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20 },
  greeting: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 32, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: { color: COLORS.bg, fontSize: 18, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
});
