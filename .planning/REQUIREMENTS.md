# Requirements: omni-book

**Defined:** 2026-03-25
**Core Value:** A reliable, correctly-rendered booking experience for tenants and customers — accurate data display, accessible UI across all screen sizes and both themes.

## v1.4 Requirements

Requirements for v1.4 Client Base (Mini-CRM). Each maps to roadmap phases.

### Client Data Model

- [x] **CRM-01**: Tenant owner's booking history is aggregated into a `Client` Prisma model per unique phone/email, synced from existing bookings via a seeding action
- [ ] **CRM-02**: Each client record exposes total completed visits count
- [ ] **CRM-03**: Each client record exposes total revenue from completed bookings (sum of `price` on COMPLETED bookings)
- [ ] **CRM-04**: Each client record exposes last visit date (most recent COMPLETED booking date)
- [ ] **CRM-05**: Each client record shows whether client has an active Telegram connection (`telegramChatId` present on related bookings)

### Dashboard UI

- [ ] **CRM-06**: Tenant owner can navigate to a Clients page via sidebar link ("Клиенты" with Users icon)
- [ ] **CRM-07**: Clients page displays a Neumorphic data table with columns: Name, Contact (Phone/Email), Total Visits, Total Spent, Last Visit, Telegram Status
- [ ] **CRM-08**: Clients table has a search bar filtering by client name or phone number

### Client Detail

- [ ] **CRM-09**: Tenant owner can click a client row to open a detail page showing that client's full booking history (date, service, resource, price, status)

### Telegram Outreach

- [ ] **CRM-10**: From the client detail page, tenant owner can send a Telegram message to clients who have an active Telegram chat connection

### Design & i18n

- [ ] **CRM-11**: All new UI uses `.neu-raised`/`.neu-inset`/`var(--neu-bg)` Neumorphism patterns consistent with v1.3 design system
- [ ] **CRM-12**: All new UI strings are translated in RU/EN/KZ (sidebar label, page headers, column headers, empty states, action labels)

## Future Requirements

### Advanced CRM (v2+)

- **CRM-F01**: Client tagging and notes (manual annotations per client)
- **CRM-F02**: Bulk Telegram messaging to filtered client segments
- **CRM-F03**: Export client list as CSV
- **CRM-F04**: Client loyalty metrics (visit frequency, average spend)
- **CRM-F05**: Automated Telegram re-engagement messages for lapsed clients

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time client sync webhook | Overkill for v1 — sync-on-booking-complete is sufficient |
| Client self-service portal | Separate product surface, v2+ |
| Email outreach | Telegram-first for this user base; email in future |
| Client merge / deduplication UI | Complex edge case — deferred to v2 |
| CSV export | Scoped out at user request — future phase |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRM-01 | Phase 4 | Complete |
| CRM-02 | Phase 4 | Pending |
| CRM-03 | Phase 4 | Pending |
| CRM-04 | Phase 4 | Pending |
| CRM-05 | Phase 4 | Pending |
| CRM-06 | Phase 5 | Pending |
| CRM-07 | Phase 5 | Pending |
| CRM-08 | Phase 5 | Pending |
| CRM-09 | Phase 5 | Pending |
| CRM-10 | Phase 5 | Pending |
| CRM-11 | Phase 5 | Pending |
| CRM-12 | Phase 5 | Pending |

**Coverage:**
- v1.4 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 — traceability updated after v1.4 roadmap creation (Phase 4 and Phase 5)*
