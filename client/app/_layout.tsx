import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { AppThemeProvider, useAppTheme } from '@/hooks/ThemeContext';
import { LanguageProvider } from '@/hooks/LanguageContext';
import { ToastProvider } from '@/hooks/ToastContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootContent() {
  const { mode, tokens } = useAppTheme();

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
