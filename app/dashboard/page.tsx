import { redirect } from "next/navigation";
import { getRoleRedirect } from "@/lib/auth/redirects";
import { requireSession } from "@/lib/auth/server-session";

export default async function DashboardIndexPage() {
  const session = await requireSession();

  redirect(getRoleRedirect(session.role));
}
