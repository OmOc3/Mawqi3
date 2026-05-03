import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { getI18nMessages, getRequestLocale } from "@/lib/i18n/server";

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = getI18nMessages(locale);

  const defaultTitle =
    locale === "ar" ? `${t.appNameArabic} | ${t.appTitle}` : `${t.appName} | ${t.appTitle}`;

  return {
    title: {
      default: defaultTitle,
      template: `%s | ${t.appName}`,
    },
    description:
      locale === "ar"
        ? `${t.appNameArabic} — ${t.appTitle}.`
        : `${t.appName} manages bait stations, QR inspections, field reports, and review workflows.`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html data-default-locale="ar" data-locale={locale} dir={direction} lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <Script id="theme-script" src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <LanguageProvider initialLocale={locale}>
          <LanguageSwitcher />
          {children}
          <RegisterServiceWorker />
          <Analytics />
          <SpeedInsights />
        </LanguageProvider>
      </body>
    </html>
  );
}
