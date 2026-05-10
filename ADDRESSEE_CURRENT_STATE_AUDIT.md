# ADDRESSEE CURRENT STATE AUDIT

Дата аудита: 2026-05-10  
Контекст: Utility Tools Site / QSEN  
Предыдущий документ: `ADDRESSEE_PRODUCT_PRD.md`

## 1. Executive Summary

Текущий "Генератор адресата и обращения" уже не выглядит как черновой прототип. В нём есть рабочее ядро, которое можно доводить до платного RU-first микропродукта: генерация блоков "Кому" и "От кого", обращение, дательный/родительный падежи для части русских ФИО, словарь должностей, warnings, confidence, manual overrides, CSV import/export, DOCX export, SEO/prerender и article funnel.

Что реализовано хорошо:

- `formatAddressee()` возвращает стабильный результат с `blocks`, `warnings`, `confidence`, `manualReviewRequired`.
- Есть консервативная модель доверия: рискованные ФИО чаще сохраняются как есть и получают warning.
- Есть проверочные скрипты для formatter, integration, CSV, DOCX, export quality и prerender.
- Есть отдельные helper-файлы для CSV/DOCX/export, то есть не всё зашито в React-компонент.
- Есть route/SEO/prerender интеграция для `/generator-adresata`.

Что мешает превратить инструмент в платный продукт:

- Нет явных `profile` и `scenario`; вместо них используется `documentTemplate`, примеры и текстовые шаблоны.
- Formatter смешивает нормализацию, падежи, сборку блоков, документные шаблоны, warnings и confidence.
- Result contract сейчас завязан на старые ключи `to`, `from`, `greeting`, `letter`, `documentText`, а не на продуктовые сущности `toBlock`, `fromBlock`, `salutation`, `documentHeader`, `fullPreview`.
- Warning contract слишком тонкий: только `code` и `message`, без `severity`, `field`, `suggestion`.
- Нет `explanations`, хотя продуктовая стратегия требует объяснять "почему так".
- EN-интерфейс существует, но core-логика и document templates фактически RU-first и русскоязычные.
- Нет local presets и scenario-first flow.
- Аналитика для Addressee почти отсутствует; copy-аналитика через `CopyButton` выглядит нерабочей из-за несовпадения export API.

Части, которые нельзя ломать:

- Публичный route `/ru/generator-adresata/` и `/en/generator-adresata/`.
- Result shape, который используют UI, CSV, DOCX и проверки: `blocks.to`, `blocks.from`, `blocks.greeting`, `blocks.letter`, `blocks.documentText`.
- Warning codes из `addresseeTypes.js`.
- Confidence thresholds `0.95`, `0.75`, `0.55` до появления совместимого adapter layer.
- CSV columns, включая `recipientDativeName` и `senderGenitiveName`.
- DOCX export, который сейчас использует effective overrides.
- Prerender content для Addressee в `scripts/generate-pages.js`.
- Sitemap/SEO route consistency.

Самые большие риски перед рефактором:

- Сломать падежи и warning behavior при выделении профилей.
- Сломать CSV из-за расхождения колонок и duplicated constants.
- Сломать DOCX/export из-за переименования block keys.
- Сломать prerender/SEO за счёт route или copy changes.
- Слишком рано добавить EN-профиль поверх RU-логики и закрепить неправильный контракт.

Текущая проверочная база:

| Script | Result |
|---|---:|
| `npm run check:addressee` | pass, 614/614 |
| `npm run check:addressee:csv` | pass, 52/52 |
| `npm run check:addressee:docx` | pass, 14/14 |
| `npm run check:addressee:integration` | pass, 338/338 |
| `npm run check:addressee:export-quality` | pass, 223/223 |
| `npm run check:addressee:prerender` | pass |

---

## 2. Current Feature Map

| Capability | Where Implemented | Maturity | Limitations | Preserve During Refactor |
|---|---|---|---|---|
| "Кому" block | `buildToBlock()` in `addresseeFormatter.js`; rendered in `AddresseeGenerator.jsx` | stable | RU-only logic; organization not declined; position dictionary finite; output key is `blocks.to` | Existing `blocks.to` output and warning behavior |
| "От кого" block | `buildFromBlock()` in `addresseeFormatter.js`; sender fields in UI | stable | Sender position/organization are not deeply normalized; genitive only for full Russian FIO; output key is `blocks.from` | Existing genitive behavior, no duplicated `от` |
| Salutation | `buildGreeting()` in `addresseeFormatter.js` | stable | Limited modes: name+patronymic, full name, colleagues; no scenario/profile salutation policy | Existing greeting strings and punctuation |
| Addressee types | Not explicit; implied by `documentTemplate`, `gender`, `greetingMode`, examples | unclear | No `person`, `organization`, `department`, `official`, `schoolDirector`, etc. | Avoid breaking existing templates while adding scenarios |
| Name cases | `addresseeNameCases.js`, called by formatter | partial | Rule/dictionary based; not full morphology; only dative/genitive; sensitive to unknown gender | Conservative warning-first behavior |
| Position cases | `POSITION_DICTIONARY` in `addresseeTypes.js`; `declinePosition()` | partial | Exact lower-case match after trim; unknown positions preserved with warning; no phrase parser | Known dictionary outputs and `UNKNOWN_POSITION` |
| Organizations | `isAbbreviatedOrganization()`, `expandIPOrganization()` | fragile | Abbreviations detected by regex; exact `ИП` expanded only when value is exactly `ИП`; no legal-name validation | Existing abbreviation warning and no hard promises |
| Manual overrides | `recipientDativeName`, `senderGenitiveName`; `resultOverrides` for output cards | stable | Case override fields are input-level; output card overrides are UI-only and not reflected back into formatter state | Both manual case fields and output override behavior |
| Warnings | `WARNING_CODES` and `warnings[]` from formatter/block builders | stable but thin | Warning has only `{ code, message }`; no severity/field/suggestion; some warnings generated in multiple layers | Code enum and localized display |
| Confidence | Numeric `0.95`, `0.75`, `0.55`; UI maps to high/medium/low | stable but coarse | No per-block confidence; `manualReviewRequired` is `confidence < 0.8`; manual case warnings do not reduce confidence | Numeric value until adapter exists |
| CSV import | `parseCsvText()` in `addresseeCsv.js`; UI paste/upload | stable | Hand-rolled parser; rejects multiline quoted fields; max 50 rows; duplicated valid type lists | Columns, BOM, row validation, row preview |
| CSV export | `buildSingleCsvExport()` in `addresseeExport.js`; `buildBulkCsvExport()` in `addresseeCsv.js` and duplicate in `addresseeExport.js` | stable but duplicated | Exports warning codes, not messages; no profile/scenario fields; duplicate helper names | Existing headers and Excel-friendly BOM |
| DOCX export | `addresseeDocxExport.js`; UI `handleExportDocx()` | partial/stable | Single document only; simple formatting; no branded templates; warnings included but no confidence/profile metadata | `downloadAddresseeDocx(resultForExport, { t })` contract |
| Copy/export actions | `handleCopyAll`, `CopyButton`, TXT/HTML/CSV/DOCX handlers | partial | Copy-all has no analytics; `CopyButton` analytics import likely broken; no loading state for DOCX | Copy behavior and effective overrides |
| Local storage | No Addressee-specific localStorage found | missing | No saved presets; no restore; no versioned storage | Absence means presets can be added cleanly later |
| Analytics | CopyButton prop in Addressee; generic analytics service | fragile | No Addressee generate/export events; `CopyButton` imports missing named `trackLinkCopied` | Do not track personal data |
| SEO route | `routeRegistry.js`, `routeSeo.js`, `generate-pages.js` | stable | Static SEO duplicated across config/build/locales; no scenario landing params | Route path, canonical, hreflang, sitemap |
| Article funnel | `articleFunnel.js`, article drafts, prerender article links | partial | Generic `tool_slug -> route`; no scenario CTA support; query params in `tool_slug` would not match registry | Existing `tool_slug: generator-adresata` behavior |

---

## 3. Data Model Audit

### Current Input Model

The main UI form state in `AddresseeGenerator.jsx` contains:

```js
{
  fullName,
  position,
  organization,
  gender,
  greetingMode,
  punctuation,
  documentTemplate,
  senderFullName,
  senderPosition,
  senderOrganization,
  recipientDativeName,
  senderGenitiveName
}
```

Recipient fields:

- `fullName`
- `position`
- `organization`
- `gender`
- `recipientDativeName`

Sender fields:

- `senderFullName`
- `senderPosition`
- `senderOrganization`
- `senderGenitiveName`

Settings fields:

- `greetingMode`
- `punctuation`
- `documentTemplate`

### Current Result Model

`formatAddressee(input)` returns:

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

Warnings are currently:

```js
{
  code,
  message
}
```

Confidence is currently:

- starts at `0.95`;
- becomes `0.55` if `INCOMPLETE_NAME` exists;
- becomes `0.75` for soft warnings like unknown gender, unknown position, Latin name, initials, hyphenated name, uncertain name case;
- `manualReviewRequired = confidence < 0.8`.

### UI-Only State

The React component also owns state that is not part of formatter input:

- `result`
- `activeExampleKey`
- `copyAllState`
- `bulkInput`
- `fullNameError`
- `statusMessage`
- `bulkResults`
- `bulkError`
- `bulkSummary`
- `resultOverrides`
- `editingBlock`
- `editDraft`

This is acceptable for current UI, but important for refactor: formatter state and presentation/editing state are mixed inside one component.

### Implicit State and Hidden Contracts

Implicit contracts:

- Block keys are string keys: `to`, `from`, `greeting`, `letter`, `documentText`.
- Editable block keys are hardcoded in UI: `to`, `from`, `greeting`, `documentText`.
- CSV headers are manually duplicated between helpers.
- CSV max rows is passed as `{ maxRows: 50 }` in UI.
- Confidence thresholds are duplicated in formatter logic and UI label mapping.
- Document template names are string constants but also repeated in `addresseeCsv.js` validation arrays.
- Document titles and body placeholders are hardcoded in Russian inside `addresseeFormatter.js`.
- Structured data URL is hardcoded with `https://qsen.ru/${language}/generator-adresata`.

### Mixing Issues

There is no dangerous direct mixing of React UI state into formatter internals, but there is architectural mixing at module level:

- `addresseeFormatter.js` contains both business logic and document template content.
- `AddresseeGenerator.jsx` contains input form, validation, bulk processing, exports, editing, status, structured data and content sections.
- `addresseeCsv.js` duplicates domain constants from `addresseeTypes.js`.

### RU/EN Readiness

RU logic is deeply embedded:

- case names are Russian-specific;
- document labels are Russian: `Кому:`, `От кого:`, `Дата`, `Подпись`;
- document template bodies are Russian;
- salutation words are Russian;
- confidence rules assume Russian FIO structure.

This is fine for RU-first, but EN should be introduced through separate profiles rather than conditional tweaks in the current functions.

### Can Profile/Scenario Be Added Safely?

Yes, if added through an adapter layer:

1. Keep current `formatAddressee(input)` output stable.
2. Add normalization helpers that accept optional `profile` and `scenario`.
3. Add internal `formatAddresseeWithProfile(input, options)` or equivalent, but adapt it back to the legacy result.
4. Move document template rules into profile/scenario config gradually.

No full rewrite is required for Phase 3.

Fields to normalize before paid MVP:

- `profile`
- `scenario`
- `recipient.fullName`, `recipient.position`, `recipient.organization`
- `sender.fullName`, `sender.position`, `sender.organization`
- `manualCases.recipientDativeName`
- `manualCases.senderGenitiveName`
- `format.greetingMode`, `format.punctuation`
- `export.profile`, `export.template`, `export.includeWarnings`

---

## 4. Formatter Architecture Audit

### Current Core Functions

Main orchestration:

- `formatAddressee(input)`

Block builders:

- `buildToBlock(organization, position, fullName, gender, recipientDativeName)`
- `buildFromBlock(senderFullName, senderPosition, senderOrganization, senderGenitiveName)`
- `buildGreeting(parsedName, gender, greetingMode, punctuation, autoDetectedGender)`
- `buildDocumentText({ template, to, from, greeting })`
- `buildDocumentDraft(...)`

Name parsing / risk helpers in formatter:

- `splitFullName()`
- `parseFullName()`
- `hasInitials()`
- `hasHyphenatedPart()`
- `isFullyLatin()`
- `detectGenderByName()`
- `isPotentiallyUndeclinableSurname()`

Position/organization helpers:

- `declinePosition()`
- `isAbbreviatedOrganization()`
- `expandIPOrganization()`

Confidence/warning responsibilities:

- `formatAddressee()` creates top-level warnings and calculates confidence.
- `buildToBlock()` adds organization/name/position warnings.
- `buildFromBlock()` adds sender name warnings.
- `buildDocumentText()` itself does not emit warnings; sensitive template warning is added later in `formatAddressee()`.

### Mixed Responsibilities

`formatAddressee()` currently does too much:

- validates input completeness;
- detects gender;
- detects risky name patterns;
- builds recipient/sender/greeting/document;
- aggregates warnings;
- applies sensitive template review warning;
- calculates confidence;
- returns result contract.

`addresseeFormatter.js` also mixes:

- Russian language constants;
- document template copy;
- business rule warnings;
- formatter output assembly.

This is manageable today, but it will become risky when profiles and explanations are added.

### Unit Test Needs

Existing tests are strong, but more should be added before profile refactor:

- per-function tests for `buildToBlock`, `buildFromBlock`, `buildGreeting`, `buildDocumentText` if these become exported or moved;
- tests for preserving legacy result shape when profile options are absent;
- tests for future adapter output mapping.

### Golden Snapshot Needs

Golden snapshots should be added for:

- RU official statement to director;
- RU business letter to CEO;
- RU memo to department head;
- risky surname with manual override;
- CSV row with all fields;
- no-sender case;
- unknown gender case;
- EN route current behavior, to prevent accidental misleading changes.

### Refactor Direction

Evolutionary refactor is recommended.

Do not rewrite formatter from scratch. First introduce a small profile/scenario adapter and keep legacy outputs. Then extract document templates and warning/explanation builders.

Recommended sequence:

1. Extract input normalization.
2. Extract profile/scenario constants.
3. Add profile-aware document template selection.
4. Keep `formatAddressee()` as public compatibility wrapper.
5. Add `explanations` internally, but do not force UI consumption immediately.

---

## 5. Name Cases / Morphology Audit

### Covered Today

`addresseeNameCases.js` covers:

- dative and genitive only;
- basic male surnames ending in `-ов`, `-ев`, `-ёв`, `-ин`, `-ын`;
- male adjectives/soft endings like `-ский`, `-ской`, `-ий`, `-ой`;
- female surnames like `-ова`, `-ева`, `-ина`, `-ына`, `-ая`, `-ская`;
- common male first names;
- common female first names;
- common patronymics ending in `-ич`, `-на`, plus some `-иевна` / `-ьевна` handling;
- risky markers: initials, hyphenated parts, Latin letters, extra parts, unknown gender, potentially undeclinable surname.

### Dangerous Cases

Cases that should stay warning-first:

- initials: `Иванов И. И.`, `Иванов И.П.`;
- hyphenated names or surnames: `Анна-Мария`, `Салтыков-Щедрин`;
- foreign or short surnames: `Ким`, `Ли`, `Пак`, `Цой`;
- mixed alphabets: `Иванов Ivan Петрович`;
- Latin-only names: `John Smith`;
- extra name parts: four or more tokens;
- unknown gender;
- missing patronymic if formal RU mode expects full FIO;
- uncommon first names not in dictionary;
- surnames with particles or spaces: `де Голль`, `Ван Дамм`;
- non-Russian patronymic-like structures.

### Test Cases to Add

Recommended additions:

- Male first names: `Илья`, `Никита`, `Лев`, `Фома`, `Григорий`, `Роман`, `Арсений`.
- Female first names: `Любовь`, `Жанна`, `Инна`, `Гузель`, `Айгуль`, `Эльвира`, `Надежда`.
- Surnames: `Гончар`, `Мельник`, `Бондарь`, `Коваленко`, `Диденко`, `Саакашвили`, `Гурцкая`.
- Compound names: `Иванов-Петров Иван Сергеевич`, `Анна-Мария Петрова`.
- Particles and spaces: `де Голль Шарль`, `Ван Дамм Жан Клод`.
- `ё/е` pairs: `Пётр/Петр`, `Фёдоров/Федоров`, `Семёнов/Семенов`.

### Low Confidence Rules

For product trust, these should remain low or medium confidence:

- any automatic gender detection;
- unknown gender;
- initials;
- Latin/mixed alphabet;
- hyphenated parts;
- extra parts;
- unknown position;
- potentially undeclinable surname;
- any failed `declineRussianFullName()` attempt.

The product should not aim for perfect morphology. The paid value should be safe formatting plus honest warnings, not a false claim of linguistic completeness.

---

## 6. Export Audit

### CSV Import

Current import supports:

- delimiters: semicolon, comma, tab;
- header-based mapping;
- no-header positional rows;
- quoted values;
- escaped quotes;
- aliases like `fio`, `fioadresata`, `dativename`;
- validation for `gender`, `greetingMode`, `punctuation`, `documentTemplate`;
- manual case columns: `recipientDativeName`, `senderGenitiveName`;
- max rows default in UI: 50.

Limitations:

- multiline quoted fields are explicitly unsupported;
- parser is hand-rolled;
- valid type lists duplicate constants from `addresseeTypes.js`;
- row errors are not exported as a detailed report;
- profile/scenario columns do not exist.

### CSV Export

Current export includes:

- input fields;
- sender fields;
- manual case fields;
- generated `to`, `from`, `greeting`, `letter`, `documentText`;
- numeric `confidence`;
- warning codes;
- UTF-8 BOM for Excel.

Fields currently lost or incomplete:

- warning messages;
- warning severity/field/suggestion;
- `manualReviewRequired`;
- `parsedName`;
- future `profile` and `scenario`;
- future explanations;
- source article/scenario context;
- row-level validation summary.

### DOCX Export

Current DOCX export includes:

- document label;
- addressee section;
- sender section;
- greeting section;
- template/document text section;
- warnings section;
- generated filename `addressee-document-YYYY-MM-DD.docx`.

Strength:

- Good premium candidate because it directly saves formatting time.
- Uses `docx` primitives and `Packer.toBlob`.
- Uses effective result with UI overrides.
- Handles multiline sections.

Limitations:

- single document only;
- simple formatting;
- no batch DOCX;
- no branded/unbranded distinction;
- no style profile;
- no option to omit warnings from final client-facing export;
- no confidence/profile/scenario metadata.

### Paid Value Assessment

DOCX as premium:

- Strong premium value if basic copy remains free.
- Best paid features: clean style templates, batch DOCX, branded/unbranded export, optional warning appendix.

CSV/batch as premium:

- Strong Pro value.
- Keep small CSV free to prove utility.
- Larger row limits, row-level warning reports and batch DOCX can be paid.

Branded/unbranded export:

- Good later premium value.
- Do not add branding friction before trust is established.

Formats that should remain free enough:

- copy block;
- copy full preview;
- small CSV/template;
- at least basic TXT/HTML or basic DOCX, depending on monetization decision.

---

## 7. UX State Audit

### Existing States

Current UI states in `AddresseeGenerator.jsx`:

- empty result state;
- required `fullName` validation;
- result generated state;
- status messages in `sr-only` live region;
- examples selection;
- block editing state;
- edited block badge;
- copy-all copied/error state;
- warnings panel;
- manual review notice;
- bulk paste/upload idle state;
- bulk parse error state;
- bulk summary;
- bulk preview table;
- export buttons for CSV/TXT/HTML/DOCX;
- DOCX export error status message.

### Missing or Weak States

Missing:

- scenario-first state;
- profile selector;
- explanation panel;
- saved presets;
- premium limit state;
- import progress/loading;
- DOCX export loading/disabled state while async export is running;
- per-block confidence;
- structured "what to check manually" per warning;
- empty sender guidance beyond hints;
- recovery for clipboard permission failure in copy-all beyond button state;
- source article scenario state from query params.

### User Clarity

The UI already explains inputs and displays results, but it is form-first, not scenario-first. For a paid product, users should not have to infer whether they are preparing a statement, memo, request, complaint or business letter.

Current complexity points:

- many fields are visible at once;
- manual case forms are visible before the user knows they need them;
- bulk CSV is on the same page as single generation;
- result shows five blocks, including `letter` and `documentText`, which can overlap conceptually;
- warnings are visible, but no "why this happened" explanation layer exists.

### Mobile and Layout

CSS includes responsive breakpoints at `1040px`, `768px`, and `420px`.

Positive:

- result cards collapse to one column;
- actions stack;
- bulk table has horizontal scroll;
- buttons use flex/wrapping.

Risks:

- 1047-line CSS is large and tightly tied to current markup;
- many fields and sections can create long mobile scrolling;
- export buttons and result cards may be cognitively dense on small screens;
- no browser screenshot verification was run as part of this audit.

Future UX requirements, without redesign now:

- scenario selector must reduce visible complexity;
- advanced/manual case fields should be progressively disclosed;
- CSV should likely become a secondary mode/tab;
- explanations should be attached to warnings and confidence;
- result hierarchy should separate final copy target from diagnostic blocks.

---

## 8. SEO/Funnel Audit

### Current Route and SEO

Current route:

- `routeRegistry.js`: key `addresseeGenerator`, path `/generator-adresata`, component `AddresseeGenerator`.
- Legacy redirect: `/generator-adresata` -> `/ru/generator-adresata/`.
- `routeSeo.js`: RU and EN title/description/keywords/h1/structured data.
- `generate-pages.js`: custom Addressee prerender content.
- `check-addressee-prerender-content.cjs`: validates RU/EN prerender, canonical, hreflang, related tools, article links.
- `searchIndex.js`: Addressee participates via `ROUTE_REGISTRY` and route SEO.

### Existing Article Cluster

Draft files in `BD/article-drafts/stage-18-addressee/`:

| File | Lang | translation_key | tool_slug | status |
|---|---|---|---|---|
| `kak-napisat-komu-v-zayavlenii.json` | ru | `addressee-to-field-application` | `generator-adresata` | draft |
| `how-to-write-to-field-in-russian-application.json` | en | `addressee-to-field-application` | `generator-adresata` | draft |
| `kak-oformit-ot-kogo-v-zayavlenii.json` | ru | `addressee-from-field-application` | `generator-adresata` | draft |
| `how-to-format-from-field-in-russian-documents.json` | en | `addressee-from-field-application` | `generator-adresata` | draft |
| `obrazets-shapki-zayavleniya.json` | ru | `application-header-example` | `generator-adresata` | draft |
| `russian-application-header-example.json` | en | `application-header-example` | `generator-adresata` | draft |

`reports/seo-content-cluster-plan.json` marks `generator-adresata` as P0 with high monetization potential and notes planned articles for "Кому", "От кого", director salutation, application header, complaint, CSV/bulk and service memo.

### Current Funnel Limitations

`articleFunnel.js` currently maps an article `tool_slug` to a route:

- `tool_slug: "generator-adresata"` -> `/ru/generator-adresata/` or `/en/generator-adresata/`.

It does not support:

- scenario-specific query params;
- field focus like `focus=to`;
- source article metadata in tool open state;
- preserving query params in `tool_slug`.

Important detail: if `tool_slug` were changed to include a query string, `getArticleToolRouteEntry()` would compare `/generator-adresata?scenario=...` to route registry path `/generator-adresata` and fail. Scenario CTA support should be added through a new field or route builder, not by overloading `tool_slug`.

### Landing Connections Needed

Recommended future mappings:

| Article intent | Future tool state |
|---|---|
| "Как написать Кому в заявлении" | `?scenario=application&focus=to&profile=ru-official` |
| "Как оформить От кого" | `?scenario=application&focus=from&profile=ru-official` |
| "Шапка заявления директору" | `?scenario=application-director&profile=ru-official` |
| "Служебная записка" | `?scenario=memo&profile=ru-official` |
| "Как обратиться к директору" | `?focus=salutation&scenario=businessLetter` |
| "CSV список адресатов" | `?scenario=csv-bulk` |
| "DOCX заявление" | `?scenario=application&export=docx` |

Near-term: keep article links generic until the tool can safely parse and apply these params.

---

## 9. Analytics Readiness

### Current Analytics Foundation

`src/utils/analytics.js` has:

- `analytics.init()`;
- `emit()`;
- GA4 forwarding if `window.gtag` exists;
- Yandex Metrika `reachGoal`;
- existing events like `tool_used`, `link_copied`, `article_viewed`, `article_list_viewed`, `search_performed`, etc.

The app has `PageViewTracker` and article list/detail events.

### Addressee Current State

Addressee-specific analytics is not ready:

- no explicit `addressee_generated`;
- no warning shown event;
- no DOCX/CSV export event;
- no CSV import started/completed event;
- no copy-all event;
- no scenario/profile event;
- no preset event because presets do not exist.

Potential issue:

- `CopyButton.jsx` dynamically imports `trackLinkCopied` as a named export from `analytics.js`, but `analytics.js` exports `analytics` and `ANALYTICS_EVENTS`, not a named `trackLinkCopied` function. This likely makes copy analytics from `CopyButton` silently fail. The current integration check only verifies that `onCopied` exists, not that analytics actually emits.

### Future Events

Recommended events:

- `tool_opened`
- `scenario_selected`
- `addressee_generated`
- `warning_shown`
- `explanation_opened`
- `copy_clicked`
- `docx_export_clicked`
- `csv_import_started`
- `csv_import_completed`
- `preset_saved`
- `premium_limit_hit`
- `pricing_clicked`

Recommended Addressee properties:

- `language`
- `profile`
- `scenario`
- `source_article_slug`
- `source_translation_key`
- `has_sender`
- `has_manual_recipient_case`
- `has_manual_sender_case`
- `warnings_count`
- `warning_codes`
- `confidence_bucket`
- `csv_rows_bucket`
- `export_type`

Privacy rule:

- never track names, organizations, document text, raw CSV, addresses, phone numbers, or identifiers.

Readiness verdict:

- foundation exists;
- event taxonomy is missing;
- CopyButton analytics should be fixed before relying on copy metrics;
- product analytics can be added safely after profile/scenario contracts exist.

---

## 10. Refactor Risk Map

| Risk | Probability | Impact | Files | Test Protection | Post-change Checks |
|---|---|---:|---|---|---|
| Safe names stop declining correctly | medium | high | `addresseeFormatter.js`, `addresseeNameCases.js` | formatter/name golden cases | `npm run check:addressee`, new snapshots |
| Risky names become overconfident | medium | high | `addresseeNameCases.js`, `addresseeFormatter.js` | low-confidence tests | Initials, Latin, hyphen, undeclinable cases |
| Warning codes change or disappear | medium | high | `addresseeTypes.js`, formatter | enum/code tests | Warning localization and UI panel |
| Confidence thresholds change unexpectedly | medium | high | formatter, UI | confidence tests | High/medium/low labels, manualReviewRequired |
| Legacy result block keys break exports | high if renamed early | high | formatter, exports, UI, DOCX | contract tests | CSV/TXT/HTML/DOCX export scripts |
| CSV column drift | medium | high | `addresseeCsv.js`, `addresseeExport.js`, UI | CSV import/export tests | Template, import, single/bulk export |
| CSV parser regressions | medium | medium | `addresseeCsv.js` | CSV parser tests | delimiters, quotes, no-header rows |
| DOCX loses effective overrides | medium | high | `AddresseeGenerator.jsx`, `addresseeDocxExport.js`, `addresseeExport.js` | export quality tests | Edited block -> DOCX |
| Prerender stale/blank Addressee page | medium | high | `generate-pages.js`, route SEO | prerender check | canonical/hreflang/static content |
| Route/search mismatch | low-medium | high | `routeRegistry.js`, `routeSeo.js`, `searchIndex.js` | integration and SEO URL checks | `/ru/en/generator-adresata/`, sitemap |
| EN becomes misleading | high if profile rushed | medium-high | formatter, locales, route SEO | EN golden tests | EN output does not claim RU case behavior |
| Article CTA scenario support breaks generic CTA | medium | medium | `articleFunnel.js`, ArticlePage | article funnel tests | Existing `tool_slug` articles still link |
| Analytics emits sensitive data | medium | high | Addressee UI, analytics | privacy assertions | Inspect event payloads |
| Premium limits block SEO trust actions | medium | medium | future UI/export | product tests | Core free generation/copy remains open |

---

## 11. Recommended Target Architecture

### Future Profile Entity

Profiles define standards and language-specific formatting rules.

```js
{
  id: 'RU_OFFICIAL_STANDARD',
  language: 'ru',
  labelKey: '...',
  blockOrder: ['toBlock', 'fromBlock', 'salutation', 'documentHeader'],
  casePolicy: {
    recipientNameCase: 'dative',
    senderNameCase: 'genitive',
    requirePatronymic: true
  },
  salutationPolicy: {},
  warningPolicy: {},
  exportDefaults: {}
}
```

Initial profiles:

- `RU_OFFICIAL_STANDARD`
- `RU_SIMPLE_BUSINESS`

Later profiles:

- `EN_BUSINESS_LETTER`
- `EN_INTERNAL_MEMO`

Avoid `RU_GOST_OFFICIAL` as public label until wording is reviewed against actual standards.

### Future Scenario Entity

Scenarios define the document workflow.

```js
{
  id: 'application',
  profileId: 'RU_OFFICIAL_STANDARD',
  documentTemplate: 'application',
  defaultGreetingMode: 'namePatronymic',
  requiredFields: ['recipient.fullName', 'sender.fullName'],
  exportTemplateId: 'ru-application-basic'
}
```

Initial scenarios:

- `application`
- `complaint`
- `request`
- `memo`
- `businessLetter`
- `custom`

Later:

- `application-director`
- `csv-bulk`
- `en-business-letter`
- `en-internal-memo`

### Future Result Contract

Target contract:

```js
{
  blocks: {
    toBlock,
    fromBlock,
    salutation,
    documentHeader,
    fullPreview
  },
  warnings: [],
  confidence: 'high' | 'medium' | 'low',
  explanations: [],
  exportData: {}
}
```

Compatibility requirement:

- keep adapter fields for current UI/export:
  - `blocks.to`
  - `blocks.from`
  - `blocks.greeting`
  - `blocks.letter`
  - `blocks.documentText`
  - numeric `confidence`
  - `manualReviewRequired`

### Future Warning Contract

```js
{
  code,
  severity,
  field,
  message,
  suggestion
}
```

Example:

```js
{
  code: 'UNDECLINABLE_SURNAME',
  severity: 'warning',
  field: 'recipient.fullName',
  message: 'Фамилия может быть несклоняемой.',
  suggestion: 'Проверьте форму вручную или заполните дательный падеж вручную.'
}
```

### Future Explanation Contract

```js
{
  code,
  title,
  text,
  relatedField
}
```

Example:

```js
{
  code: 'RECIPIENT_DATIVE_USED',
  title: 'Почему дательный падеж',
  text: 'Строка "Кому" отвечает на вопрос "кому?", поэтому ФИО адресата используется в дательном падеже.',
  relatedField: 'recipient.fullName'
}
```

### Gradual Integration Plan

Step 1: add internal contracts without changing UI.

- Add profile/scenario config files or sections.
- Add adapter that maps current input to normalized input.
- Keep `formatAddressee()` public output unchanged.

Step 2: enrich result internally.

- Add `warnings[].severity/field/suggestion` while keeping `message`.
- Add `explanations[]`.
- Add `confidenceLabel` or bucket internally while keeping numeric `confidence`.

Step 3: move templates out of formatter.

- Extract document template definitions.
- Keep old `DOCUMENT_TEMPLATE_*` constants.
- Map old templates to scenario definitions.

Step 4: update exports through adapter.

- Use `exportData` internally.
- Keep existing CSV columns.
- Add profile/scenario columns only after tests are updated.

Step 5: only then adapt UX.

- Scenario picker.
- Explanation panel.
- Presets.
- Premium hooks.

---

## 12. Test Plan Before Refactor

### Existing Scripts to Keep Running

- `npm run check:addressee`
- `npm run check:addressee:csv`
- `npm run check:addressee:docx`
- `npm run check:addressee:integration`
- `npm run check:addressee:export-quality`
- `npm run check:addressee:prerender`
- `npm run check:seo-urls`
- `npm run check:article-funnel`
- `npm run test`
- `npm run build` before release-like verification

### Unit Tests Needed

Formatter:

- no-options legacy behavior;
- profile default behavior;
- scenario maps to legacy `documentTemplate`;
- result adapter preserves old block keys.

Name cases:

- dative/genitive for common safe names;
- unknown gender;
- initials;
- hyphenated names;
- foreign surnames;
- mixed alphabet;
- extra name parts;
- new recommended names from morphology audit.

Warnings:

- every warning has `code`, `message`;
- future warnings also have `severity`, `field`, `suggestion`;
- warning localization key exists for every code.

Confidence:

- stable numeric legacy values;
- future bucket mapping;
- manual override does not incorrectly lower confidence;
- risky names never remain high confidence.

### Golden/Snapshot Cases

Golden cases should snapshot full result for:

- RU official application to director;
- RU simple business letter;
- RU memo;
- no sender;
- sender with genitive;
- manual recipient/sender cases;
- unknown position;
- Latin name;
- hyphenated name;
- undeclinable surname;
- CSV row all fields;
- DOCX text structure if feasible.

### CSV Tests

Add:

- profile/scenario columns ignored or preserved depending on phase;
- warning messages export once warning contract is enriched;
- free row limit/premium row limit later;
- row-level invalid field report.

### DOCX Tests

Add:

- override value appears in DOCX;
- warning section can be included/excluded when option exists;
- profile/scenario title appears after profile layer;
- batch DOCX later.

### SEO/Prerender Tests

Add:

- article CTA with scenario params when supported;
- `tool_slug` fallback still works;
- route SEO still has canonical/hreflang;
- search index includes Addressee;
- Addressee prerender content does not drift from current URL.

### Analytics Tests

Before adding product metrics:

- fix/verify `CopyButton` analytics export mismatch;
- ensure Addressee events omit personal data;
- event payload snapshot tests for generate/export/copy/import.

---

## 13. Backlog for Next Step: Phase 3 Profile-Based Formatter Architecture

### Safe First Changes

- Add profile/scenario constants without changing UI.
- Add tests proving `formatAddressee(input)` output is unchanged when no profile/scenario is passed.
- Add golden fixtures for current RU outputs.
- Add adapter helper names but keep existing file names and public exports.

### Contract Extraction

- Define normalized input contract internally.
- Define profile contract.
- Define scenario contract.
- Define enriched warning contract.
- Define explanation contract.
- Define legacy result adapter.

### Formatter Profile Adapter

- Implement profile option defaulting to current behavior.
- Map current `documentTemplate` to scenario.
- Add `RU_OFFICIAL_STANDARD` and `RU_SIMPLE_BUSINESS` as internal configs.
- Keep `DOCUMENT_TEMPLATE_*` constants.
- Do not remove `blocks.to/from/greeting/letter/documentText`.

### Warnings and Explanations

- Start adding `severity`, `field`, `suggestion` while preserving old fields.
- Add `explanations[]` for:
  - recipient dative;
  - sender genitive;
  - unknown position;
  - manual case override;
  - risky surname;
  - unknown gender.
- Do not expose a new UI panel yet unless separately requested.

### Tests

- Run all existing Addressee scripts after every meaningful change.
- Add new golden tests before changing formatter internals.
- Add compatibility test for legacy result shape.
- Add test for warning schema extension.
- Add test that profile/scenario fields do not break CSV export.

### No-Go Items

- No UI redesign.
- No route rename.
- No removing EN route.
- No public API.
- No backend/licensing.
- No AI API.
- No replacing current formatter wholesale.
- No renaming existing files/API without a compatibility layer.
- No changing article publishing workflow.

### Go/No-Go Recommendation

Go to Phase 3 only with an adapter-first prompt. The current baseline is green and broad enough to support a controlled refactor. Do not start with UI changes. Do not start with EN mode. Do not start by renaming block keys.

