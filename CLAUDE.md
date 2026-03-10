# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**omni-book** is a universal multi-tenant SaaS booking platform that adapts to various niches:
- **Beauty** — hairdressers, barbers, tattoo artists
- **HoReCa** — cafes, restaurants, anti-cafes
- **Sports & Leisure** — courts, photo studios, hourly lofts
- **Medicine & Consulting** — psychologists, lawyers, clinics

The system centers on flexible, configurable **resource entities** and **multi-tenancy** so a single codebase serves all verticals.

## Stack

- **Frontend/Backend**: Next.js (App Router), React, TypeScript
- **Package manager**: npm
- **Automation scripts**: Python (in `/scripts/`)
- **Runtime**: Node.js

## Common Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Run tests
npm test

# Run a single test file
npm test -- <path/to/test>
```

For Python scripts:
```bash
# Install Python dependencies
pip install -r scripts/requirements.txt

# Run a specific automation script
python scripts/<script_name>.py
```

## Architecture

### Multi-Tenancy Model
Each tenant (business) is isolated by a `tenantId`. All database queries must be scoped to the tenant. Tenant configuration drives which features, resource types, and booking rules are active.

### Resource Entity System
The core abstraction is a **Resource** — anything that can be booked (a staff member, a room, a court, a table). Resources have configurable attributes per niche (e.g., services offered, capacity, working hours). Avoid hardcoding niche-specific logic; use the resource config schema instead.

### Directory Layout (expected)
```
/app          # Next.js App Router pages and layouts
/components   # Shared React components
/lib          # Business logic, DB clients, utilities
/scripts      # Python automation scripts
/prisma       # DB schema and migrations (if using Prisma)
/public       # Static assets
```

### Key Design Rules
- All tenant data must be filtered by `tenantId` at the data-access layer — never rely on higher layers for isolation.
- Resource types and booking rules are data-driven (stored in DB/config), not hardcoded per vertical.
- Python scripts in `/scripts/` are standalone automation tools (e.g., data imports, notifications). They communicate with the app via the database or internal API, not direct module imports.
