import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '@/lib/sync/api-client';
import { StatusOptions } from '@/lib/sync/status-options';
import type { StatusOption } from '@/lib/sync/types';

export type ReportSyncStatus = 'draft' | 'queued' | 'submitted';

export interface DraftReport {
  createdAt: string;
  id: string;
  notes: string;
  stationId: string;
  submittedAt?: string;
  syncStatus?: ReportSyncStatus;
  synced?: boolean;
  retryCount?: number;
  lastSyncedAt?: string;
  lastError?: string;
  status: StatusOption[];
}

const key = 'mawqi3-report-drafts';
const maxStoredReports = 50;

function isReportSyncStatus(value: unknown): value is ReportSyncStatus {
  return value === 'draft' || value === 'queued' || value === 'submitted';
}

function isDraftReport(value: unknown): value is DraftReport {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const draft = value as Record<string, unknown>;

  return (
    typeof draft.id === 'string' &&
    typeof draft.createdAt === 'string' &&
    typeof draft.stationId === 'string' &&
    typeof draft.notes === 'string' &&
    (draft.submittedAt === undefined || typeof draft.submittedAt === 'string') &&
    (draft.synced === undefined || typeof draft.synced === 'boolean') &&
    (draft.retryCount === undefined || typeof draft.retryCount === 'number') &&
    (draft.lastSyncedAt === undefined || typeof draft.lastSyncedAt === 'string') &&
    (draft.lastError === undefined || typeof draft.lastError === 'string') &&
    (draft.syncStatus === undefined || isReportSyncStatus(draft.syncStatus)) &&
    Array.isArray(draft.status) &&
    draft.status.every((item) => typeof item === 'string' && StatusOptions.some((option) => option.value === item))
  );
}

function sortReportsByNewest(reports: DraftReport[]): DraftReport[] {
  return [...reports].sort((first, second) => {
    const firstDate = first.submittedAt ?? first.createdAt;
    const secondDate = second.submittedAt ?? second.createdAt;

    return new Date(secondDate).getTime() - new Date(firstDate).getTime();
  });
}

async function getStoredReports(): Promise<DraftReport[]> {
  const raw = await AsyncStorage.getItem(key);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed) ? sortReportsByNewest(parsed.filter(isDraftReport)) : [];
  } catch {
    return [];
  }
}

async function setStoredReports(reports: DraftReport[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(sortReportsByNewest(reports).slice(0, maxStoredReports)));
}

export async function getDrafts(): Promise<DraftReport[]> {
  const reports = await getStoredReports();

  return reports.filter((report) => report.syncStatus !== 'submitted');
}

export async function getSubmittedReports(): Promise<DraftReport[]> {
  const reports = await getStoredReports();

  return reports.filter((report) => report.syncStatus === 'submitted');
}

export async function saveDraft(draft: Omit<DraftReport, 'createdAt' | 'id'>): Promise<DraftReport> {
  const reports = await getStoredReports();
  const savedDraft: DraftReport = {
    ...draft,
    createdAt: new Date().toISOString(),
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    syncStatus: draft.syncStatus ?? 'draft',
    synced: draft.synced ?? false,
    retryCount: draft.retryCount ?? 0,
  };

  await setStoredReports([savedDraft, ...reports]);

  return savedDraft;
}

export async function saveSubmittedReport(
  report: Omit<DraftReport, 'createdAt' | 'id' | 'submittedAt' | 'syncStatus'>,
): Promise<DraftReport> {
  const reports = await getStoredReports();
  const timestamp = new Date().toISOString();
  const submittedReport: DraftReport = {
    ...report,
    createdAt: timestamp,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    submittedAt: timestamp,
    syncStatus: 'submitted',
    synced: true,
    retryCount: report.retryCount ?? 0,
    lastSyncedAt: timestamp,
  };

  await setStoredReports([submittedReport, ...reports]);

  return submittedReport;
}

export async function deleteDraft(id: string): Promise<void> {
  const reports = await getStoredReports();

  await setStoredReports(reports.filter((draft) => draft.id !== id));
}

export async function syncDraft(draftId: string): Promise<void> {
  const reports = await getStoredReports();
  const target = reports.find((draft) => draft.id === draftId);

  if (!target) {
    return;
  }

  try {
    await apiPost('/api/mobile/reports/sync', target);
    await setStoredReports(
      reports.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              lastError: undefined,
              lastSyncedAt: new Date().toISOString(),
              retryCount: draft.retryCount ?? 0,
              synced: true,
              syncStatus: 'submitted',
            }
          : draft,
      ),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'تعذر مزامنة المسودة الآن.';

    await setStoredReports(
      reports.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              lastError: message,
              retryCount: (draft.retryCount ?? 0) + 1,
              synced: false,
              syncStatus: 'queued',
            }
          : draft,
      ),
    );
  }
}
