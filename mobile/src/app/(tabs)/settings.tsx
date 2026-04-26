import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader, Card, InputField, ScreenShell, SecondaryButton, useToast } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Brand, Spacing, WebBaseUrl } from '@/constants/theme';
import { useKeepAwakeMode } from '@/contexts/keep-awake-context';
import { useLanguage } from '@/contexts/language-context';
import { useTextScale } from '@/contexts/text-scale-context';
import { type ThemeMode, useThemeMode } from '@/contexts/theme-context';
import { errorHaptic, successHaptic } from '@/lib/haptics';
import { getApiBaseUrl, setApiBaseUrl } from '@/lib/sync/api-client';
import { signOut } from '@/lib/auth';
import { type Language } from '@/lib/i18n';

const modes: ThemeMode[] = ['system', 'light', 'dark'];
const languageOptions: Language[] = ['ar', 'en'];
const languageLabelKeys: Record<Language, 'languageArabic' | 'languageEnglish'> = {
  ar: 'languageArabic',
  en: 'languageEnglish',
};
const modeLabelKeys: Record<ThemeMode, 'themeSystem' | 'themeLight' | 'themeDark'> = {
  system: 'themeSystem',
  light: 'themeLight',
  dark: 'themeDark',
};
const resolvedThemeLabelKeys: Record<'light' | 'dark', 'themeLight' | 'themeDark'> = {
  light: 'themeLight',
  dark: 'themeDark',
};

const directionRow = {
  ltr: 'row',
  rtl: 'row-reverse',
} as const;

export default function SettingsScreen() {
  const { mode, resolvedTheme, setMode } = useThemeMode();
  const { keepAwakeEnabled, setKeepAwakeEnabled } = useKeepAwakeMode();
  const { largeTextEnabled, setLargeTextEnabled } = useTextScale();
  const { direction, language, needsRestart, setLanguage, strings } = useLanguage();
  const t = strings.settings;
  const legal = strings.legal;
  const [webAppUrl, setWebAppUrlState] = useState(WebBaseUrl);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    void getApiBaseUrl().then((value) => {
      if (isMounted) {
        setWebAppUrlState(value);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveWebAppUrl(): Promise<void> {
    const cleanUrl = webAppUrl.trim();

    if (!cleanUrl) {
      return;
    }

    await setApiBaseUrl(cleanUrl);
    showToast(strings.actions.save, 'success');
  }

  async function logout(): Promise<void> {
    try {
      await signOut();
      showToast(t.logoutDone, 'success');
      await successHaptic();
      router.replace('/login');
    } catch {
      showToast(strings.auth.logoutError, 'error');
      await errorHaptic();
    }
  }

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
          <BrandHeader subtitle={t.subtitle} />

          <Card>
            <ThemedText type="title">{t.languageTitle}</ThemedText>
            <View style={[styles.modeRow, { flexDirection: directionRow[direction] }]}>
              {languageOptions.map((item) => (
                <SecondaryButton key={item} selected={language === item} onPress={() => void setLanguage(item)}>
                  {t[languageLabelKeys[item]]}
                </SecondaryButton>
              ))}
            </View>
            {needsRestart ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t.languageRestartHint}
              </ThemedText>
            ) : null}
          </Card>

          <Card>
            <ThemedText type="title">{t.themeTitle}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {t.themeCurrent}: {t[resolvedThemeLabelKeys[resolvedTheme]]}
            </ThemedText>
            <View style={[styles.modeRow, { flexDirection: directionRow[direction] }]}>
              {modes.map((item) => (
                <SecondaryButton key={item} selected={mode === item} onPress={() => setMode(item)}>
                  {t[modeLabelKeys[item]]}
                </SecondaryButton>
              ))}
            </View>
          </Card>

          <Card>
            <ThemedText type="title">{t.largeTextTitle}</ThemedText>
            <ThemedText themeColor="textSecondary">{t.largeTextBody}</ThemedText>
            <View style={[styles.modeRow, { flexDirection: directionRow[direction] }]}> 
              <SecondaryButton selected={largeTextEnabled} onPress={() => setLargeTextEnabled(true)}>
                {t.enabled}
              </SecondaryButton>
              <SecondaryButton selected={!largeTextEnabled} onPress={() => setLargeTextEnabled(false)}>
                {t.disabled}
              </SecondaryButton>
            </View>
          </Card>

          <Card>
            <ThemedText type="title">{t.keepAwakeTitle}</ThemedText>
            <ThemedText themeColor="textSecondary">{t.keepAwakeBody}</ThemedText>
            <View style={[styles.modeRow, { flexDirection: directionRow[direction] }]}> 
              <SecondaryButton selected={keepAwakeEnabled} onPress={() => setKeepAwakeEnabled(true)}>
                {t.enabled}
              </SecondaryButton>
              <SecondaryButton selected={!keepAwakeEnabled} onPress={() => setKeepAwakeEnabled(false)}>
                {t.disabled}
              </SecondaryButton>
            </View>
          </Card>

          <Card>
            <ThemedText type="smallBold">{t.webAppTitle}</ThemedText>
            <InputField
              autoCapitalize="none"
              autoCorrect={false}
              label={t.webAppUrlLabel}
              onChangeText={setWebAppUrlState}
              placeholder={t.webAppUrlPlaceholder}
              value={webAppUrl}
            />
            <View style={[styles.actions, { flexDirection: directionRow[direction] }]}>
              <SecondaryButton onPress={() => void saveWebAppUrl()}>{strings.actions.save}</SecondaryButton>
              <SecondaryButton onPress={() => Linking.openURL(`${webAppUrl.replace(/\/$/, '')}/dashboard/supervisor`)}>
                {t.supervisorPortal}
              </SecondaryButton>
              <SecondaryButton onPress={() => Linking.openURL(`${webAppUrl.replace(/\/$/, '')}/dashboard/manager`)}>
                {t.managerPortal}
              </SecondaryButton>
            </View>
          </Card>

          <Card>
            <ThemedText type="smallBold">{t.securityTitle}</ThemedText>
            <ThemedText themeColor="textSecondary">{t.securityBody}</ThemedText>
          </Card>

          <Card variant="danger">
            <ThemedText type="smallBold">{t.logoutTitle}</ThemedText>
            <ThemedText themeColor="textSecondary">{t.logoutBody}</ThemedText>
            <SecondaryButton onPress={() => void logout()}>{t.logoutCta}</SecondaryButton>
          </Card>

          <Card>
            <ThemedText type="smallBold">{t.legalTitle}</ThemedText>
            <View style={[styles.actions, { flexDirection: directionRow[direction] }]}>
              <SecondaryButton onPress={() => router.push('/legal/terms')}>{legal.terms}</SecondaryButton>
              <SecondaryButton onPress={() => router.push('/legal/privacy')}>{legal.privacy}</SecondaryButton>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              © 2025 {Brand.companyName || '[Company Name]'} — {legal.allRightsReserved}
            </ThemedText>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row-reverse',
    gap: Spacing.two,
  },
  modeRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.two,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
});
