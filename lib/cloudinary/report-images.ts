import "server-only";

import { createHash } from "node:crypto";
import { AppError } from "@/lib/errors";
import { validateReportImageFile } from "@/lib/reports/image-validation";
import { isRecord } from "@/lib/utils";
import { rewriteCloudinaryUrl } from "@/lib/cloudinary/utils";

interface CloudinaryConfig {
  apiKey: string;
  apiSecret: string;
  cloudName: string;
  folder: string;
}

function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return {
    apiKey,
    apiSecret,
    cloudName,
    folder: process.env.CLOUDINARY_REPORT_FOLDER?.trim() || "ecopest/reports",
  };
}

function signUploadParams(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.entries(params)
    .filter(([, value]) => value.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

function isCloudinaryUploadResponse(value: unknown): value is { secure_url: string } {
  return isRecord(value) && typeof value.secure_url === "string";
}

function safePublicIdPart(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 80) || "report";
}

export async function uploadReportImageToCloudinary(
  file: File,
  stationId: string,
  clientReportId: string,
): Promise<string> {
  const config = getCloudinaryConfig();

  if (!config) {
    throw new AppError(
      "إعدادات Cloudinary غير مكتملة. أضف CLOUDINARY_CLOUD_NAME و CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET.",
      "CLOUDINARY_CONFIG_MISSING",
      500,
    );
  }

  let image: Awaited<ReturnType<typeof validateReportImageFile>>;

  try {
    image = await validateReportImageFile(file);
  } catch (error: unknown) {
    throw new AppError(error instanceof Error ? error.message : "الصورة المرفقة غير صالحة.", "REPORT_IMAGE_INVALID", 400);
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = `${safePublicIdPart(stationId)}-${safePublicIdPart(clientReportId)}-${crypto.randomUUID()}`;
  const params = {
    folder: config.folder,
    public_id: publicId,
    timestamp,
  };
  const bytes = new Uint8Array(image.buffer.byteLength);
  const body = new FormData();

  bytes.set(image.buffer);
  body.set("api_key", config.apiKey);
  body.set("folder", params.folder);
  body.set("public_id", params.public_id);
  body.set("timestamp", params.timestamp);
  body.set("signature", signUploadParams(params, config.apiSecret));
  body.set("file", new Blob([bytes.buffer], { type: image.contentType }), `report.${image.extension}`);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const payload = (await response.json().catch(() => undefined)) as unknown;

  if (!response.ok || !isCloudinaryUploadResponse(payload)) {
    throw new AppError("تعذر رفع صورة التقرير إلى Cloudinary.", "REPORT_IMAGE_UPLOAD_FAILED", 502);
  }

  return rewriteCloudinaryUrl(payload.secure_url, config.cloudName);
}
