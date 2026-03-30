# Phase 7 — UI Design Contract
# Bookings Dashboard CRM Overhaul and Manual Booking Creation

**Generated:** 2026-03-30
**Status:** Approved (user-provided)
**Design System:** Neumorphism Soft UI (established system — extends existing CSS variables)

---

## Design System Foundation

All new UI elements extend the existing Neumorphism Soft UI system already in production. The following rules are **CRITICAL** and override any defaults.

### 1. Surfaces

- Background: `var(--neu-bg)` (maps to soft dark tone — NOT stark black, NOT bright white)
- Cards and panels: `var(--neu-bg)` with `.neu-raised` shadow class
- Do NOT use bare `bg-gray-900` or `bg-[#1E1E1E]` — use the existing CSS variable token so light/dark theming works

### 2. Shadows — Core Neumorphism Rule

All interactive containers (cards, buttons, form fields) must use dual drop-shadows:
- **Light shadow:** top-left, subtle (existing `.neu-raised` or `.neu-inset` classes)
- **Dark shadow:** bottom-right

Use existing utility classes: `.neu-raised` (for cards/buttons), `.neu-inset` (for inputs/pressed state)

Do NOT add custom `box-shadow` inline — extend the existing CSS variable system.

### 3. Corners

- Cards and panels: `rounded-2xl`
- Buttons and inputs: `rounded-xl`
- No sharp edges anywhere

### 4. Typography

| Element | Style |
|---------|-------|
| Time ("10:00") | `font-semibold text-lg` — highly legible, prominent |
| Day group header | `font-semibold text-base` — sticky, visually distinct |
| Client name | `font-medium text-sm` |
| Secondary info (service, resource) | `text-sm text-muted-foreground` |
| Status badge | Existing Badge component with neu-inset |

### 5. Button Interaction States

- Default: `.neu-raised` (extruded appearance)
- Hover / Active: `.neu-inset` (pressed-in appearance via inset box-shadow)
- Use `transition-all duration-150` for smooth state change
- Primary CTA ("➕ Новая запись"): accent color, `.neu-raised` → hover `.neu-inset`

---

## Screen Designs

### A. Bookings Dashboard Page (`/dashboard/bookings`)

```
┌─────────────────────────────────────────────────────┐
│  Bookings                      [➕ Новая запись]    │  ← header row, button neu-raised
├─────────────────────────────────────────────────────┤
│  [All] [Pending] [Confirmed] [Completed] [Отменено] │  ← filter chips, neu-inset when active
├─────────────────────────────────────────────────────┤
│  ─── Сегодня, 30 Марта ─────────── (sticky header) │  ← date group header, semibold
│  ┌───────────────────────────────────────────────┐  │
│  │ 10:00  │ Иван Иванов  │ Стрижка │ Кресло 1 │ ● │  │  ← booking row, neu-raised card
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 14:30  │ Анна Смит    │ Маникюр │ Мастер А  │ ● │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ─── Завтра, 31 Марта ──────────────────────────── │
│  ┌───────────────────────────────────────────────┐  │
│  │ 09:00  │ Петр Козлов  │ Массаж  │ Кабинет 2 │ ● │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Design rules for booking rows:**
- Container: `neu-raised rounded-xl` card
- Time: `font-semibold text-lg` — leftmost column, dominant visual element
- Remaining columns: `font-medium text-sm` for name, `text-sm text-muted-foreground` for service/resource
- Status indicator: colored dot or Badge (neu-inset)
- Hover state: subtle background tint (`hover:bg-muted/30`)

**Filter chips:**
- Inactive: `neu-raised rounded-xl px-3 py-1`
- Active: `neu-inset rounded-xl px-3 py-1` (pressed appearance)
- "Отменено" chip: hidden/excluded by default, visible as togglable option

**Day group headers:**
- `font-semibold text-sm uppercase tracking-wide text-muted-foreground`
- `sticky top-0 z-10 bg-[var(--neu-bg)] py-2`
- Horizontal rule separator: `border-t border-border/30`

---

### B. Manual Booking Slide-Over Panel

Opens from right side when "➕ Новая запись" is clicked.

```
                              ┌──────────────────────┐
                              │  Новая запись      ✕ │  ← SheetHeader, neu-raised panel
                              ├──────────────────────┤
                              │  Дата               │
                              │  [────────────────]  │  ← DatePicker, neu-inset input
                              │                      │
                              │  Ресурс             │
                              │  [────────────────]  │  ← Select, neu-inset
                              │                      │
                              │  Услуга             │
                              │  [────────────────]  │  ← Select (filtered by resource), neu-inset
                              │                      │
                              │  Время              │
                              │  [────────────────]  │  ← Slot picker, neu-inset
                              │                      │
                              │  Имя клиента        │
                              │  [────────────────]  │  ← Input, neu-inset
                              │                      │
                              │  Телефон            │
                              │  [────────────────]  │  ← Input, neu-inset
                              ├──────────────────────┤
                              │  [Сохранить запись]  │  ← primary button, neu-raised
                              └──────────────────────┘
```

**Sheet panel design rules:**
- Width: `w-full sm:max-w-md` (right-side slide-over)
- Background: `bg-[var(--neu-bg)] backdrop-blur-sm`
- Shadow: `shadow-2xl` on the panel edge (the Sheet's built-in left border is removed per existing Neumorphism decisions — visual separation via shadow)
- Rounded left corners: `rounded-l-2xl` (right corners flush with screen edge)
- All form inputs: `.neu-inset rounded-xl` (pressed-in appearance for fields)
- Submit button: `.neu-raised rounded-xl` with accent color, hover `.neu-inset`
- Form validation errors: `text-destructive text-sm` below each field

**Slot picker:**
- Display as grid of time chips: `grid grid-cols-3 gap-2`
- Available slot chip: `neu-raised rounded-lg text-sm px-2 py-1 cursor-pointer`
- Selected slot chip: `neu-inset rounded-lg text-sm px-2 py-1 text-neu-accent`
- Unavailable: `opacity-40 cursor-not-allowed`

---

## Component Inventory

| Component | Type | Location | Neumorphism Class |
|-----------|------|----------|-------------------|
| "➕ Новая запись" button | Primary CTA | Dashboard header | `neu-raised` → hover `neu-inset` |
| Booking row card | Display card | Grouped list | `neu-raised rounded-xl` |
| Filter chips | Toggle | Dashboard header | `neu-raised` / `neu-inset` (active) |
| Day group header | Sticky label | Between groups | `sticky bg-[var(--neu-bg)]` |
| ManualBookingSheet | Sheet (right) | Overlay | `bg-[var(--neu-bg)] backdrop-blur-sm` |
| Form inputs (all) | Input/Select | Sheet form | `neu-inset rounded-xl` |
| Slot time chips | Toggle grid | Sheet form | `neu-raised` / `neu-inset` (selected) |
| Submit button | Primary | Sheet footer | `neu-raised rounded-xl` → hover `neu-inset` |

---

## i18n Requirements

All new UI strings must have translations in **ru**, **en**, and **kz** locales.

Key new keys needed (in `dashboard` namespace of `translations.ts`):
- `newBooking` — "Новая запись" / "New Booking" / "Жаңа жазба"
- `manualBookingTitle` — "Новая запись" / "New Booking" / "Жаңа жазба"
- `selectDate` — "Дата" / "Date" / "Күні"
- `selectResource` — "Ресурс" / "Resource" / "Ресурс"
- `selectService` — "Услуга" / "Service" / "Қызмет"
- `selectTime` — "Время" / "Time" / "Уақыт"
- `clientName` — "Имя клиента" / "Client name" / "Клиент аты"
- `clientPhone` — "Телефон" / "Phone" / "Телефон"
- `saveBooking` — "Сохранить запись" / "Save booking" / "Жазбаны сақтау"
- `showCancelled` — "Отменено" / "Cancelled" / "Бас тартылды"
- `today` — "Сегодня" / "Today" / "Бүгін"
- `tomorrow` — "Завтра" / "Tomorrow" / "Ертең"
- `noSlotsAvailable` — "Нет доступного времени" / "No slots available" / "Бос уақыт жоқ"
- `bookingCreated` — "Запись создана" / "Booking created" / "Жазба жасалды"

---

## Accessibility

- All form inputs have `<label>` with `htmlFor` linking
- Sheet has `aria-label="Новая запись"` on SheetContent
- Filter chips use `aria-pressed` attribute for toggle state
- Time slots use `aria-label="Выбрать {time}"` on each chip

---

## Anti-Patterns (Do NOT)

- ❌ Use `className="shadow-md"` instead of `.neu-raised` / `.neu-inset`
- ❌ Use stark `bg-black` or `bg-white` for surfaces
- ❌ Sharp corners (`rounded-none`, `rounded-sm`) on new components
- ❌ Normal `<table>` flat layout — must use grouped sections
- ❌ Show CANCELLED bookings by default
- ❌ Use `border-border` on Sheet panel (use shadow separation per existing pattern)
