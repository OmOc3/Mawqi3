import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server-session";
import { getClientServiceAreaById } from "@/lib/db/repositories";

export const runtime = "nodejs";

interface ServiceAreaQrRouteProps {
  params: Promise<{
    areaId: string;
  }>;
}

export async function GET(_request: Request, { params }: ServiceAreaQrRouteProps): Promise<NextResponse> {
  await requireRole(["manager", "supervisor"]);
  const { areaId } = await params;
  const area = await getClientServiceAreaById(areaId);

  if (!area) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await QRCode.toBuffer(area.qrCodeValue, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
    type: "png",
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": "image/png",
    },
  });
}
