import "server-only";

import type { ReportPhoto, ReportPhotoCategory, ReportPhotoPaths } from "@/types";

export interface ReportPhotoUrls {
  after?: string;
  before?: string;
  station?: string;
}

export interface ReportPhotoGalleryItem {
  category: ReportPhotoCategory;
  photoId: string;
  url: string;
}

export async function getSignedReportPhotoUrls(
  photoPaths?: ReportPhotoPaths,
  photos: ReportPhoto[] = [],
): Promise<ReportPhotoUrls & { gallery: ReportPhotoGalleryItem[] }> {
  const legacy = {
    ...(photoPaths?.before ? { before: photoPaths.before } : {}),
    ...(photoPaths?.after ? { after: photoPaths.after } : {}),
    ...(photoPaths?.station ? { station: photoPaths.station } : {}),
  };
  const gallery: ReportPhotoGalleryItem[] =
    photos.length > 0
      ? photos.map((photo) => ({
          category: photo.category,
          photoId: photo.photoId,
          url: photo.url,
        }))
      : [
          ...(photoPaths?.station ? [{ category: "station" as const, photoId: "legacy-station", url: photoPaths.station }] : []),
          ...(photoPaths?.before ? [{ category: "before" as const, photoId: "legacy-before", url: photoPaths.before }] : []),
          ...(photoPaths?.after ? [{ category: "after" as const, photoId: "legacy-after", url: photoPaths.after }] : []),
        ];

  return {
    ...legacy,
    gallery,
  };
}
