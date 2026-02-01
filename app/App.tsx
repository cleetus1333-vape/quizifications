import React, { useEffect, Suspense, lazy } from 'react';
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

const AuthScreen = lazy(() => import('./src/screens/AuthScreen'));
const HomeScreen = lazy(() => import('./src/screens/HomeScreen'));
const QuizScreen = lazy(() => import('./src/screens/QuizScreen'));
const CategoriesScreen = lazy(() => import('./src/screens/CategoriesScreen'));
const NotesScreen = lazy(() => import('./src/screens/NotesScreen'));
const SettingsScreen = lazy(() => import('./src/screens/SettingsScreen'));
const GroupsScreen = lazy(() => import('./src/screens/GroupsScreen'));
const GroupDetailScreen = lazy(() => import('./src/screens/GroupDetailScreen'));

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LoadingFallback() {
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: colors.background, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const TabIcon = React.memo(({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ 
    fontSize: 24, 
    opacity: focused ? 1 : 0.5 
  }}>
    {emoji}
  </Text>
));

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
          height: 65,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          headerTitle: 'Quizifications',
          tabBarLabel: 'Home',
        }}
      >
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <HomeScreen {...props} />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Settings" 
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
          tabBarLabel: 'Settings',
        }}
      >
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsScreen {...props} />
          </Suspense>
        )}
      </Tab.Screen>
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
    return <LoadingFallback />;
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
          options={{ headerShown: false }}
        >
          {() => (
            <Suspense fallback={<LoadingFallback />}>
              <AuthScreen />
            </Suspense>
          )}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Quiz" 
            options={{ 
              title: 'Quiz',
              presentation: 'modal',
            }}
          >
            {(props) => (
              <Suspense fallback={<LoadingFallback />}>
                <QuizScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="Categories" 
            options={{ title: 'Study Topics' }}
          >
            {(props) => (
              <Suspense fallback={<LoadingFallback />}>
                <CategoriesScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="Notes" 
            options={{ title: 'My Notes' }}
          >
            {(props) => (
              <Suspense fallback={<LoadingFallback />}>
                <NotesScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="Groups" 
            options={{ title: 'Study Groups' }}
          >
            {(props) => (
              <Suspense fallback={<LoadingFallback />}>
                <GroupsScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="GroupDetail" 
            options={{ title: 'Group' }}
          >
            {(props) => (
              <Suspense fallback={<LoadingFallback />}>
                <GroupDetailScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
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
