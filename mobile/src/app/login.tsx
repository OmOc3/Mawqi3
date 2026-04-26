import * as ExpoLinking from 'expo-linking';
import { router } from 'expo-router';
import { signInWithCustomToken } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader, Card, InputField, PrimaryButton, ScreenShell, SecondaryButton, useToast } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing, WebBaseUrl } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/hooks/use-theme';
import { errorHaptic, successHaptic } from '@/lib/haptics';
import { ApiClientError, apiPost, getApiBaseUrl } from '@/lib/sync/api-client';
import { auth } from '@/lib/sync/firebase';
import type { LoginSuccessResponse } from '@/lib/sync/types';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildForgotPasswordUrl(baseUrl: string, email: string): string {
  const returnTo = ExpoLinking.createURL('/');
  const query = new URLSearchParams({
    email,
    returnTo,
    mode: 'forgot-password',
    source: 'mobile',
  });

  return `${baseUrl.replace(/\/$/, '')}/login?${query.toString()}`;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [webAppUrl, setWebAppUrl] = useState(WebBaseUrl);
  const { strings } = useLanguage();
  const theme = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    void getApiBaseUrl().then((value) => {
      if (isMounted) {
        setWebAppUrl(value);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function mapAuthError(errorValue: unknown): string {
    if (errorValue instanceof ApiClientError) {
      if (errorValue.status === 429) {
        return strings.auth.rateLimited;
      }

      if (errorValue.status === 0) {
        return strings.auth.networkError;
      }

      return errorValue.message || strings.auth.genericLoginError;
    }

    return strings.auth.genericLoginError;
  }

  async function submitLogin(): Promise<void> {
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
    setIsSigningIn(true);

    try {
      const result = await apiPost<LoginSuccessResponse, { email: string; password: string }>(
        '/api/auth/login',
        {
          email: cleanEmail,
          password,
        },
        { authenticated: false },
      );

      await signInWithCustomToken(auth, result.customToken);
      await successHaptic();
      setPassword('');
      router.replace('/(tabs)');
    } catch (loginError: unknown) {
      const message = mapAuthError(loginError);
      setError(message);
      showToast(message, 'error');
      await errorHaptic();
    } finally {
      setIsSigningIn(false);
    }
  }

  async function openForgotPassword(): Promise<void> {
    try {
      await Linking.openURL(buildForgotPasswordUrl(webAppUrl, email.trim()));
    } catch {
      showToast(strings.errors.unexpected, 'error');
      await errorHaptic();
    }
  }

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <BrandHeader subtitle={strings.auth.loginSubtitle} />

            <Card>
              <ThemedText type="title">{strings.auth.loginTitle}</ThemedText>

              <InputField
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                inputMode="email"
                label={strings.auth.email}
                onChangeText={setEmail}
                placeholder={strings.auth.emailPlaceholder}
                style={styles.ltrInput}
                value={email}
              />

              <InputField
                autoCapitalize="none"
                autoComplete="password"
                label={strings.auth.password}
                onChangeText={setPassword}
                placeholder={strings.auth.passwordPlaceholder}
                secureTextEntry
                style={styles.ltrInput}
                value={password}
              />

              {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}

              <PrimaryButton disabled={isSigningIn} loading={isSigningIn} onPress={() => void submitLogin()}>
                {isSigningIn ? strings.auth.signingIn : strings.actions.login}
              </PrimaryButton>
              <SecondaryButton onPress={() => void openForgotPassword()}>{strings.auth.forgotPassword}</SecondaryButton>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  ltrInput: {
    textAlign: 'left',
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
