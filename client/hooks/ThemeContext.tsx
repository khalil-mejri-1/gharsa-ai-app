import React, { createContext, useContext, useState } from 'react';

export const DESIGN_TOKENS = {
  light: {
    primary: '#0d631b',
    primaryContainer: '#2e7d32',
    primaryFixed: '#a3f69c',
    onPrimaryFixed: '#002204',
    secondary: '#00629e',
    secondaryFixed: '#cfe5ff',
    onSecondaryFixed: '#001d34',
    tertiary: '#923357',
    surface: '#f8faf9',
    surfaceContainerLow: '#f2f4f3',
    surfaceContainerLowest: '#ffffff',
    outline: '#707a6c',
    onSurface: '#191c1c',
    onSurfaceVariant: '#40493d',
    outlineVariant: '#bfcaba',
    bgGradientStart: '#064e3b',
    bgGradientMid: '#14532d',
    bgGradientEnd: '#166534',
    appBgGradientStart: '#f8faf9',
    appBgGradientMid: '#f8faf9',
    appBgGradientEnd: '#f8faf9',
  },
  dark: {
    primary: '#0ad62c',
    primaryContainer: '#0d631b',
    primaryFixed: '#0ad62c',
    onPrimaryFixed: '#002204',
    secondary: '#00b8ff',
    secondaryFixed: '#00b8ff',
    onSecondaryFixed: '#001d34',
    tertiary: '#ff4d6d',
    surface: '#020d08',
    surfaceContainerLow: '#061710',
    surfaceContainerLowest: '#0a2117',
    outline: '#3e5c4e',
    onSurface: '#e1ece7',
    onSurfaceVariant: '#a7c4b5',
    outlineVariant: '#2a463b',
    bgGradientStart: '#020d08',
    bgGradientMid: '#061710',
    bgGradientEnd: '#020d08',
    appBgGradientStart: '#020d08',
    appBgGradientMid: '#061710',
    appBgGradientEnd: '#020d08',
  }
};

type ThemeContextType = {
  mode: 'light' | 'dark';
  tokens: typeof DESIGN_TOKENS.light;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({} as any);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const toggleTheme = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ mode, tokens: DESIGN_TOKENS[mode], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
