import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BookingStatus } from '@prisma/client'
import { basePrisma } from '@/lib/db'
import { resolveTenant, isTenantError } from '@/lib/tenant'
import { createBooking, BookingConflictError, BookingLimitError, ResourceNotFoundError, ServiceNotFoundError } from '@/lib/booking/engine'

// ---- query schema ----------------------------------------------------------

const querySchema = z.object({
  tenantSlug: z.string().optional(),
  status: z.string().optional(),            // comma-separated BookingStatus values
  resourceId: z.string().optional(),
  dateFrom: z.string().optional(),          // YYYY-MM-DD
  dateTo: z.string().optional(),            // YYYY-MM-DD
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const BOOKING_INCLUDE = {
  resource: { select: { id: true, name: true, type: true } },
  service: { select: { id: true, name: true, durationMin: true, price: true, currency: true } },
  user: { select: { id: true, name: true, email: true } },
} as const

// ---- GET /api/bookings?tenantSlug=... --------------------------------------

export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req)

    const raw = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = querySchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
    }

    const { status, resourceId, dateFrom, dateTo, page, limit } = parsed.data

    // Parse comma-separated statuses
    const statuses = status
      ? status.split(',').map((s) => s.trim()).filter((s) =>
          Object.values(BookingStatus).includes(s as BookingStatus)
        ) as BookingStatus[]
      : undefined

    const where = {
      tenantId: tenant.id,
      ...(resourceId && { resourceId }),
      ...(statuses?.length && { status: { in: statuses } }),
      ...((dateFrom || dateTo) && {
        startsAt: {
          ...(dateFrom && { gte: new Date(`${dateFrom}T00:00:00.000Z`) }),
          ...(dateTo && { lte: new Date(`${dateTo}T23:59:59.999Z`) }),
        },
      }),
    }

    const [bookings, total] = await Promise.all([
      basePrisma.booking.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: { startsAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      basePrisma.booking.count({ where }),
    ])

    return NextResponse.json({
      data: bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    })
  } catch (err) {
    if (isTenantError(err)) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: (err as { statusCode: number }).statusCode }
      )
    }
    throw err
  }
}

// ---- POST /api/bookings ----------------------------------------------------

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    serviceId,
    resourceId,
    startsAt,
    guestName,
    guestPhone,
    guestEmail,
  } = body as Record<string, string>

  const missing = ['serviceId', 'resourceId', 'startsAt', 'guestName', 'guestPhone']
    .filter((k) => !(body as Record<string, string>)[k]?.trim())
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 422 }
    )
  }

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

  try {
    const booking = await createBooking({
      tenantId: tenant.id,
      resourceId,
      serviceId,
      startsAt,
      guestName,
      guestPhone,
      guestEmail,
    })
    console.log(`✅ Booking created: ${booking.id} for ${booking.guestName} at ${booking.startsAt}`)
    return NextResponse.json({ booking }, { status: 201 })
  } catch (err) {
    if (err instanceof BookingLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 })
    }
    if (err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    if (err instanceof ResourceNotFoundError || err instanceof ServiceNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    throw err
  }
}
