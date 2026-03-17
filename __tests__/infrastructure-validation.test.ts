import fs from "fs";
import path from "path";

describe("Infrastructure Validation", () => {
  // ---- FOUND-01 ----
  describe("FOUND-01: body applies bg-background text-foreground", () => {
    const cssPath = path.resolve(__dirname, "..", "app", "globals.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    it("globals.css contains an @layer base block", () => {
      expect(css).toMatch(/@layer base\s*\{/);
    });

    it("the @layer base block contains a body rule with bg-background", () => {
      const layerBaseMatch = css.match(/@layer base\s*\{[\s\S]*?\n\}/);
      expect(layerBaseMatch).not.toBeNull();
      const layerBaseBlock = layerBaseMatch![0];
      expect(layerBaseBlock).toMatch(/body\s*\{[^}]*bg-background/);
    });

    it("the @layer base block contains a body rule with text-foreground", () => {
      const layerBaseMatch = css.match(/@layer base\s*\{[\s\S]*?\n\}/);
      expect(layerBaseMatch).not.toBeNull();
      const layerBaseBlock = layerBaseMatch![0];
      expect(layerBaseBlock).toMatch(/body\s*\{[^}]*text-foreground/);
    });

    it("the raw body rule outside @layer base does NOT contain bg-background", () => {
      // Extract the raw body block (lines 11-13, before @layer base)
      // It should only have font-family, not bg-background
      const rawBodyMatch = css.match(/^body\s*\{[^}]*\}/m);
      expect(rawBodyMatch).not.toBeNull();
      expect(rawBodyMatch![0]).not.toContain("bg-background");
    });
  });

  // ---- FOUND-02 ----
  describe("FOUND-02: @theme inline bridges CSS variables to Tailwind", () => {
    const cssPath = path.resolve(__dirname, "..", "app", "globals.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    it("globals.css contains @theme inline { (with the inline keyword)", () => {
      expect(css).toMatch(/@theme inline\s*\{/);
    });

    it("@theme inline block contains --color-background: var(--background)", () => {
      expect(css).toContain("--color-background: var(--background)");
    });

    it("@theme inline block contains --color-foreground: var(--foreground) as a sanity check", () => {
      expect(css).toContain("--color-foreground: var(--foreground)");
    });

    it("file does NOT satisfy a bare @theme { (without inline) pattern at that location", () => {
      // Confirm the block uses inline keyword specifically
      const themeInlineMatch = css.match(/@theme inline\s*\{/);
      expect(themeInlineMatch).not.toBeNull();
    });
  });

  // ---- FOUND-03 ----
  describe("FOUND-03: theme providers use attribute='class'", () => {
    const providersPath = path.resolve(__dirname, "..", "components", "theme-providers.tsx");
    const source = fs.readFileSync(providersPath, "utf-8");

    it("theme-providers.tsx contains attribute: 'class'", () => {
      expect(source).toContain("attribute: 'class'");
    });

    it("theme-providers.tsx exports BookingThemeProvider", () => {
      expect(source).toContain("BookingThemeProvider");
    });

    it("theme-providers.tsx exports AdminThemeProvider", () => {
      expect(source).toContain("AdminThemeProvider");
    });

    it("both providers spread commonProps into ThemeProvider (at least 2 occurrences)", () => {
      const spreadCount = (source.match(/\{\.\.\.commonProps\}/g) ?? []).length;
      expect(spreadCount).toBeGreaterThanOrEqual(2);
    });
  });
});
