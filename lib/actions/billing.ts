'use server'

import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/auth/guards'

const prisma = new PrismaClient()

export async function requestProActivation() {
  try {
    const session = await requireAuth()
    const tenantId = session?.user?.tenantId

    if (!tenantId) {
      throw new Error('Tenant ID не найден в сессии')
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) throw new Error('Бизнес не найден')
    
    // Обход кэша TS
    const currentStatus = (tenant as any).planStatus

    if (currentStatus === 'PENDING') {
      return { success: false, error: 'Заявка уже находится в обработке' }
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { planStatus: 'PENDING' } as any
    })

    revalidatePath('/dashboard/settings/billing')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Произошла ошибка при отправке заявки' }
  }
}
