import fs from "fs";
import path from "path";

const COMPONENTS_DIR = path.resolve(__dirname, "..", "components");
const readComponent = (name: string) =>
  fs.readFileSync(path.join(COMPONENTS_DIR, name), "utf-8");

// ---- DATA-01: No raw opt_* IDs visible in booking form ----------------------

describe("DATA-01: booking-form.tsx resolves all opt_* IDs", () => {
  const src = readComponent("booking-form.tsx");

  it("has opt_ guard for resource.specialization badge (resource card display)", () => {
    // The specialization badge near the resource card must include an opt_ guard
    // The guard must appear in the same expression as the specialization access
    expect(src).toMatch(/resource\.specialization[\s\S]{0,50}startsWith\(['"]opt_['"]\)/);
  });

  it("has opt_ guard for attribute value fallback (generic attribute loop)", () => {
    // The attribute loop fallback must resolve opt_ IDs before rendering
    // At minimum 2 guards: one for specialization badge, one for attribute fallback
    const matches = src.match(/startsWith\(['"]opt_['"]\)/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("has opt_ guard for booking summary specialization (SummaryRow in confirm step)", () => {
    // The SummaryRow for specialization in the confirm step must resolve opt_ IDs
    expect(src).toMatch(/SummaryRow[\s\S]{0,400}startsWith\(['"]opt_['"]\)/);
  });

  it("has at least 3 total opt_ guard occurrences covering all three known leak points", () => {
    const matches = src.match(/startsWith\(['"]opt_['"]\)/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(3);
  });

  it("does not render a bare {String(v)} span without an adjacent opt_ guard in the attribute loop", () => {
    // The old pattern was: {String(v)}</span> — this is now replaced with an opt_ guard
    // The file should NOT contain a bare String(v) immediately followed by </span>
    // (The only String(v) remaining should be inside .replace('{n}', ...) for capacity)
    const lines = src.split("\n");
    const bareStringVLines = lines.filter(
      (line) => /\{String\(v\)\}/.test(line),
    );
    expect(bareStringVLines).toHaveLength(0);
  });
});

// ---- DATA-02: Global coverage across all display surfaces -------------------

describe("DATA-02: all display surfaces handle opt_* IDs", () => {
  it("tenant-public-page.tsx has formatAttrForCard with opt_ guard", () => {
    const src = readComponent("tenant-public-page.tsx");
    expect(src).toContain("formatAttrForCard");
    expect(src).toMatch(/startsWith\(['"]opt_['"]\)/);
  });

  it("resources-manager.tsx translates select field values via t('niche')", () => {
    const src = readComponent("resources-manager.tsx");
    expect(src).toContain("getAttrDisplay");
    expect(src).toMatch(/t\(['"]niche['"]/);
  });

  it("resource-form.tsx has optLabel helper with opt_ guard", () => {
    const src = readComponent("resource-form.tsx");
    expect(src).toContain("optLabel");
    expect(src).toMatch(/startsWith\(['"]opt_['"]\)/);
  });
});
