"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateClientProfileAction, type ClientOrderActionResult } from "@/app/actions/client-orders";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { updateClientProfileSchema, type UpdateClientProfileValues } from "@/lib/validation/client-orders";

interface ClientProfileFormProps {
  addresses: string[];
  clientUid: string;
  phone?: string;
}

function toFormData(values: UpdateClientProfileValues): FormData {
  const formData = new FormData();

  formData.set("addressesText", values.addressesText ?? "");
  formData.set("clientUid", values.clientUid);
  formData.set("phone", values.phone ?? "");

  return formData;
}

export function ClientProfileForm({ addresses, clientUid, phone }: ClientProfileFormProps) {
  const [result, setResult] = useState<ClientOrderActionResult | null>(null);
  const form = useForm<UpdateClientProfileValues>({
    resolver: zodResolver(updateClientProfileSchema),
    defaultValues: {
      addressesText: addresses.join("\n"),
      clientUid,
      phone: phone ?? "",
    },
  });

  async function onSubmit(values: UpdateClientProfileValues): Promise<void> {
    setResult(null);
    const actionResult = await updateClientProfileAction(toFormData(values));
    setResult(actionResult);
  }

  return (
    <form className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card" dir="rtl" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-[var(--foreground)]">بيانات العميل</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">رقم التواصل والعناوين التي تظهر لفريق الإدارة أثناء متابعة الطلبات.</p>
      </div>

      {result?.error ? (
        <p className="mt-4 rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {result.error}
        </p>
      ) : null}
      {result?.success ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300">
          تم تحديث بيانات العميل.
        </p>
      ) : null}

      <div className="mt-5 grid gap-4">
        <input type="hidden" {...form.register("clientUid")} />
        <TextField
          autoComplete="tel"
          error={form.formState.errors.phone?.message}
          id={`client-phone-${clientUid}`}
          label="رقم الهاتف"
          placeholder="+20 10 0000 0000"
          type="tel"
          {...form.register("phone")}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]" htmlFor={`client-addresses-${clientUid}`}>
            العناوين
          </label>
          <textarea
            aria-describedby={`client-addresses-${clientUid}-hint`}
            aria-invalid={Boolean(form.formState.errors.addressesText)}
            className="min-h-32 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm leading-6 text-[var(--foreground)] shadow-control transition-colors duration-150 placeholder:text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--border)_50%,var(--foreground)_50%)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            id={`client-addresses-${clientUid}`}
            placeholder={"كل عنوان في سطر مستقل\nمثال: القاهرة - التجمع - مبنى الإدارة"}
            {...form.register("addressesText")}
          />
          <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]" id={`client-addresses-${clientUid}-hint`}>
            حتى 8 عناوين. استخدم سطرًا مستقلًا لكل عنوان.
          </p>
          {form.formState.errors.addressesText?.message ? (
            <p className="mt-1.5 text-xs text-[var(--danger)]" role="alert">
              {form.formState.errors.addressesText.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button className="mt-5 sm:w-auto" disabled={form.formState.isSubmitting} isLoading={form.formState.isSubmitting} type="submit">
        حفظ بيانات العميل
      </Button>
    </form>
  );
}
