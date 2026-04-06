---
phase: quick-260406-vjz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - FULL_PROJECT_REPORT.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "FULL_PROJECT_REPORT.md exists in the project root"
    - "Report covers all directories: app/, components/, lib/, prisma/, db/, public/"
    - "Report lists all API routes and Server Actions discovered"
    - "Report includes i18n status for RU, KZ, and EN locales"
    - "Report includes code health section identifying ghost code and ESLint warnings"
    - "Report includes security/env variable usage audit"
  artifacts:
    - path: "FULL_PROJECT_REPORT.md"
      provides: "Comprehensive technical audit report"
  key_links:
    - from: "prisma/schema.prisma"
      to: "FULL_PROJECT_REPORT.md"
      via: "Database architecture section"
    - from: "app/api/**"
      to: "FULL_PROJECT_REPORT.md"
      via: "Feature audit — API routes"
---

<objective>
Perform a comprehensive technical audit of the entire omni-book Next.js project and write the results to FULL_PROJECT_REPORT.md in the root directory.

Purpose: Provide a single authoritative snapshot of the project state — tech stack, database schema, features, i18n completeness, code health, and security posture — so any developer can understand the exact state without further investigation.

Output: /home/yola/projects/sites/omni-book/FULL_PROJECT_REPORT.md
</objective>

<execution_context>
@/home/yola/projects/sites/omni-book/.claude/get-shit-done/workflows/execute-plan.md
@/home/yola/projects/sites/omni-book/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit project structure, tech stack, database, and API surface</name>
  <files>FULL_PROJECT_REPORT.md</files>
  <action>
Perform the following discovery steps using Bash, Read, and Grep tools, then write results into the report file.

**Step 1 — Tech Stack Versions**
Read package.json to extract exact versions for: next, react, react-dom, @prisma/client, tailwindcss, next-auth, zod, react-hook-form, recharts, resend, sonner, date-fns, date-fns-tz, lucide-react, bcryptjs.
Also read next.config.ts, tsconfig.json, postcss.config.mjs, jest.config.ts for config overview.

**Step 2 — Database Architecture**
Read prisma/schema.prisma in full. For each model, list: fields, relations, notable constraints (@unique, @default, @@index). Note which models were recently changed (Kaspi removal: mockQrCode, kaspiApiKey gone; paylinkOrderId/paylinkUrl added).

**Step 3 — API Routes Discovery**
Recursively find all route.ts files under app/api/ — list each route with its HTTP methods (GET/POST/PUT/DELETE/PATCH). Use:
  find /home/yola/projects/sites/omni-book/app/api -name "route.ts" | sort
Then grep each file for "export async function (GET|POST|PUT|DELETE|PATCH)" to identify methods.

**Step 4 — Server Actions Discovery**
Find all Server Action files under lib/actions/ — list each file and the exported action functions. Use:
  find /home/yola/projects/sites/omni-book/lib/actions -name "*.ts" | sort
Then grep for "export async function" in each.

**Step 5 — UI Components Inventory**
List all files in components/ recursively, grouping by subdirectory (ui/, booking/, dashboard/, landing/, marketing/, support/, shared/).

**Step 6 — App Router Pages**
List all page.tsx files under app/ recursively. Identify public pages, auth-gated pages, admin pages, and tenant pages.
</action>
  <verify>
    <automated>test -f /home/yola/projects/sites/omni-book/FULL_PROJECT_REPORT.md && wc -l /home/yola/projects/sites/omni-book/FULL_PROJECT_REPORT.md</automated>
  </verify>
  <done>FULL_PROJECT_REPORT.md exists with sections for Tech Stack, Database Architecture, API Routes, Server Actions, UI Components, and App Pages — all populated with actual discovered content from the codebase.</done>
</task>

<task type="auto">
  <name>Task 2: Audit features, i18n completeness, code health, and security</name>
  <files>FULL_PROJECT_REPORT.md</files>
  <action>
Continue the audit and APPEND remaining sections to FULL_PROJECT_REPORT.md.

**Step 1 — Feature Audit**
For each feature listed below, identify the key files involved and state whether it is fully implemented based on file existence and grep patterns:
- Booking flow (public): app/book/[slug]/, components/booking/, lib/booking/
- Bookings Dashboard (CRM): components/bookings-dashboard.tsx, app/dashboard/, lib/actions/
- Paylink.kz subscription: lib/payments/, lib/platform-payment.ts, app/api/paylink-webhook/
- WhatsApp prepayment button: grep for "whatsapp" or "buildWhatsAppPrepaymentUrl" across all files
- i18n (multi-locale): lib/i18n/, app/[locale]/ or middleware locale routing
- Support form: components/support/, app/api/support/ or similar
- Tokenized booking management (cancel/reschedule): app/manage/[token]/, lib/actions/
- Client CRM (clients list + Telegram outreach): components/clients-table.tsx, components/client-detail.tsx
- Super Admin / God Mode: app/admin/
- Subscription lifecycle (freeze/unfreeze, cron): lib/subscription-lifecycle.ts, app/api/cron/
- Legal pages (landing footer): app/(marketing)/
- Analytics dashboard: components/analytics-dashboard.tsx

**Step 2 — i18n Status**
Locate the translations file(s). Likely at lib/i18n/ or similar. Read or grep the translation files for RU, KZ, EN.
- Confirm all three locales exist
- Check for syntax errors (unmatched braces, trailing commas)
- Count keys per locale and flag any locale with significantly fewer keys than others (missing translations)
- List any translation namespaces found (booking, dashboard, payment, manage, legal, etc.)

**Step 3 — Code Health: Ghost Code**
Scan for Kaspi remnants (should be cleaned up after Phase 12):
  grep -r "kaspi\|Kaspi\|KASPI\|requireDeposit\|depositAmount\|mockQrCode\|kaspiApiKey\|mockPaylink" \
    /home/yola/projects/sites/omni-book/app \
    /home/yola/projects/sites/omni-book/components \
    /home/yola/projects/sites/omni-book/lib \
    --include="*.ts" --include="*.tsx" -l 2>/dev/null

Scan for unused imports or obvious dead code patterns (TODO/FIXME/HACK comments):
  grep -r "TODO\|FIXME\|HACK\|@ts-ignore\|@ts-expect-error\|eslint-disable" \
    /home/yola/projects/sites/omni-book/app \
    /home/yola/projects/sites/omni-book/components \
    /home/yola/projects/sites/omni-book/lib \
    --include="*.ts" --include="*.tsx" -n 2>/dev/null | head -60

Check payment-lifecycle.ts (should be no-op per STATE.md Phase 12-04 decision):
  cat /home/yola/projects/sites/omni-book/lib/payment-lifecycle.ts

**Step 4 — ESLint / Build Health**
Run ESLint in quiet mode to capture only errors and warnings (skip node_modules):
  cd /home/yola/projects/sites/omni-book && npx next lint --quiet 2>&1 | head -80
(If this takes too long — more than 30s — note it and skip, recording "ESLint not run — check manually")

**Step 5 — Security & Environment Variables**
List all env var references used in code:
  grep -r "process\.env\." \
    /home/yola/projects/sites/omni-book/app \
    /home/yola/projects/sites/omni-book/lib \
    --include="*.ts" --include="*.tsx" -h 2>/dev/null \
    | grep -oP 'process\.env\.\w+' | sort -u

Read .env.example or .env.local.example if present. Check that no hardcoded secrets (API keys, passwords) appear in source files:
  grep -r "sk_live\|sk_test\|password.*=.*['\"][^'\"]\{8,\}" \
    /home/yola/projects/sites/omni-book/app \
    /home/yola/projects/sites/omni-book/lib \
    --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules

Verify sensitive routes use requireAuth/requireRole guards:
  grep -r "requireAuth\|requireRole\|ensureSuperAdmin" \
    /home/yola/projects/sites/omni-book/lib/actions \
    --include="*.ts" -l 2>/dev/null

**Step 6 — Write / Append to FULL_PROJECT_REPORT.md**
Append the following sections to the report file created in Task 1:
- Feature Audit (table: Feature | Status | Key Files)
- i18n Status (table: Locale | Key Count | Namespaces | Issues)
- Code Health (subsections: Ghost Code, TODOs/FIXMEs, payment-lifecycle.ts status)
- ESLint / Build Health
- Security & Environment Variables (table: Var Name | Where Used | Notes)
- Summary & Recommendations

End the report with a "Generated" timestamp and note the current project milestone (v1.5 — Payments Pivot, Phase 12 complete).
</action>
  <verify>
    <automated>grep -c "##" /home/yola/projects/sites/omni-book/FULL_PROJECT_REPORT.md</automated>
  </verify>
  <done>FULL_PROJECT_REPORT.md contains all required sections: Feature Audit, i18n Status, Code Health, ESLint Health, Security/Env audit, and Summary. The report is detailed enough for any developer to understand the exact project state without running the code.</done>
</task>

</tasks>

<verification>
- FULL_PROJECT_REPORT.md exists at project root
- File contains at minimum 8 major sections (Tech Stack, Database, API Routes, Server Actions, Features, i18n, Code Health, Security)
- All three locales (RU, KZ, EN) are assessed
- Kaspi ghost code check is recorded (either "none found" or listing of remaining files)
- All environment variables referenced in code are listed
</verification>

<success_criteria>
Any developer unfamiliar with omni-book can read FULL_PROJECT_REPORT.md and understand: what the app does, what the database looks like, which features are implemented, where i18n stands, what technical debt remains, and how secrets are managed — without needing to read individual source files.
</success_criteria>

<output>
After completion, create `.planning/quick/260406-vjz-comprehensive-technical-audit-generate-f/260406-vjz-SUMMARY.md`
</output>
