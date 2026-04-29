"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createClientOrderAction } from "@/app/actions/client-orders";
import { Button } from "@/components/ui/button";
import { createClientOrderSchema, type CreateClientOrderValues } from "@/lib/validation/client-orders";

function toFormData(values: CreateClientOrderValues, photoFile: File | null): FormData {
  const formData = new FormData();
  formData.set("stationLabel", values.stationLabel);
  formData.set("stationLocation", values.stationLocation);
  if (values.stationDescription) {
    formData.set("stationDescription", values.stationDescription);
  }
  if (values.note) {
    formData.set("note", values.note);
  }
  if (photoFile) {
    formData.set("photo", photoFile);
  }
  return formData;
}

export function CreateClientOrderForm() {
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const form = useForm<CreateClientOrderValues>({
    resolver: zodResolver(createClientOrderSchema),
    defaultValues: {
      stationLabel: "",
      stationLocation: "",
      stationDescription: "",
      note: "",
    },
  });

  async function onSubmit(values: CreateClientOrderValues): Promise<void> {
    setResultMessage(null);
    const result = await createClientOrderAction(toFormData(values, photoFile));
    setResultMessage(result.error ?? "تم إرسال طلب الفحص بنجاح.");
    if (result.success) {
      form.reset({ stationLabel: "", stationLocation: "", stationDescription: "", note: "" });
      setPhotoFile(null);
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card sm:p-6"
      dir="rtl"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div>
        <p className="text-sm font-semibold text-[var(--primary)]">طلب جديد</p>
        <h2 className="mt-1 text-xl font-extrabold text-[var(--foreground)]">طلب فحص محطة</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          أرسل بيانات المحطة وسيقوم الفريق بمراجعة الطلب وربطه بحسابك.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="stationLabel">
          اسم المحطة
        </label>
        <input
          className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
          id="stationLabel"
          placeholder="مثال: محطة مخزن 3"
          {...form.register("stationLabel")}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="stationLocation">
          موقع المحطة
        </label>
        <input
          className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
          id="stationLocation"
          placeholder="مثال: الرياض - حي النخيل - مبنى A"
          {...form.register("stationLocation")}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="stationDescription">
          بيانات المحطة
        </label>
        <textarea
          className="min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
          id="stationDescription"
          maxLength={500}
          placeholder="وصف إضافي عن المحطة أو المكان"
          {...form.register("stationDescription")}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="note">
          ملاحظات الطلب
        </label>
        <textarea
          className="min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
          id="note"
          maxLength={600}
          {...form.register("note")}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="photo">
          صورة للمحطة (اختياري)
        </label>
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <input
            accept="image/*"
            className="block w-full text-sm text-[var(--muted)] file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:font-semibold file:text-teal-700"
            id="photo"
            onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </div>
      </div>

      <Button className="w-full" disabled={form.formState.isSubmitting} isLoading={form.formState.isSubmitting} type="submit">
        إرسال الطلب
      </Button>

      {resultMessage ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm font-medium text-[var(--muted)]">
          {resultMessage}
        </p>
      ) : null}
    </form>
  );
}
