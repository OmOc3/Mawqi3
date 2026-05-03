"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  createClientServiceAreaAction,
  type ClientVisibilityActionResult,
} from "@/app/actions/client-visibility";
import { Button } from "@/components/ui/button";
import {
  createClientServiceAreaSchema,
  type CreateClientServiceAreaValues,
} from "@/lib/validation/client-visibility";
import { useForm } from "react-hook-form";

interface ClientServiceAreaFormProps {
  clientUid: string;
}

function toFormData(values: CreateClientServiceAreaValues): FormData {
  const formData = new FormData();

  formData.set("clientUid", values.clientUid);
  formData.set("name", values.name);
  formData.set("location", values.location);

  if (values.description) formData.set("description", values.description);
  if (typeof values.lat === "number") formData.set("lat", String(values.lat));
  if (typeof values.lng === "number") formData.set("lng", String(values.lng));

  return formData;
}

export function ClientServiceAreaForm({ clientUid }: ClientServiceAreaFormProps) {
  const [result, setResult] = useState<ClientVisibilityActionResult | null>(null);
  const form = useForm<CreateClientServiceAreaValues>({
    resolver: zodResolver(createClientServiceAreaSchema),
    defaultValues: {
      clientUid,
      description: "",
      location: "",
      name: "",
    },
  });

  async function onSubmit(values: CreateClientServiceAreaValues): Promise<void> {
    setResult(null);
    const actionResult = await createClientServiceAreaAction(toFormData(values));
    setResult(actionResult);

    if (actionResult.success) {
      form.reset({ clientUid, description: "", location: "", name: "" });
    }
  }

  return (
    <form className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card" dir="rtl" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">مناطق العميل</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">أضف مكان أو منطقة عامة لها QR مستقل للمهام اليومية.</p>
      </div>

      <input type="hidden" {...form.register("clientUid")} />

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-[var(--muted)]">اسم المنطقة</span>
        <input
          className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          {...form.register("name")}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-[var(--muted)]">الموقع</span>
        <input
          className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          {...form.register("location")}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-[var(--muted)]">وصف مختصر</span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          {...form.register("description")}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[var(--muted)]">خط العرض</span>
          <input
            className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control"
            step="any"
            type="number"
            {...form.register("lat", { setValueAs: (value) => (value === "" ? undefined : Number(value)) })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[var(--muted)]">خط الطول</span>
          <input
            className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control"
            step="any"
            type="number"
            {...form.register("lng", { setValueAs: (value) => (value === "" ? undefined : Number(value)) })}
          />
        </label>
      </div>

      {Object.values(form.formState.errors).some(Boolean) ? (
        <p className="text-xs font-semibold text-[var(--danger)]">تحقق من اسم المنطقة والموقع والإحداثيات.</p>
      ) : null}

      {result?.error ? (
        <p className="rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{result.error}</p>
      ) : null}
      {result?.success ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">تم إنشاء المنطقة وQR الخاص بها.</p>
      ) : null}

      <Button disabled={form.formState.isSubmitting} isLoading={form.formState.isSubmitting} type="submit">
        إضافة المنطقة
      </Button>
    </form>
  );
}
