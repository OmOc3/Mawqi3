import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { mobileApiErrorResponse } from "@/lib/api/mobile";
import { requireBearerRole } from "@/lib/auth/bearer-session";
import { updateClientOrderStatus } from "@/lib/db/repositories";
import { updateClientOrderStatusSchema } from "@/lib/validation/client-orders";
import type { ApiErrorResponse } from "@/types";

export const runtime = "nodejs";

interface MobileClientOrderRouteContext {
  params: Promise<{
    orderId: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: MobileClientOrderRouteContext,
): Promise<NextResponse<{ success: true } | ApiErrorResponse>> {
  try {
    const session = await requireBearerRole(request, ["manager", "supervisor"]);
    const { orderId } = await params;
    const body = (await request.json()) as unknown;
    const parsed = updateClientOrderStatusSchema.safeParse({
      ...(typeof body === "object" && body !== null ? body : {}),
      orderId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "MOBILE_CLIENT_ORDER_STATUS_INVALID",
          message: "بيانات حالة الطلب غير صحيحة.",
        },
        { status: 400 },
      );
    }

    await updateClientOrderStatus(parsed.data.orderId, parsed.data.status, session.uid, session.role);

    revalidatePath("/client/portal");
    revalidatePath("/dashboard/manager/client-orders");
    revalidatePath("/dashboard/supervisor/client-orders");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}
