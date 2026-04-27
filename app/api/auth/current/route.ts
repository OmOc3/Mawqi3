import { NextResponse } from "next/server";
import { createSignedRoleCookie } from "@/lib/auth/role-cookie";
import { getRoleRedirect } from "@/lib/auth/redirects";
import { setRoleCookie } from "@/lib/auth/session";
import { getSessionMaxAgeMs } from "@/lib/auth/session-config";
import { getCurrentSession } from "@/lib/auth/server-session";
import { toAuthenticatedUserResponse } from "@/lib/auth/public-user";
import type { ApiErrorResponse, LoginSuccessResponse } from "@/types";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse<ApiErrorResponse | LoginSuccessResponse>> {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        code: "AUTH_REQUIRED",
        message: "سجل الدخول مرة أخرى.",
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json<LoginSuccessResponse>({
    redirectTo: getRoleRedirect(session.role),
    user: toAuthenticatedUserResponse(session.user),
  });
  const roleCookie = await createSignedRoleCookie({
    uid: session.uid,
    role: session.role,
    expiresAt: Date.now() + getSessionMaxAgeMs(),
  });

  setRoleCookie(response, roleCookie);

  return response;
}
