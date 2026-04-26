import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader, Card, ScreenShell, SecondaryButton } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Brand, Spacing, WebBaseUrl } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { type ThemeMode, useThemeMode } from '@/contexts/theme-context';
import { getApiBaseUrl, setApiBaseUrl } from '@/lib/sync/api-client';
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
  const { mode, resolvedTheme, setMode, theme } = useThemeMode();
  const { direction, isRtl, language, needsRestart, setLanguage, strings } = useLanguage();
  const t = strings.settings;
  const legal = strings.legal;
  const [webAppUrl, setWebAppUrlState] = useState(WebBaseUrl);

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
  }

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <ThemedText type="smallBold">{t.webAppTitle}</ThemedText>
            <ThemedText type="smallBold">{t.webAppUrlLabel}</ThemedText>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setWebAppUrlState}
              placeholder={t.webAppUrlPlaceholder}
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text,
                  textAlign: isRtl ? 'right' : 'left',
                  writingDirection: direction,
                },
              ]}
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
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
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
