'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { basePrisma } from '@/lib/db'

export async function updatePaymentSettings(_data: Record<string, never> = {}) {
  try {
    const session = await requireAuth()
    requireRole(session, ['OWNER'])
    const tenantId = session?.user?.tenantId

    if (!tenantId) {
      return { error: 'Tenant ID не найден в сессии' }
    }

    // Gate: PRO+ only (per D-07d)
    const tenant = await basePrisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    })

    if (!tenant || tenant.plan === 'FREE') {
      return { error: 'Требуется план PRO' }
    }

    // Paylink.kz settings — no tenant-facing config form yet
    revalidatePath('/dashboard/settings/billing')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Произошла ошибка при сохранении настроек' }
  }
}
