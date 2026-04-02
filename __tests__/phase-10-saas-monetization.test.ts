/**
 * Static file assertion tests for Phase 10 SaaS monetization requirements (MON-01 through MON-09).
 * Uses safeRead helper to avoid crashes on missing files — tests fail with assertion errors,
 * not throws. MON-01, MON-06 pass after Task 1. MON-02 passes after Task 2.
 * MON-07, MON-03, MON-09 fail until Plans 02-03 implement the required files.
 */

import fs from "fs"
import path from "path"

const ROOT = path.resolve(__dirname, "..")

const safeRead = (relPath: string): string => {
  const full = path.join(ROOT, relPath)
  if (!fs.existsSync(full)) return ""
  return fs.readFileSync(full, "utf-8")
}

const safeExists = (relPath: string): boolean => {
  return fs.existsSync(path.join(ROOT, relPath))
}

describe("Phase 10 SaaS Monetization — Static Assertions", () => {

  // ---- MON-01: SubscriptionPlan schema model ----

  describe("MON-01: SubscriptionPlan Prisma model", () => {
    it("prisma/schema.prisma contains model SubscriptionPlan", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/model SubscriptionPlan/)
    })

    it("prisma/schema.prisma contains plan Plan @unique", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/plan\s+Plan\s+@unique/)
    })

    it("prisma/schema.prisma contains priceMonthly field", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/priceMonthly/)
    })

    it("prisma/schema.prisma contains pricePerResource field", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/pricePerResource/)
    })

    it("prisma/schema.prisma contains features String[] field", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/features\s+String\[\]/)
    })
  })

  // ---- MON-06: PlatformPayment schema model ----

  describe("MON-06: PlatformPayment Prisma model and PaymentStatus enum", () => {
    it("prisma/schema.prisma contains model PlatformPayment", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/model PlatformPayment/)
    })

    it("prisma/schema.prisma contains enum PaymentStatus", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/enum PaymentStatus/)
    })

    it("prisma/schema.prisma contains planTarget Plan field in PlatformPayment", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/planTarget\s+Plan/)
    })

    it("prisma/schema.prisma contains mockQrCode field in PlatformPayment", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/mockQrCode/)
    })

    it("prisma/schema.prisma contains platformPayments PlatformPayment[] in Tenant model", () => {
      const schema = safeRead("prisma/schema.prisma")
      expect(schema).toMatch(/platformPayments\s+PlatformPayment\[\]/)
    })
  })

  // ---- MON-02: Removal of hardcoded pricing constants ----

  describe("MON-02: No hardcoded pricing constants — DB lookups instead", () => {
    it("lib/actions/admin.ts does NOT contain PLAN_DEFAULT_MAX_RESOURCES", () => {
      const content = safeRead("lib/actions/admin.ts")
      expect(content).not.toMatch(/PLAN_DEFAULT_MAX_RESOURCES/)
    })

    it("lib/actions/admin.ts contains subscriptionPlan.findUnique", () => {
      const content = safeRead("lib/actions/admin.ts")
      expect(content).toMatch(/subscriptionPlan\.findUnique/)
    })

    it("lib/subscription-lifecycle.ts contains subscriptionPlan.findUnique", () => {
      const content = safeRead("lib/subscription-lifecycle.ts")
      expect(content).toMatch(/subscriptionPlan\.findUnique/)
    })

    it("app/admin/analytics/page.tsx does NOT contain hardcoded PLAN_MRR constant definition (with static values)", () => {
      const content = safeRead("app/admin/analytics/page.tsx")
      // The OLD hardcoded constant had literal prices like: { FREE: 0, PRO: 10000, ENTERPRISE: 29900 }
      // The new dynamic version builds PLAN_MRR from DB — it must NOT contain the hardcoded static PRO: 10000 value
      expect(content).not.toMatch(/PRO:\s*10000/)
      expect(content).not.toMatch(/ENTERPRISE:\s*29900/)
    })

    it("app/dashboard/settings/billing/billing-content.tsx does NOT contain '10 000 ₸' hardcoded price", () => {
      const content = safeRead("app/dashboard/settings/billing/billing-content.tsx")
      expect(content).not.toMatch(/10 000 ₸/)
    })

    it("app/dashboard/settings/billing/billing-content.tsx does NOT contain hardcoded '4400'", () => {
      const content = safeRead("app/dashboard/settings/billing/billing-content.tsx")
      expect(content).not.toMatch(/4400/)
    })
  })

  // ---- MON-07: Platform payment service ----

  describe("MON-07: Platform payment service (lib/platform-payment.ts)", () => {
    it("lib/platform-payment.ts exports createPlatformPayment", () => {
      const content = safeRead("lib/platform-payment.ts")
      expect(content).toMatch(/export\s+(async\s+)?function\s+createPlatformPayment/)
    })

    it("lib/platform-payment.ts exports processPlatformPayment", () => {
      const content = safeRead("lib/platform-payment.ts")
      expect(content).toMatch(/export\s+(async\s+)?function\s+processPlatformPayment/)
    })

    it("lib/actions/billing.ts exports initiateSubscriptionPayment", () => {
      const content = safeRead("lib/actions/billing.ts")
      expect(content).toMatch(/export\s+(async\s+)?function\s+initiateSubscriptionPayment/)
    })
  })

  // ---- MON-03: Admin plan management UI ----

  describe("MON-03: Admin plan management UI", () => {
    it("app/admin/plans/page.tsx file exists", () => {
      expect(safeExists("app/admin/plans/page.tsx")).toBe(true)
    })

    it("lib/actions/admin-plans.ts exports updateSubscriptionPlan", () => {
      const content = safeRead("lib/actions/admin-plans.ts")
      expect(content).toMatch(/export\s+(async\s+)?function\s+updateSubscriptionPlan/)
    })
  })

  // ---- MON-09: Mock payment simulation endpoint ----

  describe("MON-09: Mock payment simulation endpoint", () => {
    it("app/api/mock-payment/simulate/route.ts file exists", () => {
      expect(safeExists("app/api/mock-payment/simulate/route.ts")).toBe(true)
    })
  })

  // ---- AuditEventType: saas_payment_received ----

  describe("AuditEventType includes saas_payment_received", () => {
    it("lib/actions/audit-log.ts contains saas_payment_received in AuditEventType", () => {
      const content = safeRead("lib/actions/audit-log.ts")
      expect(content).toMatch(/saas_payment_received/)
    })
  })

})
