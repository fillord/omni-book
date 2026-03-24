import { NextResponse } from 'next/server'
import { basePrisma } from '@/lib/db'
import { createAuditLog } from '@/lib/actions/audit-log'

async function processSubscriptionLifecycle(): Promise<{ warned: number; processed: number }> {
  let warned = 0
  let processed = 0
  const now = new Date()

  // --- Action 1: 3-Day Warning ---
  // Find tenants where subscriptionExpiresAt is between now+2 days and now+4 days
  // AND planStatus = 'ACTIVE'
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)

  const warningTenants = await basePrisma.tenant.findMany({
    where: {
      planStatus: 'ACTIVE',
      subscriptionExpiresAt: {
        gte: twoDaysFromNow,
        lte: fourDaysFromNow,
      },
    },
    select: { id: true, name: true },
  })

  for (const tenant of warningTenants) {
    // Dedup: check if warning notification was sent in last 24h
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const existingWarning = await basePrisma.notification.findFirst({
      where: {
        tenantId: tenant.id,
        message: { contains: 'истекает' },
        createdAt: { gte: yesterday },
      },
    })
    if (!existingWarning) {
      await basePrisma.notification.create({
        data: {
          tenantId: tenant.id,
          message:
            'Ваша подписка PRO истекает через 3 дня. Продлите подписку, чтобы избежать заморозки данных.',
        },
      })
      warned++
    }
  }

  // --- Action 2: Downgrade & Freeze ---
  // Find tenants where subscriptionExpiresAt < now AND planStatus IN [ACTIVE, PENDING]
  const expiredTenants = await basePrisma.tenant.findMany({
    where: {
      subscriptionExpiresAt: { lt: now },
      planStatus: { in: ['ACTIVE', 'PENDING'] },
    },
    select: { id: true, name: true, plan: true },
  })

  for (const tenant of expiredTenants) {
    const previousPlan = tenant.plan

    // 1. Downgrade tenant
    await basePrisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan: 'FREE',
        planStatus: 'EXPIRED',
        maxResources: 1,
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

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processSubscriptionLifecycle()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Subscription cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
