# Addressee Analytics Funnel — Phase 7

## Overview

Phase 7 adds privacy-safe analytics funnel for the Addressee Generator tool. The goal is to understand user behavior through the tool lifecycle without capturing any personal or sensitive data.

## Purpose

Track how users navigate the tool:
- Tool opened (entry point, language, scenario from URL params)
- Scenario selection changes
- Result generation (success with confidence/warnings context)
- Warnings display
- Explanation expansion
- Copy actions
- Export actions (DOCX, TXT, HTML, CSV)
- CSV bulk import started/completed
- Preset save/apply/delete actions
- Premium intent signals (without payment UI)

## Events

### addressee_tool_opened

Fires once on component mount via `useEffect`.

Payload:
- `language` — UI language (ru/en)
- `scenario` — initial scenario from URL query or default
- `profile` — profile derived from scenario
- `focus` — focus hint from URL (?focus=to|from|salutation)
- `export_hint` — export hint from URL (?export=docx)

### addressee_scenario_selected

Fires when user manually changes the scenario card.

Payload:
- `scenario` — scenario ID
- `profile` — profile ID derived from scenario
- `language` — UI language

### addressee_generated

Fires after `formatAddressee()` completes successfully (on both submit and generate).

Payload:
- `scenario` — current scenario ID
- `profile` — current profile ID
- `language` — UI language
- `has_sender` — boolean, whether sender fields have data
- `has_manual_recipient_case` — boolean, whether recipientDativeName was filled
- `has_manual_sender_case` — boolean, whether senderGenitiveName was filled
- `warnings_count` — number of warnings in result
- `warning_codes` — array of warning code strings (max 20)
- `confidence_bucket` — "high" | "medium" | "low" | "unknown"
- `confidence_label` — raw confidence label from formatter

### addressee_warning_shown

Fires after generation if `warnings_count > 0`. Does NOT send warning messages.

Payload: same as `addressee_generated` (warning_codes included).

### addressee_explanation_opened

Fires when user expands a `<details>` explanation card.

Payload:
- `explanation_code` — the code identifier of the explanation
- `scenario` — current scenario ID
- `profile` — current profile ID
- `language` — UI language
- `confidence_bucket` — current confidence bucket

Note: `explanation.text` is NEVER sent. Only the code.

### addressee_copy_clicked

Fires when user copies all results to clipboard.

Payload:
- `copy_target` — "full" for copy-all action
- `scenario` — current scenario ID
- `profile` — current profile ID
- `language` — UI language
- `confidence_bucket` — current confidence bucket

Note: The copied text content is NEVER sent.

### addressee_export_clicked

Fires on any export action (DOCX, TXT, HTML, CSV).

Payload:
- `export_type` — "docx" | "txt" | "html" | "csv"
- `scenario` — current scenario ID
- `profile` — current profile ID
- `language` — UI language
- `confidence_bucket` — current confidence bucket
- `warnings_count` — number of warnings in result

Note: The exported document content is NEVER sent.

### addressee_csv_import_started

Fires when user pastes CSV data or uploads a CSV file.

Payload:
- `language` — UI language

Note: Raw CSV content is NEVER sent.

### addressee_csv_import_completed

Fires after CSV is successfully parsed and processed.

Payload:
- `csv_rows_bucket` — "empty" | "small" (<=5) | "medium" (<=20) | "large" (>20)
- `language` — UI language

Note: Row data, names, organizations are NEVER sent.

### addressee_preset_action

Fires on save/apply/delete of any preset.

Payload:
- `preset_type` — "recipient" | "sender"
- `preset_action` — "save" | "apply" | "delete"
- `scenario` — current scenario ID
- `profile` — current profile ID
- `language` — UI language

Note: Preset label and preset data are NEVER sent.

### addressee_premium_intent

Fires when user hits a soft limit or shows premium-level engagement.

Payload:
- `plan_context` — always "addressee_generator"
- `action` — one of:
  - `preset_limit_interest` — user hit a hard preset limit (legacy, from Phase 7)
  - `preset_limit_reached` — user tried to save but hit the hard limit
  - `preset_limit_close` — user approaching preset limit (2 slots left)
  - `bulk_approaching_limit` — user processing 40+ rows in CSV bulk
  - `docx_export_interest` — user exports DOCX format

Note: No payment UI is shown. This is only the analytics signal.

### addressee_premium_intent — detailed variants

#### trackAddresseePresetLimitReached

Fires when user hits a hard preset limit.

Payload:
- `preset_type` — "recipient" | "sender"
- `preset_limit` — the limit value (10 for recipients, 5 for senders)
- `language` — UI language

#### trackAddresseeBulkApproachingLimit

Fires when CSV bulk import has >= 40 rows (approaching 50-row limit).

Payload:
- `bulk_row_count` — actual row count
- `bulk_row_limit` — limit value (50)
- `ratio` — percentage of limit used
- `language` — UI language

#### trackAddresseeExportFormatInterest

Fires when user clicks DOCX export.

Payload:
- `export_type` — "docx"
- `language` — UI language

## What Is NOT Tracked

The following are explicitly blocked by `FORBIDDEN_KEYS` and `PRESET_LABEL_KEYS`/`PRESET_DATA_KEYS` in `buildAddresseeAnalyticsPayload`:

- `fullName` / `senderFullName` — any person names
- `position` / `senderPosition` — job titles
- `organization` / `senderOrganization` — company names
- `recipientDativeName` / `senderGenitiveName` — manual case forms
- `documentText` / `blocks` / `result` — generated output
- `warnings` array messages — warning text
- `explanations` text — explanation content
- CSV raw rows and cell data
- Preset labels and data contents
- Any other PII or document content

## Privacy Rules

1. No personal data in analytics payload
2. No generated content in analytics payload
3. Warning codes allowed; warning messages forbidden
4. Explanation codes allowed; explanation text forbidden
5. CSV row counts bucketed (not raw data)
6. Copy/export targets tracked, not content
7. Preset actions tracked, not preset data
8. `safeEmit` wrapper prevents errors when analytics unavailable

## Helper Functions

### getConfidenceBucket(confidence)

Maps numeric confidence to bucket:
- `>= 0.8` → "high"
- `>= 0.6` and `< 0.8` → "medium"
- `< 0.6` → "low"
- `null/undefined` → "unknown"

### getCsvRowsBucket(rowCount)

Maps row count to bucket:
- `0` → "empty"
- `1-5` → "small"
- `6-20` → "medium"
- `> 20` → "large"

### getWarningCodes(result)

Extracts warning codes safely from formatter result:
- Returns array of string codes
- Filters out falsy values
- Limits to 20 codes

### buildAddresseeAnalyticsPayload(input, result, extra)

Central cleanup function:
- Takes `input` (form), `result` (formatter output), `extra` (call-specific)
- Adds permitted fields from result
- Adds permitted fields from input
- Explicitly deletes all FORBIDDEN_KEYS
- Explicitly deletes preset label/data keys
- Returns clean payload

## Running Checks

```bash
npm run check:addressee:analytics
```

Full check suite:

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
npm run check:addressee:presets
npm run check:addressee:analytics
npm run test
```

## Future Phases

### Phase 10: Payment / Licensing Backend

- Add Cloudflare Worker for payment webhooks
- Add D1 record for premium status
- This is Phase 10 because it requires backend changes

### Phase 11: Pricing Page

- Add `/pricing` route (static, no backend)
- Show feature matrix for Free vs Pro
- Link to payment provider (future)

## Files

- `src/utils/addresseeAnalytics.js` — analytics helper
- `src/pages/AddresseeGenerator.jsx` — event integration
- `src/utils/analytics.js` — existing analytics service
- `scripts/check-addressee-analytics.cjs` — validation script