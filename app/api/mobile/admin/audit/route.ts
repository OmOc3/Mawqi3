import { NextRequest, NextResponse } from "next/server";
import { mobileApiErrorResponse } from "@/lib/api/mobile";
import { mobileAuditLogResponse, type MobileAuditLogResponse } from "@/lib/api/mobile-serializers";
import { requireBearerRole } from "@/lib/auth/bearer-session";
import { listAuditLogs } from "@/lib/db/repositories";

export const runtime = "nodejs";

function parseDate(value: string | null, endOfDay = false): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<MobileAuditLogResponse[] | { code: string; message: string }>> {
  try {
    await requireBearerRole(request, ["manager"]);
    const { searchParams } = new URL(request.url);
    const logs = await listAuditLogs({
      action: searchParams.get("action") ?? undefined,
      actorUid: searchParams.get("actorUid") ?? undefined,
      entityType: searchParams.get("entityType") ?? undefined,
      dateFrom: parseDate(searchParams.get("dateFrom")),
      dateTo: parseDate(searchParams.get("dateTo"), true),
      limit: 75,
    });

    return NextResponse.json(logs.map(mobileAuditLogResponse));
  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}
