"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-provider";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface CopyrightFooterProps {
  className?: string;
}

export function CopyrightFooter({ className }: CopyrightFooterProps) {
  const { direction, messages } = useLanguage();
  const year = BRAND.copyrightYear();

  return (
    <footer
      className={cn(
        "mx-auto w-full max-w-7xl px-4 py-6 text-center text-xs leading-6 text-[var(--muted)] sm:px-6 lg:px-8",
        className,
      )}
      dir={direction}
    >
      <div className="flex flex-col items-center justify-center gap-2 border-t border-[var(--border)] pt-5 sm:flex-row sm:flex-wrap">
        <p>
          © {year} {BRAND.companyName}
          {direction === "rtl" ? ` · ${BRAND.companyNameArabic}` : null}. {messages.legal.allRightsReserved}
        </p>
        <nav className="flex items-center justify-center gap-3" aria-label={messages.legal.copyright}>
          <Link className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]" href="/legal/terms">
            {messages.legal.terms}
          </Link>
          <Link className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]" href="/legal/privacy">
            {messages.legal.privacy}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
