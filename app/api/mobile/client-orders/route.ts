import { NextRequest, NextResponse } from "next/server";
import { mobileApiErrorResponse } from "@/lib/api/mobile";
import {
  mobileAttendanceSessionResponse,
  mobileClientOrderResponse,
  mobileReportResponse,
  mobileStationResponse,
  type MobileClientOrderResponse,
  type MobileReportResponse,
  type MobileStationResponse,
} from "@/lib/api/mobile-serializers";
import { requireBearerRole } from "@/lib/auth/bearer-session";
import {
  getStationLocations,
  listAttendanceSessionsForClient,
  listClientOrders,
  listClientOrdersForClient,
  listOrderedStationsForClient,
  listReportsForClientOrderedStations,
} from "@/lib/db/repositories";
import type { ApiErrorResponse } from "@/types";

export const runtime = "nodejs";

interface MobileClientOrdersResponse {
  orders: MobileClientOrderResponse[];
  attendanceSessions?: ReturnType<typeof mobileAttendanceSessionResponse>[];
  reports?: MobileReportResponse[];
  stations?: MobileStationResponse[];
}

async function orderResponses(orders: Awaited<ReturnType<typeof listClientOrders>>): Promise<MobileClientOrderResponse[]> {
  const ids = orders.map((order) => order.stationId).filter((id): id is string => id != null && id.length > 0);
  const stationLocations = await getStationLocations(ids);

  return orders.map((order) =>
    mobileClientOrderResponse(
      order,
      typeof order.stationId === "string" && order.stationId.length > 0 ? stationLocations.get(order.stationId) : undefined,
    ),
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<MobileClientOrdersResponse | ApiErrorResponse>> {
  try {
    const session = await requireBearerRole(request, ["client", "manager", "supervisor"]);

    if (session.role === "client") {
      const [orders, stations, reports, attendanceSessions] = await Promise.all([
        listClientOrdersForClient(session.uid),
        listOrderedStationsForClient(session.uid),
        listReportsForClientOrderedStations(session.uid),
        listAttendanceSessionsForClient(session.uid),
      ]);

      return NextResponse.json({
        attendanceSessions: attendanceSessions.map(mobileAttendanceSessionResponse),
        orders: await orderResponses(orders),
        stations: stations.map((station) => mobileStationResponse(station.stationId, station)),
        reports: reports.map(mobileReportResponse),
      });
    }

    const orders = await listClientOrders();

    return NextResponse.json({
      orders: await orderResponses(orders),
    });
  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<MobileClientOrderResponse | ApiErrorResponse>> {
  try {
    await requireBearerRole(request, ["manager", "supervisor"]);

    return NextResponse.json(
      {
        code: "MOBILE_CLIENT_ORDER_CREATION_DISABLED",
        message: "إنشاء طلبات الفحص من العميل متوقف. استخدم لوحة الإدارة لإنشاء المحطات وربطها بالعميل.",
      },
      { status: 403 },
    );

  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}
