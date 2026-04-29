"use client";

import { useState, useTransition } from "react";
import { clockInAction, clockOutAction } from "@/app/actions/attendance";
import type { AttendanceSession } from "@/types";

interface AttendanceSiteOption {
  clientName: string;
  clientUid: string;
  locatedStationCount: number;
  stationCount: number;
}

interface AttendancePanelProps {
  attendanceSites?: AttendanceSiteOption[];
  openSession: AttendanceSession | null;
  sites?: AttendanceSiteOption[];
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getCurrentPosition(): Promise<GeolocationPosition> {
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

export function AttendancePanel({ attendanceSites, openSession, sites }: AttendancePanelProps) {
  const siteOptions = attendanceSites ?? sites ?? [];
  const [selectedClientUid, setSelectedClientUid] = useState(openSession?.clockInLocation?.clientUid ?? siteOptions[0]?.clientUid ?? "");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedClient = openSession?.clockInLocation?.clientUid ?? selectedClientUid;
  const canSubmit = siteOptions.length > 0 && selectedClient.length > 0;

  async function buildFormData(): Promise<FormData | null> {
    if (!canSubmit) {
      setMessage("لا توجد مواقع عمل مخصصة للحضور والانصراف.");
      return null;
    }

    try {
      const position = await getCurrentPosition();
      const formData = new FormData();

      formData.set("clientUid", selectedClient);
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

  function submitClockIn(): void {
    startTransition(async () => {
      setMessage(null);
      const formData = await buildFormData();

      if (!formData) {
        return;
      }

      const result = await clockInAction(formData);
      setMessage(result.error ?? "تم تسجيل الحضور بنجاح.");
      if (result.success) {
        setNotes("");
      }
    });
  }

  function submitClockOut(): void {
    startTransition(async () => {
      setMessage(null);
      const formData = await buildFormData();

      if (!formData) {
        return;
      }

      const result = await clockOutAction(formData);
      setMessage(result.error ?? "تم تسجيل الانصراف بنجاح.");
      if (result.success) {
        setNotes("");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-control">
      <h2 className="text-lg font-bold text-[var(--foreground)]">الحضور والانصراف</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">سجل بداية ونهاية يوم العمل من موقع عميل مخصص.</p>
      <div className="mt-3 rounded-xl bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--foreground)]">
        {openSession ? (
          <span>
            حالة اليوم: <strong className="text-teal-700">حضور مسجل</strong> منذ {formatDateTime(openSession.clockInAt.toDate())}
          </span>
        ) : (
          <span>
            حالة اليوم: <strong className="text-[var(--foreground)]">لم يتم تسجيل الحضور بعد</strong>
          </span>
        )}
      </div>

      <label className="mt-3 block space-y-1">
        <span className="text-sm font-semibold text-[var(--foreground)]">العميل / موقع العمل</span>
        <select
          className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          disabled={Boolean(openSession) || isPending || siteOptions.length === 0}
          onChange={(event) => setSelectedClientUid(event.target.value)}
          value={selectedClientUid}
        >
          {siteOptions.length === 0 ? <option value="">لا توجد مواقع مخصصة</option> : null}
          {siteOptions.map((site) => (
            <option key={site.clientUid} value={site.clientUid}>
              {site.clientName} - {site.locatedStationCount}/{site.stationCount} محطة بموقع
            </option>
          ))}
        </select>
      </label>

      <textarea
        className="mt-3 min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        dir="rtl"
        onChange={(event) => setNotes(event.target.value)}
        placeholder="ملاحظة اختيارية للحضور/الانصراف"
        value={notes}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={Boolean(openSession) || isPending || !canSubmit}
          onClick={submitClockIn}
          type="button"
        >
          تسجيل حضور
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!openSession || isPending || !canSubmit}
          onClick={submitClockOut}
          type="button"
        >
          تسجيل انصراف
        </button>
      </div>
      {message ? <p className="mt-3 text-sm font-medium text-[var(--foreground)]">{message}</p> : null}
    </section>
  );
}
