"use server";

import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "@/lib/i18n";

/**
 * Persists locale on the response so the next RSC request (e.g. router.refresh) sees it.
 * Client-only `document.cookie` can race with refresh and leave the server on the default locale.
 */
export async function setPreferredLocaleAction(rawLocale: string): Promise<void> {
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const jar = await cookies();

  jar.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
