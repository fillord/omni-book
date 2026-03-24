import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");

const safeRead = (relPath: string): string => {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
};

// ---- GOD-01 ----
describe("GOD-01: Financial Analytics Dashboard", () => {
  const source = safeRead("app/admin/analytics/page.tsx");

  it("app/admin/analytics/page.tsx exists", () => {
    const full = path.join(ROOT, "app/admin/analytics/page.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("analytics page contains neu-raised (neumorphism card)", () => {
    expect(source).toContain("neu-raised");
  });

  it("analytics page contains bg-[var(--neu-bg)] (neumorphism background)", () => {
    expect(source).toContain("bg-[var(--neu-bg)]");
  });

  it("analytics page contains PLAN_MRR or planCounts (MRR calculation)", () => {
    expect(source.includes("PLAN_MRR") || source.includes("planCounts")).toBe(true);
  });

  it("analytics page contains groupBy (Prisma groupBy for plan breakdown)", () => {
    expect(source).toContain("groupBy");
  });

  it("analytics page contains BarChart or ResponsiveContainer (Recharts usage)", () => {
    expect(source.includes("BarChart") || source.includes("ResponsiveContainer")).toBe(true);
  });
});

// ---- GOD-02 ----
describe("GOD-02: Tenant Drill-Down", () => {
  const drillDown = safeRead("app/admin/tenants/[tenantId]/page.tsx");
  const tenantRow = safeRead("app/admin/tenants/admin-tenant-row.tsx");

  it("app/admin/tenants/[tenantId]/page.tsx exists", () => {
    const full = path.join(ROOT, "app/admin/tenants/[tenantId]/page.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("drill-down page contains neu-raised (neumorphism card)", () => {
    expect(drillDown).toContain("neu-raised");
  });

  it("drill-down page contains bg-[var(--neu-bg)] (neumorphism background)", () => {
    expect(drillDown).toContain("bg-[var(--neu-bg)]");
  });

  it("drill-down page contains basePrisma.service.findMany or basePrisma.resource.findMany", () => {
    expect(
      drillDown.includes("basePrisma.service.findMany") ||
        drillDown.includes("basePrisma.resource.findMany")
    ).toBe(true);
  });

  it("drill-down page contains TabsContent or Tabs (tabbed layout)", () => {
    expect(drillDown.includes("TabsContent") || drillDown.includes("Tabs")).toBe(true);
  });

  it("admin-tenant-row.tsx contains href (clickable link)", () => {
    expect(tenantRow).toContain("href");
  });

  it("admin-tenant-row.tsx contains tenantId (link to drill-down)", () => {
    expect(tenantRow).toContain("tenantId");
  });
});

// ---- GOD-03 ----
describe("GOD-03: Global Announcement Banners", () => {
  const schema = safeRead("prisma/schema.prisma");
  const actions = safeRead("lib/actions/announcements.ts");
  const banner = safeRead("components/announcement-banner.tsx");
  const dashboardLayout = safeRead("app/dashboard/layout.tsx");

  it("prisma/schema.prisma contains model Announcement", () => {
    expect(schema).toContain("model Announcement");
  });

  it("lib/actions/announcements.ts exists", () => {
    const full = path.join(ROOT, "lib/actions/announcements.ts");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("lib/actions/announcements.ts contains ensureSuperAdmin", () => {
    expect(actions).toContain("ensureSuperAdmin");
  });

  it("lib/actions/announcements.ts contains revalidatePath('/dashboard')", () => {
    expect(actions).toContain("revalidatePath('/dashboard'");
  });

  it("components/announcement-banner.tsx exists", () => {
    const full = path.join(ROOT, "components/announcement-banner.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("announcement-banner.tsx contains 'use client'", () => {
    expect(banner).toContain("use client");
  });

  it("announcement-banner.tsx contains localStorage (dismissed state)", () => {
    expect(banner).toContain("localStorage");
  });

  it("app/dashboard/layout.tsx contains announcement (banner data injected)", () => {
    expect(dashboardLayout).toContain("announcement");
  });
});

// ---- GOD-04 ----
describe("GOD-04: Targeted In-App Notifications", () => {
  const schema = safeRead("prisma/schema.prisma");
  const actions = safeRead("lib/actions/notifications.ts");
  const bell = safeRead("components/notification-bell.tsx");
  const sidebar = safeRead("components/dashboard-sidebar.tsx");

  it("prisma/schema.prisma contains model Notification", () => {
    expect(schema).toContain("model Notification");
  });

  it("lib/actions/notifications.ts exists", () => {
    const full = path.join(ROOT, "lib/actions/notifications.ts");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("lib/actions/notifications.ts contains ensureSuperAdmin", () => {
    expect(actions).toContain("ensureSuperAdmin");
  });

  it("components/notification-bell.tsx exists", () => {
    const full = path.join(ROOT, "components/notification-bell.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("notification-bell.tsx contains Bell (lucide icon)", () => {
    expect(bell).toContain("Bell");
  });

  it("components/dashboard-sidebar.tsx contains NotificationBell or notification-bell", () => {
    expect(
      sidebar.includes("NotificationBell") || sidebar.includes("notification-bell")
    ).toBe(true);
  });
});

// ---- GOD-05 ----
describe("GOD-05: Audit & Activity Logs", () => {
  const schema = safeRead("prisma/schema.prisma");
  const auditLog = safeRead("lib/actions/audit-log.ts");
  const auditPage = safeRead("app/admin/audit-logs/page.tsx");
  const services = safeRead("lib/actions/services.ts");
  const resources = safeRead("lib/actions/resources.ts");
  const staff = safeRead("lib/actions/staff.ts");

  it("prisma/schema.prisma contains model AuditLog", () => {
    expect(schema).toContain("model AuditLog");
  });

  it("lib/actions/audit-log.ts exists", () => {
    const full = path.join(ROOT, "lib/actions/audit-log.ts");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("lib/actions/audit-log.ts exports createAuditLog", () => {
    expect(auditLog).toContain("createAuditLog");
  });

  it("lib/actions/audit-log.ts contains .catch(() => {}) (fire-and-forget)", () => {
    expect(auditLog).toContain(".catch(() => {})");
  });

  it("app/admin/audit-logs/page.tsx exists", () => {
    const full = path.join(ROOT, "app/admin/audit-logs/page.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("audit-logs page contains neu-raised (neumorphism card)", () => {
    expect(auditPage).toContain("neu-raised");
  });

  it("audit-logs page contains bg-[var(--neu-bg)] (neumorphism background)", () => {
    expect(auditPage).toContain("bg-[var(--neu-bg)]");
  });

  it("lib/actions/services.ts contains createAuditLog (hook in delete action)", () => {
    expect(services).toContain("createAuditLog");
  });

  it("lib/actions/resources.ts contains createAuditLog (hook in delete action)", () => {
    expect(resources).toContain("createAuditLog");
  });

  it("lib/actions/staff.ts contains createAuditLog (hook in delete action)", () => {
    expect(staff).toContain("createAuditLog");
  });
});

// ---- GOD-06 ----
describe("GOD-06: Neumorphism Design Adherence", () => {
  const analytics = safeRead("app/admin/analytics/page.tsx");
  const drillDown = safeRead("app/admin/tenants/[tenantId]/page.tsx");
  const auditPage = safeRead("app/admin/audit-logs/page.tsx");
  const banner = safeRead("components/announcement-banner.tsx");
  const bell = safeRead("components/notification-bell.tsx");

  it("analytics page does NOT contain border-border", () => {
    expect(analytics).not.toContain("border-border");
  });

  it("tenant drill-down page does NOT contain border-border", () => {
    expect(drillDown).not.toContain("border-border");
  });

  it("audit-logs page does NOT contain border-border", () => {
    expect(auditPage).not.toContain("border-border");
  });

  it("announcement-banner.tsx contains neu-raised or neu-inset", () => {
    expect(banner.includes("neu-raised") || banner.includes("neu-inset")).toBe(true);
  });

  it("notification-bell.tsx contains neu-raised or neu-inset", () => {
    expect(bell.includes("neu-raised") || bell.includes("neu-inset")).toBe(true);
  });
});
