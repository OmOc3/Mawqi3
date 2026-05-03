import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientStationAccessForm } from "@/components/client-orders/client-station-access-form";
import { ClientVisibilityAdminPanel } from "@/components/client-visibility/client-visibility-admin-panel";
import { DashboardShell } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/server-session";
import { getClientAccountDetail, listStations } from "@/lib/db/repositories";

export const metadata: Metadata = {
  title: "ملف العميل - المشرف",
};

interface SupervisorClientDetailPageProps {
  params: Promise<{
    clientUid: string;
  }>;
}

export default async function SupervisorClientDetailPage({ params }: SupervisorClientDetailPageProps) {
  const { clientUid } = await params;
  await requireRole(["supervisor", "manager"]);
  const [detail, stations] = await Promise.all([getClientAccountDetail(clientUid), listStations()]);

  if (!detail) {
    notFound();
  }

  return (
    <DashboardShell role="supervisor">
      <PageHeader
        backHref="/dashboard/supervisor/client-orders"
        description="إدارة ما يظهر للعميل: ملفات التحليلات، المحطات المعتمدة، ومناطق QR الخاصة بالمهام اليومية."
        title={`ملف ${detail.client.displayName}`}
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">{detail.client.displayName}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]" dir="ltr">{detail.client.email}</p>
          </div>
          <StatusBadge tone={detail.client.isActive ? "active" : "inactive"}>{detail.client.isActive ? "نشط" : "غير نشط"}</StatusBadge>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside>
          <ClientStationAccessForm
            assignedStationIds={detail.access.map((access) => access.stationId)}
            clientUid={detail.client.uid}
            stations={stations.map((station) => ({
              label: station.label,
              location: station.location,
              stationId: station.stationId,
            }))}
          />
        </aside>
        <ClientVisibilityAdminPanel
          access={detail.access}
          analysisDocuments={detail.analysisDocuments}
          clientUid={detail.client.uid}
          serviceAreas={detail.serviceAreas}
        />
      </div>
    </DashboardShell>
  );
}
