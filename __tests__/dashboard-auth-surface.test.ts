import fs from "fs";
import path from "path";

const readComponent = (name: string) =>
  fs.readFileSync(path.resolve(__dirname, "..", "components", name), "utf-8");

const readApp = (relPath: string) =>
  fs.readFileSync(path.resolve(__dirname, "..", relPath), "utf-8");

// ---- DASH-01 ----
describe("DASH-01: dashboard-sidebar.tsx uses sidebar token family, not bg-background", () => {
  it("root div uses bg-sidebar not bg-background", () => {
    const source = readComponent("dashboard-sidebar.tsx");
    expect(source).not.toMatch(/flex flex-col h-full bg-background/);
    expect(source).toContain("bg-sidebar");
  });
  it("footer section uses bg-sidebar not bg-background", () => {
    const source = readComponent("dashboard-sidebar.tsx");
    const lines = source.split("\n");
    const footerLines = lines.filter((l) => l.includes("mt-auto"));
    footerLines.forEach((l) => expect(l).not.toMatch(/\bbg-background\b/));
  });
  it("sidebar uses border-sidebar-border not border-border on root and footer", () => {
    const source = readComponent("dashboard-sidebar.tsx");
    expect(source).toContain("border-sidebar-border");
    expect(source).not.toMatch(/flex flex-col h-full.*border-border/);
  });
});

// ---- DASH-02 ----
describe("DASH-02: billing-content.tsx has no dark:! force-override classes", () => {
  it("billing-content.tsx contains no dark:! classes", () => {
    const source = readApp("app/dashboard/settings/billing/billing-content.tsx");
    expect(source).not.toMatch(/dark:![a-z]/);
  });
  it("billing-content.tsx contains no bare text-zinc-* neutral text classes", () => {
    const source = readApp("app/dashboard/settings/billing/billing-content.tsx");
    expect(source).not.toMatch(/\btext-zinc-\d+\b/);
  });
  it("billing-content.tsx contains no bare bg-zinc-* neutral background classes", () => {
    const source = readApp("app/dashboard/settings/billing/billing-content.tsx");
    expect(source).not.toMatch(/\bbg-zinc-\d+\b/);
  });
  it("billing-content.tsx contains no bare border-zinc-* neutral border classes", () => {
    const source = readApp("app/dashboard/settings/billing/billing-content.tsx");
    expect(source).not.toMatch(/\bborder-zinc-\d+\b/);
  });
});

// ---- DASH-03 ----
describe("DASH-03: analytics-dashboard.tsx Recharts props use CSS variable references", () => {
  it("analytics-dashboard.tsx EmptyState does not use text-zinc-400", () => {
    const source = readComponent("analytics-dashboard.tsx");
    expect(source).not.toMatch(/\btext-zinc-400\b/);
  });
  it("CartesianGrid stroke does not use hardcoded hex #f4f4f5", () => {
    const source = readComponent("analytics-dashboard.tsx");
    expect(source).not.toMatch(/stroke="#f4f4f5"/);
  });
  it("Tooltip cursor fill does not use hardcoded hex #f4f4f5", () => {
    const source = readComponent("analytics-dashboard.tsx");
    expect(source).not.toMatch(/fill: '#f4f4f5'/);
  });
  it("axis tick fill does not use hardcoded hex #a1a1aa or #52525b", () => {
    const source = readComponent("analytics-dashboard.tsx");
    expect(source).not.toMatch(/fill: '#a1a1aa'/);
    expect(source).not.toMatch(/fill: '#52525b'/);
  });
  it("contentStyle border does not use hardcoded hex #e4e4e7", () => {
    const source = readComponent("analytics-dashboard.tsx");
    expect(source).not.toMatch(/#e4e4e7/);
  });
});

// ---- DASH-04 ----
describe("DASH-04: manager components have no hardcoded neutral color classes", () => {
  const MANAGERS = ["staff-manager.tsx", "services-manager.tsx", "resources-manager.tsx"];
  const NEUTRAL_PATTERN = /\b(bg-white|bg-zinc-\d+|bg-slate-\d+|text-zinc-\d+|text-slate-\d+)\b/;

  MANAGERS.forEach((file) => {
    it(`${file} has no hardcoded neutral background or text classes`, () => {
      const source = readComponent(file);
      expect(source).not.toMatch(NEUTRAL_PATTERN);
    });
  });
});

// ---- DASH-05 ----
describe("DASH-05: dashboard-sidebar.tsx admin link uses sidebar-accent tokens", () => {
  it("admin link does not use bg-zinc-900", () => {
    const source = readComponent("dashboard-sidebar.tsx");
    expect(source).not.toMatch(/\bbg-zinc-900\b/);
  });
  it("admin link does not use text-white on hardcoded dark background", () => {
    const source = readComponent("dashboard-sidebar.tsx");
    // text-white is only allowed if NOT paired with bg-zinc-900
    expect(source).not.toMatch(/text-white\s+bg-zinc-900|bg-zinc-900\s+.*text-white/);
  });
});

// ---- AUTH-01 ----
describe("AUTH-01: login/page.tsx has no neutral zinc/slate/gray background violations", () => {
  it("login/page.tsx has no bare bg-zinc-* background classes", () => {
    const source = readApp("app/(auth)/login/page.tsx");
    expect(source).not.toMatch(/\bbg-zinc-\d+\b/);
  });
  it("login/page.tsx has no bare bg-slate-* background classes", () => {
    const source = readApp("app/(auth)/login/page.tsx");
    expect(source).not.toMatch(/\bbg-slate-\d+\b/);
  });
});

// ---- AUTH-02 ----
describe("AUTH-02: register/page.tsx has no neutral zinc/slate/gray background violations", () => {
  it("register/page.tsx has no bare bg-zinc-* background classes", () => {
    const source = readApp("app/(auth)/register/page.tsx");
    expect(source).not.toMatch(/\bbg-zinc-\d+\b/);
  });
  it("register/page.tsx has no bare bg-slate-* background classes", () => {
    const source = readApp("app/(auth)/register/page.tsx");
    expect(source).not.toMatch(/\bbg-slate-\d+\b/);
  });
});

// ---- AUTH-03 ----
describe("AUTH-03: verify-otp/page.tsx has no neutral zinc/slate/gray background violations", () => {
  it("verify-otp/page.tsx has no bare bg-zinc-* background classes", () => {
    const source = readApp("app/(auth)/verify-otp/page.tsx");
    expect(source).not.toMatch(/\bbg-zinc-\d+\b/);
  });
  it("verify-otp/page.tsx has no bare bg-slate-* background classes", () => {
    const source = readApp("app/(auth)/verify-otp/page.tsx");
    expect(source).not.toMatch(/\bbg-slate-\d+\b/);
  });
});
