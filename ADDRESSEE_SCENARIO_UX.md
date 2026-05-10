# ADDRESSEE SCENARIO UX

Date: 2026-05-10

Context: Phase 5 for QSEN Addressee. This step adds a scenario-first entry point to the existing generator without changing routes, SEO, backend, payment, AI, formatter contracts, CSV/DOCX contracts, or article publishing workflow.

## 1. Why Scenario-First UX

The previous UI started from fields and settings. That worked technically, but users had to translate their real task into a document template themselves.

Scenario-first UX makes the first decision product-shaped:

- application;
- application to director;
- memo;
- complaint;
- request;
- business-style letter;
- custom document;
- CSV / multiple addressees.

The selector does not replace the form. It sets `scenario`, `profile`, and legacy `documentTemplate`, then keeps all existing fields and exports working.

## 2. Visible Scenarios

| Scenario | Profile | Legacy `documentTemplate` | Notes |
|---|---|---|---|
| `application` | `RU_OFFICIAL_STANDARD` | `application` | Standard Russian application flow. |
| `applicationDirector` | `RU_OFFICIAL_STANDARD` | `application` | Common school/organization director use case. |
| `memo` | `RU_OFFICIAL_STANDARD` | `memo` | Internal Russian service memo. |
| `complaint` | `RU_OFFICIAL_STANDARD` | `complaint` | Formal complaint draft, review required. |
| `request` | `RU_OFFICIAL_STANDARD` | `request` | Formal request to organization or official. |
| `businessLetter` | `RU_SIMPLE_BUSINESS` | `businessLetter` | Softer Russian business style. |
| `custom` | `RU_SIMPLE_BUSINESS` | `businessLetter` by default | Flexible mode; advanced template selector remains available. |
| `csvBulk` | `RU_SIMPLE_BUSINESS` | `businessLetter` | Highlights the CSV section but does not hide single generation. |

Future EN scenarios from `addresseeProfiles.js` are not displayed. EN route copy is honest: these are Russian-document scenarios, not a finished English standards mode.

## 3. Files Added

| File | Purpose |
|---|---|
| `src/utils/addresseeScenarioUi.js` | React-free helper for scenario options, query params, default scenario, input application, and bulk detection. |
| `scripts/check-addressee-scenario-ux.js` | Source and contract checks for the scenario-first UX. |
| `ADDRESSEE_SCENARIO_UX.md` | This architecture note. |

## 4. Files Changed

- `src/pages/AddresseeGenerator.jsx`
- `src/pages/AddresseeGenerator.css`
- `src/locales/ru.json`
- `src/locales/en.json`
- `package.json`

## 5. Mapping Rules

`applyScenarioToInput(input, scenarioId)` returns a new input object and never mutates the old one.

It sets:

- `scenario`
- `profile`
- `documentTemplate`
- default `greetingMode` when it is missing

It preserves already entered names, positions, organizations, sender fields, manual case overrides, punctuation, and other existing form values.

The advanced `documentTemplate` selector remains visible. When changed manually, it syncs the scenario through `mapDocumentTemplateToScenario()`. Unknown templates become `custom`, while the chosen legacy template value is preserved.

## 6. Query Params

The existing route can read initial query params:

- `?scenario=application`
- `?scenario=application-director`
- `?scenario=memo`
- `?scenario=complaint`
- `?scenario=request`
- `?scenario=business-letter`
- `?scenario=csv-bulk`
- `?focus=to`
- `?focus=from`
- `?focus=salutation`
- `?export=docx`

These parameters only affect initial UI state:

- scenario selects the starting scenario;
- focus shows a small hint and highlights the related form section;
- `export=docx` shows a hint only and never starts automatic export;
- `csv-bulk` highlights the CSV section.

No routes, canonical URLs, hreflang, sitemap, or article CTA workflow were changed.

## 7. Progressive Disclosure

Manual case overrides are now grouped under “Advanced case overrides” / “Ручная проверка падежей”.

The fields are still present and keyboard-accessible. They are only moved into a `details` block to reduce first-screen overload.

CSV remains a secondary section below the single generator. The `csvBulk` scenario highlights it but does not remove the normal form.

## 8. Legacy Compatibility

The following contracts remain unchanged:

- `formatAddressee(input)` accepts flat legacy input.
- `blocks.to`, `blocks.from`, `blocks.greeting`, `blocks.letter`, `blocks.documentText` remain the primary output keys.
- CSV import/export continues to use existing columns.
- DOCX export continues to consume the existing result contract.
- Trust Layer still reads `profile`, `scenario`, `confidenceLabel`, warnings, and explanations from formatter output.

## 9. Checks

Run:

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
```

Recommended before release-like handoff:

```bash
npm run test
npm run build
```

If build updates generated sitemap `lastmod` values mechanically, do not keep that diff unless the task is explicitly about publishing output.

## 10. Not Changed

- No route registry changes.
- No route SEO/canonical/hreflang/sitemap changes.
- No article publishing workflow changes.
- No backend.
- No payment or premium gating.
- No AI API.
- No real EN standards mode.
- No formatter rewrite.

## 11. Later

Good next candidates:

- mobile visual QA for the scenario grid and `details` block;
- article CTA query params after funnel support is designed;
- local presets for frequent recipients/senders;
- analytics events for `scenario_selected`, `addressee_generated`, export and copy actions without personal data.
