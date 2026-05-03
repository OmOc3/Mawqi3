import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/server-session";
import { listStations } from "@/lib/db/repositories";
import type { Coordinates, Station } from "@/types";

export const metadata: Metadata = {
  title: "إحداثيات المحطات",
};

function hasCoordinates(station: Station): station is Station & { coordinates: Coordinates } {
  return Boolean(station.coordinates);
}

function externalMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

export default async function ManagerStationsCoordinatesPage() {
  await requireRole(["manager"]);
  const stations = await listStations();
  const locatedStations = stations.filter(hasCoordinates);
  const missingCoordinates = stations.filter((station) => !station.coordinates);

  return (
    <DashboardShell role="manager">
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-control transition-colors hover:bg-[var(--surface-subtle)]"
              href="/dashboard/manager/stations"
            >
              قائمة المحطات
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-control transition-colors hover:bg-[var(--primary-hover)]"
              href="/dashboard/manager/stations/new"
            >
              إضافة محطة
            </Link>
          </div>
        }
        backHref="/dashboard/manager/stations"
        description="عرض إحداثيات GPS للمحطات وفتح الموقع في تطبيق خرائط خارجي عند الحاجة."
        title="إحداثيات المحطات"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-control">
          <p className="text-sm font-medium text-[var(--muted)]">إجمالي المحطات</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">{stations.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-control">
          <p className="text-sm font-medium text-[var(--muted)]">لديها إحداثيات</p>
          <p className="mt-1 text-3xl font-extrabold text-teal-700">{locatedStations.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-control">
          <p className="text-sm font-medium text-[var(--muted)]">بدون إحداثيات</p>
          <p className="mt-1 text-3xl font-extrabold text-amber-700">{missingCoordinates.length}</p>
        </div>
      </div>

      {locatedStations.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-control">
          <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
            <h2 className="text-base font-bold text-[var(--foreground)]">المحطات ذات الإحداثيات</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">انقر «فتح في خرائط Google» للعرض في المتصفح أو التطبيق.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-[var(--surface-subtle)]">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    رقم المحطة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    الاسم
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    خط العرض / الطول
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    إجراء
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {locatedStations.map((station) => (
                  <tr className="hover:bg-[var(--surface-subtle)]" key={station.stationId}>
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]" dir="ltr">
                      #{station.stationId}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{station.label}</td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]" dir="ltr">
                      {station.coordinates.lat.toFixed(6)}, {station.coordinates.lng.toFixed(6)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <a
                          className="text-sm font-semibold text-teal-700 transition-colors hover:text-teal-600 hover:underline"
                          href={externalMapsUrl(station.coordinates.lat, station.coordinates.lng)}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          فتح في خرائط Google
                        </a>
                        <Link
                          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] hover:underline"
                          href={`/dashboard/manager/stations/${station.stationId}`}
                        >
                          التفاصيل
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-control">
          <EmptyState
            action={
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
                href="/dashboard/manager/stations/new"
              >
                إضافة إحداثيات لمحطة
              </Link>
            }
            description="أضف خط العرض والطول من نموذج المحطة حتى تظهر هنا ويمكن فتحها في خرائط Google."
            title="لا توجد محطات بإحداثيات محفوظة"
          />
        </div>
      )}

      {missingCoordinates.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-control">
          <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
            <h2 className="text-base font-bold text-[var(--foreground)]">محطات تحتاج تحديد إحداثيات</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-[var(--surface-subtle)]">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    رقم المحطة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    اسم المحطة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    الموقع
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    الإجراء
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {missingCoordinates.slice(0, 25).map((station) => (
                  <tr className="hover:bg-[var(--surface-subtle)]" key={station.stationId}>
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]" dir="ltr">
                      #{station.stationId}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{station.label}</td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">{station.location}</td>
                    <td className="px-4 py-3">
                      <Link
                        className="text-sm font-semibold text-teal-700 transition-colors hover:text-teal-600 hover:underline"
                        href={`/dashboard/manager/stations/${station.stationId}/edit`}
                      >
                        تحديد الإحداثيات
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
