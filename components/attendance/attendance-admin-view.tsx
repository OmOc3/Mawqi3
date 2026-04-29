import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAppUsers,
  listAttendanceSessionsForAdmin,
  listClientAttendanceSites,
  listStations,
  type AttendanceFilters,
} from "@/lib/db/repositories";
import type { AppTimestamp, AttendanceSession } from "@/types";

interface AttendanceAdminViewProps {
  basePath: string;
  role: "manager" | "supervisor";
  searchParams: {
    clientUid?: string;
    dateFrom?: string;
    dateTo?: string;
    stationId?: string;
    technicianUid?: string;
  };
  title: string;
}

function parseDate(value: string | undefined, endOfDay = false): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function formatTimestamp(timestamp?: AppTimestamp): string {
  if (!timestamp) {
    return "غير متاح";
  }

  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(timestamp.toDate());
}

function formatDuration(session: AttendanceSession): string {
  if (!session.clockOutAt) {
    return "قيد العمل";
  }

  const minutes = Math.max(
    0,
    Math.round((session.clockOutAt.toDate().getTime() - session.clockInAt.toDate().getTime()) / 60000),
  );
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  return hours > 0 ? `${hours} س ${restMinutes} د` : `${restMinutes} د`;
}

function buildExportHref(filters: AttendanceFilters): string {
  const params = new URLSearchParams();

  if (filters.clientUid) params.set("clientUid", filters.clientUid);
  if (filters.stationId) params.set("stationId", filters.stationId);
  if (filters.technicianUid) params.set("technicianUid", filters.technicianUid);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom.toISOString().slice(0, 10));
  if (filters.dateTo) params.set("dateTo", filters.dateTo.toISOString().slice(0, 10));

  return `/api/attendance/export${params.size > 0 ? `?${params.toString()}` : ""}`;
}

export async function AttendanceAdminView({ basePath, role, searchParams, title }: AttendanceAdminViewProps) {
  const filters: AttendanceFilters = {
    clientUid: searchParams.clientUid ?? "",
    stationId: searchParams.stationId ?? "",
    technicianUid: searchParams.technicianUid ?? "",
    dateFrom: parseDate(searchParams.dateFrom),
    dateTo: parseDate(searchParams.dateTo, true),
  };
  const [sessions, users, clients, stations] = await Promise.all([
    listAttendanceSessionsForAdmin(filters, 500),
    listAppUsers(),
    listClientAttendanceSites(),
    listStations(),
  ]);
  const technicians = users.filter((user) => user.role === "technician");
  const openSessions = sessions.filter((session) => !session.clockOutAt);

  return (
    <DashboardShell role={role}>
        <PageHeader
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-all duration-150 hover:bg-[var(--primary-hover)]"
              href={buildExportHref(filters)}
            >
              تصدير CSV
            </Link>
          }
          description="متابعة حضور الفنيين داخل مواقع العملاء، مع إظهار أقرب محطة والمسافة المسجلة من GPS."
          title={title}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
            <p className="text-sm text-[var(--muted)]">إجمالي السجلات</p>
            <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{sessions.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
            <p className="text-sm text-[var(--muted)]">حضور مفتوح</p>
            <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{openSessions.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
            <p className="text-sm text-[var(--muted)]">مواقع عمل مفعلة</p>
            <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{clients.length}</p>
          </div>
        </div>

        <form action={basePath} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card sm:grid-cols-2 sm:p-6 xl:grid-cols-5">
          <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
            <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="attendance-technician">
              الفني
            </label>
            <select id="attendance-technician" className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" defaultValue={filters.technicianUid} name="technicianUid">
              <option value="">كل الفنيين</option>
              {technicians.map((technician) => (
                <option key={technician.uid} value={technician.uid}>
                  {technician.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="attendance-client">
              العميل
            </label>
            <select id="attendance-client" className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" defaultValue={filters.clientUid} name="clientUid">
              <option value="">كل العملاء</option>
              {clients.map((client) => (
                <option key={client.clientUid} value={client.clientUid}>
                  {client.clientName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="attendance-station">
              المحطة
            </label>
            <select id="attendance-station" className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" defaultValue={filters.stationId} name="stationId">
              <option value="">كل المحطات</option>
              {stations.map((station) => (
                <option key={station.stationId} value={station.stationId}>
                  {station.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="attendance-date-from">
              من تاريخ
            </label>
            <input id="attendance-date-from" className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" defaultValue={searchParams.dateFrom ?? ""} name="dateFrom" type="date" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="attendance-date-to">
              إلى تاريخ
            </label>
            <div className="flex gap-3">
              <input id="attendance-date-to" className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" defaultValue={searchParams.dateTo ?? ""} name="dateTo" type="date" />
              <button className="min-h-11 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]" type="submit">
                تطبيق
              </button>
            </div>
          </div>
        </form>

        <div className="-mx-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card sm:mx-0">
          <table className="w-full min-w-[820px] lg:min-w-[980px]">
            <thead className="bg-[var(--surface-subtle)]">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">الفني</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">الحضور</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">الانصراف</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">المدة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">الموقع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">المسافة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {sessions.map((session) => (
                <tr className="align-top hover:bg-[var(--surface-subtle)]" key={session.attendanceId}>
                  <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">{session.technicianName}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">{formatTimestamp(session.clockInAt)}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">
                    {session.clockOutAt ? formatTimestamp(session.clockOutAt) : <StatusBadge tone="pending">قيد العمل</StatusBadge>}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)]">{formatDuration(session)}</td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                    {session.clockInLocation
                      ? `${session.clockInLocation.clientName ?? "عميل"} - ${session.clockInLocation.stationLabel}`
                      : "غير متاح"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">
                    {session.clockInLocation ? `${Math.round(session.clockInLocation.distanceMeters)} م` : "غير متاح"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">{session.notes ?? "لا توجد"}</td>
                </tr>
              ))}
              {sessions.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-[var(--muted)]" colSpan={7}>
                    لا توجد سجلات حضور مطابقة.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
    </DashboardShell>
  );
}
