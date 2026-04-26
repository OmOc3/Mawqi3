import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { BrandHeader, Card, PrimaryButton, ScreenShell, SecondaryButton } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { StatusOptions } from '@/constants/status-options';
import { useLanguage } from '@/contexts/language-context';
import { deleteDraft, getDrafts, saveDraft, type DraftReport } from '@/lib/drafts';
import { useTheme } from '@/hooks/use-theme';
import type { StatusOption } from '@/lib/sync/types';

export default function DraftsScreen() {
  const [drafts, setDrafts] = useState<DraftReport[]>([]);
  const [notes, setNotes] = useState('');
  const [stationId, setStationId] = useState('');
  const [status, setStatus] = useState<StatusOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const { language, strings } = useLanguage();
  const t = strings.drafts;
  const statusLabelKey: 'labelArabic' | 'labelEnglish' = language === 'ar' ? 'labelArabic' : 'labelEnglish';
  const statusLabelByValue = useMemo<ReadonlyMap<string, string>>(
    () => new Map(StatusOptions.map((option) => [option.value, option[statusLabelKey]])),
    [statusLabelKey],
  );

  const refreshDrafts = useCallback(async () => {
    setDrafts(await getDrafts());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshDrafts();
    }, [refreshDrafts]),
  );

  async function createDraft() {
    const cleanStationId = stationId.trim();

    if (!cleanStationId) {
      setError(strings.validation.stationIdRequired);
      return;
    }

    if (status.length === 0) {
      setError(strings.validation.statusRequired);
      return;
    }

    await saveDraft({ notes: notes.trim(), stationId: cleanStationId, status });
    setError(null);
    setNotes('');
    setStationId('');
    setStatus([]);
    await refreshDrafts();
  }

  async function removeDraft(id: string) {
    await deleteDraft(id);
    await refreshDrafts();
  }

  function toggleStatus(value: StatusOption) {
    setStatus((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BrandHeader subtitle={t.subtitle} />

          <Card>
            <ThemedText type="title">{t.title}</ThemedText>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setStationId}
              placeholder={t.stationPlaceholder}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              value={stationId}
            />
            <View style={styles.statusGrid}>
              {StatusOptions.map((option) => (
                <SecondaryButton key={option.value} selected={status.includes(option.value)} onPress={() => toggleStatus(option.value)}>
                  {option[statusLabelKey]}
                </SecondaryButton>
              ))}
            </View>
            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder={t.notesPlaceholder}
              placeholderTextColor={theme.textSecondary}
              style={[styles.notes, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              textAlignVertical="top"
              value={notes}
            />
            {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
            <PrimaryButton onPress={createDraft}>{strings.actions.saveDraft}</PrimaryButton>
          </Card>

          {drafts.map((draft) => (
            <Card key={draft.id}>
              <ThemedText type="smallBold">
                {strings.report.stationLabel} {draft.stationId}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t.savedAt}:{' '}
                {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(draft.createdAt))}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {draft.status.map((item) => statusLabelByValue.get(item) ?? item).join('، ')}
              </ThemedText>
              {draft.notes ? <ThemedText>{draft.notes}</ThemedText> : null}
              <View style={styles.actions}>
                <SecondaryButton
                  onPress={() => router.push({ pathname: '/report/[stationId]', params: { stationId: draft.stationId } })}>
                  {t.openReport}
                </SecondaryButton>
                <SecondaryButton onPress={() => removeDraft(draft.id)}>{t.deleteDraft}</SecondaryButton>
              </View>
            </Card>
          ))}
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
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    textAlign: 'left',
  },
  notes: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 96,
    padding: Spacing.three,
    textAlign: 'right',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  statusGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
