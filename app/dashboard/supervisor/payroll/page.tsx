import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "غير متاح",
};

export default async function SupervisorPayrollPage() {
  await requireRole(["manager"]);
  notFound();
}
