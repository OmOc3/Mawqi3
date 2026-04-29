"use client";

export default function ManagerAttendanceError() {
  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-6 text-right sm:px-6 lg:px-8" dir="rtl">
      <section className="mx-auto max-w-7xl rounded-2xl border border-[var(--danger-muted)] bg-[var(--danger-soft)] p-6 text-sm text-[var(--danger)] shadow-card">
        تعذر تحميل سجلات الحضور.
      </section>
    </main>
  );
}
