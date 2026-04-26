/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#ffffff',
    backgroundSelected: '#ccfbf1',
    accent: '#0284c7',
    border: '#e2e8f0',
    danger: '#dc2626',
    dangerSoft: '#fee2e2',
    dangerStrong: '#dc2626',
    info: '#0284c7',
    infoSoft: '#e0f2fe',
    onPrimary: '#f8fafc',
    primary: '#0f766e',
    primaryLight: '#14b8a6',
    primarySoft: '#ccfbf1',
    primaryStrong: '#0f766e',
    surfaceCard: '#ffffff',
    surfaceCardDark: '#1e293b',
    success: '#16a34a',
    successSoft: '#dcfce7',
    successStrong: '#16a34a',
    textSecondary: '#64748b',
    warning: '#d97706',
    warningSoft: '#fef3c7',
    warningStrong: '#d97706',
  },
  dark: {
    text: '#f8fafc',
    background: '#020617',
    backgroundElement: '#0f172a',
    backgroundSelected: '#134e4a',
    accent: '#38bdf8',
    border: '#334155',
    danger: '#f87171',
    dangerSoft: '#450a0a',
    dangerStrong: '#dc2626',
    info: '#38bdf8',
    infoSoft: '#082f49',
    onPrimary: '#f8fafc',
    primary: '#14b8a6',
    primaryLight: '#5eead4',
    primarySoft: '#134e4a',
    primaryStrong: '#0f766e',
    surfaceCard: '#1e293b',
    surfaceCardDark: '#1e293b',
    success: '#22c55e',
    successSoft: '#052e16',
    successStrong: '#16a34a',
    textSecondary: '#94a3b8',
    warning: '#f59e0b',
    warningSoft: '#451a03',
    warningStrong: '#d97706',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Tajawal',
    sansMedium: 'Tajawal-Medium',
    sansBold: 'Tajawal-Bold',
    sansHeavy: 'Tajawal-ExtraBold',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Tajawal',
    sansMedium: 'Tajawal-Medium',
    sansBold: 'Tajawal-Bold',
    sansHeavy: 'Tajawal-ExtraBold',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Tajawal, var(--font-display)',
    sansMedium: 'Tajawal, var(--font-display)',
    sansBold: 'Tajawal, var(--font-display)',
    sansHeavy: 'Tajawal, var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Typography = {
  fontFamily: 'Tajawal',
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    xxl: 30,
    display: 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
    heavy: '800',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const TouchTarget = 52;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Brand = {
  appName: 'Mawqi3',
  appNameArabic: 'موقعي',
  appTitle: 'إدارة محطات الطعوم',
  tagline: 'تشغيل ميداني واضح لمحطات الطعوم وفرق الفحص',
  taglineEnglish: 'Clear field operations for bait stations and inspection teams',
  companyName: '',
  companyNameArabic: '',
  foundedYear: 2025,
  copyrightYear: () => new Date().getFullYear(),
  scheme: 'mawqi3',
  slug: 'mawqi3',
} as const;

export const WebBaseUrl = process.env.EXPO_PUBLIC_MAWQI3_WEB_BASE_URL ?? 'http://localhost:3010';
