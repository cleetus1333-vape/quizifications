import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { registerForPushNotifications, setupNotificationListeners, setupNotificationCategories } from './src/lib/notifications';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import NotesScreen from './src/screens/NotesScreen';
import AddNoteScreen from './src/screens/AddNoteScreen';
import QuizScreen from './src/screens/QuizScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const COLORS = {
  bg: '#0a0a0b',
  card: '#141416',
  primary: '#c8ff00',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#2a2a2e',
};

type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  Quiz: undefined;
  AddNote: undefined;
};

type MainTabsParamList = {
  Home: undefined;
  Notes: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, height: 65, paddingTop: 8, paddingBottom: 8 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />, headerTitle: 'Quizifications' }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📝" focused={focused} />, headerTitle: 'My Notes' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading, settings } = useAuth();

  useEffect(() => {
    setupNotificationCategories();
  }, []);

  useEffect(() => {
    if (user) {
      registerForPushNotifications(user.id).catch(console.warn);
    }
  }, [user]);

  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => console.log('Notification:', notification),
      (response) => console.log('Response:', response)
    );
    return cleanup;
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      id="RootStack"
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz', presentation: 'modal' }} />
          <Stack.Screen name="AddNote" component={AddNoteScreen} options={{ title: 'Add Note', presentation: 'modal' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
