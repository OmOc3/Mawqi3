import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/layout/nav";
import { PageHeader } from "@/components/layout/page-header";
import { StationForm } from "@/components/stations/station-form";
import { requireRole } from "@/lib/auth/server-session";
import { STATIONS_COL } from "@/lib/collections";
import { adminDb } from "@/lib/firebase-admin";
import type { Station } from "@/types";

interface EditStationPageProps {
  params: Promise<{
    stationId: string;
  }>;
}

export const metadata: Metadata = {
  title: "تعديل محطة",
};

export default async function EditStationPage({ params }: EditStationPageProps) {
  const { stationId } = await params;
  await requireRole(["manager"]);
  const snapshot = await adminDb().collection(STATIONS_COL).doc(stationId).get();

  if (!snapshot.exists) {
    notFound();
  }

  const data = snapshot.data() as Partial<Station>;
  const station = {
    stationId: snapshot.id,
    label: data.label ?? "",
    location: data.location ?? "",
    zone: data.zone,
    coordinates: data.coordinates,
  };

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6 text-right sm:px-6 lg:px-8" dir="rtl">
      <section className="mx-auto max-w-3xl">
        <PageHeader
          backHref={`/dashboard/manager/stations/${station.stationId}`}
          description="حدّث بيانات المحطة دون تغيير رمز QR الخاص بها."
          title="تعديل محطة"
        />
        <DashboardNav role="manager" />
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <StationForm mode="edit" station={station} />
        </div>
      </section>
    </main>
  );
}
