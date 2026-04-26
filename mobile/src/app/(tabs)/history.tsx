import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader, Card, EmptyState, ReportCard, ScreenShell, SyncBanner } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useMyReports } from '@/hooks/use-reports';
import { getSubmittedReports, type DraftReport } from '@/lib/drafts';

function reportTime(value?: string): number {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

export default function HistoryScreen() {
  const [localReports, setLocalReports] = useState<DraftReport[]>([]);
  const { strings } = useLanguage();
  const remoteReports = useMyReports();

  const refreshLocalReports = useCallback(async () => {
    setLocalReports(await getSubmittedReports());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshLocalReports();
    }, [refreshLocalReports]),
  );

  const visibleLocalReports = useMemo(() => {
    const remoteIds = new Set(remoteReports.reports.flatMap((report) => [report.reportId, report.clientReportId].filter(Boolean)));

    return localReports.filter((report) => {
      if (report.serverReportId && remoteIds.has(report.serverReportId)) {
        return false;
      }

      return !remoteIds.has(report.id);
    });
  }, [localReports, remoteReports.reports]);
  const hasReports = remoteReports.reports.length > 0 || visibleLocalReports.length > 0;

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
          <BrandHeader subtitle={strings.history.subtitle} />

          <Card>
            <ThemedText type="title">{strings.history.title}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {remoteReports.loading ? strings.actions.loading : `${remoteReports.reports.length + visibleLocalReports.length} ${strings.history.submittedReports}`}
            </ThemedText>
          </Card>

          {remoteReports.error ? <SyncBanner body={remoteReports.error} title={strings.report.stationUnavailable} tone="warning" /> : null}

          {!remoteReports.loading && !hasReports ? (
            <Card>
              <EmptyState subtitle={strings.history.emptyBody} title={strings.history.emptyTitle} />
            </Card>
          ) : null}

          {[...remoteReports.reports]
            .sort((first, second) => reportTime(second.submittedAt) - reportTime(first.submittedAt))
            .map((report) => (
              <ReportCard
                createdAt={report.submittedAt}
                key={report.reportId}
                notes={report.notes ?? report.reviewNotes}
                reviewStatus={report.reviewStatus}
                stationId={report.stationId}
                stationLabel={report.stationLabel}
                status={report.status}
              />
            ))}

          {visibleLocalReports.map((report) => (
            <ReportCard
              createdAt={report.submittedAt ?? report.createdAt}
              key={report.id}
              notes={report.notes}
              stationId={report.stationId}
              stationLabel={report.stationLabel}
              status={report.status}
              syncStatus={report.syncStatus}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
});
