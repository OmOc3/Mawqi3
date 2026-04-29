import { NextRequest, NextResponse } from "next/server";
import { mobileApiErrorResponse } from "@/lib/api/mobile";
import {
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
  listClientOrders,
  listClientOrdersForClient,
  listOrderedStationsForClient,
  listReportsForClientOrderedStations,
} from "@/lib/db/repositories";
import type { ApiErrorResponse } from "@/types";

export const runtime = "nodejs";

interface MobileClientOrdersResponse {
  orders: MobileClientOrderResponse[];
  reports?: MobileReportResponse[];
  stations?: MobileStationResponse[];
}

async function orderResponses(orders: Awaited<ReturnType<typeof listClientOrders>>): Promise<MobileClientOrderResponse[]> {
  const stationLocations = await getStationLocations(orders.map((order) => order.stationId));

  return orders.map((order) => mobileClientOrderResponse(order, stationLocations.get(order.stationId)));
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<MobileClientOrdersResponse | ApiErrorResponse>> {
  try {
    const session = await requireBearerRole(request, ["client", "manager", "supervisor"]);

    if (session.role === "client") {
      const [orders, stations, reports] = await Promise.all([
        listClientOrdersForClient(session.uid),
        listOrderedStationsForClient(session.uid),
        listReportsForClientOrderedStations(session.uid),
      ]);

      return NextResponse.json({
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
): Promise<NextResponse<ApiErrorResponse>> {
  try {
    await requireBearerRole(request, ["client"]);

    return NextResponse.json(
      {
        code: "CLIENT_PORTAL_READ_ONLY",
        message: "بوابة العميل للعرض فقط. تواصل مع الإدارة لإضافة أو تعديل المحطات.",
      },
      { status: 403 },
    );
  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}
