"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server-session";
import { USERS_COL } from "@/lib/collections";
import { adminDb } from "@/lib/firebase-admin";
import { updateUserRoleSchema } from "@/lib/validation/users";
import { writeAuditLog } from "@/lib/audit";
import type { AppUser } from "@/types";

export interface UserActionResult {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function toggleUserActiveAction(targetUid: string): Promise<UserActionResult> {
  const session = await requireRole(["manager"]);

  if (targetUid === session.uid) {
    return { error: "لا يمكنك تعطيل حسابك" };
  }

  const userRef = adminDb().collection(USERS_COL).doc(targetUid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    return { error: "المستخدم غير موجود" };
  }

  const user = snapshot.data() as Partial<AppUser>;
  const nextIsActive = !user.isActive;

  await userRef.update({
    isActive: nextIsActive,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: session.uid,
  });

  await writeAuditLog({
    actorUid: session.uid,
    actorRole: session.role,
    action: nextIsActive ? "user.activate" : "user.deactivate",
    entityType: "user",
    entityId: targetUid,
    metadata: {
      isActive: nextIsActive,
      previousRole: user.role,
    },
  });

  revalidatePath("/dashboard/manager/users");

  return { success: true };
}

export async function updateUserRoleAction(targetUid: string, formData: FormData): Promise<UserActionResult> {
  const session = await requireRole(["manager"]);

  if (targetUid === session.uid) {
    return { error: "لا يمكنك تغيير دورك" };
  }

  const parsed = updateUserRoleSchema.safeParse({
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: "تحقق من الدور المختار وحاول مرة أخرى.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const userRef = adminDb().collection(USERS_COL).doc(targetUid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    return { error: "المستخدم غير موجود" };
  }

  const user = snapshot.data() as Partial<AppUser>;

  await userRef.update({
    role: parsed.data.role,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: session.uid,
  });

  await writeAuditLog({
    actorUid: session.uid,
    actorRole: session.role,
    action: "user.role_change",
    entityType: "user",
    entityId: targetUid,
    metadata: {
      previousRole: user.role,
      nextRole: parsed.data.role,
    },
  });

  revalidatePath("/dashboard/manager/users");

  return { success: true };
}
