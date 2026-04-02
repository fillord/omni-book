import { basePrisma } from '@/lib/db'
import { createAuditLog } from '@/lib/actions/audit-log'

export async function processSubscriptionLifecycle(): Promise<{
  warned: number
  processed: number
}> {
  let warned = 0
  let processed = 0
  const now = new Date()

  // --- Action 1: 3-Day Warning ---
  // Find ACTIVE tenants whose subscription expires within the next 3 days
  // (and hasn't expired yet)
  const warningThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const warningTenants = await basePrisma.tenant.findMany({
    where: {
      planStatus: 'ACTIVE',
      subscriptionExpiresAt: {
        gt: now,
        lte: warningThreshold,
      },
    },
    select: { id: true, name: true },
  })

  for (const tenant of warningTenants) {
    // Dedup: skip if a warning was already sent in the last 6 hours
    const dedupWindow = new Date(now.getTime() - 6 * 60 * 60 * 1000)
    const existingWarning = await basePrisma.notification.findFirst({
      where: {
        tenantId: tenant.id,
        message: { contains: 'истекает' },
        createdAt: { gte: dedupWindow },
      },
    })
    if (!existingWarning) {
      await basePrisma.notification.create({
        data: {
          tenantId: tenant.id,
          message:
            'Ваша подписка PRO истекает через 3 часа. Продлите подписку, чтобы избежать заморозки данных.',
        },
      })
      warned++
    }
  }

  // --- Action 2: Downgrade & Freeze ---
  // Find tenants where subscriptionExpiresAt <= now AND planStatus is not yet EXPIRED
  const expiredTenants = await basePrisma.tenant.findMany({
    where: {
      subscriptionExpiresAt: { lte: now },
      planStatus: { not: 'EXPIRED' },
    },
    select: { id: true, name: true, plan: true },
  })

  for (const tenant of expiredTenants) {
    const previousPlan = tenant.plan

    // 1. Downgrade tenant (fetch FREE plan maxResources from DB)
    const freePlan = await basePrisma.subscriptionPlan.findUnique({
      where: { plan: 'FREE' },
      select: { maxResources: true },
    })
    const freeMaxResources = freePlan?.maxResources ?? 1

    await basePrisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan: 'FREE',
        planStatus: 'EXPIRED',
        maxResources: freeMaxResources,
      },
    })

    // 2. Keep oldest 1 resource active, freeze the rest
    const oldestResource = await basePrisma.resource.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    if (oldestResource) {
      await basePrisma.resource.updateMany({
        where: { tenantId: tenant.id, id: { not: oldestResource.id } },
        data: { isFrozen: true },
      })
    }

    // 3. Keep oldest 1 service active, freeze the rest
    const oldestService = await basePrisma.service.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    if (oldestService) {
      await basePrisma.service.updateMany({
        where: { tenantId: tenant.id, id: { not: oldestService.id } },
        data: { isFrozen: true },
      })
    }

    // 4. Staff: no changes (no isFrozen on User)

    // 5. Audit log (fire-and-forget)
    createAuditLog(tenant.id, 'plan_downgrade', {
      reason: 'subscription_expired',
      previousPlan,
    })

    processed++
  }

  return { warned, processed }
}
