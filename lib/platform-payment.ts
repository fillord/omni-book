import { basePrisma } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram'
import { Plan } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { createPaylinkPayment } from '@/lib/payments/paylink'

// ---------------------------------------------------------------------------
// createPlatformPayment
// ---------------------------------------------------------------------------

export async function createPlatformPayment(
  tenantId: string,
  plan: Plan,
  amount: number
): Promise<{ paymentId: string; paylinkUrl: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  // Create DB record first to get the ID
  const payment = await basePrisma.platformPayment.create({
    data: {
      tenantId,
      amount,
      planTarget: plan,
      paylinkOrderId: '', // filled below
      paylinkUrl: '',     // filled below
      expiresAt,
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://omni-book.site'
  const backUrl = `${appUrl}/dashboard/settings/billing`
  const description = `Подписка ${plan} — Omni Book`

  const { orderId, paymentUrl } = await createPaylinkPayment(
    payment.id, // use DB record ID as orderId
    amount,
    description,
    backUrl
  )

  // Update with real Paylink data
  await basePrisma.platformPayment.update({
    where: { id: payment.id },
    data: { paylinkOrderId: orderId, paylinkUrl: paymentUrl },
  })

  return { paymentId: payment.id, paylinkUrl: paymentUrl, expiresAt }
}

// ---------------------------------------------------------------------------
// processPlatformPayment
// ---------------------------------------------------------------------------

export async function processPlatformPayment(paymentId: string): Promise<{
  success: boolean
  alreadyProcessed?: boolean
  error?: string
}> {
  // 1. Find payment
  const payment = await basePrisma.platformPayment.findUnique({ where: { id: paymentId } })
  if (!payment) return { success: false, error: 'Payment not found' }
  if (payment.status !== 'PENDING') return { success: true, alreadyProcessed: true }
  if (payment.expiresAt < new Date()) return { success: false, error: 'Payment expired' }

  // 2. Atomic status update (idempotent — only one caller wins)
  const updated = await basePrisma.platformPayment.updateMany({
    where: { id: paymentId, status: 'PENDING' },
    data: { status: 'PAID', paidAt: new Date() },
  })
  if (updated.count === 0) return { success: true, alreadyProcessed: true }

  // 3. Activate subscription
  const planRecord = await basePrisma.subscriptionPlan.findUnique({
    where: { plan: payment.planTarget },
    select: { maxResources: true },
  })
  const maxResources = planRecord?.maxResources ?? 20
  const subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await basePrisma.$transaction([
    basePrisma.tenant.update({
      where: { id: payment.tenantId },
      data: {
        plan: payment.planTarget,
        planStatus: 'ACTIVE',
        subscriptionExpiresAt,
        maxResources,
      },
    }),
    basePrisma.resource.updateMany({
      where: { tenantId: payment.tenantId, isFrozen: true },
      data: { isFrozen: false },
    }),
    basePrisma.service.updateMany({
      where: { tenantId: payment.tenantId, isFrozen: true },
      data: { isFrozen: false },
    }),
  ])

  revalidatePath('/dashboard/settings/billing')

  // 4. Telegram notification to admin (fire-and-forget)
  const tenant = await basePrisma.tenant.findUnique({
    where: { id: payment.tenantId },
    select: { name: true },
  })
  const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID
  if (adminChatId) {
    await sendTelegramMessage(
      adminChatId,
      `<b>Получена оплата подписки</b>\n\nТариф: ${payment.planTarget}\nКомпания: ${tenant?.name ?? 'Unknown'}\nСумма: ${payment.amount.toLocaleString()} ₸`
    ).catch(console.error)
  }

  return { success: true }
}
