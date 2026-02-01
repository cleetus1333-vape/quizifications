import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserSettings } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  settings: UserSettings | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setSettings(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserData(session.user.id);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            username,
          });

        if (profileError) throw profileError;

        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({
            user_id: data.user.id,
          });

        if (settingsError) throw settingsError;

        const defaultWindows = [
          { user_id: data.user.id, label: 'Morning', start_time: '09:00', end_time: '12:00', is_enabled: false },
          { user_id: data.user.id, label: 'Afternoon', start_time: '13:00', end_time: '17:00', is_enabled: true },
          { user_id: data.user.id, label: 'Evening', start_time: '18:00', end_time: '21:00', is_enabled: true },
        ];

        await supabase.from('study_windows').insert(defaultWindows);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSettings(null);
  };

  const deleteAccount = async () => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      await supabase.from('quiz_responses').delete().eq('user_id', user.id);
      await supabase.from('group_leaderboard').delete().eq('user_id', user.id);
      await supabase.from('note_questions').delete().eq('user_id', user.id);
      await supabase.from('notes').delete().eq('user_id', user.id);
      await supabase.from('user_categories').delete().eq('user_id', user.id);
      await supabase.from('study_windows').delete().eq('user_id', user.id);
      await supabase.from('user_settings').delete().eq('user_id', user.id);
      await supabase.from('group_members').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);

      await signOut();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      settings,
      loading,
      signUp,
      signIn,
      signOut,
      refreshUser,
      deleteAccount,
      updateSettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
