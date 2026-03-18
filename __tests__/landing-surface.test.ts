import fs from "fs";
import path from "path";

const LANDING_DIR = path.resolve(__dirname, "..", "components", "landing");
const readComponent = (name: string) =>
  fs.readFileSync(path.join(LANDING_DIR, name), "utf-8");

// All landing component files (Footer exempt from LAND-01, tested separately)
const CORE_COMPONENTS = [
  "HeroSection.tsx",
  "PricingCards.tsx",
  "FeaturesGrid.tsx",
  "NicheCards.tsx",
  "StatsCounter.tsx",
  "Testimonials.tsx",
  "DemoSection.tsx",
  "FadeIn.tsx",
];

// ---- LAND-01 ----
describe("LAND-01: no hardcoded background neutral classes in landing components", () => {
  // Matches bare bg-white, bg-zinc-50/100/200, bg-slate-50/100/200
  // Excludes: bg-white/20 (opacity modifier — intentional brand treatment on Pro card)
  // Excludes: prefixed variants like hover:bg-white (caught by LAND-05)
  const BG_NEUTRAL_PATTERN =
    /(?<![-/])\bbg-(white|zinc-(50|100|200)|slate-(50|100|200))(?!\/)/;

  CORE_COMPONENTS.forEach((component) => {
    it(`${component} does not contain bare bg-white/bg-zinc-50/bg-zinc-100/bg-zinc-200/bg-slate-* background classes`, () => {
      const source = readComponent(component);
      expect(source).not.toMatch(BG_NEUTRAL_PATTERN);
    });
  });

  it("Footer.tsx contains the word 'intentional' (fixed dark footer is documented as intentional)", () => {
    const footer = readComponent("Footer.tsx");
    expect(footer).toContain("intentional");
  });
});

// ---- LAND-02 ----
describe("LAND-02: no hardcoded dark heading classes (text-zinc-900/slate-900/gray-900) in landing components", () => {
  // Negative lookbehind ensures we don't match dark:text-zinc-900
  const DARK_HEADING_PATTERN = /(?<!dark:)text-(zinc|slate|gray)-900\b/;

  CORE_COMPONENTS.forEach((component) => {
    it(`${component} does not contain bare text-zinc-900/text-slate-900/text-gray-900`, () => {
      const source = readComponent(component);
      expect(source).not.toMatch(DARK_HEADING_PATTERN);
    });
  });
});

// ---- LAND-03 ----
describe("LAND-03: no hardcoded muted text classes without dark: prefix in landing components", () => {
  // dark:text-zinc-400 is acceptable (dark-mode override on brand-accent element)
  // bare text-zinc-400 is not acceptable
  const MUTED_TEXT_PATTERN =
    /(?<!dark:)text-(zinc-(400|500)|slate-500|gray-500)\b/;

  CORE_COMPONENTS.forEach((component) => {
    it(`${component} does not contain bare text-zinc-400/text-zinc-500/text-slate-500/text-gray-500 (without dark: prefix)`, () => {
      const source = readComponent(component);
      expect(source).not.toMatch(MUTED_TEXT_PATTERN);
    });
  });
});

// ---- LAND-04 ----
describe("LAND-04: no hardcoded border neutral classes without dark: prefix in landing components", () => {
  const BORDER_NEUTRAL_PATTERN =
    /(?<!dark:)border-(zinc|gray)-(200|300|800)\b/;

  CORE_COMPONENTS.forEach((component) => {
    it(`${component} does not contain bare border-zinc-200/border-zinc-300/border-zinc-800/border-gray-200/border-gray-300`, () => {
      const source = readComponent(component);
      expect(source).not.toMatch(BORDER_NEUTRAL_PATTERN);
    });
  });
});

// ---- LAND-05 ----
describe("LAND-05: no hardcoded hover state neutral classes in landing components", () => {
  const HOVER_NEUTRAL_PATTERN =
    /(dark:)?hover:(bg|text)-(zinc|gray|slate)-\d+/;

  CORE_COMPONENTS.forEach((component) => {
    it(`${component} does not contain hover:bg-zinc-*/hover:bg-gray-*/hover:text-zinc-* neutral hover classes`, () => {
      const source = readComponent(component);
      expect(source).not.toMatch(HOVER_NEUTRAL_PATTERN);
    });
  });
});

// ---- LAND-06 ----
describe("LAND-06: PricingCards.tsx contains no bare zinc/slate/gray classes outside highlighted Pro card", () => {
  // The entire file check is safe because:
  // - highlighted Pro card uses indigo/white classes only, not zinc/slate/gray
  // - non-highlighted cards use bg-card/border-border (semantic) — any zinc violations are in text only

  it("PricingCards.tsx has no bare text-zinc-* or text-slate-* or text-gray-* classes (without dark: prefix)", () => {
    const source = readComponent("PricingCards.tsx");
    expect(source).not.toMatch(/(?<!dark:)text-(zinc|slate|gray)-\d+/);
  });

  it("PricingCards.tsx has no bare bg-zinc-* or bg-slate-* or bg-gray-* classes", () => {
    const source = readComponent("PricingCards.tsx");
    expect(source).not.toMatch(/(?<![-/])\bbg-(zinc|slate|gray)-\d+\b/);
  });

  it("PricingCards.tsx has no bare border-zinc-* or border-slate-* or border-gray-* classes (without dark: prefix)", () => {
    const source = readComponent("PricingCards.tsx");
    expect(source).not.toMatch(/(?<!dark:)border-(zinc|slate|gray)-\d+/);
  });

  it("PricingCards.tsx preserves the highlighted Pro card brand colors (bg-indigo-600 present)", () => {
    const source = readComponent("PricingCards.tsx");
    expect(source).toContain("bg-indigo-600");
  });
});

// ---- LAND-07 ----
describe("LAND-07: gradient sections in landing have correct dark mode behavior", () => {
  it("HeroSection.tsx adaptive background gradient has dark: variant (dark:from-*)", () => {
    const source = readComponent("HeroSection.tsx");
    expect(source).toMatch(/dark:from-/);
  });

  it("FeaturesGrid.tsx icon container has dark:bg-indigo-950/40 (dark mode tint) OR contains 'intentional' comment near bg-indigo-50", () => {
    const source = readComponent("FeaturesGrid.tsx");
    const hasDarkTint = source.includes("dark:bg-indigo-950/40") || source.includes("dark:bg-indigo-900");
    const hasIntentionalComment = /intentional[\s\S]{0,100}bg-indigo-50|bg-indigo-50[\s\S]{0,100}intentional/.test(source);
    expect(hasDarkTint || hasIntentionalComment).toBe(true);
  });
});
