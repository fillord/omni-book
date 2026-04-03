import fs from "fs";
import path from "path";
import { translations } from "../lib/i18n/translations";

const MARKETING_DIR = path.resolve(__dirname, "..", "app", "(marketing)");
const LANDING_DIR = path.resolve(__dirname, "..", "components", "landing");

const LEGAL_PAGES = ["oferta", "privacy", "refund", "about"];

const safeRead = (filePath: string): string => {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
};

// ---- PAGE-01 through PAGE-04: Legal page file existence ----
describe("PAGE existence: legal pages exist at app/(marketing)/<page>/page.tsx", () => {
  LEGAL_PAGES.forEach((page) => {
    it(`PAGE-${LEGAL_PAGES.indexOf(page) + 1}: app/(marketing)/${page}/page.tsx exists`, () => {
      const filePath = path.join(MARKETING_DIR, page, "page.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

// ---- STYLE-01, STYLE-02: No hardcoded colors, use client directive ----
describe("STYLE-01: legal page files do not contain hardcoded bg-(zinc|slate|gray)-N color classes", () => {
  const BG_NEUTRAL_PATTERN = /(?<![-/])\bbg-(zinc|slate|gray)-\d+\b/;

  LEGAL_PAGES.forEach((page) => {
    it(`${page}/page.tsx does not contain bare bg-zinc-*/bg-slate-*/bg-gray-* classes`, () => {
      const filePath = path.join(MARKETING_DIR, page, "page.tsx");
      const source = safeRead(filePath);
      if (!source) return; // file doesn't exist yet — existence tested in PAGE suite
      expect(source).not.toMatch(BG_NEUTRAL_PATTERN);
    });
  });
});

describe("STYLE-02: legal page files start with 'use client' directive", () => {
  LEGAL_PAGES.forEach((page) => {
    it(`${page}/page.tsx starts with "use client"`, () => {
      const filePath = path.join(MARKETING_DIR, page, "page.tsx");
      const source = safeRead(filePath);
      if (!source) return; // file doesn't exist yet — existence tested in PAGE suite
      expect(source.trimStart().startsWith('"use client"')).toBe(true);
    });
  });
});

// ---- I18N-01 through I18N-03: Translations namespace checks ----
describe("I18N-01: translations.ru contains required legal page namespaces", () => {
  const REQUIRED_NAMESPACES = ["oferta", "privacy", "refund", "about", "legal"];

  REQUIRED_NAMESPACES.forEach((ns) => {
    it(`translations.ru.${ns} is defined`, () => {
      expect((translations.ru as Record<string, unknown>)[ns]).toBeDefined();
    });
  });
});

describe("I18N-02: translations.kz contains required legal page namespaces", () => {
  const REQUIRED_NAMESPACES = ["oferta", "privacy", "refund", "about", "legal"];

  REQUIRED_NAMESPACES.forEach((ns) => {
    it(`translations.kz.${ns} is defined`, () => {
      expect((translations.kz as Record<string, unknown>)[ns]).toBeDefined();
    });
  });
});

describe("I18N-03: translations.en contains required legal page namespaces", () => {
  const REQUIRED_NAMESPACES = ["oferta", "privacy", "refund", "about", "legal"];

  REQUIRED_NAMESPACES.forEach((ns) => {
    it(`translations.en.${ns} is defined`, () => {
      expect((translations.en as Record<string, unknown>)[ns]).toBeDefined();
    });
  });
});

// ---- FOOT-01, FOOT-02, FOOT-04: Footer structure checks ----
describe("FOOT-01: Footer.tsx has multi-column grid structure", () => {
  it("Footer.tsx contains grid-cols-1 (responsive grid base)", () => {
    const source = safeRead(path.join(LANDING_DIR, "Footer.tsx"));
    expect(source).toContain("grid-cols-1");
  });

  it("Footer.tsx contains md:grid-cols-3 (3-column layout on desktop)", () => {
    const source = safeRead(path.join(LANDING_DIR, "Footer.tsx"));
    expect(source).toContain("md:grid-cols-3");
  });
});

describe("FOOT-02: Footer.tsx references correct i18n column keys", () => {
  it("Footer.tsx references footerColProduct i18n key", () => {
    const source = safeRead(path.join(LANDING_DIR, "Footer.tsx"));
    expect(source).toContain("footerColProduct");
  });

  it("Footer.tsx references footerColLegal i18n key", () => {
    const source = safeRead(path.join(LANDING_DIR, "Footer.tsx"));
    expect(source).toContain("footerColLegal");
  });

  it("Footer.tsx references footerColCompany i18n key", () => {
    const source = safeRead(path.join(LANDING_DIR, "Footer.tsx"));
    expect(source).toContain("footerColCompany");
  });
});

// FOOT-03: Footer "intentional" test already covered in landing-surface.test.ts (LAND-01)
// Skipped here to avoid duplication.

describe("FOOT-04: Footer.tsx contains links to all legal pages", () => {
  it("Footer.tsx contains href=\"/privacy\"", () => {
    const source = safeRead(path.join(LANDING_DIR, "Footer.tsx"));
    expect(source).toContain('href="/privacy"');
  });

  it("Footer.tsx contains href=\"/oferta\"", () => {
    const source = safeRead(path.join(LANDING_DIR, "Footer.tsx"));
    expect(source).toContain('href="/oferta"');
  });

  it("Footer.tsx contains href=\"/refund\"", () => {
    const source = safeRead(path.join(LANDING_DIR, "Footer.tsx"));
    expect(source).toContain('href="/refund"');
  });

  it("Footer.tsx contains href=\"/about\"", () => {
    const source = safeRead(path.join(LANDING_DIR, "Footer.tsx"));
    expect(source).toContain('href="/about"');
  });
});
