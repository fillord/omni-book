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

    console.log("[SLOTS API] params:", { tenantSlug, resourceId, serviceId, date })

    if (!tenantSlug || !resourceId || !serviceId || !date) {
      console.log("[SLOTS API] ERROR: missing params")
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

    console.log("[SLOTS API] tenant:", tenant ? tenant.id : "NULL")

    if (!tenant) {
      return NextResponse.json({ error: `Tenant not found: "${tenantSlug}"` }, { status: 404 })
    }
    if (!tenant.isActive) {
      return NextResponse.json({ error: "Tenant is suspended" }, { status: 403 })
    }

    // ---- verify resource belongs to this tenant ---------------------------
    const resource = await basePrisma.resource.findFirst({
      where: { id: resourceId, tenantId: tenant.id },
      select: { id: true, name: true },
    })
    console.log("[SLOTS API] resource:", resource ? `${resource.id} (${resource.name})` : "NULL")

    if (!resource) {
      return NextResponse.json(
        { error: `Resource "${resourceId}" not found for tenant "${tenantSlug}"` },
        { status: 404 },
      )
    }

    // ---- verify service belongs to this tenant ----------------------------
    const service = await basePrisma.service.findFirst({
      where: { id: serviceId, tenantId: tenant.id },
      select: { id: true, name: true },
    })
    console.log("[SLOTS API] service:", service ? `${service.id} (${service.name})` : "NULL")

    if (!service) {
      return NextResponse.json(
        { error: `Service "${serviceId}" not found for tenant "${tenantSlug}"` },
        { status: 404 },
      )
    }

    // ---- get slots --------------------------------------------------------
    console.log("[SLOTS API] calling getAvailableSlots with tenantId:", tenant.id)
    const slots = await getAvailableSlots({
      tenantId: tenant.id,
      resourceId,
      serviceId,
      date,
    })

    console.log("[SLOTS API] slots returned:", slots.length)
    return NextResponse.json({ slots })
  } catch (err) {
    if (err instanceof DayOffError) {
      console.log("[SLOTS API] day off")
      return NextResponse.json({ slots: [], dayOff: true, message: "Выходной день" })
    }
    if (err instanceof ResourceNotFoundError || err instanceof ServiceNotFoundError) {
      console.log("[SLOTS API] engine error:", (err as Error).message)
      return NextResponse.json({ error: (err as Error).message }, { status: 404 })
    }
    console.error("[SLOTS API] unhandled error:", err)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 },
    )
  }
}
