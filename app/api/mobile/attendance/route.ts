import { NextRequest, NextResponse } from "next/server";
import { mobileApiErrorResponse } from "@/lib/api/mobile";
import { timestampToIso } from "@/lib/api/mobile-serializers";
import { requireBearerRole } from "@/lib/auth/bearer-session";
import {
  clockInAttendanceSession,
  clockOutAttendanceSession,
  getOpenAttendanceSession,
} from "@/lib/db/repositories";
import { AppError } from "@/lib/errors";
import type { AttendanceSession, Coordinates } from "@/types";

export const runtime = "nodejs";

interface MobileAttendanceLocationResponse {
  accuracyMeters?: number;
  clientName?: string;
  clientUid?: string;
  coordinates: Coordinates;
  distanceMeters: number;
  stationId: string;
  stationLabel: string;
}

interface MobileAttendanceSessionResponse {
  attendanceId: string;
  clockInAt?: string;
  clockInLocation?: MobileAttendanceLocationResponse;
  clockOutAt?: string;
  clockOutLocation?: MobileAttendanceLocationResponse;
  notes?: string;
  shiftId?: string;
  technicianName: string;
  technicianUid: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function attendanceSessionResponse(session: AttendanceSession | null): MobileAttendanceSessionResponse | null {
  if (!session) {
    return null;
  }

  return {
    attendanceId: session.attendanceId,
    ...(session.shiftId ? { shiftId: session.shiftId } : {}),
    technicianUid: session.technicianUid,
    technicianName: session.technicianName,
    ...(timestampToIso(session.clockInAt) ? { clockInAt: timestampToIso(session.clockInAt) } : {}),
    ...(session.clockInLocation ? { clockInLocation: session.clockInLocation } : {}),
    ...(timestampToIso(session.clockOutAt) ? { clockOutAt: timestampToIso(session.clockOutAt) } : {}),
    ...(session.clockOutLocation ? { clockOutLocation: session.clockOutLocation } : {}),
    ...(session.notes ? { notes: session.notes } : {}),
  };
}

function numberField(body: Record<string, unknown>, key: string): number {
  const value = body[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AppError("بيانات الموقع غير صالحة.", "ATTENDANCE_LOCATION_INVALID", 400);
  }

  return value;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<{ openSession: MobileAttendanceSessionResponse | null } | { code: string; message: string }>> {
  try {
    const session = await requireBearerRole(request, ["technician", "manager"]);
    const openSession = await getOpenAttendanceSession(session.uid);

    return NextResponse.json({ openSession: attendanceSessionResponse(openSession) });
  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<MobileAttendanceSessionResponse | { code: string; message: string }>> {
  try {
    const session = await requireBearerRole(request, ["technician", "manager"]);
    const body = (await request.json()) as unknown;

    if (!isRecord(body) || (body.action !== "clockIn" && body.action !== "clockOut")) {
      throw new AppError("طلب الحضور غير صالح.", "ATTENDANCE_REQUEST_INVALID", 400);
    }

    const stationId = typeof body.stationId === "string" ? body.stationId.trim() : "";

    if (!stationId) {
      throw new AppError("رقم المحطة مطلوب.", "ATTENDANCE_STATION_REQUIRED", 400);
    }

    const input = {
      actorRole: session.role,
      location: {
        accuracyMeters: typeof body.accuracyMeters === "number" ? body.accuracyMeters : undefined,
        lat: numberField(body, "lat"),
        lng: numberField(body, "lng"),
      },
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined,
      stationId,
      technicianName: session.user.displayName,
      technicianUid: session.uid,
    };
    const attendance =
      body.action === "clockIn"
        ? await clockInAttendanceSession(input)
        : await clockOutAttendanceSession(input);

    return NextResponse.json(attendanceSessionResponse(attendance)!);
  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}
