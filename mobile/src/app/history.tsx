import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader, Card, ScreenShell } from '@/components/mawqi3-ui';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { StatusOptions } from '@/constants/status-options';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/hooks/use-theme';
import { getSubmittedReports, type DraftReport } from '@/lib/drafts';
import { languageDateLocales } from '@/lib/i18n';
import type { StatusOption } from '@/lib/sync/types';

interface ReportGroup {
  dateKey: string;
  label: string;
  reports: DraftReport[];
}

function getReportDate(report: DraftReport): Date {
  return new Date(report.submittedAt ?? report.createdAt);
}

function getDateKey(report: DraftReport): string {
  const reportDate = getReportDate(report);

  if (Number.isNaN(reportDate.getTime())) {
    return report.id;
  }

  return reportDate.toISOString().slice(0, 10);
}

function groupReportsByDate(reports: DraftReport[], locale: string): ReportGroup[] {
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
  const groups = new Map<string, DraftReport[]>();

  reports.forEach((report) => {
    const dateKey = getDateKey(report);
    groups.set(dateKey, [...(groups.get(dateKey) ?? []), report]);
  });

  return [...groups.entries()]
    .map(([dateKey, groupReports]) => ({
      dateKey,
      label: formatter.format(getReportDate(groupReports[0])),
      reports: groupReports,
    }))
    .sort((first, second) => second.dateKey.localeCompare(first.dateKey));
}

function isStatusOption(value: string): value is StatusOption {
  return StatusOptions.some((option) => option.value === value);
}

export default function HistoryScreen() {
  const [reports, setReports] = useState<DraftReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isRtl, language, statusOptionLabels, strings } = useLanguage();
  const theme = useTheme();
  const locale = languageDateLocales[language];
  const timeFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { timeStyle: 'short' }), [locale]);
  const groups = useMemo(() => groupReportsByDate(reports, locale), [reports, locale]);
  const statusSeparator = isRtl ? '، ' : ', ';

  const refreshReports = useCallback(async () => {
    setIsLoading(true);

    try {
      setReports(await getSubmittedReports());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshReports();
    }, [refreshReports]),
  );

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BrandHeader subtitle={strings.history.subtitle} />

          <Card>
            <ThemedText type="title">{strings.history.title}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {isLoading ? strings.actions.loading : `${reports.length} ${strings.history.submittedReports}`}
            </ThemedText>
          </Card>

          {!isLoading && groups.length === 0 ? (
            <Card style={styles.emptyCard}>
              <ThemedText style={[styles.emptyArt, { color: theme.primary }]}>◌</ThemedText>
              <ThemedText type="smallBold">{strings.history.emptyTitle}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {strings.history.emptyBody}
              </ThemedText>
            </Card>
          ) : null}

          {groups.map((group) => (
            <View key={group.dateKey} style={styles.group}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {group.label}
              </ThemedText>

              {group.reports.map((report) => (
                <Card key={report.id}>
                  <View style={[styles.reportHeader, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <ThemedText type="smallBold">
                      {strings.report.stationLabel} {report.stationId}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {timeFormatter.format(getReportDate(report))}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {report.status.map((item) => (isStatusOption(item) ? statusOptionLabels[item] : item)).join(statusSeparator)}
                  </ThemedText>
                  {report.notes ? <ThemedText>{report.notes}</ThemedText> : null}
                  <View style={[styles.syncBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="smallBold" style={{ color: theme.primary }}>
                      {strings.report.submitted}
                    </ThemedText>
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  emptyArt: {
    fontSize: 56,
    fontWeight: 800,
    lineHeight: 64,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
  },
  group: {
    gap: Spacing.two,
  },
  reportHeader: {
    alignItems: 'center',
    gap: Spacing.two,
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
  syncBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
