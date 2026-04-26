import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ToastProvider } from '@/components/mawqi3-ui';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeModeProvider, useThemeMode } from '@/contexts/theme-context';
import { SyncProvider } from '@/lib/sync/report-sync';

export default function TabLayout() {
  return (
    <LanguageProvider>
      <ThemeModeProvider>
        <Mawqi3Layout />
      </ThemeModeProvider>
    </LanguageProvider>
  );
}

function Mawqi3Layout() {
  const { resolvedTheme } = useThemeMode();
  const [fontsLoaded, fontError] = useFonts({
    Tajawal: 'https://raw.githubusercontent.com/googlefonts/tajawal/main/fonts/ttf/Tajawal-Regular.ttf',
    'Tajawal-Medium': 'https://raw.githubusercontent.com/googlefonts/tajawal/main/fonts/ttf/Tajawal-Medium.ttf',
    'Tajawal-Bold': 'https://raw.githubusercontent.com/googlefonts/tajawal/main/fonts/ttf/Tajawal-Bold.ttf',
    'Tajawal-ExtraBold': 'https://raw.githubusercontent.com/googlefonts/tajawal/main/fonts/ttf/Tajawal-ExtraBold.ttf',
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <SyncProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </SyncProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
