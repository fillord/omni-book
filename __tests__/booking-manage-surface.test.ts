import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");

const safeRead = (relPath: string): string => {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
};

// ---- TOK-01: manageToken on Booking model ----
describe("TOK-01: manageToken on Booking model", () => {
  const schema = safeRead("prisma/schema.prisma");
  const engine = safeRead("lib/booking/engine.ts");

  it("prisma/schema.prisma contains manageToken (field exists)", () => {
    expect(schema).toContain("manageToken");
  });

  it("prisma/schema.prisma contains @unique after manageToken (uniqueness constraint)", () => {
    expect(schema).toMatch(/manageToken[^\\n]*@unique/);
  });

  it("lib/booking/engine.ts contains manageToken (token generation in createBooking)", () => {
    expect(engine).toContain("manageToken");
  });

  it("lib/booking/engine.ts contains crypto (crypto import for token generation)", () => {
    expect(engine).toContain("crypto");
  });
});

// ---- TOK-02: Public management page exists ----
describe("TOK-02: Public management page exists", () => {
  it("app/manage/[token]/page.tsx file exists", () => {
    const full = path.join(ROOT, "app/manage/[token]/page.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("components/booking-manage-page.tsx file exists", () => {
    const full = path.join(ROOT, "components/booking-manage-page.tsx");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("app/manage/[token]/page.tsx contains notFound (404 for invalid tokens)", () => {
    const page = safeRead("app/manage/[token]/page.tsx");
    expect(page).toContain("notFound");
  });

  it("app/manage/[token]/page.tsx contains basePrisma (direct DB access, no tenant scoping needed)", () => {
    const page = safeRead("app/manage/[token]/page.tsx");
    expect(page).toContain("basePrisma");
  });

  it("components/booking-manage-page.tsx contains neu-raised (Neumorphism styling)", () => {
    const component = safeRead("components/booking-manage-page.tsx");
    expect(component).toContain("neu-raised");
  });
});

// ---- TOK-03: 4-hour rule ----
describe("TOK-03: 4-hour rule", () => {
  const component = safeRead("components/booking-manage-page.tsx");

  it("components/booking-manage-page.tsx contains canManage (prop for 4-hour state)", () => {
    expect(component).toContain("canManage");
  });

  it("components/booking-manage-page.tsx contains Russian disabled message (Для отмены или переноса)", () => {
    expect(component).toContain("Для отмены или переноса");
  });
});

// ---- TOK-04: Cancel API route ----
describe("TOK-04: Cancel API route", () => {
  it("app/api/manage/[token]/cancel/route.ts file exists", () => {
    const full = path.join(ROOT, "app/api/manage/[token]/cancel/route.ts");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("cancel route contains CANCELLED (double L, correct spelling)", () => {
    const route = safeRead("app/api/manage/[token]/cancel/route.ts");
    expect(route).toContain("CANCELLED");
  });

  it("cancel route does NOT contain getServerSession (must be auth-free)", () => {
    const route = safeRead("app/api/manage/[token]/cancel/route.ts");
    expect(route).not.toContain("getServerSession");
  });

  it("cancel route does NOT contain requireAuth (must be auth-free)", () => {
    const route = safeRead("app/api/manage/[token]/cancel/route.ts");
    expect(route).not.toContain("requireAuth");
  });
});

// ---- TOK-05: Reschedule API route ----
describe("TOK-05: Reschedule API route", () => {
  it("app/api/manage/[token]/reschedule/route.ts file exists", () => {
    const full = path.join(ROOT, "app/api/manage/[token]/reschedule/route.ts");
    expect(fs.existsSync(full)).toBe(true);
  });

  it("reschedule route does NOT contain getServerSession (must be auth-free)", () => {
    const route = safeRead("app/api/manage/[token]/reschedule/route.ts");
    expect(route).not.toContain("getServerSession");
  });

  it("reschedule route does NOT contain requireAuth (must be auth-free)", () => {
    const route = safeRead("app/api/manage/[token]/reschedule/route.ts");
    expect(route).not.toContain("requireAuth");
  });

  it("reschedule route contains startsAt (updates booking time)", () => {
    const route = safeRead("app/api/manage/[token]/reschedule/route.ts");
    expect(route).toContain("startsAt");
  });
});

// ---- TOK-06: Telegram notification on reschedule ----
describe("TOK-06: Telegram notification on reschedule", () => {
  const route = safeRead("app/api/manage/[token]/reschedule/route.ts");

  it("reschedule route contains sendTelegramMessage (notifies owner)", () => {
    expect(route).toContain("sendTelegramMessage");
  });

  it("reschedule route contains Russian reschedule header text", () => {
    // The reschedule notification must contain a Russian header
    expect(route).toMatch(/Перенос|перенес|🔄/);
  });
});

// ---- TOK-07: Confirmation templates include management link ----
describe("TOK-07: Confirmation templates include management link", () => {
  it("lib/email/resend.ts contains manageToken (email template updated)", () => {
    const resend = safeRead("lib/email/resend.ts");
    expect(resend).toContain("manageToken");
  });

  it("lib/email/resend.ts contains /manage/ (management link in email)", () => {
    const resend = safeRead("lib/email/resend.ts");
    expect(resend).toContain("/manage/");
  });

  it("app/api/bookings/route.ts contains manage/ (Telegram message includes link)", () => {
    const route = safeRead("app/api/bookings/route.ts");
    expect(route).toContain("manage/");
  });
});
