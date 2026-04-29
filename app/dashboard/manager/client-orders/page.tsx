import type { Metadata } from "next";
import Link from "next/link";
import { CreateClientAccountForm } from "@/components/client-orders/create-client-account-form";
import { DashboardShell } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/server-session";
import { listClientDirectory } from "@/lib/db/repositories";
import type { AppTimestamp } from "@/types";

export const metadata: Metadata = {
  title: "ملفات العملاء",
};

function formatTimestamp(timestamp?: AppTimestamp): string {
  if (!timestamp) {
    return "لا توجد طلبات";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp.toDate());
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("");

  return initials || "ع";
}

export default async function ManagerClientOrdersPage() {
  await requireRole(["manager"]);
  const clients = await listClientDirectory();
  const totalOrders = clients.reduce((sum, client) => sum + client.totalOrders, 0);
  const openOrders = clients.reduce((sum, client) => sum + client.pendingOrders + client.inProgressOrders, 0);
  const completedOrders = clients.reduce((sum, client) => sum + client.completedOrders, 0);
  const missingContactCount = clients.filter((client) => !client.profile?.phone && (client.profile?.addresses.length ?? 0) === 0).length;

  return (
    <DashboardShell role="manager">
        <PageHeader
          backHref="/dashboard/manager"
          description="ملفات كاملة لكل عميل: بيانات التواصل، العناوين، الطلبات، والمحطات التي أضافها العميل."
          title="ملفات العملاء"
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
            <p className="text-sm font-medium text-[var(--muted)]">إجمالي العملاء</p>
            <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{clients.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
            <p className="text-sm font-medium text-[var(--muted)]">طلبات مفتوحة</p>
            <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{openOrders}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
            <p className="text-sm font-medium text-[var(--muted)]">طلبات مكتملة</p>
            <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{completedOrders}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
            <p className="text-sm font-medium text-[var(--muted)]">بيانات ناقصة</p>
            <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{missingContactCount}</p>
          </div>
        </div>

        <CreateClientAccountForm />

        {clients.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card">
            <EmptyState description="أنشئ حساب عميل من النموذج أعلاه، ثم ستظهر ملفاته هنا." title="لا يوجد عملاء بعد" />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {clients.map((client) => {
              const primaryAddress = client.profile?.addresses[0];
              const extraAddressCount = Math.max((client.profile?.addresses.length ?? 0) - 1, 0);

              return (
                <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card" key={client.client.uid}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--surface-subtle)] text-lg font-bold text-[var(--foreground)] ring-1 ring-[var(--border)]">
                        {getInitials(client.client.displayName)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-[var(--foreground)]">{client.client.displayName}</h2>
                        <p className="truncate text-sm text-[var(--muted)]" dir="ltr">
                          {client.client.email}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone={client.client.isActive ? "active" : "inactive"}>{client.client.isActive ? "نشط" : "غير نشط"}</StatusBadge>
                  </div>

                  <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="border-b border-[var(--border-subtle)] pb-3">
                      <dt className="text-xs font-semibold text-[var(--muted)]">رقم الهاتف</dt>
                      <dd className="mt-1 text-sm font-semibold text-[var(--foreground)]" dir="ltr">
                        {client.profile?.phone ?? "غير مسجل"}
                      </dd>
                    </div>
                    <div className="border-b border-[var(--border-subtle)] pb-3">
                      <dt className="text-xs font-semibold text-[var(--muted)]">آخر طلب</dt>
                      <dd className="mt-1 text-sm font-semibold text-[var(--foreground)]">{formatTimestamp(client.latestOrderAt)}</dd>
                    </div>
                    <div className="border-b border-[var(--border-subtle)] pb-3 sm:col-span-2">
                      <dt className="text-xs font-semibold text-[var(--muted)]">العنوان الأساسي</dt>
                      <dd className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                        {primaryAddress ?? "لم يتم تسجيل عنوان للعميل"}
                        {extraAddressCount > 0 ? <span className="ms-2 text-xs text-[var(--muted)]">+{extraAddressCount} عناوين أخرى</span> : null}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold text-[var(--muted)]">آخر موقع محطة أضافه العميل</dt>
                      <dd className="mt-1 text-sm leading-6 text-[var(--foreground)]">{client.latestStationLocation ?? "لا توجد محطة مرتبطة بعد"}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <StatusBadge tone="pending">جديد: {client.pendingOrders}</StatusBadge>
                    <StatusBadge tone="active">قيد التنفيذ: {client.inProgressOrders}</StatusBadge>
                    <StatusBadge tone="reviewed">مكتمل: {client.completedOrders}</StatusBadge>
                    <StatusBadge tone="rejected">ملغي: {client.cancelledOrders}</StatusBadge>
                    <StatusBadge tone="inactive">محطات: {client.stationCount}</StatusBadge>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
                    <p className="text-sm text-[var(--muted)]">إجمالي الطلبات: {client.totalOrders}</p>
                    <Link
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-all duration-150 hover:bg-[var(--primary-hover)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                      href={`/dashboard/manager/client-orders/${client.client.uid}`}
                    >
                      فتح ملف العميل
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalOrders === 0 && clients.length > 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--muted)] shadow-card">
            يوجد عملاء مسجلون، لكن لم يتم إنشاء طلبات فحص من بوابة العميل حتى الآن.
          </p>
        ) : null}
    </DashboardShell>
  );
}
