import { NextRequest, NextResponse } from "next/server";
import { ROLE_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySignedRoleCookie } from "@/lib/auth/role-cookie";

const publicPrefixes = ["/login", "/unauthorized", "/scan", "/api/auth", "/api/mobile"];

function isPublicPath(pathname: string): boolean {
  return pathname === "/" || publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();

  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  try {
    const pathname = request.nextUrl.pathname;
    const roleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value;
    const payload = await verifySignedRoleCookie(roleCookie);

    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    if (!payload) {
      return redirectToLogin(request);
    }

    return NextResponse.next();
  } catch (_error: unknown) {
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
