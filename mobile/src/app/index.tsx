import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BrandHeader,
  Card,
  PrimaryButton,
  ScreenShell,
  SecondaryButton,
  StatTile,
  SyncIndicator,
} from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing, WebBaseUrl } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useSyncActions, useSyncStatus } from '@/lib/sync/report-sync';
import { getApiBaseUrl } from '@/lib/sync/api-client';
import { languageDateLocales } from '@/lib/i18n';

export default function HomeScreen() {
  const { language, strings } = useLanguage();
  const { isSyncing, lastSyncedAt, pendingCount } = useSyncStatus();
  const { syncAllDrafts } = useSyncActions();
  const locale = languageDateLocales[language];
  const [webAppUrl, setWebAppUrl] = useState(WebBaseUrl);

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

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BrandHeader subtitle={strings.home.brandSubtitle} />

          <Card>
            <View style={styles.syncHeader}>
              <ThemedText type="smallBold">{strings.home.syncTitle}</ThemedText>
              <SyncIndicator status={isSyncing ? 'syncing' : pendingCount === 0 ? 'synced' : 'pending'} />
            </View>
            <ThemedText themeColor="textSecondary">
              {pendingCount === 0
                ? strings.offline.syncOnline
                : `${pendingCount} ${strings.history.draftReports}`}
            </ThemedText>
            {lastSyncedAt ? (
              <ThemedText type="small" themeColor="textSecondary">
                {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastSyncedAt))}
              </ThemedText>
            ) : null}
            <SecondaryButton loading={isSyncing} onPress={() => void syncAllDrafts()}>
              {strings.actions.syncNow}
            </SecondaryButton>
          </Card>

          <Card>
            <ThemedText type="title">{strings.home.title}</ThemedText>
            <ThemedText themeColor="textSecondary">{strings.home.subtitle}</ThemedText>
            <PrimaryButton onPress={() => router.push('/scan')}>{strings.actions.openScan}</PrimaryButton>
          </Card>

          <View style={styles.statsRow}>
            <StatTile label={strings.home.routeLabel} value={strings.home.routeReady} />
            <StatTile label={strings.home.reviewLabel} value={strings.home.reviewReady} />
          </View>

          <Card>
            <ThemedText type="smallBold">{strings.home.shortcutsTitle}</ThemedText>
            <View style={styles.actions}>
              <SecondaryButton onPress={() => Linking.openURL(`${webAppUrl}/scan`)}>
                {strings.actions.openScan}
              </SecondaryButton>
              <SecondaryButton onPress={() => router.push('/drafts')}>{strings.home.draftsCta}</SecondaryButton>
            </View>
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
  syncHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
