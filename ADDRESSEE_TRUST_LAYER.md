# ADDRESSEE TRUST LAYER

Дата: 2026-05-10

Контекст: Phase 4 для QSEN Addressee. Задача шага — показать пользователю уверенность результата, предупреждения и объяснения без полного UI redesign и без изменения formatter/export contracts.

## 1. Зачем добавлен Trust Layer

QSEN Addressee не обещает магически идеальную морфологию. Продуктовая ставка — standards-first, rule-based, private и честный уровень уверенности.

Trust Layer нужен, чтобы пользователь видел:

- насколько результат выглядит надежным;
- где возможна ошибка;
- какие поля стоит проверить вручную;
- почему использован дательный или родительный падеж;
- что ручная падежная форма действительно была применена.

Это повышает доверие и готовит будущую monetization value: premium presets, reviewed profiles, DOCX/batch flows and saved addressees become easier to justify when the user already sees why the tool is careful.

## 2. Данные из formatter

UI использует enhanced contract, добавленный в Phase 3:

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

Legacy block keys остаются основными для текущего UI, copy, CSV, TXT, HTML and DOCX exports.

## 3. Confidence

Trust Layer показывает compact confidence summary:

| `confidenceLabel` | RU meaning | UI intent |
|---|---|---|
| `high` | Высокая уверенность | Data looks complete, but official documents still need review. |
| `medium` | Средняя уверенность | There are ambiguous details; warnings should be checked. |
| `low` | Нужна ручная проверка | Use as draft and verify forms manually. |

The numeric score is still shown as percentage, but the human label is now primary.

## 4. Warnings

Warnings use the enriched contract:

```js
{
  code,
  severity,
  field,
  message,
  suggestion
}
```

The UI shows:

- severity badge;
- human-readable field label;
- warning message;
- localized suggestion if available, otherwise `warning.suggestion`.

Technical field names such as `recipient.fullName` are not shown directly. They pass through `getAddresseeFieldLabel()`.

The old warnings block was replaced by the Trust Layer warnings panel, so the same warning is not displayed twice.

## 5. Manual Review

If `manualReviewRequired` is true, the UI shows a compact "Check before use" notice.

The list is built with `buildManualReviewItems(result, t)` and deduplicates fields/reasons so it does not repeat the full warnings panel.

Examples:

- recipient full name: name form may be ambiguous;
- recipient position: position wording needs review;
- document type: document draft should be reviewed before sending.

## 6. Explanations

The explanations panel uses:

```js
{
  code,
  title,
  text,
  relatedField
}
```

Current examples:

- `RECIPIENT_DATIVE_USED`
- `SENDER_GENITIVE_USED`
- `MANUAL_RECIPIENT_CASE_USED`
- `MANUAL_SENDER_CASE_USED`
- `UNKNOWN_POSITION_REVIEW`
- `RISKY_NAME_REVIEW`
- `UNKNOWN_GENDER_REVIEW`

Explanations are rendered as compact expandable cards. The text comes from formatter output and must not include submitted personal data.

## 7. EN Caution

EN route remains available, but this phase does not make EN a true standards mode.

EN labels are generic and honest:

- RU profiles are labeled as Russian profiles.
- EN future profiles are not displayed as active modes.
- The UI does not promise an EN standards engine.

Real EN support still needs separate business letter and memo logic.

## 8. Data Safety

Do not track or expose:

- submitted full names;
- organizations;
- sender data;
- generated document text;
- manual case values;
- explanation text containing personal data.

Analytics can later track events such as `explanation_opened` or `warning_shown`, but only with codes/labels, never raw user input.

## 9. Files

Added:

- `src/utils/addresseeTrustUi.js`
- `scripts/check-addressee-trust-layer.js`
- `ADDRESSEE_TRUST_LAYER.md`

Changed:

- `src/pages/AddresseeGenerator.jsx`
- `src/pages/AddresseeGenerator.css`
- `src/locales/ru.json`
- `src/locales/en.json`
- `package.json`

## 10. Checks

Required:

```bash
npm run check:addressee
npm run check:addressee:csv
npm run check:addressee:docx
npm run check:addressee:integration
npm run check:addressee:export-quality
npm run check:addressee:prerender
npm run check:addressee:profile-adapter
npm run check:addressee:trust-layer
```

Recommended:

```bash
npm run test
npm run build
```

If `npm run build` changes generated sitemap `lastmod` values as a mechanical side effect, do not keep that diff unless the task is specifically about SEO publishing output.

## 11. Later

Not done in this phase:

- scenario-first selector;
- analytics events;
- premium limits;
- saved presets;
- backend/licensing;
- EN standards logic;
- full UI redesign.

Recommended next phase: Phase 5 scenario-first UX, using existing `scenario` metadata without changing routes or formatter contracts.
