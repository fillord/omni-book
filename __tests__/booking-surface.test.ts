import fs from "fs";
import path from "path";

const COMPONENTS_DIR = path.resolve(__dirname, "..", "components");
const readComponent = (name: string) =>
  fs.readFileSync(path.join(COMPONENTS_DIR, name), "utf-8");

// ---- BOOK-01 ----
describe("BOOK-01: no hardcoded background/text/border neutral classes in tenant-public-page.tsx", () => {
  // The COLORS constant contains intentional heroBtn values like 'bg-white text-blue-700 hover:bg-blue-50'
  // After remediation, bg-white should ONLY appear inside the COLORS map string literals (4 niches × 1 heroBtn).
  // The root div, header, and other JSX elements must use semantic tokens.

  it("tenant-public-page.tsx root div does not use bg-white as the page canvas (must use bg-background)", () => {
    const source = readComponent("tenant-public-page.tsx");
    // Check that there's no 'min-h-screen bg-white' — the root canvas must not be bg-white
    expect(source).not.toMatch(/min-h-screen\s+bg-white|bg-white\s+.*min-h-screen/);
  });

  it("tenant-public-page.tsx header does not contain bare bg-white (header must use semantic token)", () => {
    const source = readComponent("tenant-public-page.tsx");
    // The header element should not have bg-white — it must use bg-background or similar
    // We check that no <header ...> line contains bg-white
    const headerLines = source
      .split("\n")
      .filter((line) => line.includes("<header"));
    headerLines.forEach((line) => {
      expect(line).not.toMatch(/\bbg-white\b/);
    });
  });

  it("tenant-public-page.tsx does not contain bg-zinc-* background classes (except in COLORS map string literals)", () => {
    const source = readComponent("tenant-public-page.tsx");
    // bg-zinc-* classes outside quoted strings indicate violation
    // After remediation, all occurrences must be inside string literals (quotes) in COLORS constant
    // or explicitly removed
    expect(source).toMatch(/bg-zinc-\d+/);
    // This test will FAIL in RED state confirming violations exist
    // After remediation this test should be replaced with a NOT match
    // For now: assert the bg-zinc pattern count is high (violations present)
    const matches = source.match(/\bbg-zinc-\d+\b/g) ?? [];
    // In current un-remediated state, there should be many violations
    // This test documents that zinc backgrounds exist and need removal
    // We use a negative form that will FAIL now and PASS after remediation:
    expect(matches.length).toBe(0);
  });

  it("tenant-public-page.tsx does not contain dark:bg-zinc-* dual-pair classes", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).not.toMatch(/dark:bg-zinc-\d+/);
  });

  it("tenant-public-page.tsx does not contain bg-slate-* background classes", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).not.toMatch(/\bbg-slate-\d+\b/);
  });

  it("tenant-public-page.tsx does not contain bare text-zinc-* neutral text classes", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).not.toMatch(/\btext-zinc-\d+\b/);
  });

  it("tenant-public-page.tsx does not contain text-slate-* neutral text classes", () => {
    const source = readComponent("tenant-public-page.tsx");
    // text-slate-900 on root div and text-slate-50 are violations
    expect(source).not.toMatch(/\btext-slate-\d+\b/);
  });

  it("tenant-public-page.tsx does not contain bare border-zinc-* neutral border classes", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).not.toMatch(/\bborder-zinc-\d+\b/);
  });

  it("tenant-public-page.tsx footer bg-zinc-900 is intentional (only zinc-900 occurrence is the footer)", () => {
    const source = readComponent("tenant-public-page.tsx");
    // After remediation, the ONLY bg-zinc-900 that may remain is the intentional footer surface
    // The footer line must contain both bg-zinc-900 and the word "footer" (or a footer tag)
    const lines = source.split("\n");
    const zinc900Lines = lines.filter((line) =>
      /\bbg-zinc-900\b/.test(line) && !/^\s*\/\//.test(line)
    );
    // Each occurrence of bg-zinc-900 in JSX must be on a footer-related line
    zinc900Lines.forEach((line) => {
      const isFooterLine =
        line.toLowerCase().includes("footer") ||
        line.includes("<footer") ||
        line.includes("</footer");
      expect(isFooterLine).toBe(true);
    });
  });
});

// ---- BOOK-02 ----
describe("BOOK-02: no hardcoded neutral classes in booking-form.tsx", () => {
  it("booking-form.tsx does not contain bare bg-white classes", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/\bbg-white\b/);
  });

  it("booking-form.tsx does not contain bg-zinc-* background classes", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/\bbg-zinc-\d+\b/);
  });

  it("booking-form.tsx does not contain dark:bg-zinc-* dual-pair classes", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/dark:bg-zinc-\d+/);
  });

  it("booking-form.tsx does not contain border-zinc-* neutral border classes", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/\bborder-zinc-\d+\b/);
  });

  it("booking-form.tsx does not contain dark:border-zinc-* dual-pair classes", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/dark:border-zinc-\d+/);
  });

  it("booking-form.tsx does not contain bare text-zinc-* neutral text classes", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/\btext-zinc-\d+\b/);
  });

  it("booking-form.tsx does not contain dark:text-zinc-* dual-pair classes", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/dark:text-zinc-\d+/);
  });

  it("booking-form.tsx does not contain text-slate-* neutral text classes", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/\btext-slate-\d+\b/);
  });

  it("booking-form.tsx does not contain hover:bg-zinc-* hover neutral classes", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/hover:bg-zinc-\d+/);
  });

  it("booking-form.tsx does not contain hover:bg-zinc-* via dark: prefix either", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).not.toMatch(/dark:hover:bg-zinc-\d+/);
  });
});

// ---- BOOK-03 ----
describe("BOOK-03: booking-calendar.tsx uses intentional functional palette, no raw neutral fallbacks", () => {
  it("booking-calendar.tsx does not contain bare bg-gray-400 (must use RESOURCE_PALETTE or semantic fallback)", () => {
    const source = readComponent("booking-calendar.tsx");
    expect(source).not.toContain("bg-gray-400");
  });

  it("booking-calendar.tsx does not contain bare bg-zinc-* classes", () => {
    const source = readComponent("booking-calendar.tsx");
    expect(source).not.toMatch(/\bbg-zinc-\d+\b/);
  });

  it("booking-calendar.tsx does not contain bare text-zinc-* classes", () => {
    const source = readComponent("booking-calendar.tsx");
    expect(source).not.toMatch(/\btext-zinc-\d+\b/);
  });

  it("booking-calendar.tsx does not contain bare border-zinc-* classes", () => {
    const source = readComponent("booking-calendar.tsx");
    expect(source).not.toMatch(/\bborder-zinc-\d+\b/);
  });

  it("booking-calendar.tsx RESOURCE_PALETTE is documented as intentional functional palette", () => {
    const source = readComponent("booking-calendar.tsx");
    // The RESOURCE_PALETTE uses functional accent colors (blue/purple/emerald/orange/pink/teal)
    // which are intentional. A comment documenting this must exist near the palette.
    expect(source).toContain("intentional");
  });
});

// ---- BOOK-04 ----
describe("BOOK-04: brand accent colors are preserved in both components", () => {
  it("tenant-public-page.tsx COLORS map contains bg-blue-600 (blue niche accent)", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).toContain("bg-blue-600");
  });

  it("tenant-public-page.tsx COLORS map contains bg-pink-600 (pink niche accent)", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).toContain("bg-pink-600");
  });

  it("tenant-public-page.tsx COLORS map contains bg-orange-600 (orange niche accent)", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).toContain("bg-orange-600");
  });

  it("tenant-public-page.tsx COLORS map contains bg-green-600 (green niche accent)", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).toContain("bg-green-600");
  });

  it("booking-form.tsx BOOKING_COLORS contains bg-blue-600 (blue niche)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("bg-blue-600");
  });

  it("booking-form.tsx BOOKING_COLORS contains bg-pink-600 (pink niche)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("bg-pink-600");
  });

  it("booking-form.tsx BOOKING_COLORS contains bg-orange-600 (orange niche)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("bg-orange-600");
  });

  it("booking-form.tsx BOOKING_COLORS contains bg-green-600 (green niche)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("bg-green-600");
  });
});

// ---- BOOK-05 ----
describe("BOOK-05: root container uses semantic bg-background token, not hardcoded neutral", () => {
  it("tenant-public-page.tsx contains bg-background (semantic root canvas token)", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).toContain("bg-background");
  });

  it("tenant-public-page.tsx min-h-screen root container does not use bg-white as canvas", () => {
    const source = readComponent("tenant-public-page.tsx");
    // The root <div className="min-h-screen ..."> must NOT pair with bg-white
    expect(source).not.toMatch(/min-h-screen\s+bg-white|bg-white\s+[^"]*min-h-screen/);
  });

  it("tenant-public-page.tsx min-h-screen root container does not use bg-zinc-* as canvas", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).not.toMatch(/min-h-screen\s+bg-zinc-\d+|bg-zinc-\d+\s+[^"]*min-h-screen/);
  });

  it("tenant-public-page.tsx min-h-screen root container does not use bg-slate-* as canvas", () => {
    const source = readComponent("tenant-public-page.tsx");
    expect(source).not.toMatch(/min-h-screen\s+bg-slate-\d+|bg-slate-\d+\s+[^"]*min-h-screen/);
  });
});
