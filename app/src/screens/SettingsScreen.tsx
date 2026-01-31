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
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { StudyWindow } from '../types';
import { config, trialCopy } from '../lib/config';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!user?.is_premium && (
        <View style={[styles.trialCard, shadows.lg]}>
          <LinearGradient
            colors={gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trialGradient}
          >
            <Text style={styles.trialBadge}>✨ {config.trialDays}-DAY FREE TRIAL</Text>
            <Text style={styles.trialTitle}>{trialCopy.title}</Text>
            <View style={styles.trialFeatures}>
              {trialCopy.features.slice(0, 2).map((feature, i) => (
                <Text key={i} style={styles.trialFeature}>• {feature}</Text>
              ))}
            </View>
            <TouchableOpacity style={styles.trialButton} activeOpacity={0.9}>
              <Text style={styles.trialButtonText}>{trialCopy.cta}</Text>
            </TouchableOpacity>
            <Text style={styles.trialPricing}>{trialCopy.pricing}</Text>
          </LinearGradient>
        </View>
      )}

      {user?.is_premium && (
        <View style={[styles.premiumCard, shadows.md]}>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
          </View>
          <Text style={styles.premiumText}>You have full access to all features</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Study Windows</Text>
        {studyWindows.map(window => (
          <View key={window.id} style={[styles.card, shadows.sm]}>
            <View>
              <Text style={styles.windowLabel}>{window.label}</Text>
              <Text style={styles.windowTime}>
                {formatTime(window.start_time)} - {formatTime(window.end_time)}
              </Text>
            </View>
            <Switch
              value={window.is_enabled}
              onValueChange={() => toggleWindow(window)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiz Frequency</Text>
        <View style={styles.intervalRow}>
          {intervals.map(mins => (
            <TouchableOpacity
              key={mins}
              style={[
                styles.intervalButton,
                quizInterval === mins && styles.intervalButtonSelected,
                shadows.sm,
              ]}
              onPress={() => updateInterval(mins)}
              activeOpacity={0.8}
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
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.toggleLabel}>Sound</Text>
          <Switch
            value={soundEnabled}
            onValueChange={updateSound}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.toggleLabel}>Vibrate</Text>
          <Switch
            value={vibrateEnabled}
            onValueChange={updateVibrate}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={[styles.menuItem, shadows.sm]} onPress={openPrivacyPolicy} activeOpacity={0.8}>
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, shadows.sm]} onPress={openTermsOfService} activeOpacity={0.8}>
          <Text style={styles.menuItemText}>Terms of Service</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, shadows.sm]} onPress={contactSupport} activeOpacity={0.8}>
          <Text style={styles.menuItemText}>Contact Support</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, shadows.sm]} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={[styles.menuItemText, { color: colors.warning }]}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, shadows.sm]} 
          onPress={handleDeleteAccount}
          disabled={deleting}
          activeOpacity={0.8}
        >
          <Text style={[styles.menuItemText, { color: colors.error }]}>
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Quizifications v1.0.0</Text>
        {user?.username && (
          <Text style={styles.footerUsername}>@{user.username}</Text>
        )}
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
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  trialCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  trialGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  trialBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  trialTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  trialFeatures: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  trialFeature: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.xs,
  },
  trialButton: {
    backgroundColor: colors.text,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  trialButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  trialPricing: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  premiumCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: colors.goldGlow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  premiumBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gold,
  },
  premiumText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  card: {
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  intervalText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  intervalTextSelected: {
    color: colors.text,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuItem: {
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
  menuItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuItemArrow: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  footerUsername: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
