import fs from "fs";
import path from "path";

const COMPONENTS_DIR = path.resolve(__dirname, "..", "components");
const readComponent = (name: string) =>
  fs.readFileSync(path.join(COMPONENTS_DIR, name), "utf-8");

// ---- MOBL-01: Mobile card text does not overflow ----------------------------

describe("MOBL-01: mobile card text truncation", () => {
  it("services-manager.tsx mobile card flex child has min-w-0", () => {
    const src = readComponent("services-manager.tsx");
    // Extract the sm:hidden mobile card section
    const mobileSection = src.split("sm:hidden")[1]?.split("hidden sm:")[0] ?? "";
    expect(mobileSection).toContain("min-w-0");
  });

  it("services-manager.tsx mobile card title has truncate class", () => {
    const src = readComponent("services-manager.tsx");
    expect(src).toMatch(/font-medium text-sm truncate/);
  });

  it("resources-manager.tsx mobile card flex child has min-w-0", () => {
    const src = readComponent("resources-manager.tsx");
    const mobileSection = src.split("sm:hidden")[1]?.split("hidden sm:")[0] ?? "";
    expect(mobileSection).toContain("min-w-0");
  });

  it("resources-manager.tsx mobile card title has truncate class", () => {
    const src = readComponent("resources-manager.tsx");
    expect(src).toMatch(/font-medium text-sm truncate/);
  });
});

// ---- MOBL-02: Desktop layout unchanged --------------------------------------

describe("MOBL-02: desktop layout not broken", () => {
  it("services-manager.tsx still has hidden sm:table for desktop", () => {
    const src = readComponent("services-manager.tsx");
    expect(src).toContain("hidden sm:table");
  });

  it("resources-manager.tsx still has hidden sm:table for desktop", () => {
    const src = readComponent("resources-manager.tsx");
    expect(src).toContain("hidden sm:table");
  });

  it("services-manager.tsx min-w-0 is only in the sm:hidden mobile section, not in the desktop table", () => {
    const src = readComponent("services-manager.tsx");
    const desktopSection = src.split("hidden sm:table")[1] ?? "";
    expect(desktopSection).not.toContain("min-w-0");
  });

  it("resources-manager.tsx min-w-0 is only in the sm:hidden mobile section, not in the desktop table", () => {
    const src = readComponent("resources-manager.tsx");
    const desktopSection = src.split("hidden sm:table")[1] ?? "";
    expect(desktopSection).not.toContain("min-w-0");
  });
});

// ---- THEM-01: Theme toggle visible on mobile --------------------------------

describe("THEM-01: theme toggle visible on mobile", () => {
  it("PublicThemeToggle does not have hidden sm: class", () => {
    const src = readComponent("tenant-public-page.tsx");
    expect(src).not.toMatch(/PublicThemeToggle[\s\S]{0,30}hidden\s+sm:/);
  });

  it("PublicThemeToggle has inline-flex class", () => {
    const src = readComponent("tenant-public-page.tsx");
    expect(src).toMatch(/PublicThemeToggle[\s\S]{0,30}inline-flex/);
  });
});

// ---- THEM-02: Theme toggle is accessible and tappable -----------------------

describe("THEM-02: theme toggle is tappable on mobile", () => {
  it("PublicThemeToggle is inside the header shrink-0 flex container (inline flow)", () => {
    const src = readComponent("tenant-public-page.tsx");
    // The toggle must be inside the flex items-center gap-2 shrink-0 container
    const headerRightSection = src.split("flex items-center gap-2 shrink-0")[1]?.split("</header>")[0] ?? "";
    expect(headerRightSection).toContain("PublicThemeToggle");
  });

  it("sticky header has z-50 ensuring toggle is above page content", () => {
    const src = readComponent("tenant-public-page.tsx");
    expect(src).toMatch(/sticky top-0 z-50/);
  });
});
