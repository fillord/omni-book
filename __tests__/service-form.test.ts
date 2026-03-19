import fs from 'fs'
import path from 'path'

const readFile = (relPath: string) =>
  fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf-8')

// ---- DUR-01: DURATION_OPTIONS removed from service.ts ----------------------

describe("DUR-01: DURATION_OPTIONS constant removed from lib/validations/service.ts", () => {
  const src = readFile('lib/validations/service.ts')

  it("does not export DURATION_OPTIONS", () => {
    expect(src).not.toContain('DURATION_OPTIONS')
  })
})

// ---- DUR-02: Zod schema has min(1) and max(1440) ---------------------------

describe("DUR-02: durationMin zod schema validates 1-1440 range", () => {
  const src = readFile('lib/validations/service.ts')

  it("has min(1, ...) on durationMin", () => {
    expect(src).toMatch(/min\(1[,\s]/)
  })

  it("has max(1440, ...) on durationMin", () => {
    expect(src).toMatch(/max\(1440[,\s]/)
  })

  it("does not have old min(5, ...) constraint", () => {
    expect(src).not.toMatch(/min\(5[,\s]/)
  })

  it("does not have old max(480, ...) constraint", () => {
    expect(src).not.toMatch(/max\(480[,\s]/)
  })
})

// ---- DUR-03: service-form.tsx uses number input, not Select dropdown --------

describe("DUR-03: service-form.tsx uses type=number input for duration, not Select", () => {
  const src = readFile('components/service-form.tsx')

  it("does not import DURATION_OPTIONS", () => {
    expect(src).not.toContain('DURATION_OPTIONS')
  })

  it("has a number input for duration", () => {
    expect(src).toMatch(/type=["']number["']/)
  })
})

// ---- DUR-04: Stepper buttons with type="button" ----------------------------

describe("DUR-04: stepper buttons use Minus/Plus icons and have type='button'", () => {
  const src = readFile('components/service-form.tsx')

  it("imports Minus icon from lucide-react", () => {
    expect(src).toContain('Minus')
  })

  it("imports Plus icon from lucide-react", () => {
    expect(src).toContain('Plus')
  })

  it("has at least 2 type='button' attributes (one per stepper)", () => {
    const matches = src.match(/type=["']button["']/g)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBeGreaterThanOrEqual(2)
  })
})

// ---- DUR-05: Three preset values (15, 30, 60) ------------------------------

describe("DUR-05: three quick-select preset buttons for 15, 30, and 60 minutes", () => {
  const src = readFile('components/service-form.tsx')

  it("has preset array literal [15, 30, 60]", () => {
    expect(src).toMatch(/\[15,\s*30,\s*60\]/)
  })
})

// ---- DUR-06: "min" suffix visible in the duration widget -------------------

describe("DUR-06: 'min' suffix span is present inside the duration input widget", () => {
  const src = readFile('components/service-form.tsx')

  it("has a span element containing 'min' text as suffix", () => {
    expect(src).toMatch(/>[\s]*min[\s]*<\/span>/)
  })
})
