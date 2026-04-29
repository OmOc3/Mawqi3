import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientSignupForm } from "@/components/auth/client-signup-form";
import { LogoutButton } from "@/components/auth/logout-button";
import { CopyrightFooter } from "@/components/legal/copyright-footer";
import { BrandMark } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getCurrentSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "إنشاء حساب عميل",
};

export default async function ClientSignupPage() {
  const session = await getCurrentSession();

  if (session?.role === "client") {
    redirect("/client/portal");
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] text-right" dir="rtl">
      {/* Subtle background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <BrandMark className="h-9 w-9" />
          <span className="text-sm font-bold text-[var(--foreground)]">إيكوبست</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered content */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md flex-col justify-center px-4 pb-10 pt-2">

        {/* Heading */}
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
            بوابة العملاء
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            إنشاء حساب جديد
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            يُفعَّل حسابك فورًا ويمكنك متابعة طلباتك ومحطاتك مباشرة.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
          {session ? (
            <div className="rounded-xl border border-[var(--danger-muted)] bg-[var(--danger-soft)] p-4">
              <h2 className="text-base font-bold text-[var(--danger)]">جلسة غير مناسبة</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--danger)]">
                أنت مسجل دخول بحساب {session.user.displayName}. سجل الخروج أولًا لإنشاء حساب عميل جديد.
              </p>
              <LogoutButton
                buttonClassName="mt-4 !w-full"
                className="w-full"
                redirectTo="/client/signup"
              />
            </div>
          ) : (
            <>
              <ClientSignupForm />
              <p className="mt-6 text-center text-sm text-[var(--muted)]">
                لديك حساب بالفعل؟{" "}
                <Link
                  className="font-semibold text-[var(--primary)] hover:underline"
                  href="/client/login"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </>
          )}
        </div>

        <CopyrightFooter className="mt-8 px-0 text-center" />
      </section>
    </main>
  );
}
