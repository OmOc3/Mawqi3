"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { isRecord } from "@/lib/utils";
import { createLoginFormSchema, type LoginFormValues } from "@/lib/validation/auth";
import type { ApiErrorResponse, LoginSuccessResponse, UserRole } from "@/types";

function isAuthenticatedUserResponse(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.uid === "string" &&
    typeof value.email === "string" &&
    typeof value.displayName === "string" &&
    (value.role === "client" || value.role === "technician" || value.role === "supervisor" || value.role === "manager") &&
    value.isActive === true
  );
}

function isLoginSuccessResponse(value: unknown): value is LoginSuccessResponse {
  return (
    isRecord(value) &&
    typeof value.redirectTo === "string" &&
    isAuthenticatedUserResponse(value.user)
  );
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.message === "string" && typeof value.code === "string";
}

function formatApiErrorMessage(payload: ApiErrorResponse): string {
  if (payload.code === "AUTH_LOGIN_FAILED" || payload.code.startsWith("AUTH_CONFIG_")) {
    return `${payload.message} (${payload.code})`;
  }

  return payload.message;
}

interface LoginFormProps {
  expectedRole?: UserRole;
  /** من صفحة دخول الإدارة والفريق — لا يُقبل حساب عميل عبر هذا المسار. */
  staffPortalLogin?: boolean;
}

export function LoginForm({ expectedRole, staffPortalLogin }: LoginFormProps = {}) {
  const router = useRouter();
  const { locale, messages, translate } = useLanguage();
  const loginSchema = useMemo(() => createLoginFormSchema(messages), [messages]);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues): Promise<void> {
    try {
      setFormError(null);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, expectedRole, ...(staffPortalLogin ? { staffPortalLogin: true } : {}) }),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setFormError(
          isApiErrorResponse(payload) ? translate(formatApiErrorMessage(payload)) : messages.auth.genericLoginError,
        );
        return;
      }

      if (!isLoginSuccessResponse(payload)) {
        setFormError(messages.errors.unexpected);
        return;
      }

      router.replace(payload.redirectTo);
      router.refresh();
    } catch (_error: unknown) {
      setFormError(messages.errors.unexpected);
    }
  }

  return (
    <form className="space-y-5" key={locale} onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        autoComplete="email"
        dir="ltr"
        error={errors.email?.message}
        id="email"
        inputMode="email"
        label={messages.auth.email}
        placeholder={messages.auth.emailPlaceholder}
        type="email"
        {...register("email")}
      />
      <TextField
        autoComplete="current-password"
        dir="ltr"
        error={errors.password?.message}
        id="password"
        label={messages.auth.password}
        placeholder={messages.auth.passwordPlaceholder}
        type="password"
        {...register("password")}
      />
      {formError ? (
        <div
          className="rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]"
          role="alert"
        >
          {formError}
        </div>
      ) : null}
      <Button isLoading={isSubmitting} type="submit">
        {isSubmitting ? messages.auth.signingIn : messages.actions.login}
      </Button>
    </form>
  );
}
