import { DashboardShell } from "@/components/layout/dashboard-page";

export default function SupervisorPayrollLoading() {
  return (
    <DashboardShell role="supervisor">
      <div className="animate-pulse space-y-4">
        <div className="h-10 rounded-lg bg-[var(--surface-subtle)]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-24 rounded-xl bg-[var(--surface-subtle)]" />
          <div className="h-24 rounded-xl bg-[var(--surface-subtle)]" />
        </div>
      </div>
    </DashboardShell>
  );
}
