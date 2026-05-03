import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AreaTaskCompleteForm } from "@/components/area-tasks/area-task-complete-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/server-session";
import { formatIsoDateRome } from "@/lib/datetime";
import { getActiveDailyAreaTaskForScan, getClientServiceAreaById } from "@/lib/db/repositories";
import { verifyServiceAreaQrToken } from "@/lib/qr/station-qr-token";

export const metadata: Metadata = {
  title: "تسجيل رش المنطقة",
};

interface AreaScanPageProps {
  params: Promise<{
    areaId: string;
  }>;
  searchParams: Promise<{
    qr?: string;
  }>;
}

export default async function AreaScanPage({ params, searchParams }: AreaScanPageProps) {
  const session = await requireRole(["technician", "manager"]);
  const { areaId } = await params;
  const query = await searchParams;
  const area = await getClientServiceAreaById(areaId);

  if (!area) {
    notFound();
  }

  const hasValidQr = verifyServiceAreaQrToken(areaId, query.qr);
  const today = formatIsoDateRome(new Date()) ?? new Date().toISOString().slice(0, 10);
  const task =
    hasValidQr && session.role === "technician"
      ? await getActiveDailyAreaTaskForScan({
          areaId,
          scheduledDate: today,
          technicianUid: session.uid,
        })
      : null;

  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-8 text-right" dir="rtl">
      <section className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--primary)]">QR منطقة</p>
              <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">{area.name}</h1>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{area.location}</p>
            </div>
            <StatusBadge tone={area.isActive ? "active" : "inactive"}>{area.isActive ? "نشطة" : "موقوفة"}</StatusBadge>
          </div>
        </header>

        {!hasValidQr ? (
          <section className="rounded-2xl border border-[var(--danger-muted)] bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-card">
            <h2 className="text-lg font-bold">QR غير صالح</h2>
            <p className="mt-2 text-sm leading-6">استخدم QR المنطقة الصادر من لوحة الإدارة.</p>
          </section>
        ) : null}

        {hasValidQr && !task ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
            <h2 className="text-lg font-bold text-[var(--foreground)]">لا توجد مهمة معتمدة اليوم</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              لن يتم تسجيل نتيجة الرش إلا إذا كان المدير اعتمد مهمة لهذه المنطقة وهذا الفني في تاريخ اليوم.
            </p>
            <Link className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]" href="/scan">
              العودة للماسح
            </Link>
          </section>
        ) : null}

        {task ? (
          <section className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
              <h2 className="text-lg font-bold text-[var(--foreground)]">تسجيل نتيجة الرش</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-[var(--muted)]">تاريخ المهمة</dt>
                  <dd className="mt-1 text-[var(--foreground)]" dir="ltr">{task.scheduledDate}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--muted)]">الحالة</dt>
                  <dd className="mt-1 text-[var(--foreground)]">{task.status === "completed" ? "تم تنفيذها من قبل" : "معتمدة للتنفيذ"}</dd>
                </div>
              </dl>
            </div>
            <AreaTaskCompleteForm taskId={task.taskId} />
          </section>
        ) : null}
      </section>
    </main>
  );
}
