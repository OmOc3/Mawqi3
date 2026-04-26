import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { writeAuditLog } from "@/lib/audit";
import { REPORTS_COL, STATIONS_COL } from "@/lib/collections";
import { AppError } from "@/lib/errors";
import { adminDb } from "@/lib/firebase-admin";
import type { ReportPhotoPaths, StatusOption, UserRole } from "@/types";

interface SubmitReportInput {
  actorRole: UserRole;
  actorUid: string;
  clientReportId?: string;
  notes?: string;
  photoPaths?: ReportPhotoPaths;
  reportId?: string;
  stationId: string;
  status: StatusOption[];
  technicianName: string;
}

interface SubmitReportResult {
  duplicate: boolean;
  reportId: string;
  stationLabel: string;
}

function idempotentReportId(actorUid: string, clientReportId: string): string {
  const digest = createHash("sha256").update(`${actorUid}:${clientReportId}`).digest("hex").slice(0, 40);

  return `mobile_${digest}`;
}

export async function submitReportWithAdmin(input: SubmitReportInput): Promise<SubmitReportResult> {
  const stationRef = adminDb().collection(STATIONS_COL).doc(input.stationId);
  const reportDocId = input.clientReportId ? idempotentReportId(input.actorUid, input.clientReportId) : input.reportId;
  const reportsRef = adminDb().collection(REPORTS_COL);
  const reportRef = reportDocId ? reportsRef.doc(reportDocId) : reportsRef.doc();
  let stationLabel = "محطة بدون اسم";
  let duplicate = false;

  await adminDb().runTransaction(async (tx) => {
    const existingReportSnapshot = await tx.get(reportRef);

    if (existingReportSnapshot.exists) {
      const existingReport = existingReportSnapshot.data();
      stationLabel = typeof existingReport?.stationLabel === "string" ? existingReport.stationLabel : stationLabel;
      duplicate = true;
      return;
    }

    const stationSnapshot = await tx.get(stationRef);

    if (!stationSnapshot.exists) {
      throw new AppError("المحطة غير موجودة.", "STATION_NOT_FOUND", 404);
    }

    const station = stationSnapshot.data();

    if (station?.isActive !== true) {
      throw new AppError("هذه المحطة غير نشطة.", "STATION_INACTIVE", 409);
    }

    stationLabel = typeof station?.label === "string" && station.label.trim().length > 0 ? station.label : stationLabel;

    tx.set(reportRef, {
      reportId: reportRef.id,
      stationId: input.stationId,
      stationLabel,
      technicianUid: input.actorUid,
      technicianName: input.technicianName,
      status: input.status,
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.clientReportId ? { clientReportId: input.clientReportId } : {}),
      ...(input.photoPaths && Object.keys(input.photoPaths).length > 0 ? { photoPaths: input.photoPaths } : {}),
      submittedAt: FieldValue.serverTimestamp(),
      reviewStatus: "pending",
    });
    tx.update(stationRef, {
      lastVisitedAt: FieldValue.serverTimestamp(),
      totalReports: FieldValue.increment(1),
    });
  });

  if (!duplicate) {
    await writeAuditLog({
      actorUid: input.actorUid,
      actorRole: input.actorRole,
      action: "report.submit",
      entityType: "report",
      entityId: reportRef.id,
      metadata: {
        stationId: input.stationId,
        status: input.status,
        hasPhotos: Boolean(input.photoPaths && Object.keys(input.photoPaths).length > 0),
        source: input.clientReportId ? "mobile" : "web",
      },
    });
  }

  return {
    duplicate,
    reportId: reportRef.id,
    stationLabel,
  };
}
