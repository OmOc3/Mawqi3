"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateClientStationAccessAction, type ClientOrderActionResult } from "@/app/actions/client-orders";
import { Button } from "@/components/ui/button";
import { updateClientStationAccessSchema, type UpdateClientStationAccessValues } from "@/lib/validation/client-orders";

interface ClientStationAccessFormProps {
  assignedStationIds: string[];
  clientUid: string;
  stations: {
    label: string;
    location: string;
    stationId: string;
  }[];
}

function toFormData(values: UpdateClientStationAccessValues): FormData {
  const formData = new FormData();

  formData.set("clientUid", values.clientUid);
  values.stationIds.forEach((stationId) => formData.append("stationIds", stationId));

  return formData;
}

export function ClientStationAccessForm({ assignedStationIds, clientUid, stations }: ClientStationAccessFormProps) {
  const [result, setResult] = useState<ClientOrderActionResult | null>(null);
  const form = useForm<UpdateClientStationAccessValues>({
    resolver: zodResolver(updateClientStationAccessSchema),
    defaultValues: {
      clientUid,
      stationIds: assignedStationIds,
    },
  });
  const selectedCount = form.watch("stationIds").length;

  async function onSubmit(values: UpdateClientStationAccessValues): Promise<void> {
    setResult(null);
    const actionResult = await updateClientStationAccessAction(toFormData(values));
    setResult(actionResult);
  }

  return (
    <form className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card" dir="rtl" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">محطات العميل</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            المحطات المحددة هنا هي فقط التي تظهر للعميل، وهي التي يعتمد عليها حضور الفني داخل الموقع.
          </p>
        </div>
        <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          {selectedCount} محطة
        </span>
      </div>

      <input type="hidden" {...form.register("clientUid")} />

      {result?.error ? (
        <p className="mt-4 rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {result.error}
        </p>
      ) : null}
      {result?.success ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300">
          تم تحديث محطات العميل.
        </p>
      ) : null}

      <div className="mt-5 max-h-80 space-y-2 overflow-y-auto pe-1">
        {stations.map((station) => (
          <label
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm"
            key={station.stationId}
          >
            <input
              className="mt-1 h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--focus)]"
              type="checkbox"
              value={station.stationId}
              {...form.register("stationIds")}
            />
            <span className="min-w-0">
              <span className="block font-semibold text-[var(--foreground)]">{station.label}</span>
              <span className="block truncate text-xs text-[var(--muted)]">{station.location}</span>
            </span>
          </label>
        ))}
      </div>

      {form.formState.errors.stationIds?.message ? (
        <p className="mt-2 text-xs text-[var(--danger)]" role="alert">
          {form.formState.errors.stationIds.message}
        </p>
      ) : null}

      <Button className="mt-5 sm:w-auto" disabled={form.formState.isSubmitting} isLoading={form.formState.isSubmitting} type="submit">
        حفظ محطات العميل
      </Button>
    </form>
  );
}
