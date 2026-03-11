import { NextRequest, NextResponse } from 'next/server'
import { basePrisma } from '@/lib/db'
import { resolveTenant, isTenantError } from '@/lib/tenant'

// GET /api/bookings/busy?tenantSlug=...&resourceId=...&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  let tenant: Awaited<ReturnType<typeof resolveTenant>>
  try {
    tenant = await resolveTenant(req)
  } catch (err) {
    if (isTenantError(err)) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: (err as { statusCode: number }).statusCode }
      )
    }
    throw err
  }

  const resourceId = req.nextUrl.searchParams.get('resourceId')
  let date         = req.nextUrl.searchParams.get('date') ?? ''

  // Sanitize date
  const dateMatch = date.match(/^(\d{4}-\d{2}-\d{2})/)
  date = dateMatch ? dateMatch[1] : ''

  if (!resourceId || !date) {
    return NextResponse.json(
      { error: 'resourceId and date (YYYY-MM-DD) are required' },
      { status: 400 }
    )
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`)
  const dayEnd   = new Date(`${date}T23:59:59.999Z`)

  if (isNaN(dayStart.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const bookings = await basePrisma.booking.findMany({
    where: {
      tenantId: tenant.id,
      resourceId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      startsAt: { gte: dayStart, lte: dayEnd },
    },
    select: { startsAt: true, endsAt: true },
    orderBy: { startsAt: 'asc' },
  })

  return NextResponse.json({ busy: bookings })
}
