"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { i18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  buttonClassName?: string;
  className?: string;
  redirectTo?: string;
}

export function LogoutButton({ buttonClassName, className, redirectTo = "/login" }: LogoutButtonProps = {}) {
  const router = useRouter();
  const { translate } = useLanguage();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    try {
      setError(null);
      setIsPending(true);
      await fetch("/api/auth/session", { method: "DELETE" });
      router.replace(redirectTo);
      router.refresh();
    } catch (_error: unknown) {
      setError(translate(i18n.auth.logoutError));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button className={buttonClassName} isLoading={isPending} onClick={handleLogout} variant="secondary">
        {translate(i18n.actions.logout)}
      </Button>
      {error ? (
        <p className="text-center text-sm font-medium text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
