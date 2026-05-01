import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/layout/brand";
import { ROLE_COOKIE_NAME } from "@/lib/auth/constants";
import { getRoleRedirect } from "@/lib/auth/redirects";
import { verifySignedRoleCookie } from "@/lib/auth/role-cookie";
import { getAppSettings } from "@/lib/db/repositories";

export const metadata: Metadata = {
  title: "وضع الصيانة",
};

function isSafeRedirectPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  return !value.includes("://");
}

interface MaintenancePageProps {
  searchParams: Promise<{
    from?: string;
  }>;
}

export default async function MaintenancePage({ searchParams }: MaintenancePageProps) {
  const params = await searchParams;
  const settings = await getAppSettings();

  // If maintenance is disabled, let refresh take them back in.
  if (!settings.maintenanceEnabled) {
    const cookieStore = await cookies();
    const roleCookie = cookieStore.get(ROLE_COOKIE_NAME)?.value;
    const payload = await verifySignedRoleCookie(roleCookie);

    const from = typeof params.from === "string" ? params.from : "";
    if (from && isSafeRedirectPath(from)) {
      redirect(from);
    }

    if (payload) {
      redirect(getRoleRedirect(payload.role));
    }

    redirect("/login");
  }

  const message = settings.maintenanceMessage?.trim();

  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-8 text-right sm:px-6 lg:px-8" dir="rtl">
      <section className="mx-auto max-w-2xl">
        <header className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <BrandLockup compact />
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-100">
              صيانة
            </span>
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-[var(--foreground)]">الموقع تحت الصيانة</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            في تعديلات بتتم حاليًا على النظام. اعمل تحديث للصفحة.
          </p>
          {message ? (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-4 text-sm leading-7 text-[var(--foreground)]">
              {message}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
              href="/maintenance"
            >
              تحديث الصفحة
            </a>
          </div>
        </header>
      </section>
    </main>
  );
}

