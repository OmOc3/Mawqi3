import "server-only";

import { cookies } from "next/headers";
import { getLocaleDirection, getLocaleFromValue, localeCookieName, type Locale, type LocaleDirection } from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();

  return getLocaleFromValue(cookieStore.get(localeCookieName)?.value);
}

export async function getRequestLocaleDirection(): Promise<LocaleDirection> {
  return getLocaleDirection(await getRequestLocale());
}
