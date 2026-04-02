import { basePrisma } from '@/lib/db'
import { createAuditLog } from '@/lib/actions/audit-log'
import { sendTelegramMessage } from '@/lib/telegram'
import { Plan } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateMockQrSvg(plan: Plan, amount: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#f0f0f0" rx="8"/>
    <text x="100" y="85" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#666">Mock QR</text>
    <text x="100" y="110" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#999">${plan}</text>
    <text x="100" y="135" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#333">${amount.toLocaleString()} ₸</text>
  </svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

// ---------------------------------------------------------------------------
// createPlatformPayment
// ---------------------------------------------------------------------------

export async function createPlatformPayment(
  tenantId: string,
  plan: Plan,
  amount: number
): Promise<{ paymentId: string; mockQrCode: string; mockPaylink: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  const payment = await basePrisma.platformPayment.create({
    data: {
      tenantId,
      amount,
      planTarget: plan,
      mockQrCode: generateMockQrSvg(plan, amount),
      mockPaylink: '', // placeholder, updated after creation
      expiresAt,
    },
  })

  // Update mockPaylink with the actual payment ID
  const mockPaylink = `https://mock-kaspi.local/pay?id=${payment.id}`
  await basePrisma.platformPayment.update({
    where: { id: payment.id },
    data: { mockPaylink },
  })

  return {
    paymentId: payment.id,
    mockQrCode: payment.mockQrCode!,
    mockPaylink,
    expiresAt,
  }
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
  // Replicates activateSubscription transaction logic without ensureSuperAdmin guard
  const planRecord = await basePrisma.subscriptionPlan.findUnique({
    where: { plan: payment.planTarget },
    select: { maxResources: true },
  })
  const maxResources = planRecord?.maxResources ?? 20
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await basePrisma.$transaction([
    basePrisma.tenant.update({
      where: { id: payment.tenantId },
      data: {
        plan: payment.planTarget,
        planStatus: 'ACTIVE',
        subscriptionExpiresAt: expiresAt,
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

  // 4. Audit log (fire-and-forget)
  await createAuditLog(payment.tenantId, 'saas_payment_received', {
    paymentId: payment.id,
    amount: payment.amount,
    plan: payment.planTarget,
  })

  // 5. Telegram notification to admin
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
