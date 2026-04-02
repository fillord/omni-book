'use server'

import { revalidatePath } from 'next/cache'
import { Plan, PlanStatus } from '@prisma/client'
import { authConfig } from '@/lib/auth/config'
import { getServerSession } from 'next-auth'
import { basePrisma } from '@/lib/db'
import { createAuditLog } from '@/lib/actions/audit-log'
import { processSubscriptionLifecycle } from '@/lib/subscription-lifecycle'


// Безопасная проверка: только админ
async function ensureSuperAdmin() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  if (session.user.role !== 'SUPERADMIN' && session.user.email !== 'admin@omnibook.com') {
    throw new Error('Forbidden: Superadmin only')
  }
}

export async function updateTenantPlan(tenantId: string, plan: Plan, planStatus: PlanStatus) {
  try {
    await ensureSuperAdmin()

    const planRecord = await basePrisma.subscriptionPlan.findUnique({
      where: { plan },
      select: { maxResources: true },
    })
    const maxResources = planRecord?.maxResources ?? { FREE: 1, PRO: 20, ENTERPRISE: 100 }[plan]

    const current = await basePrisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    })

    const planChanged = current && current.plan !== plan

    if (planChanged) {
      const PLAN_ORDER = { FREE: 0, PRO: 1, ENTERPRISE: 2 } as const
      const oldOrder = PLAN_ORDER[current.plan as keyof typeof PLAN_ORDER] ?? 0
      const newOrder = PLAN_ORDER[plan as keyof typeof PLAN_ORDER] ?? 0
      const isUpgrade = newOrder > oldOrder

      if (isUpgrade) {
        // Upgrade: set expiry, unfreeze resources/services
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        await basePrisma.$transaction([
          basePrisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan,
              planStatus: 'ACTIVE',
              subscriptionExpiresAt: expiresAt,
              maxResources,
            },
          }),
          basePrisma.resource.updateMany({
            where: { tenantId, isFrozen: true },
            data: { isFrozen: false },
          }),
          basePrisma.service.updateMany({
            where: { tenantId, isFrozen: true },
            data: { isFrozen: false },
          }),
        ])
        createAuditLog(tenantId, 'plan_upgrade', { oldPlan: current.plan, newPlan: plan })
      } else {
        // Downgrade: clear expiry, freeze resources/services
        const oldestResource = await basePrisma.resource.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        })
        const oldestService = await basePrisma.service.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        })
        await basePrisma.$transaction([
          basePrisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan,
              planStatus: 'ACTIVE',
              subscriptionExpiresAt: null,
              maxResources,
            },
          }),
          ...(oldestResource
            ? [basePrisma.resource.updateMany({
                where: { tenantId, id: { not: oldestResource.id } },
                data: { isFrozen: true },
              })]
            : []),
          ...(oldestService
            ? [basePrisma.service.updateMany({
                where: { tenantId, id: { not: oldestService.id } },
                data: { isFrozen: true },
              })]
            : []),
        ])
        createAuditLog(tenantId, 'plan_downgrade', { oldPlan: current.plan, newPlan: plan })
      }
    } else {
      // Status-only change (or same plan): update without touching lifecycle fields
      await basePrisma.tenant.update({
        where: { id: tenantId },
        data: { plan, planStatus },
      })
    }

    revalidatePath('/admin/tenants')
    revalidatePath(`/admin/tenants/${tenantId}`)
    revalidatePath('/dashboard/settings/billing')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Ошибка обновления плана' }
  }
}

export async function updateTenantMaxResources(tenantId: string, maxResources: number) {
  try {
    await ensureSuperAdmin()

    if (maxResources < 1) throw new Error('Количество русурсов не может быть меньше 1')

    await basePrisma.tenant.update({
      where: { id: tenantId },
      data: { maxResources }
    })

    revalidatePath('/admin/tenants')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Ошибка обновления лимитов' }
  }
}

export async function activateSubscription(tenantId: string, plan: Plan = 'PRO') {
  try {
    await ensureSuperAdmin()

    const planRecord = await basePrisma.subscriptionPlan.findUnique({
      where: { plan },
      select: { maxResources: true },
    })
    const maxResources = planRecord?.maxResources ?? 20

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await basePrisma.$transaction([
      basePrisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan,
          planStatus: 'ACTIVE',
          subscriptionExpiresAt: expiresAt,
          maxResources,
        },
      }),
      basePrisma.resource.updateMany({
        where: { tenantId, isFrozen: true },
        data: { isFrozen: false },
      }),
      basePrisma.service.updateMany({
        where: { tenantId, isFrozen: true },
        data: { isFrozen: false },
      }),
    ])

    // Audit log (fire-and-forget)
    createAuditLog(tenantId, 'plan_upgrade', {
      activatedBy: 'superadmin',
      newExpiry: expiresAt.toISOString(),
    })

    revalidatePath(`/admin/tenants/${tenantId}`)
    revalidatePath('/admin/tenants')
    revalidatePath('/dashboard/settings/billing')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Ошибка активации подписки' }
  }
}

export async function banTenant(tenantId: string) {
  try {
    await ensureSuperAdmin()

    await basePrisma.tenant.update({
      where: { id: tenantId },
      data: { planStatus: PlanStatus.BANNED }
    })

    revalidatePath('/admin/tenants')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Ошибка при бане компании' }
  }
}

export async function deleteTenant(tenantId: string) {
  try {
    await ensureSuperAdmin()

    // Каскадное удаление: User, Resource, Service, Booking удаляются автоматически (onDelete: Cascade)
    await basePrisma.tenant.delete({
      where: { id: tenantId }
    })

    revalidatePath('/admin/tenants')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Ошибка при удалении компании' }
  }
}

export async function triggerSubscriptionCron() {
  try {
    await ensureSuperAdmin()
    const result = await processSubscriptionLifecycle()
    return { success: true, ...result }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Ошибка запуска cron' }
  }
}
