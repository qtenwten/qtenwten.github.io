# Addressee Local Presets — Phase 6

## Overview

Local presets allow users to save recipient and sender data directly in the browser and re-apply it without re-typing. All data stays on the client; no account, backend, or cloud sync is required.

## What Is Saved

### Recipient Preset

- `fullName` — recipient's full name
- `position` — job title
- `organization` — company/organization name
- `gender` — male / female / unknown
- `recipientDativeName` — manually entered dative (case) form

### Sender Preset

- `senderFullName` — sender's full name
- `senderPosition` — job title
- `senderOrganization` — company/organization name
- `senderGenitiveName` — manually entered genitive (case) form

## What Is NOT Saved

- Generated blocks / documentText
- Warnings and explanations
- Confidence score
- CSV rows / bulk results
- Scenario / profile / documentTemplate selections
- Any result fields produced by the formatter

## Storage

- Browser `localStorage` only
- Key: `qsen_addr_presets`
- Version: `1`
- Structure:

```json
{
  "version": 1,
  "recipients": [{ "id", "label", "createdAt", "updatedAt", "data": {...} }],
  "senders": [{ "id", "label", "createdAt", "updatedAt", "data": {...} }]
}
```

## Why No Backend / Account / Cloud Sync

Phase 6 scope is deliberately limited:
- No backend infrastructure to maintain
- No authentication or account system needed
- No data privacy concerns (data never leaves the device)
- User remains in full control of their saved data
-符合渐进式功能路线图的 MVP 策略

## Privacy Rules

- No preset data is sent to analytics
- No full names or organizations logged to console in production
- No Sentry breadcrumbs containing preset content
- No personal data in error tracking payloads

## Soft Limits

- Maximum 10 recipient presets
- Maximum 5 sender presets

When a limit is reached, the user receives a friendly message. Old presets must be deleted before new ones can be saved.

## Applying Presets

Applying a recipient or sender preset:

1. Loads the saved data into the corresponding form fields
2. Preserves the current `scenario`, `profile`, and `documentTemplate` selections
3. Does NOT reset the greeting mode or punctuation settings
4. Overwrites only the saved fields; manual case forms (`recipientDativeName`, `senderGenitiveName`) are also restored if they were saved

## Manual Case Forms

`recipientDativeName` and `senderGenitiveName` are stored as part of the preset when the user manually enters them before saving. These are restored correctly when the preset is applied.

## Running Checks

```bash
npm run check:addressee:presets
```

Individual checks:

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
npm run test
```

Full build:

```bash
npm run build
```

## Future Monetization Options

These features are intentionally excluded from Phase 6 but are viable future additions:

1. **More presets** — increase soft limits for paying users
2. **Preset import/export** — JSON file download/upload for backup and sharing
3. **Team presets** — share preset collections across an organization (requires auth + backend)
4. **Cloud sync** — cross-device preset synchronization (requires auth + backend)
5. **Branded template packs** — organization-specific preset collections with logo and style
6. **Batch presets** — save multiple recipient variants for mass-mailing workflows

## Files

- `src/utils/addresseePresets.js` — preset storage logic
- `src/pages/AddresseeGenerator.jsx` — preset UI integration
- `src/pages/AddresseeGenerator.css` — preset component styles
- `src/locales/ru.json` — RU locale keys
- `src/locales/en.json` — EN locale keys
- `scripts/check-addressee-presets.cjs` — preset validation script