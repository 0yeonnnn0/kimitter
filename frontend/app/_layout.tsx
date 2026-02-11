import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/stores/authStore';
import { setLogoutCallback } from '../src/services/api';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

export default function RootLayout() {
  const { isLoggedIn, isLoading, restoreSession } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  usePushNotifications(isLoggedIn);

  useEffect(() => {
    restoreSession();
    setLogoutCallback(() => {
      useAuthStore.setState({ user: null, accessToken: null, isLoggedIn: false });
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isLoading, segments]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true, gestureResponseDistance: { start: 50 } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="[postId]/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="user/[userId]" />
        <Stack.Screen name="change-password" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
