import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/lib/auth';
import { isConfigured } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { WebSafeArea } from '@/lib/web-safe-area';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
  },
};

function RootStack() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading || !isConfigured) SplashScreen.hideAsync();
  }, [loading]);

  if (isConfigured && loading) return null;
  const signedIn = isConfigured && session !== null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Protected guard={!isConfigured}>
        <Stack.Screen name="setup" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isConfigured && !signedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="routine/[id]" options={{ title: 'Programme' }} />
        <Stack.Screen
          name="workout/[id]"
          options={{ title: 'Séance en cours', gestureEnabled: false }}
        />
        <Stack.Screen name="seance/[id]" options={{ title: 'Séance' }} />
        <Stack.Screen name="exercise/[id]" options={{ title: 'Progression' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <WebSafeArea>
        <AuthProvider>
          <StatusBar style="light" />
          <RootStack />
        </AuthProvider>
      </WebSafeArea>
    </ThemeProvider>
  );
}
