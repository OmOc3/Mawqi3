import "server-only";

import type { ReportPhotoPaths } from "@/types";

export interface ReportPhotoUrls {
  after?: string;
  before?: string;
  station?: string;
}

export async function getSignedReportPhotoUrls(photoPaths?: ReportPhotoPaths): Promise<ReportPhotoUrls> {
  return {
    ...(photoPaths?.before ? { before: photoPaths.before } : {}),
    ...(photoPaths?.after ? { after: photoPaths.after } : {}),
    ...(photoPaths?.station ? { station: photoPaths.station } : {}),
  };
}
