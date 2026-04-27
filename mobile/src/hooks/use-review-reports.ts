import { useCallback, useEffect, useState } from 'react';

import { apiGet } from '@/lib/sync/api-client';
import type { MobileReviewReport, Report } from '@/lib/sync/types';

type ReviewStatusFilter = Report['reviewStatus'] | 'all';

interface ReviewReportsState {
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  reports: MobileReviewReport[];
}

interface ReviewReportsMessages {
  genericLoadError: string;
}

function reportTime(report: MobileReviewReport): number {
  if (!report.submittedAt) {
    return 0;
  }

  const value = new Date(report.submittedAt).getTime();

  return Number.isNaN(value) ? 0 : value;
}

function reviewReportsPath(status: ReviewStatusFilter): string {
  if (status === 'all') {
    return '/api/mobile/reports/review';
  }

  return `/api/mobile/reports/review?reviewStatus=${encodeURIComponent(status)}`;
}

export function useReviewReports(
  messages: ReviewReportsMessages,
  status: ReviewStatusFilter = 'all',
): ReviewReportsState {
  const [reports, setReports] = useState<MobileReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async (shouldUpdate: () => boolean = () => true): Promise<void> => {
    if (shouldUpdate()) {
      setLoading(true);
    }

    try {
      const nextReports = await apiGet<MobileReviewReport[]>(reviewReportsPath(status), {
        authRequiredMessage: messages.genericLoadError,
        fallbackErrorMessage: messages.genericLoadError,
        networkErrorMessage: messages.genericLoadError,
      });

      if (shouldUpdate()) {
        setReports([...nextReports].sort((first, second) => reportTime(second) - reportTime(first)));
        setError(null);
      }
    } catch (loadError: unknown) {
      if (shouldUpdate()) {
        setReports([]);
        setError(loadError instanceof Error ? loadError.message : messages.genericLoadError);
      }
    } finally {
      if (shouldUpdate()) {
        setLoading(false);
      }
    }
  }, [messages.genericLoadError, status]);

  const refresh = useCallback(async (): Promise<void> => {
    await loadReports();
  }, [loadReports]);

  useEffect(() => {
    let isMounted = true;

    async function loadIfMounted(): Promise<void> {
      await loadReports(() => isMounted);
    }

    void loadIfMounted();
    const interval = setInterval(() => {
      if (isMounted) {
        void loadReports(() => isMounted);
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadReports]);

  return { error, loading, refresh, reports };
}
