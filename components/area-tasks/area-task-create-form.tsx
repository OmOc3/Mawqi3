"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createDailyAreaTaskAction, type ClientVisibilityActionResult } from "@/app/actions/client-visibility";
import { Button } from "@/components/ui/button";
import { createDailyAreaTaskSchema, type CreateDailyAreaTaskValues } from "@/lib/validation/client-visibility";

interface AreaTaskCreateFormProps {
  areas: {
    areaId: string;
    clientName?: string;
    location: string;
    name: string;
  }[];
  technicians: {
    displayName: string;
    uid: string;
  }[];
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toFormData(values: CreateDailyAreaTaskValues): FormData {
  const formData = new FormData();

  formData.set("areaId", values.areaId);
  formData.set("scheduledDate", values.scheduledDate);
  formData.set("technicianUid", values.technicianUid);
  if (values.notes) formData.set("notes", values.notes);

  return formData;
}

export function AreaTaskCreateForm({ areas, technicians }: AreaTaskCreateFormProps) {
  const [result, setResult] = useState<ClientVisibilityActionResult | null>(null);
  const form = useForm<CreateDailyAreaTaskValues>({
    resolver: zodResolver(createDailyAreaTaskSchema),
    defaultValues: {
      areaId: "",
      notes: "",
      scheduledDate: todayInputValue(),
      technicianUid: "",
    },
  });

  async function onSubmit(values: CreateDailyAreaTaskValues): Promise<void> {
    setResult(null);
    const actionResult = await createDailyAreaTaskAction(toFormData(values));
    setResult(actionResult);

    if (actionResult.success) {
      form.reset({ areaId: "", notes: "", scheduledDate: todayInputValue(), technicianUid: "" });
    }
  }

  return (
    <form className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card" dir="rtl" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">إضافة مهمة يومية</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">المشرف يضيف المهمة، والمدير يعتمدها قبل ظهورها للفني.</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[var(--muted)]">المنطقة</span>
          <select
            className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control"
            {...form.register("areaId")}
          >
            <option value="">اختر المنطقة</option>
            {areas.map((area) => (
              <option key={area.areaId} value={area.areaId}>
                {area.clientName ? `${area.clientName} - ` : ""}
                {area.name} - {area.location}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[var(--muted)]">الفني</span>
          <select
            className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control"
            {...form.register("technicianUid")}
          >
            <option value="">اختر الفني</option>
            {technicians.map((technician) => (
              <option key={technician.uid} value={technician.uid}>
                {technician.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[var(--muted)]">التاريخ</span>
          <input
            className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control"
            type="date"
            {...form.register("scheduledDate")}
          />
        </label>

        <label className="block space-y-1.5 lg:col-span-2">
          <span className="text-sm font-semibold text-[var(--muted)]">ملاحظات</span>
          <textarea
            className="min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control"
            {...form.register("notes")}
          />
        </label>
      </div>

      {Object.values(form.formState.errors).some(Boolean) ? (
        <p className="mt-3 text-xs font-semibold text-[var(--danger)]">تحقق من المنطقة والفني والتاريخ.</p>
      ) : null}
      {result?.error ? (
        <p className="mt-4 rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{result.error}</p>
      ) : null}
      {result?.success ? (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">تم إنشاء المهمة.</p>
      ) : null}

      <Button className="mt-5 sm:w-auto" disabled={form.formState.isSubmitting} isLoading={form.formState.isSubmitting} type="submit">
        حفظ المهمة
      </Button>
    </form>
  );
}
