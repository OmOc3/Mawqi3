import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { AUDIT_LOGS_COL } from "@/lib/collections";
import { adminDb } from "@/lib/firebase-admin";
import type { UserRole } from "@/types";

export interface AuditLogInput {
  actorUid: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  try {
    const ref = adminDb().collection(AUDIT_LOGS_COL).doc();
    const auditLog = {
      logId: ref.id,
      actorUid: entry.actorUid,
      actorRole: entry.actorRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      createdAt: FieldValue.serverTimestamp(),
      ...(entry.metadata ? { metadata: entry.metadata } : {}),
    };

    await ref.set(auditLog);
  } catch (error: unknown) {
    console.error("Failed to write audit log.", error);
  }
}
