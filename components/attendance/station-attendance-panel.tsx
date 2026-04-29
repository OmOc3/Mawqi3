"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clockInAction, clockOutAction } from "@/app/actions/attendance";
import type { AttendanceSession } from "@/types";

interface StationAttendancePanelProps {
  openSession: AttendanceSession | null;
  stationId: string;
  stationLabel: string;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
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

export function StationAttendancePanel({ openSession, stationId, stationLabel }: StationAttendancePanelProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const openStationId = openSession?.clockInLocation?.stationId;
  const isOpenForThisStation = openStationId === stationId;
  const hasDifferentOpenStation = Boolean(openStationId && openStationId !== stationId);

  async function buildFormData(): Promise<FormData | null> {
    try {
      const position = await readPosition();
      const formData = new FormData();

      formData.set("stationId", stationId);
      formData.set("lat", String(position.coords.latitude));
      formData.set("lng", String(position.coords.longitude));

      if (Number.isFinite(position.coords.accuracy)) {
        formData.set("accuracyMeters", String(position.coords.accuracy));
      }

      if (notes.trim()) {
        formData.set("notes", notes.trim());
      }

      return formData;
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "تعذر قراءة موقعك الحالي.");
      return null;
    }
  }

  function submit(action: "clockIn" | "clockOut"): void {
    startTransition(async () => {
      setMessage(null);
      const formData = await buildFormData();

      if (!formData) {
        return;
      }

      const result = action === "clockIn" ? await clockInAction(formData) : await clockOutAction(formData);

      setMessage(result.error ?? (action === "clockIn" ? "تم تسجيل الحضور في المحطة." : "تم تسجيل الانصراف من المحطة."));

      if (result.success) {
        setNotes("");
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">حضور المحطة</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            يجب تسجيل الحضور من نطاق المحطة قبل حفظ تقرير الفني.
          </p>
        </div>
        <span
          className={
            isOpenForThisStation
              ? "inline-flex rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800"
              : "inline-flex rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
          }
        >
          {isOpenForThisStation ? "حضور مسجل" : "لم يتم تسجيل الحضور"}
        </span>
      </div>

      {openSession ? (
        <div className="mt-3 rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
          حضور مفتوح منذ {formatDateTime(openSession.clockInAt.toDate())}
          {openSession.clockInLocation?.stationLabel ? ` في ${openSession.clockInLocation.stationLabel}` : ""}
        </div>
      ) : null}

      {hasDifferentOpenStation ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          لديك حضور مفتوح في محطة أخرى. سجل الانصراف منها قبل بدء {stationLabel}.
        </p>
      ) : null}

      <textarea
        className="mt-3 min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        dir="rtl"
        onChange={(event) => setNotes(event.target.value)}
        placeholder="ملاحظة اختيارية للحضور أو الانصراف"
        value={notes}
      />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={Boolean(openSession) || isPending}
          onClick={() => submit("clockIn")}
          type="button"
        >
          تسجيل حضور
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isOpenForThisStation || isPending}
          onClick={() => submit("clockOut")}
          type="button"
        >
          تسجيل انصراف
        </button>
      </div>

      {message ? <p className="mt-3 text-sm font-medium text-[var(--foreground)]">{message}</p> : null}
    </section>
  );
}
