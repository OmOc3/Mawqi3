import { runClientOrderStatusFormAction } from "@/app/actions/client-orders";
import type { ClientOrderStatus } from "@/types";

export function isOrderAwaitingAdminApproval(order: { stationId?: string | null | undefined; status: ClientOrderStatus }): boolean {
  return order.status === "pending" && (order.stationId == null || String(order.stationId).length === 0);
}

export function resolveOrderLocationText(
  order: {
    proposalLocation?: string | null | undefined;
    stationId?: string | null | undefined;
    station?: { location?: string } | undefined;
  },
  stationLocations: Map<string, string>,
): string {
  const fromStationRow =
    typeof order.stationId === "string" && order.stationId.length > 0 ? stationLocations.get(order.stationId) : undefined;
  if (fromStationRow && fromStationRow.trim().length > 0) {
    return fromStationRow;
  }
  const fromSnapshot = order.station?.location;
  if (fromSnapshot && fromSnapshot.trim().length > 0) {
    return fromSnapshot;
  }
  const prop = order.proposalLocation?.trim();
  return prop !== undefined && prop.length > 0 ? prop : "غير متاح";
}

interface ClientOrderReviewActionsProps {
  compact?: boolean;
  orderId: string;
}

const statusChoices: ReadonlyArray<{ label: string; value: ClientOrderStatus }> = [
  { value: "pending", label: "جديد" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

interface ClientOrderOperationalStatusFormProps {
  defaultStatus: ClientOrderStatus;
  orderId: string;
  variant?: "compact" | "default";
}

export function ClientOrderOperationalStatusForm({
  defaultStatus,
  orderId,
  variant,
}: ClientOrderOperationalStatusFormProps) {
  const compact = variant === "compact";
  return (
    <form action={runClientOrderStatusFormAction} className={compact ? "flex gap-2" : "flex flex-wrap items-center gap-2"}>
      <input name="orderId" type="hidden" value={orderId} />
      <select
        aria-label="تحديث حالة الطلب"
        className={
          compact
            ? "min-h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            : "min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-control focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        }
        defaultValue={defaultStatus}
        name="status"
      >
        {statusChoices.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        className={
          compact
            ? "min-h-10 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)]"
            : "inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-all duration-150 hover:bg-[var(--primary-hover)]"
        }
        type="submit"
      >
        حفظ
      </button>
    </form>
  );
}

export function ClientOrderReviewActions({ compact, orderId }: ClientOrderReviewActionsProps) {
  const approve = (
    <form action={runClientOrderStatusFormAction} className={compact ? "inline" : undefined}>
      <input name="orderId" type="hidden" value={orderId} />
      <input name="status" type="hidden" value="in_progress" />
      <button
        className={`inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 ${compact ? "min-h-10" : "min-h-11"}`}
        type="submit"
      >
        اعتماد الطلب
      </button>
    </form>
  );

  const rejectForm = (
    <form action={runClientOrderStatusFormAction} className={`space-y-2 ${compact ? "w-full max-w-[14rem]" : ""}`} dir="rtl">
      <input name="orderId" type="hidden" value={orderId} />
      <input name="status" type="hidden" value="cancelled" />
      <label className="sr-only" htmlFor={`reject-note-${orderId}`}>
        سبب الرفض (اختياري)
      </label>
      <textarea
        className={`w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm ${compact ? "" : "min-h-[4.5rem]"}`}
        id={`reject-note-${orderId}`}
        maxLength={600}
        name="decisionNote"
        placeholder="سبب الرفض (اختياري)"
      />
      <button
        className={`inline-flex w-full items-center justify-center rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 ${compact ? "min-h-10" : "min-h-11"}`}
        type="submit"
      >
        رفض الطلب
      </button>
    </form>
  );

  if (compact) {
    return (
      <div className="flex flex-wrap items-start gap-2">
        {approve}
        {rejectForm}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <p className="mb-3 text-sm font-semibold text-amber-900 dark:text-amber-200">
        هذا الطلب في انتظار موافقة الإدارة — لا توجد محطة بعد في النظام.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {approve}
        <div className="min-w-[min(100%,280px)] flex-1">{rejectForm}</div>
      </div>
    </div>
  );
}
