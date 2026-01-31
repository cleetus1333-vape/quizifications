// src/screens/AuthScreen.tsx

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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, username.toLowerCase().trim());
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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🧠</Text>
          <Text style={styles.logoText}>Quizifications</Text>
        </View>

        <Text style={styles.tagline}>
          {isSignUp 
            ? 'Create your account' 
            : 'Welcome back'}
        </Text>

        {/* Form */}
        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle */}
        <TouchableOpacity 
          style={styles.toggle}
          onPress={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
        >
          <Text style={styles.toggleText}>
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  logoText: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  tagline: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.background,
  },
  toggle: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.accent,
    fontSize: fontSize.md,
  },
});
