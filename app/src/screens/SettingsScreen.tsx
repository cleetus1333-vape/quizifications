import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { StudyWindow } from '../types';
import { config } from '../lib/config';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

export default function SettingsScreen() {
  const { user, settings, signOut, deleteAccount } = useAuth();
  const [studyWindows, setStudyWindows] = useState<StudyWindow[]>([]);
  const [quizInterval, setQuizInterval] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    const { data: windows } = await supabase
      .from('study_windows')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time');

    if (windows) setStudyWindows(windows);

    if (settings) {
      setQuizInterval(settings.quiz_interval_minutes);
      setSoundEnabled(settings.sound_enabled);
      setVibrateEnabled(settings.vibrate_enabled);
    }
  };

  const toggleWindow = async (window: StudyWindow) => {
    const newEnabled = !window.is_enabled;
    
    await supabase
      .from('study_windows')
      .update({ is_enabled: newEnabled })
      .eq('id', window.id);

    setStudyWindows(prev => 
      prev.map(w => w.id === window.id ? { ...w, is_enabled: newEnabled } : w)
    );
  };

  const updateInterval = async (minutes: number) => {
    if (!user) return;
    setQuizInterval(minutes);

    await supabase
      .from('user_settings')
      .update({ quiz_interval_minutes: minutes })
      .eq('user_id', user.id);
  };

  const updateSound = async (enabled: boolean) => {
    if (!user) return;
    setSoundEnabled(enabled);

    await supabase
      .from('user_settings')
      .update({ sound_enabled: enabled })
      .eq('user_id', user.id);
  };

  const updateVibrate = async (enabled: boolean) => {
    if (!user) return;
    setVibrateEnabled(enabled);

    await supabase
      .from('user_settings')
      .update({ vibrate_enabled: enabled })
      .eq('user_id', user.id);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'All your notes, quiz history, and groups will be deleted forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    const { error } = await deleteAccount();
                    setDeleting(false);
                    if (error) {
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(config.privacyPolicyUrl);
  };

  const openTermsOfService = () => {
    Linking.openURL(config.termsOfServiceUrl);
  };

  const contactSupport = () => {
    Linking.openURL(`mailto:${config.supportEmail}`);
  };

  const intervals = [15, 30, 45, 60];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>STUDY WINDOWS</Text>
        {studyWindows.map(window => (
          <View key={window.id} style={styles.windowRow}>
            <View>
              <Text style={styles.windowLabel}>{window.label}</Text>
              <Text style={styles.windowTime}>
                {formatTime(window.start_time)} - {formatTime(window.end_time)}
              </Text>
            </View>
            <Switch
              value={window.is_enabled}
              onValueChange={() => toggleWindow(window)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.text}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QUIZ FREQUENCY</Text>
        <View style={styles.intervalRow}>
          {intervals.map(mins => (
            <TouchableOpacity
              key={mins}
              style={[
                styles.intervalButton,
                quizInterval === mins && styles.intervalButtonSelected,
              ]}
              onPress={() => updateInterval(mins)}
            >
              <Text style={[
                styles.intervalText,
                quizInterval === mins && styles.intervalTextSelected,
              ]}>
                {mins}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Sound</Text>
          <Switch
            value={soundEnabled}
            onValueChange={updateSound}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.text}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Vibrate</Text>
          <Switch
            value={vibrateEnabled}
            onValueChange={updateVibrate}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>

        {user?.is_premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>⭐ Premium Member</Text>
          </View>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={openPrivacyPolicy}>
          <Text style={styles.menuItemText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={openTermsOfService}>
          <Text style={styles.menuItemText}>Terms of Service</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={contactSupport}>
          <Text style={styles.menuItemText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <Text style={[styles.menuItemText, { color: colors.warning }]}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          <Text style={[styles.menuItemText, { color: colors.error }]}>
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Quizifications v1.0.0</Text>
        <Text style={styles.footerText}>@{user?.username}</Text>
      </View>
    </ScrollView>
  );
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  windowRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  windowLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  windowTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intervalButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  intervalButtonSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  intervalText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  intervalTextSelected: {
    color: colors.background,
  },
  toggleRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  premiumBadge: {
    backgroundColor: colors.accentGlow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  premiumText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  menuItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
