import type { Metadata } from "next";
import { updateClientOrderStatusAction } from "@/app/actions/client-orders";
import { DashboardShell } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/server-session";
import { getStationLocations, listClientOrders } from "@/lib/db/repositories";

export const metadata: Metadata = {
  title: "طلبات العملاء - المشرف",
};

const statuses = [
  { value: "pending", label: "جديد" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
] as const;

export default async function SupervisorClientOrdersPage() {
  await requireRole(["supervisor", "manager"]);
  const orders = await listClientOrders();
  const stationLocations = await getStationLocations(orders.map((order) => order.stationId));

  return (
    <DashboardShell role="supervisor">
        <PageHeader description="متابعة طلبات العملاء وتحديث حالة التنفيذ." title="طلبات العملاء" />

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card">
          <table className="w-full min-w-[860px]">
            <thead className="bg-[var(--surface-subtle)]">
              <tr>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted)]">العميل</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted)]">المحطة</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted)]">الموقع</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted)]">الحالة</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted)]">تحديث</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {orders.map((order) => (
                <tr key={order.orderId}>
                  <td className="px-3 py-2 text-sm text-[var(--foreground)]">{order.clientName}</td>
                  <td className="px-3 py-2 text-sm text-[var(--foreground)]">{order.stationLabel}</td>
                  <td className="px-3 py-2 text-sm text-[var(--muted)]">{stationLocations.get(order.stationId) ?? "غير متاح"}</td>
                  <td className="px-3 py-2 text-sm text-[var(--foreground)]">{statuses.find((status) => status.value === order.status)?.label ?? order.status}</td>
                  <td className="px-3 py-2 text-sm">
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateClientOrderStatusAction(formData);
                      }}
                      className="flex gap-2"
                    >
                      <input name="orderId" type="hidden" value={order.orderId} />
                      <select aria-label="حالة الطلب" className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" defaultValue={order.status} name="status">
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <button className="min-h-11 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]" type="submit">
                        حفظ
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </DashboardShell>
  );
}
