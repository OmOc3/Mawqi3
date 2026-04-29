"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server-session";
import { replaceClientStationAccess, updateClientOrderStatus, upsertClientProfile } from "@/lib/db/repositories";
import {
  clientAddressLinesFromText,
  createClientOrderSchema,
  updateClientOrderStatusSchema,
  updateClientProfileSchema,
  updateClientStationAccessSchema,
} from "@/lib/validation/client-orders";

export interface ClientOrderActionResult {
  error?: string;
  success?: boolean;
}

function optionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function createClientOrderAction(formData: FormData): Promise<ClientOrderActionResult> {
  await requireRole(["client"]);
  const parsed = createClientOrderSchema.safeParse({
    stationDescription: optionalString(formData, "stationDescription"),
    stationLabel: formData.get("stationLabel"),
    stationLocation: formData.get("stationLocation"),
    note: optionalString(formData, "note"),
  });

  if (!parsed.success) {
    return { error: "تحقق من بيانات الطلب." };
  }

  return { error: "بوابة العميل للعرض فقط. تواصل مع الإدارة لإضافة أو تعديل المحطات." };
}

export async function updateClientOrderStatusAction(formData: FormData): Promise<ClientOrderActionResult> {
  const session = await requireRole(["manager", "supervisor"]);
  const parsed = updateClientOrderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "بيانات الطلب غير صحيحة." };
  }

  try {
    const clientUid = await updateClientOrderStatus(parsed.data.orderId, parsed.data.status, session.uid, session.role);
    revalidatePath("/dashboard/manager/client-orders");
    revalidatePath(`/dashboard/manager/client-orders/${clientUid}`);
    revalidatePath("/dashboard/supervisor/client-orders");
    revalidatePath("/client/portal");
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "تعذر تحديث حالة الطلب." };
  }
}

export async function updateClientProfileAction(formData: FormData): Promise<ClientOrderActionResult> {
  const session = await requireRole(["manager"]);
  const parsed = updateClientProfileSchema.safeParse({
    addressesText: formData.get("addressesText"),
    clientUid: formData.get("clientUid"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من بيانات العميل." };
  }

  try {
    await upsertClientProfile({
      actorRole: session.role,
      actorUid: session.uid,
      addresses: clientAddressLinesFromText(parsed.data.addressesText),
      clientUid: parsed.data.clientUid,
      phone: parsed.data.phone || undefined,
    });

    revalidatePath("/dashboard/manager/client-orders");
    revalidatePath(`/dashboard/manager/client-orders/${parsed.data.clientUid}`);
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "تعذر تحديث بيانات العميل." };
  }
}

export async function updateClientStationAccessAction(formData: FormData): Promise<ClientOrderActionResult> {
  const session = await requireRole(["manager"]);
  const parsed = updateClientStationAccessSchema.safeParse({
    clientUid: formData.get("clientUid"),
    stationIds: formData.getAll("stationIds").filter((value): value is string => typeof value === "string"),
  });

  if (!parsed.success) {
    return { error: "تحقق من محطات العميل المحددة." };
  }

  try {
    await replaceClientStationAccess({
      actorUid: session.uid,
      clientUid: parsed.data.clientUid,
      stationIds: parsed.data.stationIds,
    });

    revalidatePath("/dashboard/manager/client-orders");
    revalidatePath(`/dashboard/manager/client-orders/${parsed.data.clientUid}`);
    revalidatePath("/client/portal");
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "تعذر تحديث محطات العميل." };
  }
}
