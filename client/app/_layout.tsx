import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import CustomSplashScreen from '@/components/CustomSplashScreen';

SplashScreen.preventAutoHideAsync();

import { useColorScheme } from '@/hooks/use-color-scheme';

import { AppThemeProvider, useAppTheme } from '@/hooks/ThemeContext';
import { LanguageProvider } from '@/hooks/LanguageContext';
import { ToastProvider } from '@/hooks/ToastContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootContent() {
  const { mode, tokens } = useAppTheme();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Perform any necessary data fetching or font loading here
        // We'll simulate a 2.5s load time to show off the creative splash
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return <CustomSplashScreen />;
  }

  return (
    <ThemeProvider value={{
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        text: tokens.onSurface,
        background: tokens.surface,
      }
    }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <RootContent />
        </ToastProvider>
      </LanguageProvider>
    </AppThemeProvider>
  );
}
