import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server-session";
import { getStationLocations, listReports } from "@/lib/db/repositories";
import { pestTypeLabels } from "@/lib/i18n";
import {
  csvRow,
  defaultExportDateFrom,
  REPORT_EXPORT_MAX_ROWS,
  statusLabelsForCsv,
} from "@/lib/reports/export";
import { formatDateRome, formatIsoDateRome, formatTimeRome } from "@/lib/datetime";
import type { Report } from "@/types";

export const runtime = "nodejs";

function parseDate(value: string | null, endOfDay = false): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export async function GET(request: NextRequest): Promise<Response> {
  await requireRole(["manager", "supervisor"]);

  const params = request.nextUrl.searchParams;
  const dateFrom = parseDate(params.get("from") ?? params.get("dateFrom")) ?? defaultExportDateFrom();
  const dateTo = parseDate(params.get("to") ?? params.get("dateTo"), true);
  const reviewStatus = params.get("reviewStatus");
  const reports = await listReports({
    filters: {
      stationId: params.get("stationId") ?? undefined,
      technicianUid: params.get("technicianUid") ?? undefined,
      reviewStatus:
        reviewStatus === "pending" || reviewStatus === "reviewed" || reviewStatus === "rejected"
          ? reviewStatus
          : "",
      dateFrom,
      dateTo,
    },
    limit: REPORT_EXPORT_MAX_ROWS + 1,
  });

  if (reports.length > REPORT_EXPORT_MAX_ROWS) {
    return NextResponse.json(
      {
        message: `نتيجة التصدير أكبر من الحد الآمن (${REPORT_EXPORT_MAX_ROWS} صف). ضيّق نطاق التاريخ أو الفلاتر ثم حاول مرة أخرى.`,
        code: "EXPORT_TOO_LARGE",
      },
      { status: 400 },
    );
  }

  const stationLocations = await getStationLocations(reports.map((report) => report.stationId));

  function pestLabelsForCsv(types: Report["pestTypes"]): string {
    if (!types?.length) {
      return "";
    }

    return types.map((p) => pestTypeLabels[p]).join("؛ ");
  }

  function reviewStatusArabic(status: Report["reviewStatus"]): string {
    return (
      {
        pending: "بانتظار المراجعة",
        reviewed: "موافق",
        rejected: "مرفوض",
      } as const
    )[status];
  }

  const header = [
    "رقم التقرير",
    "المحطة",
    "الموقع",
    "أنواع الآفات",
    "الفني",
    "الحالة",
    "ملاحظات",
    "حالة المراجعة",
    "التاريخ",
    "وقت الإرسال",
  ];
  const rows = reports.map((report) => {
    const submittedAt = report.submittedAt?.toDate();
    const locationText = report.stationLocation ?? stationLocations.get(report.stationId) ?? "";

    return [
      report.reportId,
      report.stationLabel,
      locationText,
      pestLabelsForCsv(report.pestTypes),
      report.technicianName,
      statusLabelsForCsv(report.status),
      report.notes ?? "",
      reviewStatusArabic(report.reviewStatus),
      submittedAt ? formatDateRome(submittedAt, { locale: "ar-EG" }) : "",
      submittedAt ? formatTimeRome(submittedAt, { locale: "ar-EG" }) : "",
    ];
  });
  const csv = [header, ...rows].map(csvRow).join("\n");
  const filenameDate = formatIsoDateRome(new Date()) ?? new Intl.DateTimeFormat("en-CA").format(new Date());

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Disposition": `attachment; filename="reports-${filenameDate}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
