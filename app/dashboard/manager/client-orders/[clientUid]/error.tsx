"use client";

export default function ClientProfileError() {
  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-8 text-right" dir="rtl">
      <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--danger-muted)] bg-[var(--danger-soft)] p-6 text-sm text-[var(--danger)]">
        تعذر تحميل ملف العميل.
      </div>
    </main>
  );
}
