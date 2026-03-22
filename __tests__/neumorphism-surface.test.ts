import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");

const readFile = (relPath: string) =>
  fs.readFileSync(path.join(ROOT, relPath), "utf-8");

// ---- NEU-01 ----
describe("NEU-01: Neumorphism variables defined in globals.css", () => {
  const css = readFile("app/globals.css");

  // Extract :root block content
  const rootMatch = css.match(/:root\s*\{([^}]*)\}/s);
  const rootBlock = rootMatch ? rootMatch[1] : "";

  // Extract .dark block content
  const darkMatch = css.match(/\.dark\s*\{([^}]*)\}/s);
  const darkBlock = darkMatch ? darkMatch[1] : "";

  it(":root contains --neu-bg: #e0e5ec", () => {
    expect(rootBlock).toContain("--neu-bg: #e0e5ec");
  });

  it(":root contains --neu-shadow-light: #ffffff", () => {
    expect(rootBlock).toContain("--neu-shadow-light: #ffffff");
  });

  it(":root contains --neu-shadow-dark: #a3b1c6", () => {
    expect(rootBlock).toContain("--neu-shadow-dark: #a3b1c6");
  });

  it(":root contains --neu-accent: #4299e1", () => {
    expect(rootBlock).toContain("--neu-accent: #4299e1");
  });

  it(":root contains --neu-text: #4a5568", () => {
    expect(rootBlock).toContain("--neu-text: #4a5568");
  });

  it(".dark contains --neu-bg: #1e1e24", () => {
    expect(darkBlock).toContain("--neu-bg: #1e1e24");
  });

  it(".dark contains --neu-shadow-light: #2c2c35", () => {
    expect(darkBlock).toContain("--neu-shadow-light: #2c2c35");
  });

  it(".dark contains --neu-shadow-dark: #101013", () => {
    expect(darkBlock).toContain("--neu-shadow-dark: #101013");
  });

  it(".dark contains --neu-accent: #10b981", () => {
    expect(darkBlock).toContain("--neu-accent: #10b981");
  });

  it(".dark contains --neu-text: #d1d5db", () => {
    expect(darkBlock).toContain("--neu-text: #d1d5db");
  });
});

// ---- NEU-02 ----
describe("NEU-02: Token remapping in globals.css", () => {
  const css = readFile("app/globals.css");

  it("globals.css contains --background: var(--neu-bg)", () => {
    expect(css).toContain("--background: var(--neu-bg)");
  });

  it("globals.css contains --card: var(--neu-bg)", () => {
    expect(css).toContain("--card: var(--neu-bg)");
  });

  it("globals.css contains --popover: var(--neu-bg)", () => {
    expect(css).toContain("--popover: var(--neu-bg)");
  });

  it("globals.css contains --border: transparent", () => {
    expect(css).toContain("--border: transparent");
  });

  it("globals.css contains --input: var(--neu-bg)", () => {
    expect(css).toContain("--input: var(--neu-bg)");
  });
});

// ---- NEU-03 ----
describe("NEU-03: Utility classes defined in globals.css", () => {
  const css = readFile("app/globals.css");

  it("globals.css contains .neu-raised class", () => {
    expect(css).toContain(".neu-raised");
  });

  it(".neu-raised uses box-shadow with var(--neu-shadow-dark) and var(--neu-shadow-light)", () => {
    // Find the .neu-raised block
    const raisedMatch = css.match(/\.neu-raised\s*\{([^}]*)\}/s);
    const raisedBlock = raisedMatch ? raisedMatch[1] : "";
    expect(raisedBlock).toContain("box-shadow:");
    expect(raisedBlock).toContain("var(--neu-shadow-dark)");
    expect(raisedBlock).toContain("var(--neu-shadow-light)");
  });

  it("globals.css contains .neu-inset class", () => {
    expect(css).toContain(".neu-inset");
  });

  it(".neu-inset uses inset box-shadow", () => {
    const insetMatch = css.match(/\.neu-inset\s*\{([^}]*)\}/s);
    const insetBlock = insetMatch ? insetMatch[1] : "";
    expect(insetBlock).toContain("inset");
  });

  it("globals.css contains .neu-btn class", () => {
    expect(css).toContain(".neu-btn");
  });
});

// ---- NEU-04 ----
describe("NEU-04: Button uses neu-btn", () => {
  const source = readFile("components/ui/button.tsx");

  it("button.tsx contains neu-btn (in default variant or base class)", () => {
    expect(source).toContain("neu-btn");
  });
});

// ---- NEU-05 ----
describe("NEU-05: Input uses neu-inset", () => {
  const source = readFile("components/ui/input.tsx");

  it("input.tsx contains neu-inset", () => {
    expect(source).toContain("neu-inset");
  });

  it("input.tsx contains border-transparent", () => {
    expect(source).toContain("border-transparent");
  });

  it("input.tsx does NOT contain the old pattern 'border border-input'", () => {
    expect(source).not.toMatch(/border\s+border-input/);
  });
});

// ---- NEU-06 ----
describe("NEU-06: Card uses neu-raised, no ring", () => {
  const source = readFile("components/ui/card.tsx");

  it("card.tsx contains neu-raised", () => {
    expect(source).toContain("neu-raised");
  });

  it("card.tsx does NOT contain ring-1 ring-foreground/10", () => {
    expect(source).not.toContain("ring-1 ring-foreground/10");
  });
});

// ---- NEU-07 ----
describe("NEU-07: Dialog uses neu-raised, no ring", () => {
  const source = readFile("components/ui/dialog.tsx");

  it("dialog.tsx DialogContent contains neu-raised", () => {
    expect(source).toContain("neu-raised");
  });

  it("dialog.tsx does NOT contain ring-1 ring-foreground/10", () => {
    expect(source).not.toContain("ring-1 ring-foreground/10");
  });
});

// ---- NEU-08 ----
describe("NEU-08: Select trigger inset, content raised", () => {
  const source = readFile("components/ui/select.tsx");

  it("select.tsx contains neu-inset (trigger)", () => {
    expect(source).toContain("neu-inset");
  });

  it("select.tsx contains neu-raised (content)", () => {
    expect(source).toContain("neu-raised");
  });

  it("select.tsx does NOT contain 'shadow-md ring-1 ring-foreground/10' in content", () => {
    expect(source).not.toContain("shadow-md ring-1 ring-foreground/10");
  });
});

// ---- NEU-09 ----
describe("NEU-09: DropdownMenu uses neu-raised", () => {
  const source = readFile("components/ui/dropdown-menu.tsx");

  it("dropdown-menu.tsx contains neu-raised", () => {
    expect(source).toContain("neu-raised");
  });

  it("dropdown-menu.tsx does NOT contain 'shadow-md ring-1 ring-foreground/10'", () => {
    expect(source).not.toContain("shadow-md ring-1 ring-foreground/10");
  });
});

// ---- NEU-10 ----
describe("NEU-10: Global transition rule (300ms, explicit properties)", () => {
  const css = readFile("app/globals.css");

  it("globals.css contains transition: with background-color, box-shadow, and 300ms", () => {
    expect(css).toMatch(/transition:.*background-color.*300ms/s);
    expect(css).toMatch(/transition:.*box-shadow.*300ms/s);
  });

  it("globals.css does NOT contain 'transition: all' (anti-pattern)", () => {
    expect(css).not.toMatch(/transition:\s*all\b/);
  });
});

// ---- NEU-11 ----
describe("NEU-11: RESOURCE_PALETTE preserved in booking-calendar.tsx", () => {
  const source = readFile("components/booking-calendar.tsx");

  it("booking-calendar.tsx still contains RESOURCE_PALETTE", () => {
    expect(source).toContain("RESOURCE_PALETTE");
  });
});

// ---- NEU-14 ----
describe("NEU-14: HeroSection uses bg-background, no old gradient", () => {
  const source = readFile("components/landing/HeroSection.tsx");

  it("HeroSection.tsx contains bg-background on the section element", () => {
    expect(source).toContain("bg-background");
  });

  it("HeroSection.tsx does NOT contain the old gradient bg-gradient-to-br from-indigo-50", () => {
    expect(source).not.toContain("bg-gradient-to-br from-indigo-50");
  });
});
