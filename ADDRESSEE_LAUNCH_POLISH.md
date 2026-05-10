# Addressee Launch Polish (Phase 11)

## Changes

### UX Copy Simplification
- Removed "Pro" mentions from locale strings (exportPremiumHint, bulk.proHint, presets.limitClose)
- Added `introPrivacy` notice in panel heading
- Added `freeForeverNotice` after copy-all button
- Bulk section hidden by default (CSS `display:none`), shown via `--active` class

### Presets UI
- Both presets sections wrapped in `<details open={presets.length > 0}>`
- Save buttons preserved inside each `<details>` section

## Verification
- `npm run check:addressee` — 614/614 PASS
- `npm run check:addressee:profile-adapter` — 71/71 PASS
- `npm run check:addressee:trust-layer` — 46/46 PASS
- `npm run check:addressee:mobile-qa` — 37/37 PASS
- `npm run check:addressee:scenario-ux` — 64/64 PASS
- `npm run check:addressee:ui-i18n` — 126/126 PASS
- `npm run check:addressee:presets` — 97/97 PASS
- `npm run check:addressee:analytics` — 99/99 PASS
- `npm run check:addressee:article-cta` — 11/11 PASS
- `npm run check:article-funnel` — 4/4 PASS
- `npm run check:addressee:launch-polish` — 32/32 PASS
- `npm test` — 12/12 PASS

## Files Changed
- `package.json` — added `check:addressee:launch-polish` script
- `public/sitemap.xml` — date updated to 2026-05-10
- `src/locales/en.json` — removed Pro, added introPrivacy, freeForeverNotice
- `src/locales/ru.json` — removed Pro, added introPrivacy, freeForeverNotice
- `src/pages/AddresseeGenerator.css` — bulk hidden, notice styles, presets details
- `src/pages/AddresseeGenerator.jsx` — introPrivacy, freeForeverNotice, details wrapping

## New Files
- `ADDRESSEE_PRODUCT_READINESS_REVIEW.md` — Phase 10 audit
- `scripts/check-addressee-launch-polish.cjs` — Phase 11 checks