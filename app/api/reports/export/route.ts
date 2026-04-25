import { type DocumentData, type Query } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/server-session";
import { REPORTS_COL, STATIONS_COL } from "@/lib/collections";
import { adminDb } from "@/lib/firebase-admin";
import { statusOptionLabels } from "@/lib/i18n";
import type { Report, Station, StatusOption } from "@/types";

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

function reportFromData(reportId: string, data: Partial<Report>): Report {
  return {
    reportId: data.reportId ?? reportId,
    stationId: data.stationId ?? "",
    stationLabel: data.stationLabel ?? "محطة بدون اسم",
    technicianUid: data.technicianUid ?? "",
    technicianName: data.technicianName ?? "فني غير محدد",
    status: (data.status ?? []) as StatusOption[],
    notes: data.notes,
    submittedAt: data.submittedAt as Report["submittedAt"],
    reviewStatus: data.reviewStatus ?? "pending",
    editedAt: data.editedAt,
    editedBy: data.editedBy,
    reviewedAt: data.reviewedAt,
    reviewedBy: data.reviewedBy,
    reviewNotes: data.reviewNotes,
  };
}

function csvCell(value: string | number): string {
  const text = String(value);

  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

async function getStationLocations(stationIds: string[]): Promise<Map<string, string>> {
  const uniqueStationIds = Array.from(new Set(stationIds.filter(Boolean)));
  const entries = await Promise.all(
    uniqueStationIds.map(async (stationId) => {
      const snapshot = await adminDb().collection(STATIONS_COL).doc(stationId).get();
      const station = snapshot.exists ? (snapshot.data() as Partial<Station>) : null;

      return [stationId, station?.location ?? ""] as const;
    }),
  );

  return new Map(entries);
}

export async function GET(request: NextRequest): Promise<Response> {
  await requireRole(["manager", "supervisor"]);

  const params = request.nextUrl.searchParams;
  const dateFrom = parseDate(params.get("from") ?? params.get("dateFrom"));
  const dateTo = parseDate(params.get("to") ?? params.get("dateTo"), true);
  let query: Query<DocumentData> = adminDb().collection(REPORTS_COL);

  if (params.get("stationId")) {
    query = query.where("stationId", "==", params.get("stationId"));
  }

  if (params.get("technicianUid")) {
    query = query.where("technicianUid", "==", params.get("technicianUid"));
  }

  if (params.get("reviewStatus")) {
    query = query.where("reviewStatus", "==", params.get("reviewStatus"));
  }

  if (dateFrom) {
    query = query.where("submittedAt", ">=", dateFrom);
  }

  if (dateTo) {
    query = query.where("submittedAt", "<=", dateTo);
  }

  const snapshot = await query.orderBy("submittedAt", "desc").get();
  const reports = snapshot.docs.map((doc) => reportFromData(doc.id, doc.data() as Partial<Report>));
  const stationLocations = await getStationLocations(reports.map((report) => report.stationId));
  const header = ["رقم التقرير", "المحطة", "الموقع", "الفني", "الحالة", "ملاحظات", "التاريخ", "وقت الإرسال"];
  const rows = reports.map((report) => {
    const submittedAt = report.submittedAt?.toDate();
    const status = report.status.map((item) => statusOptionLabels[item]).join(" | ");

    return [
      report.reportId,
      report.stationLabel,
      stationLocations.get(report.stationId) ?? "",
      report.technicianName,
      status,
      report.notes ?? "",
      submittedAt ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(submittedAt) : "",
      submittedAt ? new Intl.DateTimeFormat("ar-EG", { timeStyle: "short" }).format(submittedAt) : "",
    ];
  });
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const filenameDate = new Intl.DateTimeFormat("en-CA").format(new Date());

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Disposition": `attachment; filename="reports-${filenameDate}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
