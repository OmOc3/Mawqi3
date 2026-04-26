import * as ExpoLinking from 'expo-linking';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader, Card, PrimaryButton, ScreenShell } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing, WebBaseUrl } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/hooks/use-theme';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildWebLoginUrl(email: string): string {
  const returnTo = ExpoLinking.createURL('/');
  const query = new URLSearchParams({
    email,
    returnTo,
    source: 'mobile',
  });

  return `${WebBaseUrl.replace(/\/$/, '')}/login?${query.toString()}`;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const { direction, isRtl, strings } = useLanguage();
  const theme = useTheme();

  async function openWebLogin(): Promise<void> {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError(strings.validation.requiredEmail);
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError(strings.auth.invalidEmail);
      return;
    }

    if (!password) {
      setError(strings.auth.passwordRequired);
      return;
    }

    setError(null);
    setIsOpening(true);

    try {
      await Linking.openURL(buildWebLoginUrl(cleanEmail));
      setPassword('');
    } catch {
      setError(strings.errors.unexpected);
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <BrandHeader subtitle={strings.auth.loginSubtitle} />

            <Card>
              <ThemedText type="title">{strings.auth.loginTitle}</ThemedText>

              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{strings.auth.email}</ThemedText>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  inputMode="email"
                  onChangeText={setEmail}
                  placeholder={strings.auth.emailPlaceholder}
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
                  value={email}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{strings.auth.password}</ThemedText>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  onChangeText={setPassword}
                  placeholder={strings.auth.passwordPlaceholder}
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
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
                  value={password}
                />
              </View>

              {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}

              <PrimaryButton disabled={isOpening} onPress={() => void openWebLogin()}>
                {isOpening ? strings.auth.signingIn : strings.auth.webLoginCta}
              </PrimaryButton>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  keyboardView: {
    flex: 1,
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
