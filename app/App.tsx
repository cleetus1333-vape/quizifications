import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { 
  registerForPushNotifications, 
  setupNotificationListeners,
  scheduleNextQuiz 
} from './src/lib/notifications';
import { useQuiz } from './src/hooks/useQuiz';
import { colors } from './src/constants/theme';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import NotesScreen from './src/screens/NotesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ 
      fontSize: 24, 
      opacity: focused ? 1 : 0.5 
    }}>
      {emoji}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          headerTitle: 'Quizifications',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading, settings } = useAuth();
  const { getRandomQuestion } = useQuiz();

  useEffect(() => {
    if (user) {
      registerForPushNotifications(user.id);
      const interval = settings?.quiz_interval_minutes || 30;
      scheduleNextQuiz(getRandomQuestion, interval);
    }
  }, [user, settings, getRandomQuestion]);

  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notification received:', notification);
      },
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);
      }
    );

    return cleanup;
  }, []);

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {!user ? (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Quiz" 
            component={QuizScreen}
            options={{ 
              title: 'Quiz',
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="Categories" 
            component={CategoriesScreen}
            options={{ title: 'Study Topics' }}
          />
          <Stack.Screen 
            name="Notes" 
            component={NotesScreen}
            options={{ title: 'My Notes' }}
          />
          <Stack.Screen 
            name="Groups" 
            component={GroupsScreen}
            options={{ title: 'Study Groups' }}
          />
          <Stack.Screen 
            name="GroupDetail" 
            component={GroupDetailScreen}
            options={{ title: 'Group' }}
          />
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
