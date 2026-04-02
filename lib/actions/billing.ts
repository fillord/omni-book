'use server'

import { revalidatePath } from 'next/cache'
import { Plan, PlanStatus } from '@prisma/client'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { sendTelegramMessage } from '@/lib/telegram'
import { basePrisma } from '@/lib/db'
import { createPlatformPayment } from '@/lib/platform-payment'

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

export async function initiateSubscriptionPayment(plan: Plan = 'PRO'): Promise<{
  success: boolean
  paymentId?: string
  mockQrCode?: string
  amount?: number
  expiresAt?: string
  error?: string
}> {
  try {
    const session = await requireAuth()
    requireRole(session, ['OWNER'])
    const tenantId = session.user.tenantId!

    // Get plan pricing from DB
    const planRecord = await basePrisma.subscriptionPlan.findUnique({
      where: { plan },
      select: { priceMonthly: true },
    })
    if (!planRecord || planRecord.priceMonthly <= 0) {
      return { success: false, error: 'Invalid plan or dynamic pricing — use Enterprise inquiry' }
    }

    // Check for existing pending payment
    const existingPending = await basePrisma.platformPayment.findFirst({
      where: { tenantId, status: 'PENDING', expiresAt: { gt: new Date() } },
    })
    if (existingPending) {
      return {
        success: true,
        paymentId: existingPending.id,
        mockQrCode: existingPending.mockQrCode ?? undefined,
        amount: existingPending.amount,
        expiresAt: existingPending.expiresAt.toISOString(),
      }
    }

    // Set tenant to PENDING
    await basePrisma.tenant.update({
      where: { id: tenantId },
      data: { planStatus: 'PENDING' },
    })

    // Create platform payment
    const result = await createPlatformPayment(tenantId, plan, planRecord.priceMonthly)

    revalidatePath('/dashboard/settings/billing')
    return {
      success: true,
      paymentId: result.paymentId,
      mockQrCode: result.mockQrCode,
      amount: planRecord.priceMonthly,
      expiresAt: result.expiresAt.toISOString(),
    }
  } catch (err) {
    return { success: false, error: 'Failed to initiate payment' }
  }
}

export async function renewSubscription() {
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

    // Set to PRO + PENDING (requires super-admin confirmation)
    await basePrisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: 'PRO',
        planStatus: PlanStatus.PENDING,
      },
    })

    // Notify superadmin via Telegram (fire-and-forget)
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID
    if (adminChatId) {
      const msg = [
        '🔄 <b>Заявка на продление PRO!</b>',
        `🏢 Компания: ${tenant.name}`,
        `📅 Подписка истекла: ${tenant.subscriptionExpiresAt?.toLocaleDateString('ru-RU') ?? 'неизвестно'}`,
      ].join('\n')
      sendTelegramMessage(adminChatId, msg).catch(console.error)
    }

    revalidatePath('/dashboard/settings/billing')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Произошла ошибка при продлении' }
  }
}
