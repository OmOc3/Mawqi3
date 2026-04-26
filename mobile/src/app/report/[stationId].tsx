import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BrandHeader,
  Card,
  InputField,
  PrimaryButton,
  ScreenShell,
  SecondaryButton,
  StationSummary,
  StatusBadge,
  SyncBanner,
  useToast,
} from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { StatusOptions } from '@/constants/status-options';
import { useLanguage } from '@/contexts/language-context';
import { useStation } from '@/hooks/use-station';
import { useTheme } from '@/hooks/use-theme';
import { clearWorkingDraft, getWorkingDraft, saveSubmittedReport, syncDraft, upsertWorkingDraft } from '@/lib/drafts';
import { errorHaptic, successHaptic, warningHaptic } from '@/lib/haptics';
import type { StatusOption } from '@/lib/sync/types';

function getParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default function StationReportScreen() {
  const params = useLocalSearchParams();
  const stationId = useMemo(() => decodeURIComponent(getParamValue(params.stationId)), [params.stationId]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<StatusOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { isRtl, statusOptionLabels, strings } = useLanguage();
  const { error: stationError, loading: stationLoading, station } = useStation(stationId);
  const theme = useTheme();
  const { showToast } = useToast();
  const notesRef = useRef(notes);
  const statusRef = useRef(status);
  const lastAutoSavedSignature = useRef('');

  useEffect(() => {
    notesRef.current = notes;
    statusRef.current = status;
  }, [notes, status]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateWorkingDraft(): Promise<void> {
      const draft = await getWorkingDraft(stationId);

      if (isMounted && draft) {
        setNotes(draft.notes);
        setStatus(draft.status);
        lastAutoSavedSignature.current = JSON.stringify({ notes: draft.notes, status: draft.status });
      }
    }

    void hydrateWorkingDraft();

    return () => {
      isMounted = false;
    };
  }, [stationId]);

  function toggleStatus(value: StatusOption): void {
    setStatus((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function validateDraft(): boolean {
    if (!stationId.trim()) {
      setError(strings.validation.stationIdRequired);
      void warningHaptic();
      return false;
    }

    if (notes.length > 500) {
      setError(strings.validation.notesTooLong);
      void warningHaptic();
      return false;
    }

    setError(null);
    return true;
  }

  function validateSubmit(): boolean {
    if (!validateDraft()) {
      return false;
    }

    if (!station) {
      setError(stationError ?? strings.report.stationUnavailable);
      void warningHaptic();
      return false;
    }

    if (!station.isActive) {
      setError(strings.report.inactiveStationHint);
      void warningHaptic();
      return false;
    }

    if (status.length === 0) {
      setError(strings.validation.statusRequired);
      void warningHaptic();
      return false;
    }

    return true;
  }

  const autoSaveWorkingDraft = useCallback(
    async (showFeedback: boolean): Promise<void> => {
      const cleanStationId = stationId.trim();
      const currentNotes = notesRef.current.trim();
      const currentStatus = statusRef.current;

      if (!cleanStationId || (currentNotes.length === 0 && currentStatus.length === 0)) {
        return;
      }

      const signature = JSON.stringify({ notes: currentNotes, status: currentStatus });

      if (signature === lastAutoSavedSignature.current) {
        return;
      }

      try {
        await upsertWorkingDraft({ notes: currentNotes, stationId: cleanStationId, status: currentStatus });
        lastAutoSavedSignature.current = signature;

        if (showFeedback) {
          showToast(strings.report.autoSaved, 'info');
        }
      } catch {
        showToast(strings.errors.unexpected, 'error');
        await errorHaptic();
      }
    },
    [showToast, stationId, strings.errors.unexpected, strings.report.autoSaved],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      void autoSaveWorkingDraft(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoSaveWorkingDraft]);

  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus): void {
      if (nextState === 'background' || nextState === 'inactive') {
        void autoSaveWorkingDraft(false);
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [autoSaveWorkingDraft]);

  async function saveReportDraft(): Promise<void> {
    if (!validateDraft()) {
      return;
    }

    setIsSaving(true);

    try {
      await upsertWorkingDraft({ notes: notes.trim(), stationId: stationId.trim(), status });
      lastAutoSavedSignature.current = JSON.stringify({ notes: notes.trim(), status });
      showToast(strings.report.draftSaved, 'success');
      await successHaptic();
    } catch {
      setError(strings.errors.unexpected);
      showToast(strings.errors.unexpected, 'error');
      await errorHaptic();
    } finally {
      setIsSaving(false);
    }
  }

  async function submitReport(): Promise<void> {
    if (!validateSubmit()) {
      return;
    }

    setIsSaving(true);

    try {
      const queuedReport = await saveSubmittedReport({
        notes: notes.trim(),
        stationId: stationId.trim(),
        stationLabel: station?.label,
        status,
      });

      await clearWorkingDraft(stationId.trim());
      await syncDraft(queuedReport.id);
      showToast(strings.report.queued, 'success');
      await successHaptic();
      setNotes('');
      setStatus([]);
      router.push('/(tabs)/history');
    } catch {
      setError(strings.errors.unexpected);
      showToast(strings.errors.unexpected, 'error');
      await errorHaptic();
    } finally {
      setIsSaving(false);
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
            <BrandHeader subtitle={strings.report.subtitle} />

            {stationLoading ? (
              <SyncBanner body={stationId} title={strings.report.stationLoading} tone="info" />
            ) : station ? (
              <StationSummary station={station} />
            ) : (
              <SyncBanner body={stationError ?? stationId} title={strings.report.stationUnavailable} tone="danger" />
            )}

            {station?.isActive === false ? (
              <SyncBanner body={strings.report.inactiveStationHint} title={strings.report.stationInactive} tone="danger" />
            ) : null}

            <Card>
              <View style={styles.sectionHeader}>
                <ThemedText type="title">{strings.report.statusTitle}</ThemedText>
                <ThemedText selectable type="small" themeColor="textSecondary">
                  {strings.report.stationLabel} {stationId || '-'}
                </ThemedText>
              </View>
              <View style={[styles.statusGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                {StatusOptions.map((option) => (
                  <SecondaryButton key={option.value} selected={status.includes(option.value)} onPress={() => toggleStatus(option.value)}>
                    {statusOptionLabels[option.value]}
                  </SecondaryButton>
                ))}
              </View>
              {status.length > 0 ? (
                <View style={styles.selectedStatuses}>
                  {status.map((item) => (
                    <StatusBadge key={item} status={item} />
                  ))}
                </View>
              ) : null}
            </Card>

            <Card>
              <InputField
                label={strings.report.notesLabel}
                multiline
                onChangeText={setNotes}
                placeholder={strings.report.notesPlaceholder}
                style={styles.notes}
                value={notes}
              />

              {error ? <ThemedText selectable style={{ color: theme.danger }}>{error}</ThemedText> : null}

              <View style={[styles.actions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <SecondaryButton disabled={isSaving} onPress={() => void saveReportDraft()}>
                  {strings.report.saveOffline}
                </SecondaryButton>
                <PrimaryButton disabled={isSaving} loading={isSaving} onPress={() => void submitReport()}>
                  {isSaving ? strings.actions.saving : strings.report.submit}
                </PrimaryButton>
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.two,
  },
  keyboardView: {
    flex: 1,
  },
  notes: {
    minHeight: 132,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  sectionHeader: {
    gap: Spacing.one,
  },
  selectedStatuses: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statusGrid: {
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
