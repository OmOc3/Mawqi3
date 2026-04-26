import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader, Card, PrimaryButton, ScreenShell, SecondaryButton } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { StatusOptions } from '@/constants/status-options';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/hooks/use-theme';
import { saveDraft, saveSubmittedReport } from '@/lib/drafts';
import type { StatusOption } from '@/lib/sync/types';

type StatusValue = StatusOption;

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
  const [status, setStatus] = useState<StatusValue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { direction, isRtl, statusOptionLabels, strings } = useLanguage();
  const theme = useTheme();

  function toggleStatus(value: StatusValue): void {
    setStatus((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function validateForm(): boolean {
    if (!stationId.trim()) {
      setError(strings.validation.stationIdRequired);
      return false;
    }

    if (status.length === 0) {
      setError(strings.validation.statusRequired);
      return false;
    }

    if (notes.length > 500) {
      setError(strings.validation.notesTooLong);
      return false;
    }

    setError(null);
    return true;
  }

  async function saveReportDraft(): Promise<void> {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      await saveDraft({ notes: notes.trim(), stationId: stationId.trim(), status });
      setMessage(strings.report.queued);
      setNotes('');
      setStatus([]);
    } catch {
      setError(strings.errors.unexpected);
    } finally {
      setIsSaving(false);
    }
  }

  async function submitReport(): Promise<void> {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      await saveSubmittedReport({ notes: notes.trim(), stationId: stationId.trim(), status });
      setMessage(strings.report.submitted);
      setNotes('');
      setStatus([]);
      router.push('/history');
    } catch {
      setError(strings.errors.unexpected);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <BrandHeader subtitle={strings.report.subtitle} />

            <Card>
              <ThemedText type="title">{strings.report.title}</ThemedText>
              <View style={[styles.stationBadge, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  {strings.report.stationLabel} {stationId || '-'}
                </ThemedText>
              </View>
            </Card>

            <Card>
              <ThemedText type="smallBold">{strings.report.statusTitle}</ThemedText>
              <View style={[styles.statusGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                {StatusOptions.map((option) => (
                  <SecondaryButton key={option.value} selected={status.includes(option.value)} onPress={() => toggleStatus(option.value)}>
                    {statusOptionLabels[option.value]}
                  </SecondaryButton>
                ))}
              </View>
            </Card>

            <Card>
              <ThemedText type="smallBold">{strings.report.notesLabel}</ThemedText>
              <TextInput
                multiline
                onChangeText={setNotes}
                placeholder={strings.report.notesPlaceholder}
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.notes,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                    textAlign: isRtl ? 'right' : 'left',
                    writingDirection: direction,
                  },
                ]}
                textAlignVertical="top"
                value={notes}
              />

              {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
              {message ? <ThemedText style={{ color: theme.success }}>{message}</ThemedText> : null}

              <View style={[styles.actions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <SecondaryButton disabled={isSaving} onPress={() => void saveReportDraft()}>
                  {strings.report.saveOffline}
                </SecondaryButton>
                <PrimaryButton disabled={isSaving} onPress={() => void submitReport()}>
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
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 132,
    padding: Spacing.three,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  stationBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  statusGrid: {
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
