import { NextRequest, NextResponse } from "next/server"
import { resolveTenant, isTenantError } from "@/lib/tenant"
import {
  getAvailableSlots,
  DayOffError,
  ResourceNotFoundError,
  ServiceNotFoundError,
} from "@/lib/booking/engine"

/**
 * GET /api/bookings/slots?resourceId=&serviceId=&date=YYYY-MM-DD
 * Returns available time slots for the given resource+service on the given date.
 *
 * Response 200: { slots: SlotResult[] }
 * Response 200: { slots: [], dayOff: true } — resource has no schedule on that day
 */
export async function GET(req: NextRequest) {
  try {
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

    const { searchParams } = req.nextUrl
    const resourceId = searchParams.get("resourceId")
    const serviceId  = searchParams.get("serviceId")
    let date         = searchParams.get("date") ?? ""

    // Sanitize date — extract YYYY-MM-DD, discard any trailing garbage (e.g. ":1")
    const dateMatch = date.match(/^(\d{4}-\d{2}-\d{2})/)
    date = dateMatch ? dateMatch[1] : ""

    if (!resourceId || !serviceId || !date) {
      return NextResponse.json(
        { error: "Missing required query params: resourceId, serviceId, date (YYYY-MM-DD)" },
        { status: 400 }
      )
    }

    try {
      const slots = await getAvailableSlots({
        tenantId: tenant.id,
        resourceId,
        serviceId,
        date,
      })
      return NextResponse.json({ slots })
    } catch (err) {
      if (err instanceof DayOffError) {
        const { getServerT } = await import("@/lib/i18n/server")
        const t = await getServerT()
        return NextResponse.json({ slots: [], dayOff: true, message: t('booking', 'dayOff') })
      }
      if (err instanceof ResourceNotFoundError || err instanceof ServiceNotFoundError) {
        return NextResponse.json({ error: (err as Error).message }, { status: 404 })
      }
      throw err
    }
  } catch (error) {
    console.error("GET /api/bookings/slots error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    )
  }
}
