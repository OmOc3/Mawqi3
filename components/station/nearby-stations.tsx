"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateTimeRome } from "@/lib/datetime";

interface NearbyStation {
  distanceMeters: number;
  label: string;
  lastVisitedAt?: string;
  lastVisitedBy?: string;
  location: string;
  photoUrl?: string;
  stationId: string;
  zone?: string;
}

function formatDistance(value: number): string {
  return value < 1000 ? `${Math.round(value)} م` : `${(value / 1000).toFixed(1)} كم`;
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return "لم تتم الزيارة";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير متاح";
  }

  return formatDateTimeRome(date, { locale: "ar-EG" });
}

function readPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("المتصفح لا يدعم قراءة الموقع."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 15_000,
    });
  });
}

export function NearbyStations() {
  const [stations, setStations] = useState<NearbyStation[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function loadNearbyStations(): Promise<void> {
    setStatus("loading");
    setMessage(null);

    try {
      const position = await readPosition();
      const params = new URLSearchParams({
        lat: String(position.coords.latitude),
        lng: String(position.coords.longitude),
      });

      if (Number.isFinite(position.coords.accuracy)) {
        params.set("accuracyMeters", String(position.coords.accuracy));
      }

      const response = await fetch(`/api/stations/nearby?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        const error = payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "";
        throw new Error(error || "تعذر تحميل المحطات القريبة.");
      }

      setStations(Array.isArray(payload) ? (payload as NearbyStation[]) : []);
      setStatus("ready");
    } catch (error: unknown) {
      setStations([]);
      setStatus("idle");
      setMessage(error instanceof Error ? error.message : "تعذر قراءة موقعك الحالي.");
    }
  }

  useEffect(() => {
    void loadNearbyStations();
  }, []);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-control">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">المحطات القريبة</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            تظهر المحطات النشطة داخل نطاق 100 متر من موقعك الحالي فقط.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === "loading"}
          onClick={() => void loadNearbyStations()}
          type="button"
        >
          {status === "loading" ? "جاري التحديد..." : "تحديث الموقع"}
        </button>
      </div>

      {message ? <p className="mt-4 rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--danger)]">{message}</p> : null}

      {status === "loading" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div className="h-40 animate-pulse rounded-xl bg-[var(--surface-subtle)]" key={item} />
          ))}
        </div>
      ) : null}

      {status === "ready" && stations.length === 0 ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-5 text-sm leading-6 text-[var(--muted)]">
          لا توجد محطات قريبة من موقعك الحالي. اقترب من المحطة أو استخدم QR المثبت عليها.
        </div>
      ) : null}

      {stations.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => (
            <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4" key={station.stationId}>
              {station.photoUrl ? (
                <Image
                  alt={`صورة المحطة ${station.label}`}
                  className="mb-3 h-32 w-full rounded-lg border border-[var(--border)] object-cover"
                  height={128}
                  src={station.photoUrl}
                  unoptimized
                  width={320}
                />
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-teal-700" dir="ltr">
                    #{station.stationId}
                  </p>
                  <h3 className="truncate text-base font-bold text-[var(--foreground)]">{station.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{station.location}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  {formatDistance(station.distanceMeters)}
                </span>
              </div>
              <div className="mt-3 rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
                آخر زيارة: {formatTimestamp(station.lastVisitedAt)}
                {station.lastVisitedBy ? ` بواسطة ${station.lastVisitedBy}` : ""}
              </div>
              <Link
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
                href={`/station/${station.stationId}/report`}
              >
                فتح المحطة
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
