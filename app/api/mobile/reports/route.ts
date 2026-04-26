import { NextRequest, NextResponse } from "next/server";
import { mobileApiErrorResponse } from "@/lib/api/mobile";
import { requireBearerRole } from "@/lib/auth/bearer-session";
import { REPORTS_COL } from "@/lib/collections";
import { adminDb } from "@/lib/firebase-admin";
import type { FirestoreTimestamp, Report, StatusOption } from "@/types";

export const runtime = "nodejs";

interface MobileReportResponse {
  clientReportId?: string;
  notes?: string;
  reportId: string;
  reviewNotes?: string;
  reviewStatus: Report["reviewStatus"];
  stationId: string;
  stationLabel: string;
  status: StatusOption[];
  submittedAt?: string;
}

function timestampToIso(value: unknown): string | undefined {
  const timestamp = value as Partial<FirestoreTimestamp>;

  if (typeof timestamp?.toDate !== "function") {
    return undefined;
  }

  return timestamp.toDate().toISOString();
}

function timestampToMillis(value: unknown): number {
  const timestamp = value as Partial<FirestoreTimestamp>;

  if (typeof timestamp?.toDate !== "function") {
    return 0;
  }

  return timestamp.toDate().getTime();
}

function reportResponse(reportId: string, data: Partial<Report>): MobileReportResponse {
  return {
    reportId: data.reportId ?? reportId,
    stationId: data.stationId ?? "",
    stationLabel: data.stationLabel ?? "محطة بدون اسم",
    status: (data.status ?? []) as StatusOption[],
    reviewStatus: data.reviewStatus ?? "pending",
    ...(data.clientReportId ? { clientReportId: data.clientReportId } : {}),
    ...(data.notes ? { notes: data.notes } : {}),
    ...(data.reviewNotes ? { reviewNotes: data.reviewNotes } : {}),
    ...(timestampToIso(data.submittedAt) ? { submittedAt: timestampToIso(data.submittedAt) } : {}),
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<MobileReportResponse[] | { code: string; message: string }>> {
  try {
    const session = await requireBearerRole(request, ["technician", "manager"]);
    const snapshot = await adminDb().collection(REPORTS_COL).where("technicianUid", "==", session.uid).get();
    const reports = snapshot.docs
      .map((doc) => ({ id: doc.id, data: doc.data() as Partial<Report> }))
      .sort((first, second) => timestampToMillis(second.data.submittedAt) - timestampToMillis(first.data.submittedAt))
      .slice(0, 50)
      .map((entry) => reportResponse(entry.id, entry.data));

    return NextResponse.json(reports);
  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}
