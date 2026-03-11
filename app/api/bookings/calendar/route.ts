import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { basePrisma } from '@/lib/db'
import { resolveTenant, isTenantError } from '@/lib/tenant'

// ---- query schema ----------------------------------------------------------

const querySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStart must be YYYY-MM-DD'),
  resourceIds: z.string().optional(),  // comma-separated IDs (empty = all)
  tenantSlug: z.string().optional(),
})

// ---- GET /api/bookings/calendar?weekStart=YYYY-MM-DD&resourceIds=...  ------

export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req)

    const raw = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = querySchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { weekStart, resourceIds: resourceIdsParam } = parsed.data

    const weekStartDate = new Date(`${weekStart}T00:00:00.000Z`)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekEndDate.getDate() + 7)

    if (isNaN(weekStartDate.getTime())) {
      return NextResponse.json({ error: 'Invalid weekStart date' }, { status: 400 })
    }

    const resourceFilter = resourceIdsParam
      ? resourceIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
      : []

    const tenantId = tenant.id

    const [resources, bookings] = await Promise.all([
      basePrisma.resource.findMany({
        where: {
          tenantId,
          isActive: true,
          ...(resourceFilter.length > 0 && { id: { in: resourceFilter } }),
        },
        select: { id: true, name: true, type: true },
        orderBy: { name: 'asc' },
      }),
      basePrisma.booking.findMany({
        where: {
          tenantId,
          ...(resourceFilter.length > 0 && { resourceId: { in: resourceFilter } }),
          startsAt: { lt: weekEndDate },
          endsAt: { gt: weekStartDate },
        },
        include: {
          resource: { select: { id: true, name: true, type: true } },
          service: { select: { id: true, name: true, durationMin: true, price: true, currency: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startsAt: 'asc' },
      }),
    ])

    // Group by resourceId
    const grouped: Record<
      string,
      { resourceName: string; resourceType: string; bookings: typeof bookings }
    > = {}

    for (const resource of resources) {
      grouped[resource.id] = {
        resourceName: resource.name,
        resourceType: resource.type,
        bookings: [],
      }
    }

    for (const booking of bookings) {
      const rId = booking.resourceId
      if (!grouped[rId]) {
        grouped[rId] = {
          resourceName: booking.resource.name,
          resourceType: booking.resource.type,
          bookings: [],
        }
      }
      grouped[rId].bookings.push(booking)
    }

    return NextResponse.json({ data: grouped, weekStart })
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
