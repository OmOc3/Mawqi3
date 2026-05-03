import type { Metadata } from "next";
import { AreaTasksDashboard } from "@/components/area-tasks/area-tasks-dashboard";
import { requireRole } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "المهام اليومية للمناطق - المشرف",
};

export default async function SupervisorAreaTasksPage() {
  await requireRole(["supervisor", "manager"]);

  return <AreaTasksDashboard role="supervisor" />;
}
