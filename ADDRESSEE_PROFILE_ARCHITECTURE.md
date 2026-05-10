# ADDRESSEE PROFILE ARCHITECTURE

Дата: 2026-05-10

Контекст: Phase 3 для QSEN Addressee. Цель шага — добавить adapter-first слой profile/scenario без UI redesign, backend, оплаты, AI API и без ломки legacy formatter/export contract.

## 1. Добавленные файлы

| File | Purpose |
|---|---|
| `src/utils/addresseeProfiles.js` | Registry профилей, сценариев и mapper между `documentTemplate` и `scenario`. |
| `src/utils/addresseeAdapter.js` | Normalized input adapter, legacy input builder, enhanced result builder, warning enrichment, explanations и `confidenceLabel`. |
| `scripts/check-addressee-profile-adapter.js` | Compatibility/golden check для profile/scenario adapter layer. |
| `ADDRESSEE_PROFILE_ARCHITECTURE.md` | Документация текущего архитектурного слоя. |

Изменены минимально:

- `src/utils/addresseeFormatter.js` — `formatAddressee(input)` теперь нормализует input перед legacy-ядром и обогащает result после него.
- `package.json` — добавлен script `check:addressee:profile-adapter`.

## 2. Profile

`profile` описывает стандарт форматирования, а не UI-режим.

Текущие profile ids:

- `RU_OFFICIAL_STANDARD`
- `RU_SIMPLE_BUSINESS`
- `EN_BUSINESS_LETTER`
- `EN_INTERNAL_MEMO`

`RU_OFFICIAL_STANDARD`:

- language: `ru`
- recipientNameCase: `dative`
- senderNameCase: `genitive`
- requirePatronymic: `true`
- warning policy: conservative name cases, unknown position warning, abbreviated organization warning
- docxTemplate: `ru-official-basic`

`RU_SIMPLE_BUSINESS`:

- language: `ru`
- recipientNameCase: `dative`
- senderNameCase: `genitive`
- requirePatronymic: `false`
- warnings are softer, but safety warnings remain enabled
- docxTemplate: `ru-business-basic`

EN profiles:

- `status: 'future'`
- `enabled: false`
- reason: `EN mode requires separate business letter/memo logic and must not reuse RU case rules.`

Important: EN profiles are declared only as future architecture anchors. They must not be exposed as a complete working mode until EN business-letter and memo logic is implemented separately.

## 3. Scenario

`scenario` describes the user's job-to-be-done and maps to the existing `documentTemplate` contract.

Current scenario ids:

- `application`
- `complaint`
- `request`
- `memo`
- `businessLetter`
- `custom`
- `applicationDirector`
- `csvBulk`
- `enBusinessLetter`
- `enInternalMemo`

Current mapping:

| Scenario | Profile | Legacy `documentTemplate` |
|---|---|---|
| `application` | `RU_OFFICIAL_STANDARD` | `application` |
| `complaint` | `RU_OFFICIAL_STANDARD` | `complaint` |
| `request` | `RU_OFFICIAL_STANDARD` | `request` |
| `memo` | `RU_OFFICIAL_STANDARD` | `memo` |
| `businessLetter` | `RU_SIMPLE_BUSINESS` | `businessLetter` |
| `custom` | `RU_SIMPLE_BUSINESS` | `businessLetter` |
| `applicationDirector` | `RU_OFFICIAL_STANDARD` | `application` |
| `csvBulk` | `RU_SIMPLE_BUSINESS` | `businessLetter` |
| `enBusinessLetter` | `EN_BUSINESS_LETTER` | `businessLetter` |
| `enInternalMemo` | `EN_INTERNAL_MEMO` | `memo` |

Unknown scenario falls back to `custom`.

Missing `documentTemplate` maps to `businessLetter`, matching legacy behavior.

Unknown `documentTemplate` maps to `custom`, but the original `documentTemplate` value is preserved in normalized input so legacy formatter can keep its current fallback behavior.

## 4. Normalized Input

New normalized input shape:

```js
{
  profile,
  scenario,
  recipient: {
    fullName,
    position,
    organization,
    gender
  },
  sender: {
    fullName,
    position,
    organization
  },
  manualCases: {
    recipientDativeName,
    senderGenitiveName
  },
  format: {
    greetingMode,
    punctuation,
    documentTemplate
  },
  exportOptions: {
    includeWarnings
  }
}
```

The adapter accepts:

- current flat UI input;
- nested future input;
- CSV row-like input with `data`;
- optional `profile`;
- optional `scenario`.

The formatter still receives a legacy flat input through `buildLegacyInputFromNormalized(normalizedInput)`.

## 5. Legacy Compatibility

`formatAddressee(input)` must continue returning these legacy fields:

```js
{
  blocks: {
    to,
    from,
    greeting,
    letter,
    documentText
  },
  warnings,
  confidence,
  manualReviewRequired,
  parsedName
}
```

These keys are used by current UI, CSV export, DOCX export, integration checks and prerender-related expectations. They are not optional.

Do not remove or rename:

- `blocks.to`
- `blocks.from`
- `blocks.greeting`
- `blocks.letter`
- `blocks.documentText`
- `warnings`
- `confidence`
- `manualReviewRequired`
- `parsedName`

Confidence remains numeric and uses the existing values:

- `0.95`
- `0.75`
- `0.55`

`manualReviewRequired` remains derived from `confidence < 0.8`.

## 6. Enhanced Result

The formatter now also returns:

```js
{
  profile,
  scenario,
  blocks: {
    to,
    from,
    greeting,
    letter,
    documentText,
    toBlock,
    fromBlock,
    salutation,
    documentHeader,
    fullPreview
  },
  warnings,
  explanations,
  confidence,
  confidenceLabel,
  manualReviewRequired,
  parsedName,
  exportData
}
```

Alias mapping:

- `toBlock = blocks.to`
- `fromBlock = blocks.from`
- `salutation = blocks.greeting`
- `documentHeader = blocks.letter`
- `fullPreview = blocks.documentText`

`confidenceLabel` mapping:

- `high` for `confidence >= 0.8`
- `medium` for `confidence >= 0.6 && confidence < 0.8`
- `low` for `confidence < 0.6`

## 7. Warning Contract

Legacy warnings keep:

```js
{
  code,
  message
}
```

New enriched warning contract:

```js
{
  code,
  severity,
  field,
  message,
  suggestion
}
```

Fallbacks:

- `severity: 'warning'`
- `field: 'general'`
- `suggestion: null`

Existing UI can continue displaying `warning.message`.

Existing warning codes remain unchanged and must not be renamed without a migration.

## 8. Explanation Contract

New explanations are internal trust-layer data for a future UI panel.

Contract:

```js
{
  code,
  title,
  text,
  relatedField
}
```

Current explanation codes:

- `RECIPIENT_DATIVE_USED`
- `SENDER_GENITIVE_USED`
- `MANUAL_RECIPIENT_CASE_USED`
- `MANUAL_SENDER_CASE_USED`
- `UNKNOWN_POSITION_REVIEW`
- `RISKY_NAME_REVIEW`
- `UNKNOWN_GENDER_REVIEW`

Rules:

- Do not include user personal data in explanation text.
- RU explanations are generated only for RU profiles.
- EN explanations should not be generated until EN profiles become real working modes.

## 9. How To Add A Scenario

1. Add an id to `SCENARIO_IDS`.
2. Add an item to `ADDRESSEE_SCENARIOS`.
3. Point it to an existing or new profile.
4. Map it to an existing `documentTemplate` unless a formatter change is intentionally planned.
5. If it corresponds to an existing template, update `mapDocumentTemplateToScenario`.
6. Add profile-adapter checks for scenario resolution.
7. Add formatter golden cases only if output strings are expected to differ.

Do not change UI routing or SEO routes as part of adding a pure internal scenario.

## 10. How To Add A Profile

1. Add an id to `PROFILE_IDS`.
2. Add an object to `ADDRESSEE_PROFILES`.
3. Define `language`, `enabled`, `status`, `casePolicy`, `warningPolicy`, and `exportDefaults`.
4. Add or update scenarios that point to the profile.
5. Add adapter tests proving fallback behavior and legacy contract stability.
6. Only then change formatter behavior if the profile needs output differences.

For EN profiles, do not reuse RU case rules as a shortcut. EN needs separate address/salutation/header logic.

## 11. Tests To Run After Changes

Required checks:

```bash
npm run check:addressee
npm run check:addressee:csv
npm run check:addressee:docx
npm run check:addressee:integration
npm run check:addressee:export-quality
npm run check:addressee:prerender
npm run check:addressee:profile-adapter
```

Recommended broader checks:

```bash
npm run test
npm run build
```

Before changing behavior, add or update golden checks for:

- legacy result shape;
- block aliases;
- warning code/message preservation;
- warning metadata;
- confidence numeric values;
- `confidenceLabel`;
- explanations;
- CSV export;
- DOCX export;
- prerender content.

## 12. Current Non-Goals

This layer does not implement:

- UI redesign;
- explanation panel UI;
- premium limits;
- account system;
- backend;
- payment;
- AI API;
- real EN business-letter mode;
- route changes;
- article publishing changes.

The next safe phase is Trust Layer / explanation panel, because the formatter now emits `warnings[]`, `confidenceLabel` and `explanations[]` without breaking old consumers.
