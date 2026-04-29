import Image from "next/image";
import { DashboardShell } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listDailyWorkReports } from "@/lib/db/repositories";
import type { AppTimestamp, DailyWorkReport } from "@/types";

interface DailyReportsAdminViewProps {
  role: "manager" | "supervisor";
  title: string;
}

function formatTimestamp(timestamp?: AppTimestamp): string {
  if (!timestamp) {
    return "غير متاح";
  }

  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(timestamp.toDate());
}

function DailyReportCard({ report }: { report: DailyWorkReport }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-teal-700">{formatTimestamp(report.reportDate)}</p>
          <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">{report.technicianName}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="inactive">{report.stationLabels.length} محطة</StatusBadge>
          <StatusBadge tone={report.photos?.length ? "active" : "inactive"}>{report.photos?.length ?? 0} صورة</StatusBadge>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">{report.summary}</p>
      {report.notes ? <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{report.notes}</p> : null}
      {report.stationLabels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {report.stationLabels.map((label) => (
            <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]" key={label}>
              {label}
            </span>
          ))}
        </div>
      ) : null}
      {report.photos && report.photos.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {report.photos.map((photo) => (
            <a className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]" href={photo.url} key={photo.photoId} rel="noreferrer" target="_blank">
              <Image
                alt="صورة التقرير اليومي"
                className="h-28 w-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
                height={112}
                src={photo.url}
                unoptimized
                width={220}
              />
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export async function DailyReportsAdminView({ role, title }: DailyReportsAdminViewProps) {
  const reports = await listDailyWorkReports({}, 300);

  return (
    <DashboardShell role={role}>
        <PageHeader
          description="استعراض التقارير اليومية التي يرفعها الفنيون، مع الصور والمحطات المرتبطة بكل يوم عمل."
          title={title}
        />

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)] shadow-card">
            لا توجد تقارير يومية حتى الآن.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <DailyReportCard key={report.dailyReportId} report={report} />
            ))}
          </div>
        )}
    </DashboardShell>
  );
}
