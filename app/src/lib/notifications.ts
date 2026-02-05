import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('quiz', [
    { identifier: 'answer_a', buttonTitle: 'A', options: { opensAppToForeground: true } },
    { identifier: 'answer_b', buttonTitle: 'B', options: { opensAppToForeground: true } },
    { identifier: 'answer_c', buttonTitle: 'C', options: { opensAppToForeground: true } },
    { identifier: 'answer_d', buttonTitle: 'D', options: { opensAppToForeground: true } },
  ]);
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await supabase.from('users').update({ push_token: token }).eq('id', userId);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('quiz', {
        name: 'Quiz Notifications',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  correctIndex: number;
  sourceName: string;
}

export async function scheduleQuizNotification(question: QuizQuestion, delayMinutes: number): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Quiz Time!',
      body: question.question,
      data: {
        questionId: question.id,
        question: question.question,
        answers: question.answers,
        correctIndex: question.correctIndex,
      },
      categoryIdentifier: 'quiz',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delayMinutes * 60,
    },
  });
  return identifier;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function setupNotificationListeners(
  onReceived: (n: Notifications.Notification) => void,
  onResponse: (r: Notifications.NotificationResponse) => void
) {
  const sub1 = Notifications.addNotificationReceivedListener(onReceived);
  const sub2 = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    sub1.remove();
    sub2.remove();
  };
}
