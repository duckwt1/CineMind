import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AlertProvider } from '../src/context/AlertContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { colors } from '../src/theme/colors';

// Inject Ionicons @font-face immediately in browser DOM
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const fontId = 'expo-vector-icons-ionicons-web';
  if (!document.getElementById(fontId)) {
    const style = document.createElement('style');
    style.id = fontId;
    style.textContent = `
      @font-face {
        font-family: 'ionicons';
        src: url('/fonts/Ionicons.ttf') format('truetype'),
             url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.2.0/Fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: block;
      }
      @font-face {
        font-family: 'Ionicons';
        src: url('/fonts/Ionicons.ttf') format('truetype'),
             url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.2.0/Fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: block;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(
    Platform.OS !== 'web'
      ? {
          ...Ionicons.font,
        }
      : {}
  );

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Ionicons.loadFont().catch(() => {});
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AlertProvider>
        <NotificationProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bgBase },
              headerTintColor: colors.textPrimary,
              headerTitleStyle: { fontWeight: '700', fontSize: 17 },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.bgBase },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ title: 'Sign In', headerShown: false }} />
            <Stack.Screen name="(auth)/register" options={{ title: 'Create Account', headerShown: false }} />
            <Stack.Screen
              name="movie/[id]"
              options={{
                title: 'Movie Details',
                headerStyle: { backgroundColor: colors.bgBase },
                headerTintColor: colors.accentGold,
              }}
            />
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
          </Stack>
        </NotificationProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}
