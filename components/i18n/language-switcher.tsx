"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { supportedLocales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLanguage } from "./language-provider";

const localeLabels: Record<Locale, string> = {
  ar: "AR",
  en: "EN",
};

const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export function LanguageSwitcher() {
  const router = useRouter();
  const { direction, locale, setLocale } = useLanguage();
  const positionClassName = direction === "rtl" ? "left-3 sm:left-5" : "right-3 sm:right-5";

  function handleLocaleChange(nextLocale: Locale): void {
    if (nextLocale === locale) {
      return;
    }

    setLocale(nextLocale);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      aria-label={direction === "rtl" ? "اختيار اللغة" : "Choose language"}
      className={cn(
        "fixed top-3 z-[80] inline-flex overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 text-xs font-bold shadow-control",
        positionClassName,
      )}
      data-no-translate
      role="group"
    >
      {supportedLocales.map((localeOption) => {
        const isActive = localeOption === locale;

        return (
          <button
            aria-label={localeNames[localeOption]}
            aria-pressed={isActive}
            className={cn(
              "min-h-8 min-w-10 rounded-md px-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
              isActive
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]",
            )}
            key={localeOption}
            onClick={() => handleLocaleChange(localeOption)}
            title={localeNames[localeOption]}
            type="button"
          >
            {localeLabels[localeOption]}
          </button>
        );
      })}
    </div>
  );
}
