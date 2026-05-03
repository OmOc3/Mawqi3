import type { ReportPhotoPaths } from "@/types";

export function rewriteCloudinaryUrl(url: string, _cloudName: string): string {
  return url;
}

export function normalizeCloudinaryDeliveryUrl(url: string, cloudName = process.env.CLOUDINARY_CLOUD_NAME): string {
  const resolvedCloudName = cloudName?.trim();

  if (!resolvedCloudName) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "api.ecopest.com" ||
      !parsedUrl.pathname.startsWith("/image/upload/")
    ) {
      return url;
    }

    parsedUrl.hostname = "res.cloudinary.com";
    parsedUrl.pathname = `/${resolvedCloudName}${parsedUrl.pathname}`;

    return parsedUrl.toString();
  } catch {
    return url;
  }
}

export function normalizeCloudinaryDeliveryUrls(urls: string[] | null | undefined): string[] | undefined {
  return urls?.map((url) => normalizeCloudinaryDeliveryUrl(url));
}

export function normalizeCloudinaryReportPhotoPaths(paths: ReportPhotoPaths | null | undefined): ReportPhotoPaths | undefined {
  if (!paths) {
    return undefined;
  }

  return {
    ...(paths.after ? { after: normalizeCloudinaryDeliveryUrl(paths.after) } : {}),
    ...(paths.before ? { before: normalizeCloudinaryDeliveryUrl(paths.before) } : {}),
    ...(paths.station ? { station: normalizeCloudinaryDeliveryUrl(paths.station) } : {}),
  };
}
