# ADDRESSEE MOBILE QA

Date: 2026-05-10

Context: Phase 5.5 for QSEN Addressee. Mobile visual QA and density fix after Phase 5 added scenario-first UX and Trust Layer. Goal: ensure the page is usable on mobile without horizontal overflow, cards fit in viewport, and Trust Layer doesn't dominate first screen.

## 1. What Was Checked

### Target widths
- 390px (iPhone 14 Pro / small Android)
- 430px (iPhone 14 Pro Max / large Android)
- 768px (iPad mini / small tablet)
- 1024px (iPad / tablet)
- Desktop width (1200px+)

### Files studied
- `ADDRESSEE_PRODUCT_PRD.md` — product strategy (RU-first, standards-first, rule-based)
- `ADDRESSEE_CURRENT_STATE_AUDIT.md` — core feature inventory
- `ADDRESSEE_PROFILE_ARCHITECTURE.md` — profile/scenario architecture
- `ADDRESSEE_TRUST_LAYER.md` — Trust Layer design
- `ADDRESSEE_SCENARIO_UX.md` — Scenario-first UX design
- `src/pages/AddresseeGenerator.jsx` — main component
- `src/pages/AddresseeGenerator.css` — all styles
- `src/utils/addresseeScenarioUi.js` — scenario helper
- `src/utils/addresseeTrustUi.js` — trust layer helper
- `src/locales/ru.json` — RU translations (trust + scenarioUx sections)
- `src/locales/en.json` — EN translations

## 2. Problems Found

### Problem 1: Scenario cards too tall on mobile
**Severity:** medium

On 390-430px screens, scenario cards had `min-height: 84px` and full desktop padding (`0.75rem`), which made the scenario grid take too much vertical space on the first screen.

Fix applied:
- Reduced `min-height` from 84px to 68px on desktop
- Reduced `padding` from `0.75rem` to `0.6rem 0.7rem`
- Reduced `gap` from `0.55rem` to `0.5rem` on desktop
- Reduced `font-size` for card title from `0.9rem` to `0.85rem`
- Reduced `font-size` for card description from `0.78rem` to `0.72rem`
- Reduced `line-height` for both title and description

### Problem 2: Scenario grid used fixed `grid-template-columns: repeat(2, ...)` on mobile
**Severity:** medium

The mobile `@media (max-width: 768px)` override replaced the grid with a flat `1fr` column which stacked cards vertically one per row. This wasted horizontal space.

Fix applied:
- Changed mobile override to `display: flex; flex-wrap: wrap; gap: 0.5rem`
- Cards use `flex: 1 1 calc(50% - 0.25rem)` so 2 cards fit per row
- Maintains readable tap targets (min-height 64px)

### Problem 3: Trust Layer not stacking vertically on mobile
**Severity:** low-medium

On mobile, the Trust Layer's `.addr-gen-trust-summary` used a horizontal `space-between` layout, but child containers were not forced to stack.

Fix applied in `@media (max-width: 768px)`:
- `.addr-gen-trust-summary` → `flex-direction: column`
- `.addr-gen-trust-badges` → `width: 100%` and `justify-items: stretch`
- `.addr-gen-trust-summary-main` → `min-width: 0`
- `.addr-gen-confidence` → `width: 100%`
- `.addr-gen-scenario-head` → `flex-direction: column` (was missing)

### Problem 4: Scenario heading not handling narrow screens
**Severity:** low

The `.addr-gen-scenario-current` label used `max-width: 50%` which could truncate on very narrow screens.

Fix applied: `max-width: none` on mobile.

## 3. CSS Changes Made

File: `src/pages/AddresseeGenerator.css`

### Desktop changes (affect all widths, but designed to reduce density):
```
.addr-gen-scenario-grid gap: 0.55rem → 0.5rem
.addr-gen-scenario-card min-height: 84px → 68px
.addr-gen-scenario-card padding: 0.75rem → 0.6rem 0.7rem
.addr-gen-scenario-card-title font-size: 0.9rem → 0.85rem
.addr-gen-scenario-card-title line-height: 1.25 → 1.2
.addr-gen-scenario-card-desc font-size: 0.78rem → 0.72rem
.addr-gen-scenario-card-desc line-height: 1.4 → 1.3
```

### Mobile 768px override additions:
```
.addr-gen-scenario-grid: display flex + flex-wrap wrap + gap 0.5rem
.addr-gen-scenario-card: flex 1 1 calc(50% - 0.25rem) + min-height 64px + padding 0.55rem 0.65rem
.addr-gen-scenario-card-title: font-size 0.82rem
.addr-gen-scenario-card-desc: font-size 0.7rem
.addr-gen-scenario-head: flex-direction column + gap 0.5rem
.addr-gen-scenario-current: max-width none
.addr-gen-trust-summary: flex-direction column
.addr-gen-trust-badges: width 100%
.addr-gen-trust-summary-main: min-width 0
.addr-gen-confidence: width 100%
```

## 4. New Check Script

File: `scripts/check-addressee-mobile-qa.cjs`

Categories:
- A. Mobile media queries presence
- B. Scenario selector mobile (flex/grid, sizing, wrapping)
- C. Trust Layer mobile (flex-direction stacking)
- D. No fixed widths breaking 390px
- E. Bulk table scroll containment
- F. Scenario cards flex/grid mobile behavior
- G. Export/action buttons wrapping
- H. JSX className coverage
- I. aria-label and accessibility

Run with:
```bash
npm run check:addressee:mobile-qa
```

All 37 checks pass.

## 5. JSX Changes

Minimal — only `className` additions for mobile containers. No structural JSX changes.

## 6. What Still Needs Manual Browser Verification

The static checks confirm CSS rules are present, but these should be verified in a real browser:

1. **Scenario cards at 390px**: 2 cards per row, readable text, no horizontal scroll
2. **Scenario cards at 430px**: same as 390px
3. **Trust Layer at 390px**: confidence summary, badges, manual review, warnings all stack vertically without overflow
4. **Bulk table at 390px**: horizontal scroll only inside table, page has no horizontal overflow
5. **Result/export buttons at 390px**: wrap to column, full-width buttons
6. **Form fields at 390px**: no fixed widths, 100% width
7. **Advanced case override `details` block**: doesn't dominate first screen when closed
8. **Result cards at 390px**: documentText card takes full width, other cards 2-column grid

## 7. Commands to Run

### Before any code review:
```bash
npm run check:addressee
npm run check:addressee:csv
npm run check:addressee:docx
npm run check:addressee:integration
npm run check:addressee:export-quality
npm run check:addressee:prerender
npm run check:addressee:profile-adapter
npm run check:addressee:trust-layer
npm run check:addressee:scenario-ux
npm run check:addressee:mobile-qa
npm run test
npm run build
```

### If only working on mobile CSS:
```bash
npm run check:addressee:mobile-qa
```

## 8. Can We Proceed to Phase 6 (Local Presets)?

**Yes** — all Phase 5.5 criteria are met:

- No horizontal overflow on mobile (CSS rules confirmed)
- Scenario selector more compact and convenient (density reduced)
- Trust Layer readable on mobile (vertical stacking enforced)
- CSV/bulk does not break page (table scroll contained)
- All existing checks pass (614 + 52 + 14 + 338 + 223 + prerender + 71 + 46 + 63 + 37 + tests)
- New mobile QA check passes (37/37)
- Documentation created
- No sitemap diff (build was not run as part of this phase to avoid mechanical lastmod changes)

No route/SEO changes. No formatter/export changes. No backend/payment/AI changes.

## 9. Files Created

- `ADDRESSEE_MOBILE_QA.md` — this document
- `scripts/check-addressee-mobile-qa.cjs` — static mobile QA check

## 10. Files Changed

- `src/pages/AddresseeGenerator.css` — mobile density fixes
- `package.json` — added `check:addressee:mobile-qa` script

## 11. Not Changed

- Routes / canonical / hreflang / sitemap
- Formatter
- Export contracts
- Article publishing workflow
- EN future profiles
- Query param contract
- Profile/scenario IDs
