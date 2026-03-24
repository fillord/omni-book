'use server'

import { revalidatePath } from 'next/cache'
import { Plan, PlanStatus } from '@prisma/client'
import { authConfig } from '@/lib/auth/config'
import { getServerSession } from 'next-auth'
import { basePrisma } from '@/lib/db'
import { createAuditLog } from '@/lib/actions/audit-log'


// Безопасная проверка: только админ
async function ensureSuperAdmin() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) throw new Error('Unauthorized')
  
  if (session.user.role !== 'SUPERADMIN' && session.user.email !== 'admin@omnibook.com') {
    throw new Error('Forbidden: Superadmin only')
  }
}

const PLAN_DEFAULT_MAX_RESOURCES: Record<Plan, number> = {
  FREE: 1,
  PRO: 20,
  ENTERPRISE: 100,
}

export async function updateTenantPlan(tenantId: string, plan: Plan, planStatus: PlanStatus) {
  try {
    await ensureSuperAdmin()

    // Получаем текущий план, чтобы понять — изменился ли он
    const current = await basePrisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    })

    const data: { plan: Plan; planStatus: PlanStatus; maxResources?: number } = { plan, planStatus }

    // Автоматически выставляем лимит ресурсов только при смене тарифа
    if (current && current.plan !== plan) {
      data.maxResources = PLAN_DEFAULT_MAX_RESOURCES[plan]
    }

    await basePrisma.tenant.update({
      where: { id: tenantId },
      data,
    })

    // Audit: detect plan change direction
    if (current && current.plan !== plan) {
      const PLAN_ORDER = { FREE: 0, PRO: 1, ENTERPRISE: 2 } as const
      const oldOrder = PLAN_ORDER[current.plan as keyof typeof PLAN_ORDER] ?? 0
      const newOrder = PLAN_ORDER[plan as keyof typeof PLAN_ORDER] ?? 0
      const eventType = newOrder > oldOrder ? 'plan_upgrade' : 'plan_downgrade'
      createAuditLog(tenantId, eventType, {
        oldPlan: current.plan,
        newPlan: plan,
      })
    }

    revalidatePath('/admin/tenants')
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
