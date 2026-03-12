'use server'

import { revalidatePath } from 'next/cache'
import { PrismaClient, Plan, PlanStatus } from '@prisma/client'
import { authConfig } from '@/lib/auth/config'
import { getServerSession } from 'next-auth'

const prisma = new PrismaClient()

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

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { plan, planStatus }
    })

    revalidatePath('/admin/tenants')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Ошибка обновления плана' }
  }
}

export async function updateTenantMaxResources(tenantId: string, maxResources: number) {
  try {
    await ensureSuperAdmin()

    if (maxResources < 1) throw new Error('Количество русурсов не может быть меньше 1')

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { maxResources }
    })

    revalidatePath('/admin/tenants')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Ошибка обновления лимитов' }
  }
}
