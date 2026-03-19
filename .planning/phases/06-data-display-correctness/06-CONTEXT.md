# Phase 6: Data Display Correctness - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate all raw `opt_*` IDs from every user-visible surface. Every option value (select field attributes, labels, type names) must render as a human-readable label. Creating new features or changing the opt_ ID system itself is out of scope.

</domain>

<decisions>
## Implementation Decisions

### Fix location
- Fix at the **render layer** — add opt_ guards in `booking-form.tsx` at all three display points using the `t('niche', val)` call from `useI18n()` which is already available in that component
- Pattern: `val.startsWith('opt_') ? t('niche', val) : String(val)` — same as the `optLabel()` helper in `resource-form.tsx`
- Three specific fix points in `booking-form.tsx`:
  1. Line 549: `resource.specialization` badge on resource card
  2. Line 570: generic attribute fallback `String(v)` in the attributes loop
  3. Line 703: `selectedResource.specialization` in booking summary `SummaryRow`

### Coverage scope
- Audit ALL surfaces that display opt_* values — not just the known leaks in `booking-form.tsx`
- Surfaces to audit: `booking-form.tsx` (known), `services-manager.tsx` (unchecked), `lib/email/reminders.ts` (unchecked), any other display components
- Fix ALL leaks found during the audit — DATA-02 requires global coverage across all niches and field types
- If a surface is already correct (like `resources-manager.tsx`, `tenant-public-page.tsx`), document it as confirmed clean

### Claude's Discretion
- Whether to extract `optLabel()`/opt_ guard into a shared utility vs inline the check at each display point
- Exact structure of the full-surface audit (grep strategy)
- Whether to add a test to prevent future regressions (extending v1.0 static file assertion pattern)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Opt_ ID system
- `lib/niche/config.ts` — Defines all niche configs with `opt_*` keys as field labels, resource type labels, and select option values; the authoritative source of what opt_ IDs exist
- `lib/i18n/translations.ts` — Maps `opt_*` keys to human-readable strings in ru/kz/en under the `niche` section
- `lib/i18n/context.tsx` — `t()` function implementation (falls back to `${section}.${key}` if key not found)

### Known leak locations
- `components/booking-form.tsx` — Lines 549, 570, 703: the three confirmed opt_ display leaks

### Already-correct surfaces (confirmed in codebase scout)
- `components/resource-form.tsx` — `optLabel()` helper (line 161–163) correctly handles opt_ in select fields
- `components/resources-manager.tsx` — `getAttrDisplay()` (line 73) uses `t('niche', val)` for select fields
- `components/tenant-public-page.tsx` — `formatAttrForCard()` (line 700) checks `startsWith('opt_')` and translates

### Requirements
- `.planning/REQUIREMENTS.md` — DATA-01 (no raw opt_ visible anywhere), DATA-02 (global coverage across all niches/field types)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `optLabel(t, val)` in `resource-form.tsx` (line 161–163): `return val.startsWith('opt_') ? t('niche', val) : val` — the exact pattern to replicate or extract and share
- `getAttrDisplay()` in `resources-manager.tsx` (line 60–75): reference implementation for attribute display with opt_ translation
- `formatAttrForCard()` in `tenant-public-page.tsx` (line ~693–703): reference for opt_ guard pattern

### Established Patterns
- `useI18n()` hook provides `t` in client components; `getServerT()` in server components — both available for translations
- `t('niche', key)` is the standard call for resolving opt_ IDs — consistent across all correct implementations
- Static file assertion tests (`fs.readFileSync` + regex) — established in v1.0 for Tailwind audits; same pattern could verify no raw opt_ strings in rendered output paths

### Integration Points
- `booking-form.tsx` receives `resource` props from `tenant-public-page.tsx` — the resource object includes `specialization` (string | null) and `attributes` (Record<string, unknown>) which may contain opt_ values
- `useI18n()` is already imported and used in `booking-form.tsx` — no new imports needed for the fix

</code_context>

<specifics>
## Specific Ideas

No specific UI references — the fix is invisible to users (they see the label, not the mechanism).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-data-display-correctness*
*Context gathered: 2026-03-19*
