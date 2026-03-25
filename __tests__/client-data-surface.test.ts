import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");

const safeRead = (relPath: string): string => {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
};

// ---- CRM-01: Client model in schema ----
describe("CRM-01: Client model in schema", () => {
  const schema = safeRead("prisma/schema.prisma");

  // Extract just the Client model section
  const clientModelMatch = schema.match(/model Client \{[\s\S]*?(?=\nmodel |\nenum )/);
  const clientModel = clientModelMatch ? clientModelMatch[0] : "";

  // Extract just the Tenant model section
  const tenantModelMatch = schema.match(/model Tenant \{[\s\S]*?(?=\nmodel |\nenum )/);
  const tenantModel = tenantModelMatch ? tenantModelMatch[0] : "";

  it("schema.prisma contains model Client {", () => {
    expect(schema).toContain("model Client {");
  });

  it("Client model has @@unique([tenantId, phone]) composite constraint", () => {
    expect(schema).toContain("@@unique([tenantId, phone])");
  });

  it("Client model has @@index([tenantId])", () => {
    expect(schema).toContain("@@index([tenantId])");
  });

  it("Client model contains onDelete: Cascade", () => {
    expect(clientModel).toContain("onDelete: Cascade");
  });

  it("Client model contains tenantId field", () => {
    expect(clientModel).toContain("tenantId       String");
  });

  it("Client model contains phone field", () => {
    expect(clientModel).toContain("phone          String");
  });

  it("Client model contains totalVisits Int @default(0)", () => {
    expect(clientModel).toMatch(/totalVisits\s+Int\s+@default\(0\)/);
  });

  it("Client model contains totalRevenue Int @default(0)", () => {
    expect(clientModel).toMatch(/totalRevenue\s+Int\s+@default\(0\)/);
  });

  it("Client model contains lastVisitAt DateTime?", () => {
    expect(clientModel).toContain("lastVisitAt    DateTime?");
  });

  it("Client model contains hasTelegram Boolean @default(false)", () => {
    expect(clientModel).toMatch(/hasTelegram\s+Boolean\s+@default\(false\)/);
  });

  it("Tenant model contains clients Client[] back-relation", () => {
    expect(tenantModel).toContain("clients");
    expect(tenantModel).toContain("Client[]");
  });
});

// ---- CRM-01: syncClients action file ----
describe("CRM-01: syncClients action file", () => {
  const clientsAction = safeRead("lib/actions/clients.ts");

  it("lib/actions/clients.ts exists", () => {
    const full = path.join(ROOT, "lib/actions/clients.ts");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("clients.ts contains 'use server'", () => {
    expect(clientsAction).toContain("'use server'");
  });

  it("clients.ts contains syncClients", () => {
    expect(clientsAction).toContain("syncClients");
  });

  it("clients.ts contains upsert (idempotency)", () => {
    expect(clientsAction).toContain("upsert");
  });

  it("clients.ts contains tenantId_phone (composite unique key in upsert where)", () => {
    expect(clientsAction).toContain("tenantId_phone");
  });

  it("clients.ts contains COMPLETED (booking status filter)", () => {
    expect(clientsAction).toContain("COMPLETED");
  });

  it("clients.ts contains requireAuth (auth guard)", () => {
    expect(clientsAction).toContain("requireAuth");
  });

  it("clients.ts contains requireRole (role guard)", () => {
    expect(clientsAction).toContain("requireRole");
  });
});

// ---- CRM-02: Total visits count ----
describe("CRM-02: Total visits count", () => {
  const clientsAction = safeRead("lib/actions/clients.ts");

  it("clients.ts contains totalVisits", () => {
    expect(clientsAction).toContain("totalVisits");
  });

  it("clients.ts contains .length (count of bookings array)", () => {
    expect(clientsAction).toContain(".length");
  });
});

// ---- CRM-03: Total revenue ----
describe("CRM-03: Total revenue", () => {
  const clientsAction = safeRead("lib/actions/clients.ts");

  it("clients.ts contains totalRevenue", () => {
    expect(clientsAction).toContain("totalRevenue");
  });

  it("clients.ts contains reduce (sum pattern)", () => {
    expect(clientsAction).toContain("reduce");
  });

  it("clients.ts contains price (service price reference)", () => {
    expect(clientsAction).toContain("price");
  });
});

// ---- CRM-04: Last visit date ----
describe("CRM-04: Last visit date", () => {
  const clientsAction = safeRead("lib/actions/clients.ts");

  it("clients.ts contains lastVisitAt", () => {
    expect(clientsAction).toContain("lastVisitAt");
  });

  it("clients.ts contains startsAt (booking date field)", () => {
    expect(clientsAction).toContain("startsAt");
  });
});

// ---- CRM-05: Telegram status ----
describe("CRM-05: Telegram status", () => {
  const clientsAction = safeRead("lib/actions/clients.ts");

  it("clients.ts contains hasTelegram", () => {
    expect(clientsAction).toContain("hasTelegram");
  });

  it("clients.ts contains telegramChatId (booking field check)", () => {
    expect(clientsAction).toContain("telegramChatId");
  });
});

// ---- CRM-01: getClients query action ----
describe("CRM-01: getClients query action", () => {
  const clientsAction = safeRead("lib/actions/clients.ts");

  it("clients.ts contains getClients", () => {
    expect(clientsAction).toContain("getClients");
  });

  it("clients.ts contains findMany", () => {
    expect(clientsAction).toContain("findMany");
  });

  it("clients.ts contains orderBy", () => {
    expect(clientsAction).toContain("orderBy");
  });
});
