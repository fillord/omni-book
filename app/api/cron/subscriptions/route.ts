import { NextResponse } from 'next/server'
import { processSubscriptionLifecycle } from '@/lib/subscription-lifecycle'
import { basePrisma } from '@/lib/db'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processSubscriptionLifecycle()
    // Clean up expired OTP codes to prevent unbounded table growth (DB-05)
    const otpCleanup = await basePrisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    return NextResponse.json({ success: true, ...result, expiredOtpCodes: otpCleanup.count })
  } catch (error) {
    console.error('Subscription cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
