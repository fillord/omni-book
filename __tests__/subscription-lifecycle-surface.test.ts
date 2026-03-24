import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");

const safeRead = (relPath: string): string => {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
};

// ---- SUB-01: Schema ----
describe("SUB-01: Prisma schema isFrozen + CANCELED", () => {
  const schema = safeRead("prisma/schema.prisma");

  // Extract just the Resource model section
  const resourceModelMatch = schema.match(/model Resource \{[\s\S]*?(?=\nmodel |\nenum )/);
  const resourceModel = resourceModelMatch ? resourceModelMatch[0] : "";

  // Extract just the Service model section
  const serviceModelMatch = schema.match(/model Service \{[\s\S]*?(?=\nmodel |\nenum )/);
  const serviceModel = serviceModelMatch ? serviceModelMatch[0] : "";

  // Extract just the PlanStatus enum section
  const planStatusMatch = schema.match(/enum PlanStatus \{[\s\S]*?\}/);
  const planStatus = planStatusMatch ? planStatusMatch[0] : "";

  it("schema.prisma Resource model contains isFrozen Boolean", () => {
    expect(resourceModel).toContain("isFrozen");
  });

  it("schema.prisma Resource model isFrozen has @default(false)", () => {
    expect(resourceModel).toMatch(/isFrozen\s+Boolean\s+@default\(false\)/);
  });

  it("schema.prisma Service model contains isFrozen Boolean", () => {
    expect(serviceModel).toContain("isFrozen");
  });

  it("schema.prisma Service model isFrozen has @default(false)", () => {
    expect(serviceModel).toMatch(/isFrozen\s+Boolean\s+@default\(false\)/);
  });

  it("schema.prisma PlanStatus enum contains CANCELED", () => {
    expect(planStatus).toContain("CANCELED");
  });
});

// ---- SUB-02: Cron route ----
describe("SUB-02: Cron subscription lifecycle route", () => {
  const cronRoute = safeRead("app/api/cron/subscriptions/route.ts");

  it("app/api/cron/subscriptions/route.ts exists", () => {
    const full = path.join(ROOT, "app/api/cron/subscriptions/route.ts");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("cron route contains CRON_SECRET (auth check)", () => {
    expect(cronRoute).toContain("CRON_SECRET");
  });

  it("cron route contains subscriptionExpiresAt (expiry detection)", () => {
    expect(cronRoute).toContain("subscriptionExpiresAt");
  });

  it("cron route contains isFrozen (freeze logic)", () => {
    expect(cronRoute).toContain("isFrozen");
  });

  it("cron route contains notification.create or notification.createMany (3-day warning)", () => {
    expect(
      cronRoute.includes("notification.create") || cronRoute.includes("notification.createMany")
    ).toBe(true);
  });

  it("cron route contains plan_downgrade (audit log event)", () => {
    expect(cronRoute).toContain("plan_downgrade");
  });

  it("cron route exports GET handler", () => {
    expect(cronRoute).toContain("export async function GET");
  });

  it("vercel.json contains /api/cron/subscriptions schedule", () => {
    const vercel = safeRead("vercel.json");
    expect(vercel).toContain("/api/cron/subscriptions");
  });
});

// ---- SUB-03: Frozen UI ----
describe("SUB-03: Frozen indicator in managers", () => {
  const resourcesManager = safeRead("components/resources-manager.tsx");
  const servicesManager = safeRead("components/services-manager.tsx");
  const staffManager = safeRead("components/staff-manager.tsx");

  it("components/resources-manager.tsx contains isFrozen", () => {
    expect(resourcesManager).toContain("isFrozen");
  });

  it("components/resources-manager.tsx contains Заморожен", () => {
    expect(resourcesManager).toContain("Заморожен");
  });

  it("components/services-manager.tsx contains isFrozen", () => {
    expect(servicesManager).toContain("isFrozen");
  });

  it("components/services-manager.tsx contains Заморожен", () => {
    expect(servicesManager).toContain("Заморожен");
  });

  it("components/staff-manager.tsx contains planStatus", () => {
    expect(staffManager).toContain("planStatus");
  });
});

// ---- SUB-04: Billing page ----
describe("SUB-04: Billing page subscription status display", () => {
  const billingContent = safeRead("app/dashboard/settings/billing/billing-content.tsx");

  it("billing-content.tsx contains subscriptionExpiresAt", () => {
    expect(billingContent).toContain("subscriptionExpiresAt");
  });

  it("billing-content.tsx contains Ваша подписка истекла (expired message)", () => {
    expect(billingContent).toContain("Ваша подписка истекла");
  });
});

// ---- SUB-05: Admin activation ----
describe("SUB-05: Admin activateSubscription action", () => {
  const adminActions = safeRead("lib/actions/admin.ts");
  const adminTenantPage = safeRead("app/admin/tenants/[tenantId]/page.tsx");

  it("lib/actions/admin.ts contains activateSubscription", () => {
    expect(adminActions).toContain("activateSubscription");
  });

  it("lib/actions/admin.ts contains isFrozen: false (unfreeze logic)", () => {
    expect(adminActions).toContain("isFrozen: false");
  });

  it("app/admin/tenants/[tenantId]/page.tsx contains activateSubscription or ActivateSubscription", () => {
    expect(
      adminTenantPage.includes("activateSubscription") ||
        adminTenantPage.includes("ActivateSubscription")
    ).toBe(true);
  });
});

// ---- SUB-06: Neumorphism frozen badges ----
describe("SUB-06: Frozen badges use neu-inset (neumorphism design)", () => {
  const resourcesManager = safeRead("components/resources-manager.tsx");
  const servicesManager = safeRead("components/services-manager.tsx");

  it("resources-manager.tsx contains neu-inset (frozen badge neumorphism)", () => {
    expect(resourcesManager).toContain("neu-inset");
  });

  it("services-manager.tsx contains neu-inset (frozen badge neumorphism)", () => {
    expect(servicesManager).toContain("neu-inset");
  });
});
