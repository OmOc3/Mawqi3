"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server-session";
import { REPORTS_COL, STATIONS_COL } from "@/lib/collections";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { reviewReportSchema, submitReportSchema } from "@/lib/validation/reports";
import { writeAuditLog } from "@/lib/audit";
import type { Report, ReportPhotoPaths, Station } from "@/types";

export interface SubmitReportActionResult {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  reportId?: string;
  success?: boolean;
}

export interface ReviewReportActionResult {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function optionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function stringArray(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

function optionalImageFile(formData: FormData, key: string): File | undefined {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return undefined;
  }

  return value;
}

function validateImageFile(file: File): string | null {
  const maxSizeBytes = 5 * 1024 * 1024;

  if (!file.type.startsWith("image/")) {
    return "ارفع صورة فقط بصيغة مدعومة.";
  }

  if (file.size > maxSizeBytes) {
    return "حجم الصورة يجب ألا يتجاوز 5 ميجابايت.";
  }

  return null;
}

function extensionFromType(file: File): string {
  const extension = file.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "").toLowerCase();

  return extension ? `.${extension}` : "";
}

async function uploadReportPhoto(reportId: string, kind: keyof ReportPhotoPaths, file: File): Promise<string> {
  const path = `reports/${reportId}/${kind}${extensionFromType(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await adminStorage().bucket().file(path).save(buffer, {
    contentType: file.type,
    metadata: {
      metadata: {
        originalName: file.name,
      },
    },
  });

  return path;
}

export async function submitStationReportAction(
  stationId: string,
  formData: FormData,
): Promise<SubmitReportActionResult> {
  const session = await requireRole(["technician", "manager"]);
  const parsed = submitReportSchema.safeParse({
    stationId,
    status: stringArray(formData, "status"),
    notes: optionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      error: "تحقق من بيانات التقرير وحاول مرة أخرى.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const stationRef = adminDb().collection(STATIONS_COL).doc(parsed.data.stationId);
  const stationSnapshot = await stationRef.get();

  if (!stationSnapshot.exists) {
    return { error: "المحطة غير موجودة" };
  }

  const station = stationSnapshot.data() as Partial<Station>;

  if (!station.isActive) {
    return { error: "هذه المحطة غير نشطة" };
  }

  const reportRef = adminDb().collection(REPORTS_COL).doc();
  const beforePhoto = optionalImageFile(formData, "beforePhoto");
  const afterPhoto = optionalImageFile(formData, "afterPhoto");
  const photoValidationError =
    (beforePhoto ? validateImageFile(beforePhoto) : null) ?? (afterPhoto ? validateImageFile(afterPhoto) : null);

  if (photoValidationError) {
    return { error: photoValidationError };
  }

  const [beforePhotoPath, afterPhotoPath] = await Promise.all([
    beforePhoto ? uploadReportPhoto(reportRef.id, "before", beforePhoto) : Promise.resolve(undefined),
    afterPhoto ? uploadReportPhoto(reportRef.id, "after", afterPhoto) : Promise.resolve(undefined),
  ]);
  const photoPaths: ReportPhotoPaths = {
    ...(beforePhotoPath ? { before: beforePhotoPath } : {}),
    ...(afterPhotoPath ? { after: afterPhotoPath } : {}),
  };

  await adminDb().runTransaction(async (tx) => {
    tx.set(reportRef, {
      reportId: reportRef.id,
      stationId: parsed.data.stationId,
      stationLabel: station.label ?? "محطة بدون اسم",
      technicianUid: session.uid,
      technicianName: session.user.displayName,
      status: parsed.data.status,
      ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
      ...(Object.keys(photoPaths).length > 0 ? { photoPaths } : {}),
      submittedAt: FieldValue.serverTimestamp(),
      reviewStatus: "pending",
    });
    tx.update(stationRef, {
      lastVisitedAt: FieldValue.serverTimestamp(),
      totalReports: FieldValue.increment(1),
    });
  });

  await writeAuditLog({
    actorUid: session.uid,
    actorRole: session.role,
    action: "report.submit",
    entityType: "report",
    entityId: reportRef.id,
    metadata: {
      stationId: parsed.data.stationId,
      status: parsed.data.status,
      hasPhotos: Object.keys(photoPaths).length > 0,
    },
  });

  return {
    success: true,
    reportId: reportRef.id,
  };
}

export async function addReviewReportAction(
  reportId: string,
  formData: FormData,
): Promise<ReviewReportActionResult> {
  const session = await requireRole(["manager", "supervisor"]);
  const parsed = reviewReportSchema.safeParse({
    reviewStatus: optionalString(formData, "reviewStatus"),
    reviewNotes: optionalString(formData, "reviewNotes"),
  });

  if (!parsed.success) {
    return {
      error: "تحقق من بيانات المراجعة وحاول مرة أخرى.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const reportRef = adminDb().collection(REPORTS_COL).doc(reportId);
  const reportSnapshot = await reportRef.get();

  if (!reportSnapshot.exists) {
    return { error: "التقرير غير موجود." };
  }

  const report = reportSnapshot.data() as Partial<Report>;

  await reportRef.update({
    reviewStatus: parsed.data.reviewStatus,
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy: session.uid,
    reviewNotes: parsed.data.reviewNotes ?? FieldValue.delete(),
  });

  await writeAuditLog({
    actorUid: session.uid,
    actorRole: session.role,
    action: "report.review",
    entityType: "report",
    entityId: reportId,
    metadata: {
      stationId: report.stationId,
      reviewStatus: parsed.data.reviewStatus,
    },
  });

  revalidatePath("/dashboard/manager/reports");
  revalidatePath("/dashboard/supervisor/reports");

  return { success: true };
}
