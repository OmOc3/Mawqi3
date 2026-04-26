import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader, Card, PrimaryButton, ScreenShell, SecondaryButton, StatTile, SyncBanner } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { getDrafts, getSyncQueueReports } from '@/lib/drafts';
import { useCurrentUser } from '@/lib/auth';
import { useSyncActions, useSyncStatus } from '@/lib/sync/report-sync';

export default function HomeScreen() {
  const { strings } = useLanguage();
  const currentUser = useCurrentUser();
  const { isSyncing, lastSyncedAt, pendingCount } = useSyncStatus();
  const { syncAllDrafts } = useSyncActions();
  const [draftCount, setDraftCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);

  const refreshLocalCounts = useCallback(async () => {
    const [drafts, queue] = await Promise.all([getDrafts(), getSyncQueueReports()]);

    setDraftCount(drafts.length);
    setQueueCount(queue.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshLocalCounts();
    }, [refreshLocalCounts]),
  );

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
          <BrandHeader subtitle={strings.home.brandSubtitle} />

          <Card>
            <ThemedText type="subtitle">{strings.home.title}</ThemedText>
            <ThemedText themeColor="textSecondary">{strings.home.subtitle}</ThemedText>
            {currentUser ? (
              <ThemedText selectable type="small" themeColor="textSecondary">
                {currentUser.profile.displayName}
              </ThemedText>
            ) : null}
            <PrimaryButton onPress={() => router.push('/(tabs)/scan')}>{strings.actions.openScan}</PrimaryButton>
          </Card>

          <SyncBanner
            actionLabel={pendingCount > 0 || queueCount > 0 ? strings.actions.syncNow : undefined}
            body={
              pendingCount === 0 && queueCount === 0
                ? strings.offline.syncOnline
                : `${pendingCount || queueCount} ${strings.history.draftReports}`
            }
            loading={isSyncing}
            onAction={() => void syncAllDrafts().then(refreshLocalCounts)}
            title={strings.home.syncTitle}
            tone={pendingCount === 0 && queueCount === 0 ? 'success' : 'warning'}
          />

          <View style={styles.statsRow}>
            <StatTile label={strings.tabs.drafts} value={String(draftCount)} />
            <StatTile label={strings.tabs.history} value={String(queueCount)} trend={queueCount > 0 ? 'down' : 'up'} />
          </View>

          <Card>
            <ThemedText type="smallBold">{strings.home.shortcutsTitle}</ThemedText>
            <View style={styles.actions}>
              <SecondaryButton onPress={() => router.push('/(tabs)/drafts')}>{strings.home.draftsCta}</SecondaryButton>
              <SecondaryButton onPress={() => router.push('/(tabs)/history')}>{strings.tabs.history}</SecondaryButton>
            </View>
            {lastSyncedAt ? (
              <ThemedText selectable type="small" themeColor="textSecondary">
                {lastSyncedAt}
              </ThemedText>
            ) : null}
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
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.two,
  },
});
