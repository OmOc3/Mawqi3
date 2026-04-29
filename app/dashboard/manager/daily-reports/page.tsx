import type { Metadata } from "next";
import { DailyReportsAdminView } from "@/components/daily-reports/daily-reports-admin-view";
import { requireRole } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "التقارير اليومية",
};

export default async function ManagerDailyReportsPage() {
  await requireRole(["manager"]);

  return <DailyReportsAdminView role="manager" title="التقارير اليومية" />;
}
