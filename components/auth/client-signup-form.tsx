"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { isRecord } from "@/lib/utils";
import { clientSignupSchema, type ClientSignupValues } from "@/lib/validation/auth";
import type { ApiErrorResponse, LoginSuccessResponse } from "@/types";

function isAuthenticatedUserResponse(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.uid === "string" &&
    typeof value.email === "string" &&
    typeof value.displayName === "string" &&
    value.role === "client" &&
    value.isActive === true
  );
}

function isLoginSuccessResponse(value: unknown): value is LoginSuccessResponse {
  return isRecord(value) && typeof value.redirectTo === "string" && isAuthenticatedUserResponse(value.user);
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.message === "string" && typeof value.code === "string";
}

export function ClientSignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ClientSignupValues>({
    resolver: zodResolver(clientSignupSchema),
    defaultValues: {
      accessCode: "",
      addressesText: "",
      displayName: "",
      email: "",
      phone: "",
    },
  });

  async function onSubmit(values: ClientSignupValues): Promise<void> {
    try {
      setFormError(null);
      const response = await fetch("/api/auth/client-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setFormError(isApiErrorResponse(payload) ? payload.message : "تعذر إنشاء حساب العميل.");
        return;
      }

      if (!isLoginSuccessResponse(payload)) {
        setFormError("تم إنشاء الحساب لكن تعذر فتح بوابة العميل.");
        return;
      }

      router.replace(payload.redirectTo);
      router.refresh();
    } catch (_error: unknown) {
      setFormError("تعذر إنشاء حساب العميل. حاول مرة أخرى.");
    }
  }

  return (
    <form className="space-y-5" dir="rtl" onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        autoComplete="name"
        error={errors.displayName?.message}
        id="displayName"
        label="اسم العميل"
        placeholder="اسم الشركة أو الشخص"
        {...register("displayName")}
      />
      <TextField
        autoComplete="email"
        dir="ltr"
        error={errors.email?.message}
        id="signupEmail"
        inputMode="email"
        label="البريد الإلكتروني"
        placeholder="client@example.com"
        type="email"
        {...register("email")}
      />
      <TextField
        autoComplete="new-password"
        dir="ltr"
        error={errors.accessCode?.message}
        id="accessCode"
        label="كود الدخول"
        placeholder="8 أحرف أو أرقام على الأقل"
        type="password"
        {...register("accessCode")}
      />
      <TextField
        autoComplete="tel"
        dir="ltr"
        error={errors.phone?.message}
        id="phone"
        inputMode="tel"
        label="رقم الهاتف اختياري"
        placeholder="+20..."
        {...register("phone")}
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]" htmlFor="addressesText">
          العنوان اختياري
        </label>
        <textarea
          aria-describedby={errors.addressesText?.message ? "addressesText-error" : undefined}
          aria-invalid={Boolean(errors.addressesText)}
          className="min-h-24 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] shadow-control transition-colors duration-150 placeholder:text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--border)_50%,var(--foreground)_50%)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:opacity-60"
          id="addressesText"
          placeholder="اكتب كل عنوان في سطر مستقل"
          {...register("addressesText")}
        />
        {errors.addressesText?.message ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--danger)]" id="addressesText-error" role="alert">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
            {errors.addressesText.message}
          </p>
        ) : null}
      </div>
      {formError ? (
        <div
          className="rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]"
          role="alert"
        >
          {formError}
        </div>
      ) : null}
      <Button isLoading={isSubmitting} type="submit">
        {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب العميل"}
      </Button>
    </form>
  );
}
