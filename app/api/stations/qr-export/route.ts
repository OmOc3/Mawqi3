import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server-session";
import { listStationsForQrExport } from "@/lib/db/repositories";
import { formatIsoDateRome } from "@/lib/datetime";
import { createStationQrExportPdf } from "@/lib/stations/qr-export-pdf";
import {
  dateFromForStationQrScope,
  parseStationQrExportScope,
  toStationQrExportItems,
  uniqueStationIds,
} from "@/lib/stations/qr-export";
import { buildStationReportUrl } from "@/lib/url/base-url";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  await requireRole(["manager"]);

  const params = request.nextUrl.searchParams;
  const scope = parseStationQrExportScope(params.get("scope"));
  const stationIds = uniqueStationIds(params.getAll("stationId"));

  if (scope === "selected" && stationIds.length === 0) {
    return NextResponse.json(
      { code: "QR_EXPORT_NO_STATIONS", message: "اختر محطة واحدة على الأقل قبل تصدير QR." },
      { status: 400 },
    );
  }

  const { clientNamesByStationId, stations } = await listStationsForQrExport({
    dateFrom: dateFromForStationQrScope(scope),
    stationIds: scope === "selected" ? stationIds : undefined,
  });

  if (stations.length === 0) {
    return NextResponse.json(
      { code: "QR_EXPORT_EMPTY", message: "لا توجد محطات مطابقة لنطاق التصدير المحدد." },
      { status: 404 },
    );
  }

  const items = await toStationQrExportItems(stations, clientNamesByStationId, buildStationReportUrl);
  const pdfBytes = await createStationQrExportPdf(items);
  const pdfBody = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(pdfBody).set(pdfBytes);
  const filenameDate = formatIsoDateRome(new Date()) ?? new Intl.DateTimeFormat("en-CA").format(new Date());

  return new Response(pdfBody, {
    headers: {
      "Content-Disposition": `attachment; filename="station-qr-${filenameDate}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
