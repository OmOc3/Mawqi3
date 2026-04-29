"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server-session";
import { uploadReportImageToCloudinary } from "@/lib/cloudinary/report-images";
import { createDailyWorkReport } from "@/lib/db/repositories";
import { createDailyWorkReportSchema } from "@/lib/validation/daily-reports";

export interface DailyWorkReportActionResult {
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
  return formData.getAll(key).filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function imageFiles(formData: FormData): File[] {
  return formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0).slice(0, 8);
}

function parseReportDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("تاريخ التقرير غير صالح.");
  }

  date.setHours(12, 0, 0, 0);
  return date;
}

export async function createDailyWorkReportAction(formData: FormData): Promise<DailyWorkReportActionResult> {
  const session = await requireRole(["technician", "manager"]);
  const parsed = createDailyWorkReportSchema.safeParse({
    notes: optionalString(formData, "notes"),
    reportDate: formData.get("reportDate"),
    stationIds: stringArray(formData, "stationIds"),
    summary: optionalString(formData, "summary"),
  });

  if (!parsed.success) {
    return {
      error: "تحقق من بيانات التقرير اليومي.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const reportId = crypto.randomUUID();
    const photos = await Promise.all(
      imageFiles(formData).map((file, index) =>
        uploadReportImageToCloudinary(file, "daily-work", `${reportId}-${index + 1}`),
      ),
    );

    await createDailyWorkReport({
      actorRole: session.role,
      notes: parsed.data.notes,
      photos,
      reportDate: parseReportDate(parsed.data.reportDate),
      stationIds: parsed.data.stationIds,
      summary: parsed.data.summary,
      technicianName: session.user.displayName,
      technicianUid: session.uid,
    });

    revalidatePath("/scan");
    revalidatePath("/dashboard/manager/daily-reports");
    revalidatePath("/dashboard/supervisor/daily-reports");
    revalidatePath("/client/portal");
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "تعذر حفظ التقرير اليومي." };
  }
}
