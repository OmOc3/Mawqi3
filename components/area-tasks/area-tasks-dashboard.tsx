import {
  approveDailyAreaTaskAction,
  cancelDailyAreaTaskAction,
  toggleDailyAreaTaskClientVisibilityAction,
} from "@/app/actions/client-visibility";
import { AreaTaskCreateForm } from "@/components/area-tasks/area-task-create-form";
import { DashboardShell } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAppUsers, listClientServiceAreas, listDailyAreaTasks } from "@/lib/db/repositories";
import type { AppTimestamp, DailyAreaTask, DailyAreaTaskStatus, SprayStatus } from "@/types";

interface AreaTasksDashboardProps {
  role: "manager" | "supervisor";
}

const taskStatusLabels: Record<DailyAreaTaskStatus, string> = {
  approved: "معتمدة للفني",
  cancelled: "ملغاة",
  completed: "تم التنفيذ",
  pending_manager_approval: "بانتظار اعتماد المدير",
};

const sprayStatusLabels: Record<SprayStatus, string> = {
  not_sprayed: "لم يتم الرش",
  sprayed: "تم الرش",
};

function formatTimestamp(timestamp?: AppTimestamp): string {
  if (!timestamp) return "غير متاح";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp.toDate());
}

function taskTone(status: DailyAreaTaskStatus): "active" | "inactive" | "pending" | "rejected" | "reviewed" {
  if (status === "pending_manager_approval") return "pending";
  if (status === "approved") return "active";
  if (status === "completed") return "reviewed";
  return "rejected";
}

function TaskActions({ role, task }: { role: "manager" | "supervisor"; task: DailyAreaTask }) {
  return (
    <div className="flex flex-wrap gap-2">
      {role === "manager" && task.status === "pending_manager_approval" ? (
        <form action={approveDailyAreaTaskAction}>
          <input name="taskId" type="hidden" value={task.taskId} />
          <button className="inline-flex min-h-9 items-center rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)]" type="submit">
            اعتماد
          </button>
        </form>
      ) : null}

      {task.status !== "completed" && task.status !== "cancelled" ? (
        <form action={cancelDailyAreaTaskAction}>
          <input name="taskId" type="hidden" value={task.taskId} />
          <button className="inline-flex min-h-9 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface-subtle)]" type="submit">
            إلغاء
          </button>
        </form>
      ) : null}

      {task.status === "completed" ? (
        <form action={toggleDailyAreaTaskClientVisibilityAction}>
          <input name="taskId" type="hidden" value={task.taskId} />
          <input name="clientVisible" type="hidden" value={task.clientVisible ? "false" : "true"} />
          <button className="inline-flex min-h-9 items-center rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)]" type="submit">
            {task.clientVisible ? "إخفاء من العميل" : "نشر للعميل"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export async function AreaTasksDashboard({ role }: AreaTasksDashboardProps) {
  const [areas, tasks, users] = await Promise.all([
    listClientServiceAreas(),
    listDailyAreaTasks({}, 200),
    listAppUsers(),
  ]);
  const technicians = users.filter((user) => user.role === "technician" && user.isActive);
  const technicianNames = new Map(technicians.map((technician) => [technician.uid, technician.displayName]));
  const clientNames = new Map(users.filter((user) => user.role === "client").map((client) => [client.uid, client.displayName]));
  const pendingCount = tasks.filter((task) => task.status === "pending_manager_approval").length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const publishedCount = tasks.filter((task) => task.clientVisible).length;

  return (
    <DashboardShell role={role}>
      <PageHeader
        backHref={`/dashboard/${role}`}
        description="إنشاء جدول يومي للمناطق، اعتماد المدير للمهام، ثم نشر نتيجة الرش للعميل بعد تنفيذ الفني."
        title="المهام اليومية للمناطق"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card">
          <p className="text-sm font-semibold text-[var(--muted)]">بانتظار المدير</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card">
          <p className="text-sm font-semibold text-[var(--muted)]">تم التنفيذ</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{completedCount}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card">
          <p className="text-sm font-semibold text-[var(--muted)]">منشورة للعميل</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{publishedCount}</p>
        </div>
      </div>

      <AreaTaskCreateForm
        areas={areas.filter((area) => area.isActive).map((area) => ({
          areaId: area.areaId,
          clientName: area.clientName,
          location: area.location,
          name: area.name,
        }))}
        technicians={technicians.map((technician) => ({
          displayName: technician.displayName,
          uid: technician.uid,
        }))}
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">جدول المهام</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">المهام المعتمدة فقط تظهر للفني في شاشة المسح.</p>
          </div>
          <StatusBadge tone="inactive">{tasks.length} مهمة</StatusBadge>
        </div>

        {tasks.length === 0 ? (
          <p className="mt-5 rounded-lg bg-[var(--surface-subtle)] p-4 text-sm text-[var(--muted)]">لا توجد مهام مناطق حتى الآن.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">العميل</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">المنطقة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">الفني</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">نتيجة الرش</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">ظهور العميل</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)]">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {tasks.map((task) => (
                  <tr className="align-top transition-colors hover:bg-[var(--surface-subtle)]" key={task.taskId}>
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                      {clientNames.get(task.clientUid) ?? task.clientName ?? "عميل"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{task.areaName ?? task.areaId}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{task.areaLocation}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)]">
                      {technicianNames.get(task.technicianUid) ?? task.technicianName ?? task.technicianUid}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)]" dir="ltr">{task.scheduledDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={taskTone(task.status)}>{taskStatusLabels[task.status]}</StatusBadge>
                      {task.completedAt ? <p className="mt-1 text-xs text-[var(--muted)]">{formatTimestamp(task.completedAt)}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)]">
                      {task.sprayStatus ? sprayStatusLabels[task.sprayStatus] : "لم يسجل بعد"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={task.clientVisible ? "reviewed" : "inactive"}>
                        {task.clientVisible ? "ظاهر" : "مخفي"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <TaskActions role={role} task={task} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
