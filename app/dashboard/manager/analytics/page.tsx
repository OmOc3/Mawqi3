import type { Metadata } from "next";
import { DashboardNav } from "@/components/layout/nav";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPills } from "@/components/reports/status-pills";
import { requireRole } from "@/lib/auth/server-session";
import { REPORTS_COL, STATIONS_COL } from "@/lib/collections";
import { adminDb } from "@/lib/firebase-admin";
import type { Report, Station, StatusOption } from "@/types";

export const metadata: Metadata = {
  title: "التحليلات",
};

interface ZoneStats {
  activeStations: number;
  reports: number;
  stations: number;
  zone: string;
}

interface TechnicianStats {
  pending: number;
  reports: number;
  technicianName: string;
  technicianUid: string;
}

function stationFromData(stationId: string, data: Partial<Station>): Station {
  return {
    stationId: data.stationId ?? stationId,
    label: data.label ?? "محطة بدون اسم",
    location: data.location ?? "غير محدد",
    zone: data.zone,
    coordinates: data.coordinates,
    qrCodeValue: data.qrCodeValue ?? "",
    isActive: data.isActive ?? false,
    createdAt: data.createdAt as Station["createdAt"],
    createdBy: data.createdBy ?? "",
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy,
    lastVisitedAt: data.lastVisitedAt,
    totalReports: data.totalReports ?? 0,
  };
}

function reportFromData(reportId: string, data: Partial<Report>): Report {
  return {
    reportId: data.reportId ?? reportId,
    stationId: data.stationId ?? "",
    stationLabel: data.stationLabel ?? "محطة بدون اسم",
    technicianUid: data.technicianUid ?? "",
    technicianName: data.technicianName ?? "فني غير محدد",
    status: (data.status ?? []) as StatusOption[],
    notes: data.notes,
    photoPaths: data.photoPaths,
    submittedAt: data.submittedAt as Report["submittedAt"],
    reviewStatus: data.reviewStatus ?? "pending",
    editedAt: data.editedAt,
    editedBy: data.editedBy,
    reviewedAt: data.reviewedAt,
    reviewedBy: data.reviewedBy,
    reviewNotes: data.reviewNotes,
  };
}

function buildZoneStats(stations: Station[], reports: Report[]): ZoneStats[] {
  const stationZoneById = new Map(stations.map((station) => [station.stationId, station.zone ?? "غير محدد"]));
  const statsByZone = new Map<string, ZoneStats>();

  stations.forEach((station) => {
    const zone = station.zone ?? "غير محدد";
    const current = statsByZone.get(zone) ?? {
      activeStations: 0,
      reports: 0,
      stations: 0,
      zone,
    };

    current.stations += 1;
    current.activeStations += station.isActive ? 1 : 0;
    statsByZone.set(zone, current);
  });

  reports.forEach((report) => {
    const zone = stationZoneById.get(report.stationId) ?? "غير محدد";
    const current = statsByZone.get(zone) ?? {
      activeStations: 0,
      reports: 0,
      stations: 0,
      zone,
    };

    current.reports += 1;
    statsByZone.set(zone, current);
  });

  return Array.from(statsByZone.values()).sort((a, b) => b.reports - a.reports);
}

function buildTechnicianStats(reports: Report[]): TechnicianStats[] {
  const statsByTechnician = new Map<string, TechnicianStats>();

  reports.forEach((report) => {
    const key = report.technicianUid || report.technicianName;
    const current = statsByTechnician.get(key) ?? {
      pending: 0,
      reports: 0,
      technicianName: report.technicianName,
      technicianUid: report.technicianUid,
    };

    current.reports += 1;
    current.pending += report.reviewStatus === "pending" ? 1 : 0;
    statsByTechnician.set(key, current);
  });

  return Array.from(statsByTechnician.values()).sort((a, b) => b.reports - a.reports).slice(0, 10);
}

function statusCounts(reports: Report[]): Array<{ count: number; status: StatusOption }> {
  const counts = new Map<StatusOption, number>();

  reports.forEach((report) => {
    report.status.forEach((status) => {
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([status, count]) => ({ count, status }))
    .sort((a, b) => b.count - a.count);
}

export default async function ManagerAnalyticsPage() {
  await requireRole(["manager"]);
  const [stationsSnapshot, reportsSnapshot] = await Promise.all([
    adminDb().collection(STATIONS_COL).get(),
    adminDb().collection(REPORTS_COL).get(),
  ]);
  const stations = stationsSnapshot.docs.map((doc) => stationFromData(doc.id, doc.data() as Partial<Station>));
  const reports = reportsSnapshot.docs.map((doc) => reportFromData(doc.id, doc.data() as Partial<Report>));
  const zones = buildZoneStats(stations, reports);
  const technicians = buildTechnicianStats(reports);
  const statusSummary = statusCounts(reports);

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6 text-right sm:px-6 lg:px-8" dir="rtl">
      <section className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          backHref="/dashboard/manager"
          description="ملخصات تشغيلية حسب المنطقة والفني وحالات الفحص."
          title="التحليلات"
        />
        <DashboardNav role="manager" />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-800">الأداء حسب المنطقة</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      المنطقة
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      المحطات
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      النشطة
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      التقارير
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones.map((zone) => (
                    <tr className="hover:bg-slate-50" key={zone.zone}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{zone.zone}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{zone.stations}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{zone.activeStations}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{zone.reports}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-800">أداء الفنيين</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      الفني
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      التقارير
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      بانتظار المراجعة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {technicians.map((technician) => (
                    <tr className="hover:bg-slate-50" key={technician.technicianUid || technician.technicianName}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{technician.technicianName}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{technician.reports}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{technician.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-800">أكثر حالات الفحص تكرارًا</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statusSummary.map((item) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.status}>
                <StatusPills status={[item.status]} />
                <p className="mt-3 text-3xl font-bold text-slate-900">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
