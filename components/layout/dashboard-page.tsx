import type { ReactNode } from "react";
import { DashboardNav } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  role: "manager" | "supervisor";
}

export function DashboardShell({ children, className, contentClassName, role }: DashboardShellProps) {
  return (
    <main
      className={cn(
        "dashboard-shell min-h-dvh bg-[var(--background)] text-start",
        className,
      )}
    >
      <section className={cn("dashboard-shell__content mx-auto", contentClassName ?? "max-w-7xl")}>
        {children}
        <div className="contents">
          <DashboardNav role={role} />
        </div>
      </section>
    </main>
  );
}
