import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader, Card, PrimaryButton, ScreenShell, SecondaryButton } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing, WebBaseUrl } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/hooks/use-theme';
import { getApiBaseUrl } from '@/lib/sync/api-client';

function normalizeStationId(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

export default function ScanScreen() {
  const [stationId, setStationId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(null);
  const theme = useTheme();
  const { strings } = useLanguage();
  const t = strings.scan;
  const [webAppUrl, setWebAppUrl] = useState(WebBaseUrl);
  const normalizedStationId = normalizeStationId(stationId);

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

  function openReport() {
    if (!normalizedStationId) {
      setError(strings.validation.stationIdRequired);
      return;
    }

    setError(null);
    router.push({ pathname: '/report/[stationId]', params: { stationId: normalizedStationId } });
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (!result.data || result.data === lastScannedValue) {
      return;
    }

    setLastScannedValue(result.data);
    const match = result.data.match(/\/station\/([^/]+)\/report/);

    if (match?.[1]) {
      const scannedStationId = decodeURIComponent(match[1]);
      setStationId(scannedStationId);
      router.push({ pathname: '/report/[stationId]', params: { stationId: scannedStationId } });
      return;
    }

    setError(t.invalidQr);
  }

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BrandHeader subtitle={t.subtitle} />

          <Card>
            <ThemedText type="title">{t.title}</ThemedText>
            <ThemedText themeColor="textSecondary">{t.manualSubtitle}</ThemedText>
            <View style={[styles.cameraFrame, { borderColor: theme.border, backgroundColor: theme.background }]}>
              {permission?.granted ? (
                <>
                  <CameraView
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    facing="back"
                    onBarcodeScanned={handleBarcodeScanned}
                    style={StyleSheet.absoluteFill}
                  />
                  <View pointerEvents="none" style={[styles.scanGuide, { borderColor: theme.primary }]} />
                </>
              ) : (
                <View style={styles.permissionBox}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t.cameraPermissionBody}
                  </ThemedText>
                  <PrimaryButton onPress={requestPermission}>{t.enableCamera}</PrimaryButton>
                </View>
              )}
            </View>
          </Card>

          <Card>
            <ThemedText type="smallBold">{t.manualStationLabel}</ThemedText>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setStationId}
              placeholder={t.manualStationPlaceholder}
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={stationId}
            />
            {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
            <PrimaryButton onPress={openReport}>{strings.actions.openReport}</PrimaryButton>
          </Card>

          <View style={styles.actions}>
            <SecondaryButton onPress={() => Linking.openURL(`${webAppUrl}/scan`)}>{t.webScanCta}</SecondaryButton>
            <SecondaryButton onPress={() => Linking.openURL(`${webAppUrl}/login`)}>{strings.actions.login}</SecondaryButton>
          </View>
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
  cameraFrame: {
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    textAlign: 'left',
  },
  permissionBox: {
    flex: 1,
    gap: Spacing.three,
    justifyContent: 'center',
    padding: Spacing.three,
  },
  scanGuide: {
    borderRadius: 18,
    borderWidth: 3,
    bottom: '18%',
    left: '18%',
    position: 'absolute',
    right: '18%',
    top: '18%',
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
