import type { Metadata } from "next";
import { DailyReportsAdminView } from "@/components/daily-reports/daily-reports-admin-view";
import { requireRole } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "التقارير اليومية",
};

export default async function SupervisorDailyReportsPage() {
  await requireRole(["supervisor", "manager"]);

  return <DailyReportsAdminView role="supervisor" title="التقارير اليومية" />;
}
