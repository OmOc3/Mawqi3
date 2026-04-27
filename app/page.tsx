import { redirect } from "next/navigation";
import { getRoleRedirect } from "@/lib/auth/redirects";
import { getCurrentSession } from "@/lib/auth/server-session";

export default async function HomePage() {
  const session = await getCurrentSession();

  redirect(session ? getRoleRedirect(session.role) : "/login");
}
