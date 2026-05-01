"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createDailyWorkReportAction, type DailyWorkReportActionResult } from "@/app/actions/daily-reports";
import { Button } from "@/components/ui/button";
import { formatIsoDateRome } from "@/lib/datetime";
import { createDailyWorkReportSchema, type CreateDailyWorkReportValues } from "@/lib/validation/daily-reports";

interface DailyReportFormProps {
  stations: {
    label: string;
    stationId: string;
  }[];
}

function todayInputValue(): string {
  return formatIsoDateRome(new Date()) ?? new Date().toISOString().slice(0, 10);
}

function toFormData(values: CreateDailyWorkReportValues, photos: File[]): FormData {
  const formData = new FormData();

  formData.set("reportDate", values.reportDate);
  formData.set("summary", values.summary);
  formData.set("notes", values.notes ?? "");
  values.stationIds.forEach((stationId) => formData.append("stationIds", stationId));
  photos.forEach((photo) => formData.append("photos", photo));

  return formData;
}

export function DailyReportForm({ stations }: DailyReportFormProps) {
  const [result, setResult] = useState<DailyWorkReportActionResult | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const form = useForm<CreateDailyWorkReportValues>({
    resolver: zodResolver(createDailyWorkReportSchema),
    defaultValues: {
      notes: "",
      reportDate: todayInputValue(),
      stationIds: [],
      summary: "",
    },
  });

  async function onSubmit(values: CreateDailyWorkReportValues): Promise<void> {
    setResult(null);
    const actionResult = await createDailyWorkReportAction(toFormData(values, photos));
    setResult(actionResult);

    if (actionResult.success) {
      form.reset({
        notes: "",
        reportDate: todayInputValue(),
        stationIds: [],
        summary: "",
      });
      setPhotos([]);
    }
  }

  return (
    <form className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-control" dir="rtl" onSubmit={form.handleSubmit(onSubmit)}>
      <h2 className="text-lg font-bold text-[var(--foreground)]">تقرير يومي</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">ارفع ملخص يوم العمل وصور التنفيذ، واربطه بالمحطات التي تم العمل عليها.</p>

      {result?.error ? (
        <p className="mt-4 rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {result.error}
        </p>
      ) : null}
      {result?.success ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300">
          تم حفظ التقرير اليومي.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]" htmlFor="daily-report-date">
            تاريخ التقرير
          </label>
          <input
            className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
            id="daily-report-date"
            type="date"
            {...form.register("reportDate")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]" htmlFor="daily-summary">
            ملخص العمل
          </label>
          <textarea
            className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm leading-6 text-[var(--foreground)]"
            id="daily-summary"
            maxLength={1200}
            placeholder="مثال: تم فحص محطات المخزن وتغيير الطعوم وتنظيف نقاط النشاط."
            {...form.register("summary")}
          />
          {form.formState.errors.summary?.message ? <p className="mt-1 text-xs text-[var(--danger)]">{form.formState.errors.summary.message}</p> : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">المحطات المرتبطة</p>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-2">
            {stations.map((station) => (
              <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--foreground)]" key={station.stationId}>
                <input className="h-4 w-4 rounded accent-teal-600" type="checkbox" value={station.stationId} {...form.register("stationIds")} />
                <span>{station.label}</span>
              </label>
            ))}
            {stations.length === 0 ? <p className="px-2 py-1.5 text-sm text-[var(--muted)]">لا توجد محطات متاحة.</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]" htmlFor="daily-notes">
            ملاحظات إضافية
          </label>
          <textarea
            className="min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm leading-6 text-[var(--foreground)]"
            id="daily-notes"
            maxLength={800}
            {...form.register("notes")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]" htmlFor="daily-photos">
            صور العمل
          </label>
          <input
            accept="image/*"
            className="block w-full text-sm text-[var(--muted)] file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:font-semibold file:text-teal-700"
            id="daily-photos"
            multiple
            onChange={(event) => setPhotos(Array.from(event.target.files ?? []).slice(0, 8))}
            type="file"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">حتى 8 صور، كل صورة بحد أقصى 5 ميجابايت.</p>
        </div>
      </div>

      <Button className="mt-5 w-full" disabled={form.formState.isSubmitting} isLoading={form.formState.isSubmitting} type="submit">
        حفظ التقرير اليومي
      </Button>
    </form>
  );
}
