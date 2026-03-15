import { NextRequest, NextResponse } from "next/server"
import { basePrisma } from "@/lib/db"
import {
  getAvailableSlots,
  DayOffError,
  ResourceNotFoundError,
  ServiceNotFoundError,
} from "@/lib/booking/engine"

/**
 * GET /api/bookings/slots?tenantSlug=xxx&resourceId=xxx&serviceId=xxx&date=YYYY-MM-DD
 *
 * Returns available time-slots for the given resource+service on a given date.
 * Response 200: { slots: SlotResult[] }
 * Response 200: { slots: [], dayOff: true }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    // ---- extract & validate params ----------------------------------------
    const tenantSlug = searchParams.get("tenantSlug")?.trim() ?? ""
    const resourceId = searchParams.get("resourceId")?.trim() ?? ""
    const serviceId  = searchParams.get("serviceId")?.trim()  ?? ""
    let   date       = searchParams.get("date")?.trim()       ?? ""

    // Sanitize date — keep only YYYY-MM-DD portion
    const dateMatch = date.match(/^(\d{4}-\d{2}-\d{2})/)
    date = dateMatch ? dateMatch[1] : ""

    // Validate year range (prevent "0020-03-16" style bugs)
    const year = date ? parseInt(date.split("-")[0], 10) : 0
    if (year < 2000 || year > 2099) {
      date = ""
    }

    if (!tenantSlug || !resourceId || !serviceId || !date) {
      return NextResponse.json(
        { error: "Missing required query params: tenantSlug, resourceId, serviceId, date (YYYY-MM-DD)" },
        { status: 400 },
      )
    }

    // ---- resolve tenant ---------------------------------------------------
    const tenant = await basePrisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, isActive: true },
    })

    if (!tenant) {
      return NextResponse.json({ error: `Tenant not found: "${tenantSlug}"` }, { status: 404 })
    }
    if (!tenant.isActive) {
      return NextResponse.json({ error: "Tenant is suspended" }, { status: 403 })
    }

    // ---- get slots --------------------------------------------------------
    const slots = await getAvailableSlots({
      tenantId: tenant.id,
      resourceId,
      serviceId,
      date,
    })

    return NextResponse.json({ slots })
  } catch (err) {
    if (err instanceof DayOffError) {
      return NextResponse.json({ slots: [], dayOff: true, message: "Выходной день" })
    }
    if (err instanceof ResourceNotFoundError || err instanceof ServiceNotFoundError) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 })
    }
    console.error("GET /api/bookings/slots error:", err)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 },
    )
  }
}
