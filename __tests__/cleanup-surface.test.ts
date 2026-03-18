import fs from "fs";
import path from "path";

const readComponent = (name: string) =>
  fs.readFileSync(path.resolve(__dirname, "..", "components", name), "utf-8");

const readApp = (relPath: string) =>
  fs.readFileSync(path.resolve(__dirname, "..", relPath), "utf-8");

// ---- CLEAN-01 ----
describe("CLEAN-01: banned-actions.tsx uses semantic tokens, no hardcoded zinc classes", () => {
  it("banned-actions.tsx has no bg-zinc-* background classes", () => {
    const source = readComponent("banned-actions.tsx");
    expect(source).not.toMatch(/\bbg-zinc-\d+\b/);
  });

  it("banned-actions.tsx has no border-zinc-* border classes", () => {
    const source = readComponent("banned-actions.tsx");
    expect(source).not.toMatch(/\bborder-zinc-\d+\b/);
  });

  it("banned-actions.tsx has no text-zinc-* text classes", () => {
    const source = readComponent("banned-actions.tsx");
    expect(source).not.toMatch(/\btext-zinc-\d+\b/);
  });

  it("banned-actions.tsx has no hover:bg-zinc-* hover classes", () => {
    const source = readComponent("banned-actions.tsx");
    expect(source).not.toMatch(/\bhover:bg-zinc-\d+\b/);
  });

  it("banned-actions.tsx contact support button uses semantic bg-foreground", () => {
    const source = readComponent("banned-actions.tsx");
    expect(source).toContain("bg-foreground");
  });

  it("banned-actions.tsx return home link uses semantic text-muted-foreground", () => {
    const source = readComponent("banned-actions.tsx");
    expect(source).toContain("text-muted-foreground");
  });
});

// ---- CLEAN-02 ----
describe("CLEAN-02: booking-status-badge.tsx CANCELLED entry uses semantic tokens", () => {
  it("CANCELLED entry contains semantic bg-muted text-muted-foreground border-border classes", () => {
    const source = readComponent("booking-status-badge.tsx");
    expect(source).toContain("bg-muted text-muted-foreground border-border");
  });

  it("CANCELLED entry does not contain bg-zinc-* (no hardcoded zinc)", () => {
    const source = readComponent("booking-status-badge.tsx");
    expect(source).not.toMatch(/CANCELLED[\s\S]*?bg-zinc/);
  });

  it("PENDING entry still contains bg-amber-100 (preserved intentional accent)", () => {
    const source = readComponent("booking-status-badge.tsx");
    expect(source).toContain("bg-amber-100");
  });

  it("CONFIRMED entry still contains bg-blue-100 (preserved intentional accent)", () => {
    const source = readComponent("booking-status-badge.tsx");
    expect(source).toContain("bg-blue-100");
  });

  it("COMPLETED entry still contains bg-green-100 (preserved intentional accent)", () => {
    const source = readComponent("booking-status-badge.tsx");
    expect(source).toContain("bg-green-100");
  });

  it("NO_SHOW entry still contains bg-red-100 (preserved intentional accent)", () => {
    const source = readComponent("booking-status-badge.tsx");
    expect(source).toContain("bg-red-100");
  });
});

// ---- CLEAN-03 ----
describe("CLEAN-03: dashboard/page.tsx bg-white/10 is documented as intentional", () => {
  it("dashboard/page.tsx still contains bg-white/10 (not removed)", () => {
    const source = readApp("app/dashboard/page.tsx");
    expect(source).toContain("bg-white/10");
  });

  it("dashboard/page.tsx has an intentional comment within 5 lines of bg-white/10", () => {
    const source = readApp("app/dashboard/page.tsx");
    const lines = source.split("\n");
    const bgWhiteIdx = lines.findIndex((line) => line.includes("bg-white/10"));
    expect(bgWhiteIdx).toBeGreaterThan(-1);

    // Check within 5 lines above or on the same line for a comment containing "intentional"
    const contextStart = Math.max(0, bgWhiteIdx - 5);
    const contextLines = lines.slice(contextStart, bgWhiteIdx + 1);
    const hasIntentionalComment = contextLines.some((line) =>
      line.includes("intentional")
    );
    expect(hasIntentionalComment).toBe(true);
  });
});

// ---- Regression: booking-form.tsx selection states ----
describe("Regression: booking-form.tsx selection states have dark mode overrides", () => {
  it("booking-form.tsx contains dark:bg-blue-950/40 (blue niche dark selected state)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("dark:bg-blue-950/40");
  });

  it("booking-form.tsx contains dark:bg-pink-950/40 (pink niche dark selected state)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("dark:bg-pink-950/40");
  });

  it("booking-form.tsx contains dark:bg-orange-950/40 (orange niche dark selected state)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("dark:bg-orange-950/40");
  });

  it("booking-form.tsx contains dark:bg-green-950/40 (green niche dark selected state)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("dark:bg-green-950/40");
  });

  it("serviceSelected: lines contain a dark: class override", () => {
    const source = readComponent("booking-form.tsx");
    const serviceSelectedLines = source
      .split("\n")
      .filter((line) => line.includes("serviceSelected:"));
    expect(serviceSelectedLines.length).toBeGreaterThan(0);
    serviceSelectedLines.forEach((line) => {
      expect(line).toMatch(/dark:/);
    });
  });

  it("resourceSelected: lines contain a dark: class override", () => {
    const source = readComponent("booking-form.tsx");
    const resourceSelectedLines = source
      .split("\n")
      .filter((line) => line.includes("resourceSelected:"));
    expect(resourceSelectedLines.length).toBeGreaterThan(0);
    resourceSelectedLines.forEach((line) => {
      expect(line).toMatch(/dark:/);
    });
  });

  it("error block contains dark:bg-red-950/40 (dark mode error background)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("dark:bg-red-950/40");
  });

  it("error block contains dark:text-red-300 (dark mode error text)", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("dark:text-red-300");
  });

  it("success screen contains dark:bg-green-950/40 near bg-green-100 icon", () => {
    const source = readComponent("booking-form.tsx");
    expect(source).toContain("dark:bg-green-950/40");
  });
});

// ---- Regression: tenant-public-page.tsx badge and avatarBg ----
describe("Regression: tenant-public-page.tsx badge and avatarBg have dark mode overrides", () => {
  it("blue niche badge: line contains dark:bg-blue-950/40 and dark:text-blue-300", () => {
    const source = readComponent("tenant-public-page.tsx");
    const badgeLine = source
      .split("\n")
      .find((line) => line.includes("badge:") && line.includes("bg-blue-100"));
    expect(badgeLine).toBeDefined();
    expect(badgeLine).toMatch(/dark:bg-blue-950\/40/);
    expect(badgeLine).toMatch(/dark:text-blue-300/);
  });

  it("pink niche badge: line contains dark:bg-pink-950/40 and dark:text-pink-300", () => {
    const source = readComponent("tenant-public-page.tsx");
    const badgeLine = source
      .split("\n")
      .find((line) => line.includes("badge:") && line.includes("bg-pink-100"));
    expect(badgeLine).toBeDefined();
    expect(badgeLine).toMatch(/dark:bg-pink-950\/40/);
    expect(badgeLine).toMatch(/dark:text-pink-300/);
  });

  it("orange niche badge: line contains dark:bg-orange-950/40 and dark:text-orange-300", () => {
    const source = readComponent("tenant-public-page.tsx");
    const badgeLine = source
      .split("\n")
      .find(
        (line) => line.includes("badge:") && line.includes("bg-orange-100")
      );
    expect(badgeLine).toBeDefined();
    expect(badgeLine).toMatch(/dark:bg-orange-950\/40/);
    expect(badgeLine).toMatch(/dark:text-orange-300/);
  });

  it("green niche badge: line contains dark:bg-green-950/40 and dark:text-green-300", () => {
    const source = readComponent("tenant-public-page.tsx");
    const badgeLine = source
      .split("\n")
      .find(
        (line) => line.includes("badge:") && line.includes("bg-green-100")
      );
    expect(badgeLine).toBeDefined();
    expect(badgeLine).toMatch(/dark:bg-green-950\/40/);
    expect(badgeLine).toMatch(/dark:text-green-300/);
  });

  it("blue niche avatarBg: line contains dark:bg-blue-950/40 and dark:text-blue-300", () => {
    const source = readComponent("tenant-public-page.tsx");
    const avatarLine = source
      .split("\n")
      .find(
        (line) => line.includes("avatarBg:") && line.includes("bg-blue-100")
      );
    expect(avatarLine).toBeDefined();
    expect(avatarLine).toMatch(/dark:bg-blue-950\/40/);
    expect(avatarLine).toMatch(/dark:text-blue-300/);
  });

  it("pink niche avatarBg: line contains dark:bg-pink-950/40 and dark:text-pink-300", () => {
    const source = readComponent("tenant-public-page.tsx");
    const avatarLine = source
      .split("\n")
      .find(
        (line) => line.includes("avatarBg:") && line.includes("bg-pink-100")
      );
    expect(avatarLine).toBeDefined();
    expect(avatarLine).toMatch(/dark:bg-pink-950\/40/);
    expect(avatarLine).toMatch(/dark:text-pink-300/);
  });

  it("orange niche avatarBg: line contains dark:bg-orange-950/40 and dark:text-orange-300", () => {
    const source = readComponent("tenant-public-page.tsx");
    const avatarLine = source
      .split("\n")
      .find(
        (line) =>
          line.includes("avatarBg:") && line.includes("bg-orange-100")
      );
    expect(avatarLine).toBeDefined();
    expect(avatarLine).toMatch(/dark:bg-orange-950\/40/);
    expect(avatarLine).toMatch(/dark:text-orange-300/);
  });

  it("green niche avatarBg: line contains dark:bg-green-950/40 and dark:text-green-300", () => {
    const source = readComponent("tenant-public-page.tsx");
    const avatarLine = source
      .split("\n")
      .find(
        (line) =>
          line.includes("avatarBg:") && line.includes("bg-green-100")
      );
    expect(avatarLine).toBeDefined();
    expect(avatarLine).toMatch(/dark:bg-green-950\/40/);
    expect(avatarLine).toMatch(/dark:text-green-300/);
  });

  it("isTable emoji container (w-12 h-12 rounded-xl) line contains a dark: class", () => {
    const source = readComponent("tenant-public-page.tsx");
    // Find the line with the isTable emoji container
    const containerLine = source
      .split("\n")
      .find((line) => line.includes("w-12 h-12 rounded-xl"));
    expect(containerLine).toBeDefined();
    expect(containerLine).toMatch(/dark:/);
  });
});
