import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { RoleRedirectWatcher } from "@/components/auth/role-redirect-watcher";
import { CopyrightFooter } from "@/components/legal/copyright-footer";
import { BrandLockup } from "@/components/layout/brand";
import { ManualStationEntry } from "@/components/station/manual-station-entry";
import { NearbyStations } from "@/components/station/nearby-stations";
import { WebQrScanner } from "@/components/station/web-qr-scanner";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getCurrentSession } from "@/lib/auth/server-session";
import { listAttendanceSessions, listReportsForTechnician, listStations } from "@/lib/db/repositories";
import { i18n } from "@/lib/i18n";
import { statusOptionLabels } from "@ecopest/shared/constants";
import type { AppTimestamp, Report, Station } from "@/types";

function IconFrame({ children, className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" className={className || "h-5 w-5 shrink-0"} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      {children}
    </svg>
  );
}

function ScanBarcode(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M8 7v10" /><path d="M12 7v10" /><path d="M16 7v10" /></IconFrame>;
}
function MapPin(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></IconFrame>;
}
function Clock(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></IconFrame>;
}
function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></IconFrame>;
}
function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></IconFrame>;
}
function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></IconFrame>;
}
function Phone(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></IconFrame>;
}
function Mail(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></IconFrame>;
}
function ArrowLeft(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></IconFrame>;
}
function Activity(props: React.SVGProps<SVGSVGElement>) {
  return <IconFrame {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></IconFrame>;
}

export const metadata: Metadata = {
  title: i18n.scan.title,
};

function formatTimestamp(timestamp?: AppTimestamp): string {
  if (!timestamp) {
    return "لم تتم الزيارة";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp.toDate());
}

function supportHref(type: "email" | "phone", value: string): string {
  return type === "email" ? `mailto:${value}` : `tel:${value}`;
}

function SupportCard() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@example.com";
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();

  return (
    <section className="group relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-800 p-8 text-white shadow-xl transition-all hover:shadow-teal-900/20 dark:from-teal-900 dark:to-emerald-950">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <Activity className="h-4 w-4 text-teal-50" />
            </span>
            <h2 className="text-2xl font-bold text-white">دعم الشركة والمساعدة</h2>
          </div>
          <p className="max-w-xl text-teal-100/90 text-sm leading-relaxed md:text-base">
            هل تواجه مشكلة في قراءة رمز الاستجابة السريعة (QR) أو تعذر تسجيل فحص الميدان؟ 
            لا تتردد في التواصل مع فريق الدعم الفني لمساعدتك فوراً.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-teal-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-xl active:translate-y-0"
            href={supportHref("email", supportEmail)}
          >
            <Mail className="h-4 w-4" />
            مراسلة الدعم
          </a>
          {supportPhone ? (
            <a
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:shadow-lg"
              href={supportHref("phone", supportPhone)}
              dir="ltr"
            >
              <Phone className="h-4 w-4" />
              {supportPhone}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StationCard({ station }: { station: Station }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/40 hover:shadow-xl">
      {station.photoUrls?.[0] ? (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            alt={`صورة المحطة ${station.label}`}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            src={station.photoUrls[0]}
            unoptimized
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        </div>
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30">
          <MapPin className="h-10 w-10 text-teal-200 dark:text-teal-800" />
        </div>
      )}
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="mb-2 inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold tracking-wider text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" dir="ltr">
              #{station.stationId}
            </span>
            <h3 className="truncate text-lg font-bold text-[var(--foreground)]">{station.label}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{station.location}</span>
            </p>
          </div>
        </div>
        
        {station.description ? (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
            {station.description}
          </p>
        ) : null}

        <div className="mt-auto space-y-2 rounded-2xl bg-[var(--surface-subtle)] p-3">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> آخر زيارة</span>
            <span className="font-semibold text-[var(--foreground)]">{formatTimestamp(station.lastVisitedAt)}</span>
          </div>
          {station.lastVisitedBy ? (
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> بواسطة</span>
              <span className="font-semibold text-teal-700 dark:text-teal-400">{station.lastVisitedBy}</span>
            </div>
          ) : null}
        </div>

        <Link
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/20 transition-all hover:bg-[var(--primary-hover)] hover:shadow-lg active:scale-[0.98]"
          href={`/station/${station.stationId}/report`}
        >
          فتح نموذج الفحص
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>
    </article>
  );
}

function RecentReport({ report }: { report: Report }) {
  const isPending = report.reviewStatus === "pending";
  return (
    <li className="group flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-500/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isPending ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'}`}>
            {isPending ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-base font-bold text-[var(--foreground)]">{report.stationLabel}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted)]">
              <Calendar className="h-3 w-3" />
              {formatTimestamp(report.submittedAt)}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
          isPending 
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" 
            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
        }`}>
          {isPending ? "بانتظار المراجعة" : report.reviewStatus}
        </span>
      </div>
      
      <div className="ms-13 mt-1 flex flex-wrap gap-1.5">
        {report.status.map((status) => (
          <span key={status} className="inline-flex items-center rounded-md bg-[var(--surface-subtle)] px-2 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            {statusOptionLabels[status]}
          </span>
        ))}
      </div>
    </li>
  );
}

export default async function ScanInstructionsPage() {
  const session = await getCurrentSession();
  const [stations, recentReports, attendanceSessions] = await Promise.all([
    session?.role === "manager" ? listStations() : Promise.resolve([]),
    session?.role === "technician" ? listReportsForTechnician(session.uid, 6) : Promise.resolve([]),
    session?.role === "technician" ? listAttendanceSessions(session.uid, 5) : Promise.resolve([]),
  ]);
  const allActiveStations = stations.filter((station) => station.isActive);
  const activeStations = allActiveStations.slice(0, 6);

  return (
    <main className="min-h-dvh bg-[var(--surface-subtle)] pb-12 text-right" dir="rtl">
      {session ? <RoleRedirectWatcher currentRole={session.role} /> : null}
      
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 p-4 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <BrandLockup />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session ? <LogoutButton buttonClassName="min-h-10 rounded-xl px-4 text-sm shadow-sm" /> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        {/* Main Scanner Section */}
        <section className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
          
          {/* Text Content */}
          <div className="flex flex-col justify-center pt-4 lg:pt-0">
            <div className="mb-6 w-fit inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-bold text-teal-800 shadow-sm dark:border-teal-900/50 dark:bg-teal-900/30 dark:text-teal-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500"></span>
              </span>
              لوحة الفني الميداني
            </div>
            
            <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)] md:text-5xl lg:text-6xl lg:leading-tight">
              {i18n.scan.title}
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
              وجّه كاميرا الهاتف نحو رمز الاستجابة السريعة (QR) المثبت على محطة الطعوم، أو اسمح للتطبيق بتحديد موقعك لعرض وفتح المحطات القريبة منك فوراً.
            </p>

            {!session && (
              <div className="mt-8 flex">
                <Link
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-8 text-base font-bold text-[var(--surface)] shadow-xl transition-all hover:scale-105 hover:bg-[var(--foreground)]/90"
                  href="/login"
                >
                  {i18n.scan.loginCta}
                  <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
                </Link>
              </div>
            )}
          </div>

          {/* Scanner Card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-b from-teal-400 to-[var(--border)] opacity-20 blur-lg transition duration-1000 group-hover:opacity-40" />
            <div className="relative flex flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl">
              
              <div className="rounded-3xl bg-[var(--surface-subtle)] p-4 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
                    <ScanBarcode className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    الماسح الضوئي
                  </h3>
                </div>
                
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-black shadow-inner">
                  <WebQrScanner />
                </div>

                {session?.role === "manager" && (
                  <div className="mt-6">
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-[var(--border)]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-[var(--surface-subtle)] px-3 text-xs font-semibold uppercase text-[var(--muted-foreground)]">إدخال يدوي للإدارة</span>
                      </div>
                    </div>
                    <ManualStationEntry />
                  </div>
                )}
                
                {session?.role === "technician" && (
                  <div className="mt-5 rounded-xl border border-[var(--border)] bg-teal-50/50 p-4 dark:bg-teal-900/10">
                    <p className="flex gap-3 text-sm leading-relaxed text-teal-800 dark:text-teal-300">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      الوصول للمحطات يتم عبر المسح الضوئي أو عن طريق قائمة المحطات القريبة بعد السماح بصلاحيات الموقع.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <SupportCard />

        {/* Dashboard Sections */}
        {session && (
          <div className={`mt-12 ${session.role === "technician" ? "grid gap-8 xl:grid-cols-[1fr_400px]" : "grid gap-8"}`}>
            
            {/* Left Column: Stations (Active/Nearby) */}
            <section className="space-y-6">
              {session.role === "technician" ? (
                <NearbyStations />
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                    <div>
                      <h2 className="flex items-center gap-2 text-2xl font-black text-[var(--foreground)]">
                        <MapPin className="h-6 w-6 text-[var(--primary)]" />
                        المحطات النشطة
                      </h2>
                      <p className="mt-2 text-sm text-[var(--muted)]">قائمة المحطات المتاحة للفحص والتسجيل المباشر.</p>
                    </div>
                  </div>
                  
                  {activeStations.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {activeStations.map((station) => (
                        <StationCard key={station.stationId} station={station} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-center shadow-sm">
                      <div className="rounded-full bg-[var(--surface-subtle)] p-4">
                        <MapPin className="h-8 w-8 text-[var(--muted)]" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-[var(--muted)]">لا توجد محطات نشطة حتى الآن.</p>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Right Column: Technician Reports & Attendance */}
            {session.role === "technician" && (
              <aside className="space-y-6">
                
                {/* Reports Widget */}
                <div className="flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-control">
                  <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] p-5">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
                      <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      سجل فحوصاتي
                    </h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">آخر التقارير التي قمت بإرسالها.</p>
                  </div>
                  <div className="p-5">
                    {recentReports.length > 0 ? (
                      <ul className="space-y-3">
                        {recentReports.map((report) => (
                          <RecentReport key={report.reportId} report={report} />
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="mb-3 rounded-full bg-[var(--surface-subtle)] p-3">
                          <AlertCircle className="h-6 w-6 text-[var(--muted)]" />
                        </div>
                        <p className="text-sm font-medium text-[var(--muted)]">لم تسجل أي فحوصات بعد.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attendance Widget */}
                <div className="flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-control">
                  <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] p-5">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
                      <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      سجلات الحضور
                    </h3>
                  </div>
                  <div className="p-5">
                    <ul className="space-y-3">
                      {attendanceSessions.length > 0 ? (
                        attendanceSessions.map((attendance) => (
                          <li className="flex items-start gap-3 rounded-2xl bg-[var(--surface-subtle)] p-4 text-sm transition-colors hover:bg-[var(--border-subtle)]" key={attendance.attendanceId}>
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] shadow-sm">
                              <Calendar className="h-4 w-4 text-[var(--muted)]" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-[var(--foreground)]">
                                حضور: <span className="font-normal text-[var(--muted-foreground)]">{formatTimestamp(attendance.clockInAt)}</span>
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="h-px flex-1 bg-[var(--border)]" />
                              </div>
                              <p className="mt-2 font-semibold text-[var(--foreground)]">
                                انصراف:{" "}
                                {attendance.clockOutAt ? (
                                  <span className="font-normal text-[var(--muted-foreground)]">{formatTimestamp(attendance.clockOutAt)}</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500"></span>
                                    </span>
                                    قيد العمل
                                  </span>
                                )}
                              </p>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="flex flex-col items-center justify-center py-6 text-center text-sm text-[var(--muted)]">
                          لا توجد سجلات حضور.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
      
      <CopyrightFooter className="mx-auto mt-16 max-w-7xl border-t border-[var(--border)] pt-8" />
    </main>
  );
}
