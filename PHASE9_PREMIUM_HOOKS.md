# Phase 9 — Premium Hooks / Pricing Intent

## Overview

Phase 9 adds monetization readiness to the Addressee Generator without actual payment processing. The goal is to plant soft premium hooks, track pricing intent signals, and prepare the UI for future paid features.

## What Was Added

### 1. Expanded Premium Intent Analytics

Three new tracking helpers in `src/utils/addresseeAnalytics.js`:

#### trackAddresseePresetLimitReached(presetType, limit, extra)

Fires when user hits a hard preset limit.

Payload:
- `preset_type` — "recipient" | "sender"
- `preset_limit` — the limit value (10 for recipients, 5 for senders)

#### trackAddresseeBulkApproachingLimit(rowCount, limit, extra)

Fires when CSV bulk import has >= 40 rows (approaching 50-row limit).

Payload:
- `bulk_row_count` — actual row count
- `bulk_row_limit` — limit value (50)
- `ratio` — percentage of limit used (e.g., 80 for 40/50)

#### trackAddresseeExportFormatInterest(exportType, extra)

Fires when user clicks DOCX export (potential premium format indicator).

Payload:
- `export_type` — "docx"

### 2. Approaching Limit Warning for Presets

`src/utils/addresseePresets.js` now detects when user has 2 or fewer slots remaining and returns `limit_close` error (instead of `limit_reached`). This allows showing a soft "running out of space" message before hitting the actual wall.

Limits:
- Recipient presets: 10 max, warning at 8+
- Sender presets: 5 max, warning at 3+

### 3. Premium Copy in Export Section

Added subtle hint text after the export buttons:

- RU: `addresseeGenerator.exportPremiumHint` = "DOCX-шаблоны для массовых рассылок и интеграций могут стать Pro-функцией."
- EN: `addresseeGenerator.exportPremiumHint` = "DOCX templates for mass mailings and integrations may become a Pro feature."

### 4. Premium Copy in Preset Section

Added `limitClose` locale keys for soft limit warnings:

- RU: `limitClose`: "Осталось {remaining} мест. Больше адресатов — в Pro-версии."
- EN: `limitClose`: "{remaining} slots left. More recipients — in Pro version."

### 5. Bulk CSV Approaching Limit Hint

The `proHint` text was already in place (added in Phase 7):
- RU: "Сейчас можно обработать до 50 строк за раз. Массовая обработка больших списков может быть вынесена в Pro-режим."
- EN: "You can process up to 50 rows at a time. Larger batch processing may become a Pro feature later."

## What Was NOT Added

Per the constraints, this phase does NOT include:
- No backend / payment provider
- No checkout flow
- No user accounts
- No cloud sync
- No AI features
- No paywall on basic generation
- No blocking of copy on basic results
- No changes to CSV/DOCX export contracts
- No changes to routes/SEO/canonical/hreflang/sitemap
- No personal data tracking

## Files Modified

- `src/utils/addresseeAnalytics.js` — 3 new tracking functions
- `src/utils/addresseePresets.js` — `limit_close` detection, new count helpers
- `src/pages/AddresseeGenerator.jsx` — hooks wired to handlers
- `src/locales/ru.json` — premium locale strings
- `src/locales/en.json` — premium locale strings
- `src/pages/AddresseeGenerator.css` — premium hint styling

## Files Added

- `PHASE9_PREMIUM_HOOKS.md` — this documentation

## Running Checks

```bash
npm run check:addressee:analytics
npm run check:addressee:presets
npm run check:addressee
```

## Future Phases

### Phase 10: Payment / Licensing Backend
- Add Cloudflare Worker for payment webhooks
- Add D1 record for premium status
- Connect premium hooks to actual gated features

### Phase 11: Pricing Page
- Add `/pricing` route (static, no backend)
- Show feature matrix for Free vs Pro
- Link to payment provider (future)

## Analytics Events Summary

| Event | Trigger | Key Signals |
|-------|---------|------------|
| `addressee_premium_intent` | `preset_limit_reached` | User saved max recipients/senders |
| `addressee_premium_intent` | `preset_limit_close` | User approaching preset limit (2 slots left) |
| `addressee_premium_intent` | `bulk_approaching_limit` | User processing 40+ rows in CSV |
| `addressee_premium_intent` | `docx_export_interest` | User exports DOCX format |

These events help identify:
1. Users who outgrow free limits
2. Users highly engaged with export formats
3. Power users who would benefit from batch processing
