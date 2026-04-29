import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { extractPortableBetterAuthCookieHeader, unsealMobileWebSessionCookieHeader } from "@/lib/auth/mobile-web-session-cookies";
import { createSignedRoleCookie } from "@/lib/auth/role-cookie";
import { setRoleCookie } from "@/lib/auth/session";
import { getSessionMaxAgeMs, getSessionMaxAgeSeconds } from "@/lib/auth/session-config";
import { consumeMobileWebSessionRecord } from "@/lib/db/repositories";

export const runtime = "nodejs";

const validRedirects = new Set(["/dashboard/manager", "/dashboard/supervisor"]);

function hashHandoffToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function loginRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
}

function appendStoredAuthCookies(response: NextResponse, cookieHeader: string): void {
  const portableCookieHeader = extractPortableBetterAuthCookieHeader(cookieHeader);

  if (!portableCookieHeader) {
    return;
  }

  portableCookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.includes("="))
    .forEach((cookie) => {
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

      response.headers.append(
        "Set-Cookie",
        `${cookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${getSessionMaxAgeSeconds()}${secure}`,
      );
    });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return loginRedirect(request);
  }

  try {
    const consumedSession = await consumeMobileWebSessionRecord(hashHandoffToken(token));

    if (!consumedSession || !validRedirects.has(consumedSession.redirectTo)) {
      return loginRedirect(request);
    }

    const response = NextResponse.redirect(new URL(consumedSession.redirectTo, request.nextUrl.origin));
    const roleCookie = await createSignedRoleCookie({
      uid: consumedSession.uid,
      role: consumedSession.role,
      expiresAt: Date.now() + getSessionMaxAgeMs(),
    });

    const cookieHeader = unsealMobileWebSessionCookieHeader(consumedSession.cookieHeader);

    if (!cookieHeader) {
      return loginRedirect(request);
    }

    appendStoredAuthCookies(response, cookieHeader);
    setRoleCookie(response, roleCookie);

    return response;
  } catch (_error: unknown) {
    return loginRedirect(request);
  }
}
