import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getActiveAppUser } from "@/lib/auth/user-profile";
import { adminAuth } from "@/lib/firebase-admin";
import type { AppUser, UserRole } from "@/types";

export interface CurrentSession {
  uid: string;
  role: UserRole;
  user: AppUser;
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedCookie = await adminAuth().verifySessionCookie(sessionCookie, true);
    const user = await getActiveAppUser(decodedCookie.uid);

    if (!user) {
      return null;
    }

    return {
      uid: user.uid,
      role: user.role,
      user,
    };
  } catch (_error: unknown) {
    return null;
  }
}

export async function requireSession(): Promise<CurrentSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(roles: UserRole[]): Promise<CurrentSession> {
  const session = await requireSession();

  if (!roles.includes(session.role)) {
    redirect("/unauthorized");
  }

  return session;
}
