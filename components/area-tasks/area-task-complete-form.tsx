"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { completeDailyAreaTaskScanAction, type ClientVisibilityActionResult } from "@/app/actions/client-visibility";
import { Button } from "@/components/ui/button";
import { completeDailyAreaTaskSchema, type CompleteDailyAreaTaskValues } from "@/lib/validation/client-visibility";

interface AreaTaskCompleteFormProps {
  taskId: string;
}

function toFormData(values: CompleteDailyAreaTaskValues): FormData {
  const formData = new FormData();

  formData.set("taskId", values.taskId);
  formData.set("sprayStatus", values.sprayStatus);
  if (values.notes) formData.set("notes", values.notes);

  return formData;
}

export function AreaTaskCompleteForm({ taskId }: AreaTaskCompleteFormProps) {
  const [result, setResult] = useState<ClientVisibilityActionResult | null>(null);
  const form = useForm<CompleteDailyAreaTaskValues>({
    resolver: zodResolver(completeDailyAreaTaskSchema),
    defaultValues: {
      notes: "",
      sprayStatus: "sprayed",
      taskId,
    },
  });

  async function onSubmit(values: CompleteDailyAreaTaskValues): Promise<void> {
    setResult(null);
    const actionResult = await completeDailyAreaTaskScanAction(toFormData(values));
    setResult(actionResult);
  }

  return (
    <form className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card" dir="rtl" onSubmit={form.handleSubmit(onSubmit)}>
      <input type="hidden" {...form.register("taskId")} />

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">نتيجة الرش</legend>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
          <input className="h-4 w-4" type="radio" value="sprayed" {...form.register("sprayStatus")} />
          تم الرش
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
          <input className="h-4 w-4" type="radio" value="not_sprayed" {...form.register("sprayStatus")} />
          لم يتم الرش
        </label>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-[var(--muted)]">ملاحظات التنفيذ</span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control"
          {...form.register("notes")}
        />
      </label>

      {result?.error ? (
        <p className="rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{result.error}</p>
      ) : null}
      {result?.success ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">تم تسجيل نتيجة الرش. لن تظهر للعميل إلا بعد نشرها من المشرف أو المدير.</p>
      ) : null}

      <Button disabled={form.formState.isSubmitting} isLoading={form.formState.isSubmitting} type="submit">
        تسجيل نتيجة الرش
      </Button>
    </form>
  );
}
