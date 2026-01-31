// src/screens/SettingsScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { StudyWindow } from '../types';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

export default function SettingsScreen({ navigation }: any) {
  const { user, settings, signOut, refreshUser } = useAuth();
  const [studyWindows, setStudyWindows] = useState<StudyWindow[]>([]);
  const [quizInterval, setQuizInterval] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    // Load study windows
    const { data: windows } = await supabase
      .from('study_windows')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time');

    if (windows) setStudyWindows(windows);

    // Load settings
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

  const copyInviteLink = async () => {
    if (user?.referral_code) {
      await Clipboard.setStringAsync(`https://getpopquiz.app/join/${user.referral_code}`);
      Alert.alert('Copied!', 'Invite link copied to clipboard');
    }
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

  const intervals = [15, 30, 45, 60];

  return (
    <ScrollView style={styles.container}>
      {/* Study Windows */}
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

      {/* Quiz Frequency */}
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

      {/* Notifications */}
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

      {/* Invite */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INVITE FRIENDS</Text>
        <TouchableOpacity style={styles.inviteButton} onPress={copyInviteLink}>
          <Text style={styles.inviteCode}>
            quizifications.com/join/{user?.referral_code}
          </Text>
          <Text style={styles.copyText}>Copy</Text>
        </TouchableOpacity>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        
        {!user?.is_premium && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Upgrade')}
          >
            <Text style={styles.upgradeText}>⭐ Upgrade to Premium</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Terms of Service</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <Text style={[styles.menuItemText, { color: colors.error }]}>Sign Out</Text>
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
  inviteButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteCode: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  copyText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
  },
  upgradeButton: {
    backgroundColor: colors.accentGlow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  upgradeText: {
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
