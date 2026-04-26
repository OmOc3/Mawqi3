import { NextRequest, NextResponse } from "next/server";
import { mobileApiErrorResponse } from "@/lib/api/mobile";
import { requireBearerRole } from "@/lib/auth/bearer-session";
import { STATIONS_COL } from "@/lib/collections";
import { AppError } from "@/lib/errors";
import { adminDb } from "@/lib/firebase-admin";
import type { FirestoreTimestamp, Station } from "@/types";

export const runtime = "nodejs";

interface MobileStationResponse {
  createdAt?: string;
  isActive: boolean;
  label: string;
  lastVisitedAt?: string;
  location: string;
  stationId: string;
  totalReports: number;
  updatedAt?: string;
  zone?: string;
}

interface MobileStationRouteContext {
  params: Promise<{
    stationId: string;
  }>;
}

function timestampToIso(value: unknown): string | undefined {
  const timestamp = value as Partial<FirestoreTimestamp>;

  if (typeof timestamp?.toDate !== "function") {
    return undefined;
  }

  return timestamp.toDate().toISOString();
}

function stationResponse(stationId: string, data: Partial<Station>): MobileStationResponse {
  return {
    stationId: data.stationId ?? stationId,
    label: data.label ?? "محطة بدون اسم",
    location: data.location ?? "غير محدد",
    ...(data.zone ? { zone: data.zone } : {}),
    isActive: data.isActive ?? false,
    totalReports: data.totalReports ?? 0,
    ...(timestampToIso(data.createdAt) ? { createdAt: timestampToIso(data.createdAt) } : {}),
    ...(timestampToIso(data.updatedAt) ? { updatedAt: timestampToIso(data.updatedAt) } : {}),
    ...(timestampToIso(data.lastVisitedAt) ? { lastVisitedAt: timestampToIso(data.lastVisitedAt) } : {}),
  };
}

export async function GET(
  request: NextRequest,
  { params }: MobileStationRouteContext,
): Promise<NextResponse<MobileStationResponse | { code: string; message: string }>> {
  try {
    await requireBearerRole(request, ["technician", "manager"]);
    const { stationId } = await params;
    const snapshot = await adminDb().collection(STATIONS_COL).doc(stationId).get();

    if (!snapshot.exists) {
      throw new AppError("المحطة غير موجودة.", "STATION_NOT_FOUND", 404);
    }

    return NextResponse.json(stationResponse(snapshot.id, snapshot.data() as Partial<Station>));
  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}
