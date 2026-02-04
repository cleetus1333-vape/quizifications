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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { config, trialCopy, cancellationInstructions } from '../lib/config';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';

export default function SettingsScreen() {
  const { user, settings, signOut, deleteAccount } = useAuth();
  const [quizInterval, setQuizInterval] = useState(60);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (settings) {
      setQuizInterval(settings.quiz_interval_minutes || 60);
      setNotificationsEnabled(settings.notifications_enabled ?? true);
      setSoundEnabled(settings.sound_enabled ?? true);
      setVibrateEnabled(settings.vibrate_enabled ?? true);
    }
  }, [settings]);

  const updateSetting = async (key: string, value: any) => {
    if (!user) return;
    await supabase
      .from('user_settings')
      .update({ [key]: value })
      .eq('user_id', user.id);
  };

  const updateInterval = async (minutes: number) => {
    setQuizInterval(minutes);
    await updateSetting('quiz_interval_minutes', minutes);
  };

  const updateNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    await updateSetting('notifications_enabled', enabled);
  };

  const updateSound = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    await updateSetting('sound_enabled', enabled);
  };

  const updateVibrate = async (enabled: boolean) => {
    setVibrateEnabled(enabled);
    await updateSetting('vibrate_enabled', enabled);
  };

  const handleRestorePurchases = async () => {
    Alert.alert(
      'Restore Purchases',
      'This will restore any previous purchases. Make sure you are signed in with the same account you used to purchase.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => {
            Alert.alert('Coming Soon', 'Purchase restoration will be available once subscriptions are configured in App Store Connect.');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all notes, and quiz history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Are you sure?', 'All your data will be deleted forever.', [
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
            ]);
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => Linking.openURL(config.privacyPolicyUrl);
  const openTermsOfService = () => Linking.openURL(config.termsOfServiceUrl);
  const contactSupport = () => Linking.openURL(`mailto:${config.supportEmail}`);

  const intervals = [30, 60, 120, 180];
  const intervalLabels: Record<number, string> = {
    30: '30m',
    60: '1h',
    120: '2h',
    180: '3h',
  };

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
              {trialCopy.features.slice(0, 3).map((feature, i) => (
                <Text key={i} style={styles.trialFeature}>
                  • {feature}
                </Text>
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
          <Text style={styles.premiumText}>Full access to all features</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiz Frequency</Text>
        <Text style={styles.sectionSubtitle}>How often should we quiz you?</Text>
        <View style={styles.intervalRow}>
          {intervals.map((mins) => (
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
              <Text
                style={[
                  styles.intervalText,
                  quizInterval === mins && styles.intervalTextSelected,
                ]}
              >
                {intervalLabels[mins]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.toggleLabel}>Quiz Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={updateNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
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
        <Text style={styles.sectionTitle}>Subscription</Text>
        <TouchableOpacity
          style={[styles.menuItem, shadows.sm]}
          onPress={handleRestorePurchases}
          activeOpacity={0.8}
        >
          <Text style={styles.menuItemText}>Restore Purchases</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <View style={[styles.infoCard, shadows.sm]}>
          <Text style={styles.infoTitle}>How to Cancel</Text>
          <Text style={styles.infoLabel}>{Platform.OS === 'ios' ? 'iOS:' : 'Android:'}</Text>
          <Text style={styles.infoText}>
            {Platform.OS === 'ios' ? cancellationInstructions.ios : cancellationInstructions.android}
          </Text>
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
        {user?.email && <Text style={styles.footerEmail}>{user.email}</Text>}
      </View>
    </ScrollView>
  );
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
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
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
  toggleLabel: {
    fontSize: fontSize.md,
    color: colors.text,
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
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
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
  footerEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
