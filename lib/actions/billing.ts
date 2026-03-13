'use server'

import { revalidatePath } from 'next/cache'
import { PlanStatus } from '@prisma/client'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { sendTelegramMessage } from '@/lib/telegram'
import { basePrisma } from '@/lib/db'

export async function requestProActivation() {
  try {
    const session = await requireAuth()
    requireRole(session, ['OWNER'])
    const tenantId = session?.user?.tenantId

    if (!tenantId) {
      throw new Error('Tenant ID не найден в сессии')
    }

    const tenant = await basePrisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) throw new Error('Бизнес не найден')

    if (tenant.planStatus === PlanStatus.PENDING) {
      return { success: false, error: 'Заявка уже находится в обработке' }
    }

    await basePrisma.tenant.update({
      where: { id: tenantId },
      data: { planStatus: PlanStatus.PENDING },
    })

    // Notify superadmin via Telegram (fire-and-forget)
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID
    if (adminChatId) {
      const planName = tenant.plan ?? 'PRO'
      const msg = [
        '💰 <b>Новая заявка на оплату!</b>',
        `🏢 Компания: ${tenant.name}`,
        `💎 План: ${planName}`,
      ].join('\n')
      sendTelegramMessage(adminChatId, msg).catch(console.error)
    }

    revalidatePath('/dashboard/settings/billing')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Произошла ошибка при отправке заявки' }
  }
}
