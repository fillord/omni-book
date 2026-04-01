/**
 * Static file assertion tests for Phase 9 payment requirements (PAY-01 through PAY-08).
 * Uses safeRead helper to avoid crashes on missing files — tests fail with assertion errors,
 * not throws. PAY-07 verifies existing code; others are RED until Plans 02-04 implement features.
 */

import fs from "fs"
import path from "path"

const ROOT = path.resolve(__dirname, "..")

const safeRead = (relPath: string): string => {
  const full = path.join(ROOT, relPath)
  if (!fs.existsSync(full)) return ""
  return fs.readFileSync(full, "utf-8")
}

// ---- PAY-01: Tenant deposit configuration (schema fields) ----

describe("PAY-01: Tenant deposit configuration schema fields", () => {
  it("prisma/schema.prisma contains requireDeposit in Tenant model", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).toMatch(/requireDeposit/)
  })

  it("prisma/schema.prisma contains depositAmount in Tenant model", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).toMatch(/depositAmount/)
  })

  it("prisma/schema.prisma contains kaspiMerchantId in Tenant model", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).toMatch(/kaspiMerchantId/)
  })

  it("prisma/schema.prisma contains kaspiApiKey in Tenant model", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).toMatch(/kaspiApiKey/)
  })
})

// ---- PAY-02: Kaspi adapter exports ----

describe("PAY-02: Kaspi adapter module existence and exports", () => {
  it("lib/payments/kaspi.ts file exists and is non-empty", () => {
    const content = safeRead("lib/payments/kaspi.ts")
    expect(content.length).toBeGreaterThan(0)
  })

  it("lib/payments/kaspi.ts exports createKaspiInvoice", () => {
    const content = safeRead("lib/payments/kaspi.ts")
    expect(content).toMatch(/export\s+(async\s+)?function\s+createKaspiInvoice/)
  })

  it("lib/payments/kaspi.ts exports verifyKaspiWebhook", () => {
    const content = safeRead("lib/payments/kaspi.ts")
    expect(content).toMatch(/export\s+(async\s+)?function\s+verifyKaspiWebhook/)
  })

  it("lib/payments/kaspi.ts exports KaspiInvoiceResult type/interface", () => {
    const content = safeRead("lib/payments/kaspi.ts")
    expect(content).toMatch(/export\s+(interface|type)\s+KaspiInvoiceResult/)
  })
})

// ---- PAY-03: Booking model payment fields ----

describe("PAY-03: Booking model payment fields", () => {
  it("prisma/schema.prisma contains paymentInvoiceId in Booking model", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).toMatch(/paymentInvoiceId/)
  })

  it("prisma/schema.prisma contains paymentExpiresAt in Booking model", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).toMatch(/paymentExpiresAt/)
  })

  it("prisma/schema.prisma contains @@index([status, paymentExpiresAt]) on Booking", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).toMatch(/@@index\(\[status,\s*paymentExpiresAt\]\)/)
  })

  it("app/api/bookings/route.ts contains invoiceCreated in response", () => {
    const route = safeRead("app/api/bookings/route.ts")
    expect(route).toMatch(/invoiceCreated/)
  })

  it("lib/booking/engine.ts contains paymentExpiresAt in CreateBookingParams or create data", () => {
    const engine = safeRead("lib/booking/engine.ts")
    expect(engine).toMatch(/paymentExpiresAt/)
  })
})

// ---- PAY-04: Waiting-for-payment UI ----

describe("PAY-04: Waiting-for-payment UI in booking form", () => {
  it("components/booking-form.tsx contains WaitingForPayment or waitingForPayment or pendingPayment", () => {
    const form = safeRead("components/booking-form.tsx")
    expect(form).toMatch(/WaitingForPayment|waitingForPayment|pendingPayment/)
  })

  it("components/booking-form.tsx contains countdown-related code (setInterval or countdown)", () => {
    const form = safeRead("components/booking-form.tsx")
    expect(form).toMatch(/setInterval|countdown/i)
  })
})

// ---- PAY-05: Kaspi webhook handler ----

describe("PAY-05: Kaspi webhook handler route", () => {
  it("app/api/webhooks/kaspi/route.ts file exists and is non-empty", () => {
    const content = safeRead("app/api/webhooks/kaspi/route.ts")
    expect(content.length).toBeGreaterThan(0)
  })

  it("app/api/webhooks/kaspi/route.ts contains POST export", () => {
    const content = safeRead("app/api/webhooks/kaspi/route.ts")
    expect(content).toMatch(/export\s+(async\s+)?function\s+POST/)
  })

  it("app/api/webhooks/kaspi/route.ts contains CONFIRMED status transition", () => {
    const content = safeRead("app/api/webhooks/kaspi/route.ts")
    expect(content).toMatch(/CONFIRMED/)
  })
})

// ---- PAY-06: Payment timeout cron ----

describe("PAY-06: Payment timeout cron for expired pending bookings", () => {
  it("app/api/cron/pending-payments/route.ts file exists and is non-empty", () => {
    const content = safeRead("app/api/cron/pending-payments/route.ts")
    expect(content.length).toBeGreaterThan(0)
  })

  it("app/api/cron/pending-payments/route.ts contains GET export (Vercel cron constraint)", () => {
    const content = safeRead("app/api/cron/pending-payments/route.ts")
    expect(content).toMatch(/export\s+(async\s+)?function\s+GET/)
  })

  it("lib/payment-lifecycle.ts contains cancelExpiredPendingBookings", () => {
    const content = safeRead("lib/payment-lifecycle.ts")
    expect(content).toMatch(/cancelExpiredPendingBookings/)
  })

  it("vercel.json contains pending-payments cron path", () => {
    const content = safeRead("vercel.json")
    expect(content).toMatch(/pending-payments/)
  })
})

// ---- PAY-07: Slot blocking for PENDING (verify existing) ----

describe("PAY-07: PENDING bookings block slots in collision query (existing)", () => {
  it('lib/booking/engine.ts collision check includes both CONFIRMED and PENDING statuses', () => {
    const engine = safeRead("lib/booking/engine.ts")
    // Verify that status in clause includes PENDING alongside CONFIRMED (single or double quotes)
    expect(engine).toMatch(/['"]CONFIRMED['"].*['"]PENDING['"]|['"]PENDING['"].*['"]CONFIRMED['"]/)
  })
})

// ---- PAY-08: Neumorphism design adherence ----

describe("PAY-08: Neumorphism design adherence", () => {
  it("components/booking-form.tsx contains neu-raised or neu-inset (Neumorphism system)", () => {
    const form = safeRead("components/booking-form.tsx")
    expect(form).toMatch(/neu-raised|neu-inset/)
  })

  // app/api/webhooks/kaspi/route.ts is server-side only — no UI, Neumorphism check skipped
})
