// Technician report history hook for mobile screens.
import { useEffect, useState } from 'react';

import type { Report } from '@/lib/sync/types';
import { apiGet } from '@/lib/sync/api-client';

interface ReportsState {
  error: string | null;
  loading: boolean;
  reports: Report[];
}

export function useMyReports(technicianId: string): ReportsState {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReports(): Promise<void> {
      if (!technicianId) {
        if (isMounted) {
          setReports([]);
          setLoading(false);
          setError(null);
        }

        return;
      }

      setLoading(true);

      try {
        const nextReports = await apiGet<Report[]>(`/api/mobile/reports?technicianId=${encodeURIComponent(technicianId)}`);

        if (isMounted) {
          setReports([...nextReports].sort((first, second) => second.submittedAt.seconds - first.submittedAt.seconds));
          setError(null);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setReports([]);
          setError(error instanceof Error ? error.message : 'تعذر تحميل التقارير.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    const interval = setInterval(() => {
      void loadReports();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [technicianId]);

  return { error, loading, reports };
}
