import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet, BrandHeader, Card, InputField, PrimaryButton, ScreenShell, SecondaryButton, useToast } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/hooks/use-theme';
import { useStation } from '@/hooks/use-station';
import { errorHaptic, successHaptic, warningHaptic } from '@/lib/haptics';
import { languageDateLocales } from '@/lib/i18n';

function normalizeStationId(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

function extractStationIdFromQr(value: string): string | null {
  const match = value.match(/\/station\/([^/?#]+)\/report/);

  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function timestampToDate(timestamp?: string): Date | null {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? null : date;
}

export default function ScanScreen() {
  const [stationId, setStationId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [previewStationId, setPreviewStationId] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isTorchEnabled, setIsTorchEnabled] = useState(false);
  const theme = useTheme();
  const { isRtl, language, strings } = useLanguage();
  const t = strings.scan;
  const normalizedStationId = normalizeStationId(stationId);
  const preview = useStation(previewStationId ?? '');
  const { showToast } = useToast();
  const locale = languageDateLocales[language];
  const lastVisitedAt = useMemo(() => timestampToDate(preview.station?.lastVisitedAt), [preview.station?.lastVisitedAt]);

  useEffect(() => {
    if (!lastScannedValue) {
      return undefined;
    }

    const timeout = setTimeout(() => setLastScannedValue(null), 2500);

    return () => clearTimeout(timeout);
  }, [lastScannedValue]);

  function addToScanHistory(nextStationId: string): void {
    setScanHistory((current) => [nextStationId, ...current.filter((item) => item !== nextStationId)].slice(0, 5));
  }

  function openPreview(nextStationId: string): void {
    addToScanHistory(nextStationId);
    setPreviewStationId(nextStationId);
    setIsPreviewVisible(true);
  }

  function openReport(nextStationId = normalizedStationId) {
    const reportStationId = normalizeStationId(nextStationId);

    if (!reportStationId) {
      setError(strings.validation.stationIdRequired);
      void warningHaptic();
      return;
    }

    setError(null);
    setIsPreviewVisible(false);
    router.push({ pathname: '/report/[stationId]', params: { stationId: reportStationId } });
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (!result.data || result.data === lastScannedValue) {
      return;
    }

    setLastScannedValue(result.data);
    const scannedStationId = extractStationIdFromQr(result.data);

    if (scannedStationId) {
      setStationId(scannedStationId);
      setError(null);
      void successHaptic();
      openPreview(scannedStationId);
      return;
    }

    setError(t.invalidQr);
    showToast(t.invalidQr, 'error');
    void errorHaptic();
  }

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
          <BrandHeader subtitle={t.subtitle} />

          <Card>
            <ThemedText type="title">{t.title}</ThemedText>
            <ThemedText themeColor="textSecondary">{t.manualSubtitle}</ThemedText>
            <View style={[styles.cameraFrame, { borderColor: theme.border, backgroundColor: theme.background }]}>
              {permission?.granted ? (
                <>
                  <CameraView
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    enableTorch={isTorchEnabled}
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
            {permission?.granted ? (
              <SecondaryButton onPress={() => setIsTorchEnabled((current) => !current)}>
                {isTorchEnabled ? t.torchOff : t.torchOn}
              </SecondaryButton>
            ) : null}
          </Card>

          <Card>
            <InputField
              autoCapitalize="none"
              autoCorrect={false}
              label={t.manualStationLabel}
              onChangeText={setStationId}
              placeholder={t.manualStationPlaceholder}
              style={styles.input}
              value={stationId}
            />
            {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
            <PrimaryButton onPress={() => openReport()}>{strings.actions.openReport}</PrimaryButton>
          </Card>

          {scanHistory.length > 0 ? (
            <Card>
              <ThemedText type="smallBold">{t.historyTitle}</ThemedText>
              <View style={[styles.historyList, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}> 
                {scanHistory.map((historyStationId) => (
                  <SecondaryButton key={historyStationId} onPress={() => openPreview(historyStationId)}>
                    {historyStationId}
                  </SecondaryButton>
                ))}
              </View>
            </Card>
          ) : null}

        </ScrollView>
      </SafeAreaView>
      <BottomSheet onDismiss={() => setIsPreviewVisible(false)} title={t.previewTitle} visible={isPreviewVisible}>
        <View style={styles.previewContent}>
          <ThemedText type="smallBold">
            {strings.report.stationLabel} {previewStationId ?? '-'}
          </ThemedText>

          {preview.loading ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t.previewLoading}
            </ThemedText>
          ) : null}

          {!preview.loading && preview.station ? (
            <View style={styles.previewContent}>
              <ThemedText type="title">{preview.station.label}</ThemedText>
              <ThemedText themeColor="textSecondary">
                {t.stationLocation}: {preview.station.location}
              </ThemedText>
              {preview.station.zone ? (
                <ThemedText themeColor="textSecondary">
                  {t.stationZone}: {preview.station.zone}
                </ThemedText>
              ) : null}
              <ThemedText themeColor="textSecondary">
                {t.stationLastVisit}:{' '}
                {lastVisitedAt ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(lastVisitedAt) : t.previewMissing}
              </ThemedText>
            </View>
          ) : null}

          {!preview.loading && preview.error ? (
            <ThemedText type="small" style={{ color: theme.warningStrong }}>
              {preview.error}
            </ThemedText>
          ) : null}

          <View style={[styles.actions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}> 
            <SecondaryButton onPress={() => setIsPreviewVisible(false)}>{strings.actions.cancel}</SecondaryButton>
            <PrimaryButton onPress={() => openReport(previewStationId ?? '')}>{strings.actions.openReport}</PrimaryButton>
          </View>
        </View>
      </BottomSheet>
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
  historyList: {
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  input: {
    textAlign: 'left',
  },
  permissionBox: {
    flex: 1,
    gap: Spacing.three,
    justifyContent: 'center',
    padding: Spacing.three,
  },
  previewContent: {
    gap: Spacing.two,
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
