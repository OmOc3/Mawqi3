"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { editSubmittedReportAction, type EditSubmittedReportActionResult } from "@/app/actions/reports";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import type { EditableSubmittedReportFields } from "@/lib/reports/editable-submitted-fields";
import { editSubmittedReportSchema, type EditSubmittedReportValues } from "@/lib/validation/reports";
import type { StatusOption } from "@/types";
import { pestTypeOptions, reportStatusOptions } from "@ecopest/shared/constants";

const statusOptions = reportStatusOptions as unknown as StatusOption[];

interface EditSubmittedReportFormProps {
  canEdit: boolean;
  instanceId?: string;
  report: EditableSubmittedReportFields;
}

function toFormData(values: EditSubmittedReportValues): FormData {
  const formData = new FormData();

  values.status.forEach((status) => {
    formData.append("status", status);
  });
  values.pestTypes.forEach((pest) => {
    formData.append("pestTypes", pest);
  });

  if (values.notes) {
    formData.set("notes", values.notes);
  }

  return formData;
}

export function EditSubmittedReportForm({ canEdit, instanceId = "edit", report }: EditSubmittedReportFormProps) {
  const router = useRouter();
  const { pestTypeLabels, statusOptionLabels, translate } = useLanguage();
  const [result, setResult] = useState<EditSubmittedReportActionResult | null>(null);
  const fieldIdPrefix = `${instanceId}-${report.reportId}`;
  const form = useForm<EditSubmittedReportValues>({
    resolver: zodResolver(editSubmittedReportSchema),
    defaultValues: {
      notes: report.notes ?? "",
      status: report.status,
      pestTypes: report.pestTypes?.length ? report.pestTypes : ["others"],
    },
  });

  if (!canEdit) {
    return (
      <p className="mt-2 text-xs text-[var(--muted)]">
        {translate("لا يمكن تعديل بيانات التنفيذ بعد اعتماد المراجعة. يمكن للمدير التعديل عند الحاجة.")}
      </p>
    );
  }

  async function onSubmit(values: EditSubmittedReportValues): Promise<void> {
    setResult(null);
    const actionResult = await editSubmittedReportAction(report.reportId, toFormData(values));

    setResult(actionResult);

    if (actionResult.success) {
      router.refresh();
    }
  }

  return (
    <form className="mt-3 grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3" dir="rtl" onSubmit={form.handleSubmit(onSubmit)}>
      <p className="text-sm font-bold text-[var(--foreground)]">
        {translate("تعديل بيانات التنفيذ (قبل الاعتماد النهائي)")}
      </p>

      {result?.error ? (
        <p className="text-sm font-medium text-[var(--danger)]" role="alert">
          {result.error}
        </p>
      ) : null}
      {result?.success ? (
        <p className="text-sm font-medium text-[var(--success)]" role="status">
          {translate("تم حفظ التعديلات.")}
        </p>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[var(--foreground)]">{translate("حالة المحطة")}</legend>
        {statusOptions.map((status) => (
          <label className="flex cursor-pointer items-center gap-2 text-sm" key={status}>
            <input className="h-4 w-4 rounded accent-teal-600" type="checkbox" value={status} {...form.register("status")} />
            <span>{statusOptionLabels[status]}</span>
          </label>
        ))}
        {form.formState.errors.status?.message ? (
          <p className="text-xs text-[var(--danger)]">{form.formState.errors.status.message}</p>
        ) : null}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[var(--foreground)]">
          {translate("برنامج التنفيذ — أنواع الآفات")}
        </legend>
        {pestTypeOptions.map((pest) => (
          <label className="flex cursor-pointer items-center gap-2 text-sm" key={pest}>
            <input className="h-4 w-4 rounded accent-teal-600" type="checkbox" value={pest} {...form.register("pestTypes")} />
            <span>{pestTypeLabels[pest]}</span>
          </label>
        ))}
        {form.formState.errors.pestTypes?.message ? (
          <p className="text-xs text-[var(--danger)]">{form.formState.errors.pestTypes.message}</p>
        ) : null}
      </fieldset>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--foreground)]" htmlFor={`edit-notes-${fieldIdPrefix}`}>
          {translate("ملاحظات الفني")}
        </label>
        <textarea
          className="min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          id={`edit-notes-${fieldIdPrefix}`}
          maxLength={500}
          {...form.register("notes")}
        />
      </div>

      <Button className="sm:w-fit" disabled={form.formState.isSubmitting} isLoading={form.formState.isSubmitting} type="submit">
        {translate("حفظ تعديلات التنفيذ")}
      </Button>
    </form>
  );
}
