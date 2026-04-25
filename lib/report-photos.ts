import "server-only";

import { adminStorage } from "@/lib/firebase-admin";
import type { ReportPhotoPaths } from "@/types";

export interface ReportPhotoUrls {
  after?: string;
  before?: string;
}

async function signedUrlForPath(path: string): Promise<string | undefined> {
  try {
    const [url] = await adminStorage()
      .bucket()
      .file(path)
      .getSignedUrl({
        action: "read",
        expires: Date.now() + 15 * 60 * 1000,
      });

    return url;
  } catch (_error: unknown) {
    return undefined;
  }
}

export async function getSignedReportPhotoUrls(photoPaths?: ReportPhotoPaths): Promise<ReportPhotoUrls> {
  if (!photoPaths) {
    return {};
  }

  const [before, after] = await Promise.all([
    photoPaths.before ? signedUrlForPath(photoPaths.before) : Promise.resolve(undefined),
    photoPaths.after ? signedUrlForPath(photoPaths.after) : Promise.resolve(undefined),
  ]);

  return {
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
  };
}
