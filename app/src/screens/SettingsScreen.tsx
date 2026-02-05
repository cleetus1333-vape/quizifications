import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const COLORS = {
  bg: '#0a0a0b',
  card: '#141416',
  primary: '#c8ff00',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#2a2a2e',
  error: '#ef4444',
};

export default function SettingsScreen() {
  const { user, signOut, deleteAccount } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const openURL = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{user?.is_premium ? 'Premium' : 'Free Trial'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>Restore Purchases</Text>
        </TouchableOpacity>
        <Text style={styles.helpText}>
          To cancel: Settings → [Your Name] → Subscriptions → Quizifications
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity style={styles.card} onPress={() => openURL('https://quizifications.com/privacy.html')}>
          <Text style={styles.cardText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => openURL('https://quizifications.com/terms.html')}>
          <Text style={styles.cardText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.card} onPress={() => openURL('mailto:help@quizifications.com')}>
          <Text style={styles.cardText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  value: { fontSize: 16, color: COLORS.text },
  cardText: { fontSize: 16, color: COLORS.text },
  helpText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, marginLeft: 4 },
  signOutBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteText: { fontSize: 16, color: COLORS.error, fontWeight: '600' },
  version: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 12, marginTop: 24 },
});
