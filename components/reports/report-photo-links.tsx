"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReportPhotoCategory } from "@/types";

interface ReportPhotoLinksProps {
  photoCount: number;
  reportId: string;
}

interface ReportPhotoUrlsResponse {
  photos?: {
    after?: string;
    before?: string;
    gallery?: {
      category: ReportPhotoCategory;
      photoId: string;
      url: string;
    }[];
    station?: string;
  };
}

const labels: Record<ReportPhotoCategory, string> = {
  after: "بعد",
  before: "قبل",
  during: "أثناء العمل",
  other: "أخرى",
  station: "المحطة",
};

export function ReportPhotoLinks({ photoCount, reportId }: ReportPhotoLinksProps) {
  const [photos, setPhotos] = useState<ReportPhotoUrlsResponse["photos"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (photoCount === 0) {
    return <p className="mt-3 text-xs text-[var(--muted)]">لا توجد صور مرفقة.</p>;
  }

  async function loadPhotos(): Promise<void> {
    if (photos || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}/photos`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as ReportPhotoUrlsResponse & { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "تعذر تحميل الصور.");
      }

      setPhotos(payload.photos ?? {});
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الصور.");
    } finally {
      setIsLoading(false);
    }
  }

  const gallery = photos?.gallery ?? [];

  return (
    <div className="mt-3">
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm transition-all duration-150 hover:bg-[var(--surface-subtle)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        disabled={isLoading}
        onClick={loadPhotos}
        type="button"
      >
        {isLoading ? "جاري تحميل الصور..." : `عرض الصور (${photoCount})`}
      </button>

      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}

      {photos ? (
        gallery.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {gallery.map((photo) => (
              <a
                className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
                href={photo.url}
                key={photo.photoId}
                rel="noreferrer"
                target="_blank"
              >
                <Image
                  alt={`صورة ${labels[photo.category]}`}
                  className="h-32 w-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
                  height={128}
                  src={photo.url}
                  unoptimized
                  width={240}
                />
                <span className="block px-3 py-2 text-xs font-semibold text-[var(--foreground)]">{labels[photo.category]}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-[var(--muted)]">لا توجد صور متاحة.</p>
        )
      ) : null}
    </div>
  );
}
