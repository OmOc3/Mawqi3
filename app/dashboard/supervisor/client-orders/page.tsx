import type { Metadata } from "next";
import {
  ClientOrderOperationalStatusForm,
  ClientOrderReviewActions,
  isOrderAwaitingAdminApproval,
  resolveOrderLocationText,
} from "@/components/client-orders/client-order-review-actions";
import { OrderStatusTimeline } from "@/components/client-orders/order-status-timeline";
import { DashboardShell } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/server-session";
import { getStationLocations, listClientOrders, listAttendanceSessionsForAdmin } from "@/lib/db/repositories";
import type { AppTimestamp, ClientOrder, ClientOrderStatus } from "@/types";

// Serializable order for client components
interface SerializableOrder {
  orderId: string;
  clientUid: string;
  stationId?: string | null;
  stationLabel: string;
  clientName: string;
  status: ClientOrderStatus;
  note?: string | null;
  photoUrl?: string | null;
  createdAt?: string | null;
}

// Convert ClientOrder to serializable format
function toSerializableOrder(order: ClientOrder): SerializableOrder {
  return {
    orderId: order.orderId,
    clientUid: order.clientUid,
    stationId: order.stationId,
    stationLabel: order.stationLabel,
    clientName: order.clientName,
    status: order.status,
    note: order.note,
    photoUrl: order.photoUrl,
    createdAt: order.createdAt?.toDate().toISOString() ?? null,
  };
}

export const metadata: Metadata = {
  title: "العملاء والطلبات - المشرف",
};

function formatTimestamp(timestamp?: AppTimestamp): string {
  if (!timestamp) {
    return "غير متاح";
  }
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp.toDate());
}

// Serializable attendance info
interface AttendanceInfo {
  technicianName: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
}

// Find attendance session and convert to serializable data
function findAttendanceForOrder(order: ClientOrder, attendanceLogs: Array<{ technicianName: string; clockInAt?: AppTimestamp | null; clockOutAt?: AppTimestamp | null; clockInLocation?: { stationId: string } | null }>): AttendanceInfo | null {
  if (!order.stationId || order.stationId.length === 0) return null;

  const stationAttendance = attendanceLogs.find(
    (log) => log.clockInLocation?.stationId === order.stationId
  );
  if (!stationAttendance) return null;
  
  return {
    technicianName: stationAttendance.technicianName,
    clockInAt: stationAttendance.clockInAt?.toDate().toISOString() ?? null,
    clockOutAt: stationAttendance.clockOutAt?.toDate().toISOString() ?? null,
  };
}

function OrderCard({ attendance, location, order }: { attendance: AttendanceInfo | null; location: string; order: ClientOrder }) {
  const serializableOrder = toSerializableOrder(order);
  const needsDecision = isOrderAwaitingAdminApproval(order);

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--muted)]">المحطة</p>
          <h3 className="mt-1 truncate text-base font-bold text-[var(--foreground)]">{order.stationLabel}</h3>
        </div>
        <OrderStatusTimeline compact order={serializableOrder} attendanceSession={attendance} />
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-[var(--primary)] hover:underline">
          تتبع الحالة
        </summary>
        <div className="mt-3 rounded-lg bg-[var(--surface-subtle)] p-3">
          <OrderStatusTimeline order={serializableOrder} attendanceSession={attendance} />
        </div>
      </details>

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-medium text-[var(--muted)]">العميل</dt>
          <dd className="mt-1 text-[var(--foreground)]">{order.clientName}</dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--muted)]">الموقع المقترح</dt>
          <dd className="mt-1 text-[var(--muted)]">{location}</dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--muted)]">تاريخ الطلب</dt>
          <dd className="mt-1 text-[var(--foreground)]">{formatTimestamp(order.createdAt)}</dd>
        </div>
      </dl>

      {order.proposalDescription ? (
        <div className="mt-3 text-sm">
          <p className="text-xs font-medium text-[var(--muted)]">وصف المحطة من العميل</p>
          <p className="mt-1 text-[var(--foreground)]">{order.proposalDescription}</p>
        </div>
      ) : null}
      {order.decisionNote ? (
        <div className="mt-3 text-sm">
          <p className="text-xs font-medium text-[var(--muted)]">ملاحظة القرار</p>
          <p className="mt-1 text-[var(--foreground)]">{order.decisionNote}</p>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3">
        <p className="text-xs font-medium text-[var(--muted)]">ملاحظات</p>
        <p className="mt-1 text-sm text-[var(--foreground)]">{order.note ?? "لا توجد ملاحظات"}</p>
      </div>

      <div className="mt-4 space-y-3">
        {needsDecision ? (
          <ClientOrderReviewActions orderId={order.orderId} />
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--muted)]">تحديث حالة التنفيذ</p>
            <ClientOrderOperationalStatusForm defaultStatus={order.status} orderId={order.orderId} />
          </div>
        )}
      </div>
    </article>
  );
}

export default async function SupervisorClientOrdersPage() {
  await requireRole(["supervisor", "manager"]);
  const orders = await listClientOrders();
  const assignedStationIds = orders
    .map((order) => order.stationId)
    .filter((stationId): stationId is string => stationId != null && stationId.length > 0);
  const stationLocations = await getStationLocations(assignedStationIds);
  const attendanceLogs = await listAttendanceSessionsForAdmin({}, 100);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    inProgress: orders.filter((o) => o.status === "in_progress").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <DashboardShell role="supervisor">
      <PageHeader
        backHref="/dashboard/supervisor"
        description="مراجعة طلبات الفحص: اعتماد الطلب قبل إنشاء المحطة أو رفضه، ثم متابعة حالة التنفيذ."
        title="العملاء والطلبات"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card">
          <p className="text-xs font-medium text-[var(--muted)]">إجمالي الطلبات</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--foreground)]">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card">
          <p className="text-xs font-medium text-[var(--muted)]">جديدة</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card">
          <p className="text-xs font-medium text-[var(--muted)]">قيد التنفيذ</p>
          <p className="mt-2 text-2xl font-extrabold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card">
          <p className="text-xs font-medium text-[var(--muted)]">مكتملة</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card">
          <p className="text-xs font-medium text-[var(--muted)]">ملغاة</p>
          <p className="mt-2 text-2xl font-extrabold text-rose-600">{stats.cancelled}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card">
          <EmptyState
            description="ستظهر طلبات العملاء هنا عندما يقوم العملاء بإنشاء طلبات فحص جديدة من بوابتهم."
            title="لا توجد طلبات حالياً"
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {orders.map((order) => (
              <OrderCard
                key={order.orderId}
                attendance={findAttendanceForOrder(order, attendanceLogs)}
                location={resolveOrderLocationText(order, stationLocations)}
                order={order}
              />
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">العميل</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">المحطة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">الموقع</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">التاريخ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">تحديث</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {orders.map((order) => {
                    const attendance = findAttendanceForOrder(order, attendanceLogs);
                    return (
                    <tr className="transition-colors hover:bg-[var(--surface-subtle)]" key={order.orderId}>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{order.clientName}</td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{order.stationLabel}</td>
                      <td className="px-4 py-3 text-sm text-[var(--muted)]">{resolveOrderLocationText(order, stationLocations)}</td>
                      <td className="px-4 py-3 text-sm text-[var(--muted)]">{formatTimestamp(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <OrderStatusTimeline compact order={toSerializableOrder(order)} attendanceSession={attendance} />
                      </td>
                      <td className="px-4 py-3">
                        {isOrderAwaitingAdminApproval(order) ? (
                          <ClientOrderReviewActions compact orderId={order.orderId} />
                        ) : (
                          <ClientOrderOperationalStatusForm
                            defaultStatus={order.status}
                            orderId={order.orderId}
                            variant="compact"
                          />
                        )}
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
