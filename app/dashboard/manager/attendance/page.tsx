import type { Metadata } from "next";
import { AttendanceAdminView } from "@/components/attendance/attendance-admin-view";
import { requireRole } from "@/lib/auth/server-session";

interface ManagerAttendancePageProps {
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

export default async function ManagerAttendancePage({ searchParams }: ManagerAttendancePageProps) {
  await requireRole(["manager"]);

  return (
    <AttendanceAdminView
      basePath="/dashboard/manager/attendance"
      role="manager"
      searchParams={await searchParams}
      title="الحضور والانصراف"
    />
  );
}
