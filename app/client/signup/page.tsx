import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientSignupForm } from "@/components/auth/client-signup-form";
import { LogoutButton } from "@/components/auth/logout-button";
import { CopyrightFooter } from "@/components/legal/copyright-footer";
import { BrandLockup } from "@/components/layout/brand";
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
    <main className="min-h-dvh bg-[var(--background)] px-4 py-6 text-right sm:px-6" dir="rtl">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-6xl flex-col justify-center gap-6">
        <header className="flex items-start justify-between gap-3">
          <BrandLockup />
          <ThemeToggle />
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.65fr)] lg:items-start">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card sm:p-6">
            <p className="text-sm font-semibold text-[var(--primary)]">بوابة العملاء</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">إنشاء حساب عميل</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              الحساب يتم تفعيله فورًا بدور عميل، وبعد التسجيل ستنتقل مباشرة إلى بوابة متابعة الطلبات والمحطات المرتبطة.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="text-sm font-bold text-[var(--foreground)]">طلبات الفحص</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">إرسال طلبات جديدة ومتابعة حالتها.</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="text-sm font-bold text-[var(--foreground)]">تقارير المحطات</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">عرض تقارير الفريق بعد تنفيذ الزيارة.</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="text-sm font-bold text-[var(--foreground)]">بيانات التواصل</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">حفظ هاتف وعناوين العميل للاستخدام الإداري.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card sm:p-6">
            {session ? (
              <div className="rounded-xl border border-[var(--danger-muted)] bg-[var(--danger-soft)] p-4">
                <h2 className="text-base font-bold text-[var(--danger)]">جلسة غير مناسبة لبوابة العملاء</h2>
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
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">بيانات الحساب</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">استخدم كود دخول من 8 إلى 32 حرفًا أو رقمًا.</p>
                </div>
                <ClientSignupForm />
                <p className="mt-5 text-center text-sm text-[var(--muted)]">
                  لديك حساب بالفعل؟{" "}
                  <Link className="font-semibold text-[var(--primary)] hover:underline" href="/client/login">
                    تسجيل دخول العميل
                  </Link>
                </p>
              </>
            )}
          </section>
        </div>

        <CopyrightFooter className="px-0" />
      </section>
    </main>
  );
}
