/**
 * Static file assertion tests for Phase 9 payment requirements (PAY-01 through PAY-08).
 * Uses safeRead helper to avoid crashes on missing files — tests fail with assertion errors,
 * not throws.
 *
 * Phase 12 update: Kaspi Pay removed. PAY-01 through PAY-06 Kaspi-specific assertions removed.
 * PAY-07 and PAY-08 retained. New assertions added for Phase 12 schema changes.
 */

import fs from "fs"
import path from "path"

const ROOT = path.resolve(__dirname, "..")

const safeRead = (relPath: string): string => {
  const full = path.join(ROOT, relPath)
  if (!fs.existsSync(full)) return ""
  return fs.readFileSync(full, "utf-8")
}

// Removed in Phase 12: Kaspi deposit flow
// PAY-01: Tenant deposit configuration schema fields — kaspiMerchantId/kaspiApiKey removed
// PAY-02: Kaspi adapter module — lib/payments/kaspi.ts deleted
// PAY-03: Booking model payment fields — paymentInvoiceId/paymentExpiresAt removed
// PAY-04: Waiting-for-payment UI — removed from booking-form.tsx
// PAY-05: Kaspi webhook handler — app/api/webhooks/kaspi/route.ts deleted
// PAY-06: Payment timeout cron — app/api/cron/pending-payments/route.ts deleted

// ---- Phase 12-01: Paylink fields present ----

describe("Phase 12-01: PlatformPayment model has Paylink fields", () => {
  it("prisma/schema.prisma contains paylinkOrderId in PlatformPayment model", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).toMatch(/paylinkOrderId/)
  })

  it("prisma/schema.prisma contains paylinkUrl in PlatformPayment model", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).toMatch(/paylinkUrl/)
  })

  it("prisma/schema.prisma does NOT contain mockQrCode", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).not.toMatch(/mockQrCode/)
  })

  it("prisma/schema.prisma does NOT contain mockPaylink", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).not.toMatch(/mockPaylink/)
  })
})

// ---- Phase 12-01: Kaspi Tenant fields removed ----

describe("Phase 12-01: Kaspi fields removed from Tenant model", () => {
  it("prisma/schema.prisma does NOT contain kaspiMerchantId", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).not.toMatch(/kaspiMerchantId/)
  })

  it("prisma/schema.prisma does NOT contain kaspiApiKey", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).not.toMatch(/kaspiApiKey/)
  })
})

// ---- Phase 12-01: Kaspi Booking fields removed ----

describe("Phase 12-01: Kaspi fields removed from Booking model", () => {
  it("prisma/schema.prisma does NOT contain paymentInvoiceId", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).not.toMatch(/paymentInvoiceId/)
  })

  it("prisma/schema.prisma does NOT contain paymentExpiresAt", () => {
    const schema = safeRead("prisma/schema.prisma")
    expect(schema).not.toMatch(/paymentExpiresAt/)
  })
})

// ---- Phase 12-01: Kaspi files deleted ----

describe("Phase 12-01: Kaspi source files deleted", () => {
  it("lib/payments/kaspi.ts file does NOT exist", () => {
    const content = safeRead("lib/payments/kaspi.ts")
    expect(content.length).toBe(0)
  })

  it("app/api/webhooks/kaspi/route.ts file does NOT exist", () => {
    const content = safeRead("app/api/webhooks/kaspi/route.ts")
    expect(content.length).toBe(0)
  })

  it("app/api/cron/pending-payments/route.ts file does NOT exist", () => {
    const content = safeRead("app/api/cron/pending-payments/route.ts")
    expect(content.length).toBe(0)
  })
})

// ---- Phase 12-01: vercel.json cron cleanup ----

describe("Phase 12-01: vercel.json does not contain pending-payments cron", () => {
  it("vercel.json does NOT contain pending-payments path", () => {
    const content = safeRead("vercel.json")
    expect(content).not.toMatch(/pending-payments/)
  })
})

// ---- PAY-07: Slot blocking for PENDING (verify existing) ----

describe("PAY-07: PENDING bookings block slots in collision query (existing)", () => {
  it('lib/booking/engine.ts collision check includes PENDING status', () => {
    const engine = safeRead("lib/booking/engine.ts")
    expect(engine).toMatch(/PENDING/)
  })
})

// ---- PAY-08: Neumorphism design adherence ----

describe("PAY-08: Neumorphism design adherence", () => {
  it("components/booking-form.tsx contains neu-raised or neu-inset (Neumorphism system)", () => {
    const form = safeRead("components/booking-form.tsx")
    expect(form).toMatch(/neu-raised|neu-inset/)
  })
})
