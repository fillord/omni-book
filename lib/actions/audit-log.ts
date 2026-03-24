import { basePrisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export type AuditEventType =
  | 'login'
  | 'plan_upgrade'
  | 'plan_downgrade'
  | 'service_deleted'
  | 'resource_deleted'
  | 'staff_deleted'

export async function createAuditLog(
  tenantId: string,
  eventType: AuditEventType,
  details: Record<string, unknown> = {}
) {
  await basePrisma.auditLog.create({
    data: {
      tenantId,
      eventType,
      details: details as Prisma.InputJsonValue,
    },
  }).catch(() => {}) // Fire-and-forget — NEVER block the primary action
}
