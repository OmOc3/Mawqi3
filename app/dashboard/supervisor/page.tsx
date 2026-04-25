import type { Metadata } from "next";
import Link from "next/link";
import { DashboardNav } from "@/components/layout/nav";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/server-session";
import { REPORTS_COL, STATIONS_COL } from "@/lib/collections";
import { adminDb } from "@/lib/firebase-admin";
import { i18n } from "@/lib/i18n";

export const metadata: Metadata = {
  title: i18n.dashboard.supervisorTitle,
};

interface StatCardProps {
  href: string;
  label: string;
  value: number;
}

function StatCard({ href, label, value }: StatCardProps) {
  return (
    <Link className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50" href={href}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
    </Link>
  );
}

export default async function SupervisorDashboardPage() {
  await requireRole(["supervisor", "manager"]);
  const startOfToday = new Date();

  startOfToday.setHours(0, 0, 0, 0);

  const [reportsSnapshot, reportsTodaySnapshot, pendingReportsSnapshot, activeStationsSnapshot] = await Promise.all([
    adminDb().collection(REPORTS_COL).get(),
    adminDb().collection(REPORTS_COL).where("submittedAt", ">=", startOfToday).get(),
    adminDb().collection(REPORTS_COL).where("reviewStatus", "==", "pending").get(),
    adminDb().collection(STATIONS_COL).where("isActive", "==", true).get(),
  ]);

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6 text-right sm:px-6 lg:px-8" dir="rtl">
      <section className="mx-auto max-w-7xl">
        <PageHeader
          action={
            <Link
              className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
              href="/dashboard/supervisor/reports"
            >
              عرض التقارير
            </Link>
          }
          description="متابعة التقارير اليومية وحالات المراجعة للمحطات النشطة."
          title={i18n.dashboard.supervisorTitle}
        />
        <DashboardNav role="supervisor" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard href="/dashboard/supervisor/reports" label="إجمالي التقارير" value={reportsSnapshot.size} />
          <StatCard
            href="/dashboard/supervisor/reports"
            label="تقارير اليوم"
            value={reportsTodaySnapshot.size}
          />
          <StatCard
            href="/dashboard/supervisor/reports?reviewStatus=pending"
            label="بانتظار المراجعة"
            value={pendingReportsSnapshot.size}
          />
          <StatCard
            href="/dashboard/supervisor/reports"
            label="المحطات النشطة"
            value={activeStationsSnapshot.size}
          />
        </div>
      </section>
    </main>
  );
}
