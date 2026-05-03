import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/layout/page-header";
import { StationForm } from "@/components/stations/station-form";
import { requireRole } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "إنشاء محطة - المشرف",
};

export default async function SupervisorNewStationPage() {
  await requireRole(["supervisor", "manager"]);

  return (
    <DashboardShell role="supervisor">
      <PageHeader
        backHref="/dashboard/supervisor/stations"
        description="إنشاء محطة جديدة من لوحة المشرف. التعطيل والحذف يظلان للمدير فقط."
        title="إنشاء محطة"
      />
      <StationForm mode="create" />
    </DashboardShell>
  );
}
