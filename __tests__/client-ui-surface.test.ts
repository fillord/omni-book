import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");

const safeRead = (relPath: string): string => {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
};

// ---- CRM-06: Sidebar navigation to Clients page ----
describe("CRM-06: Sidebar navigation to Clients page", () => {
  const sidebar = safeRead("components/dashboard-sidebar.tsx");

  it("sidebar contains Users (lucide-react icon import)", () => {
    expect(sidebar).toContain("Users");
  });

  it("sidebar contains /dashboard/clients (href)", () => {
    expect(sidebar).toContain("/dashboard/clients");
  });

  it("sidebar contains section: 'clients' (translation namespace)", () => {
    expect(sidebar).toContain("section: 'clients'");
  });

  it("app/dashboard/clients/page.tsx exists", () => {
    const full = path.join(ROOT, "app/dashboard/clients/page.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });
});

// ---- CRM-07: Clients table component ----
describe("CRM-07: Clients table component", () => {
  it("components/clients-table.tsx exists", () => {
    const full = path.join(ROOT, "components/clients-table.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("clients-table contains Table (UI import)", () => {
    const clientsTable = safeRead("components/clients-table.tsx");
    expect(clientsTable).toContain("Table");
  });

  it("clients-table contains totalVisits", () => {
    const clientsTable = safeRead("components/clients-table.tsx");
    expect(clientsTable).toContain("totalVisits");
  });

  it("clients-table contains totalRevenue", () => {
    const clientsTable = safeRead("components/clients-table.tsx");
    expect(clientsTable).toContain("totalRevenue");
  });

  it("clients-table contains hasTelegram", () => {
    const clientsTable = safeRead("components/clients-table.tsx");
    expect(clientsTable).toContain("hasTelegram");
  });
});

// ---- CRM-08: Search bar filtering ----
describe("CRM-08: Search bar filtering", () => {
  it("clients-table contains useState", () => {
    const clientsTable = safeRead("components/clients-table.tsx");
    expect(clientsTable).toContain("useState");
  });

  it("clients-table contains useMemo", () => {
    const clientsTable = safeRead("components/clients-table.tsx");
    expect(clientsTable).toContain("useMemo");
  });

  it("clients-table contains searchPlaceholder (i18n key reference)", () => {
    const clientsTable = safeRead("components/clients-table.tsx");
    expect(clientsTable).toContain("searchPlaceholder");
  });
});

// ---- CRM-09: Client detail page ----
describe("CRM-09: Client detail page", () => {
  it("app/dashboard/clients/[clientId]/page.tsx exists", () => {
    const full = path.join(ROOT, "app/dashboard/clients/[clientId]/page.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("detail page contains guestPhone (booking query by phone, not by Client relation)", () => {
    const detailPage = safeRead("app/dashboard/clients/[clientId]/page.tsx");
    expect(detailPage).toContain("guestPhone");
  });

  it("detail page contains notFound (ownership check)", () => {
    const detailPage = safeRead("app/dashboard/clients/[clientId]/page.tsx");
    expect(detailPage).toContain("notFound");
  });
});

// ---- CRM-10: Telegram outreach action ----
describe("CRM-10: Telegram outreach action", () => {
  it("clients.ts contains sendTelegramToClient", () => {
    const clientsAction = safeRead("lib/actions/clients.ts");
    expect(clientsAction).toContain("sendTelegramToClient");
  });

  it("clients.ts contains sendTelegramMessage (telegram utility call)", () => {
    const clientsAction = safeRead("lib/actions/clients.ts");
    expect(clientsAction).toContain("sendTelegramMessage");
  });

  it("clients.ts contains telegramChatId (booking lookup for chat ID)", () => {
    const clientsAction = safeRead("lib/actions/clients.ts");
    expect(clientsAction).toContain("telegramChatId");
  });

  it("client-detail.tsx contains sendTelegramToClient (UI wires to action)", () => {
    const clientDetail = safeRead("components/client-detail.tsx");
    expect(clientDetail).toContain("sendTelegramToClient");
  });
});

// ---- CRM-11: Neumorphism design adherence ----
describe("CRM-11: Neumorphism design adherence", () => {
  it("clients-table contains Card (neu-raised wrapper)", () => {
    const clientsTable = safeRead("components/clients-table.tsx");
    expect(clientsTable).toContain("Card");
  });

  it("client-detail.tsx contains Card (neu-raised wrapper)", () => {
    const clientDetail = safeRead("components/client-detail.tsx");
    expect(clientDetail).toContain("Card");
  });
});

// ---- CRM-12: i18n translations in all three locales ----
describe("CRM-12: i18n translations in all three locales", () => {
  const translations = safeRead("lib/i18n/translations.ts");

  it("translations contain clients: section at least 3 times (once per locale)", () => {
    const matches = translations.match(/clients:/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(3);
  });

  it("translations contain searchPlaceholder", () => {
    expect(translations).toContain("searchPlaceholder");
  });

  it("translations contain sendMessage", () => {
    expect(translations).toContain("sendMessage");
  });

  it("translations contain bookingHistory", () => {
    expect(translations).toContain("bookingHistory");
  });
});
