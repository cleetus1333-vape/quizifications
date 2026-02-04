import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { config, trialCopy } from '../lib/config';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openTerms = () => Linking.openURL(config.termsOfServiceUrl);
  const openPrivacy = () => Linking.openURL(config.privacyPolicyUrl);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#12121a']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoQ}>Q</Text>
            </View>
            <Text style={styles.logoText}>Quizifications</Text>
            <Text style={styles.tagline}>Master anything with smart quizzes</Text>
          </View>

          <View style={[styles.card, shadows.lg]}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, !isSignUp && styles.tabActive]}
                onPress={() => { setIsSignUp(false); setError(''); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, isSignUp && styles.tabActive]}
                onPress={() => { setIsSignUp(true); setError(''); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={gradients.primary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isSignUp ? 'Start Free Trial' : 'Sign In'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {isSignUp && (
              <View style={styles.trialBanner}>
                <Text style={styles.trialBadge}>✨ {config.trialDays}-DAY FREE TRIAL</Text>
                <Text style={styles.trialPrice}>Then just {config.premiumPrice}</Text>
                <View style={styles.features}>
                  {trialCopy.features.map((feature, i) => (
                    <Text key={i} style={styles.feature}>• {feature}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.link} onPress={openTerms}>Terms</Text>
              {' & '}
              <Text style={styles.link} onPress={openPrivacy}>Privacy Policy</Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  logoQ: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.text,
  },
  logoText: {
    fontSize: fontSize.xxxl,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  form: {
    gap: spacing.sm,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorContainer: {
    backgroundColor: colors.errorGlow,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  submitGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  trialBanner: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trialBadge: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  trialPrice: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  features: {
    alignSelf: 'flex-start',
    width: '100%',
  },
  feature: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
