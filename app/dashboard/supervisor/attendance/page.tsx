import type { Metadata } from "next";
import { AttendanceAdminView } from "@/components/attendance/attendance-admin-view";
import { requireRole } from "@/lib/auth/server-session";

interface SupervisorAttendancePageProps {
  searchParams: Promise<{
    clientUid?: string;
    dateFrom?: string;
    dateTo?: string;
    stationId?: string;
    technicianUid?: string;
  }>;
}

export const metadata: Metadata = {
  title: "الحضور والانصراف",
};

export default async function SupervisorAttendancePage({ searchParams }: SupervisorAttendancePageProps) {
  await requireRole(["supervisor", "manager"]);

  return (
    <AttendanceAdminView
      basePath="/dashboard/supervisor/attendance"
      role="supervisor"
      searchParams={await searchParams}
      title="الحضور والانصراف"
    />
  );
}
