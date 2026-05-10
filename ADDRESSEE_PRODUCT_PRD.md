# ADDRESSEE PRODUCT PRD

## 0. Product Frame

**Product name:** QSEN Addressee

**Working positioning:** standards-first, private, rule-based tool for preparing the addressee block, salutation, "Кому / От кого" lines, and formal document header.

**Current stage:** product framing before interface and formatter changes.

**Core principle:** this is not an AI letter writer. The product wins by being narrow, predictable, explainable, private, and fast.

---

## 1. Product Positioning

QSEN Addressee is a niche document utility for people who need to correctly format the top block of a formal Russian document: recipient, sender, salutation, and a reusable document header.

The first strong market is RU-first:

- Russian names require case handling: dative for "Кому", genitive for "От кого".
- Formal Russian documents often have repeated but error-prone header patterns.
- Users need a trustworthy result they can copy into Word, email, CRM notes, or internal templates.
- The task is narrow enough to solve well without AI APIs.

The product is for:

- office workers preparing statements, memos, requests, complaints, HR documents;
- small businesses preparing formal letters without a lawyer or document specialist;
- schools, clinics, local organizations, government-facing users who need standard wording;
- operations teams that repeatedly prepare small batches of addressed documents.

The product is not:

- a full legal document generator;
- an AI assistant that writes the whole letter;
- a CRM, ERP, or customer data-quality platform;
- a morphology API;
- a full Word/Google Docs replacement;
- a generic template marketplace.

Why it can earn money:

- The task is small but high-anxiety: wrong cases and official headers make documents look unprofessional.
- Repeat users exist: HR, accounting, schools, admin assistants, sales ops, legal ops.
- Users can clearly understand paid value: DOCX export, batch CSV, saved presets, organization/person templates, and reviewed standard profiles.
- The tool can stay SEO-friendly because the free core solves the user's first problem, while premium saves time for repeated work.

---

## 2. Target Audiences

### Primary RU Audience

**Who:** Russian-speaking office workers, admin assistants, HR specialists, accountants, school/clinic/NGO administrators, small business employees.

**Pain solved:** "I need to write a formal document, but I am not sure how to format 'Кому', 'От кого', salutation, and name cases correctly."

**Frequency:** from a few times per month to daily for administrative roles.

**Potential paid value:**

- save frequent recipients and senders;
- export clean DOCX without reformatting;
- process several recipients through CSV;
- use reviewed profiles for statements, memos, requests, complaints, internal notes;
- avoid manual case checking for common Russian names and positions.

### Secondary RU Audience

**Who:** individual users, students, parents, applicants, freelancers, self-employed people, small entrepreneurs.

**Pain solved:** "I need one correct statement, complaint, request, or application and do not want to search through examples for 20 minutes."

**Frequency:** episodic, from once per year to several times per quarter.

**Potential paid value:**

- one-time template packs for a concrete task;
- polished DOCX export;
- scenario-specific document header examples;
- simple paid "download clean document" moment if trust is already earned.

### Future EN Audience

**Who:** English-speaking users writing business letters, memos, formal requests, cover letters, or international correspondence.

**Pain solved:** "I need a correctly structured addressee/salutation/header for a business document."

**Frequency:** weekly to monthly for office roles.

**Potential paid value:**

- reusable business letter and memo presets;
- company/person address book stored locally;
- DOCX export and branded templates;
- batch personalization for simple mail merge use cases.

Important: EN should not be a translated Russian mode. A real EN mode needs its own standards: business letter blocks, memo headers, organization/person addressing, role-based salutations, locale variants (US/UK/international), and no Russian case logic presented as if it applied to English.

---

## 3. Jobs To Be Done

### JTBD 1: Statement Header to a Director

When I need to submit a statement to a director, I want to enter the director's role, organization, name, and my data, so I can copy or download a correctly formatted header.

Expected output:

- "Кому" block in dative;
- "От кого" block in genitive;
- optional salutation;
- document draft for "ЗАЯВЛЕНИЕ";
- warnings if name, role, or case is uncertain.

### JTBD 2: Correct "Кому / От кого"

When I am unsure how to write "Кому" and "От кого", I want the tool to generate both blocks and explain the case choice, so I can trust the result before sending.

Expected output:

- dative recipient form;
- genitive sender form;
- confidence level;
- "why this form" explanation;
- manual override for disputed cases.

### JTBD 3: Service Memo

When I need to prepare a служебная записка, I want a memo-specific profile, so the header, salutation, and document title fit the internal-document context.

Expected output:

- "СЛУЖЕБНАЯ ЗАПИСКА" template;
- recipient and sender blocks;
- concise editable body placeholder;
- copy and DOCX export.

### JTBD 4: Several Addressees through CSV

When I need to prepare multiple addressed blocks, I want to upload/paste CSV, so I can generate results in one pass and review warnings row by row.

Expected output:

- CSV template;
- CSV import validation;
- bulk preview;
- row-level warnings and confidence;
- export of generated "to/from/greeting/documentText" fields.

### JTBD 5: Export to DOCX

When I need to send or print the result, I want to export a DOCX file, so I can make final edits in Word without rebuilding the header manually.

Expected output:

- DOCX with document title, "Кому", "От кого", salutation, draft body, date/signature placeholders;
- warnings included or optionally separated;
- formatting that does not require cleanup.

### JTBD 6: Saved Recipients and Senders

When I repeatedly write to the same director, department, or organization, I want local saved presets, so I can generate the next document in seconds.

Expected output:

- local-only saved recipients;
- local-only saved sender profiles;
- quick scenario selection;
- no account required for basic local presets.

### JTBD 7: Manual Case Override

When the tool flags a rare surname, initials, foreign name, or non-standard role, I want to enter the correct dative/genitive form manually, so the final output stays correct while the system remains honest about uncertainty.

Expected output:

- recipient dative override;
- sender genitive override;
- warning that manual form was used;
- high confidence only if all remaining fields are stable.

### JTBD 8: Article-to-Tool Workflow

When I read a guide like "Как написать Кому в заявлении", I want the generator to open in the matching scenario, so I do not have to translate article advice into tool settings manually.

Expected output:

- article CTA includes a scenario parameter later;
- tool opens with "Заявление" or "Директор организации" profile;
- examples match the article intent.

---

## 4. Competitive Difference

QSEN Addressee should not compete directly with broad AI or document platforms.

### Not AI Letter Generators

AI letter generators produce full prose. QSEN Addressee should produce deterministic, explainable document blocks. The value is not creative writing; it is standards, cases, warnings, and repeatable formatting.

### Not CRM / ERP Data-Quality Tools

CRM/ERP tools manage contact databases and enterprise workflows. QSEN Addressee should stay lightweight: paste or type data, generate a block, export, and optionally keep local presets.

### Not Morpher-like Morphology Tools

Morphology APIs solve a linguistic subproblem. QSEN Addressee solves a document workflow: name cases plus position wording, salutation, "Кому / От кого", template context, warnings, export, and article guidance.

### Not Full Document Editors

Word, Google Docs, and online editors are places to finish documents. QSEN Addressee should produce the exact header and starting draft, then export cleanly.

### Not Generic Template Sites

Template sites give static examples. QSEN Addressee should turn user data into a formatted, case-aware, explainable result with confidence and warnings.

### QSEN Addressee Niche

The product owns the narrow space between "example article" and "full document editor":

> I know what document I need, but I need the addressee/header/salutation to be correct, fast, private, and exportable.

---

## 5. MVP Scope

### Must Have for First Paid MVP

**Standard profiles**

- `RU_GOST_OFFICIAL` or safer first name `RU_OFFICIAL_STANDARD`: formal Russian document style for statements, requests, complaints, official letters.
- `RU_SIMPLE_BUSINESS`: less strict business correspondence for partners, clients, internal communication.
- Each profile must define: block order, labels, case expectations, salutation rules, disclaimer level, export defaults.
- Do not market strict GOST compliance until references and wording are reviewed.

**Generation**

- "Кому" block generation.
- "От кого" block generation.
- Salutation generation.
- Document header/draft generation for at least: business letter, statement, memo.
- Manual dative/genitive name forms for disputed cases.

**Trust layer**

- warning codes for incomplete name, unknown gender, unknown position, abbreviation, Latin/mixed alphabet, initials, hyphenated names, undeclinable/ambiguous surnames;
- confidence score with user-facing labels;
- manual review flag;
- explanation "why this form" for names, positions, and template profile;
- clear disclaimer: not legal advice, final official requirements must be checked.

**Actions**

- copy individual blocks;
- copy full document block;
- DOCX export for single result;
- TXT/HTML export can remain supportive but should not distract from DOCX;
- CSV import/export with template, validation, row preview, warning summary;
- local saved presets for frequent recipients and senders.

**SEO/product bridge**

- route remains `/ru/generator-adresata/` and `/en/generator-adresata/`;
- RU article CTAs point to `/ru/generator-adresata/`;
- EN article CTAs should remain conservative until EN mode is real;
- article topics map to scenarios.

**Quality bar**

- no AI API dependency;
- no external API dependency for core generation;
- deterministic frontend-first formatter;
- regression checks for formatter, CSV, DOCX, integration, export quality.

### Should Have After Stabilization

- scenario query params: `?scenario=application-director`, `?scenario=memo-manager`, `?profile=ru-official`;
- better profile selector with "statement", "memo", "request", "business letter";
- local preset manager with import/export JSON;
- batch DOCX export for multiple rows;
- richer position dictionary and organization patterns;
- confidence breakdown per block;
- article CTA analytics with source article and scenario;
- print-friendly layout;
- optional "copy for email" vs "copy for Word" formatting.

### Later / Not Now

- accounts and cloud sync;
- payment/licensing backend;
- team libraries;
- Worker-based license checks;
- webhook integrations;
- public API;
- advanced CRM import;
- EN standard mode with real US/UK/international variants;
- legal document generation beyond safe editable placeholders.

---

## 6. Anti-Features

Do not build these now:

- AI agent or AI API-based letter writer;
- full legal document generator;
- complex account system;
- heavy CRM/contact database;
- full document editor;
- enterprise integrations;
- public API as a separate product;
- premature deep internationalization;
- auto-publishing documents;
- legal advice claims;
- automatic D1/Worker changes from this frontend repo unless the relevant source exists and the owner approves.

The product should remain a precise utility, not a platform-shaped distraction.

---

## 7. Monetization

### Free

Goal: earn trust, support SEO, and let users solve the first real task.

Free should include:

- single addressee generation;
- "Кому", "От кого", salutation;
- warnings and confidence;
- basic "why this form" explanation;
- copy individual blocks and full block;
- at least one useful export path, preferably copy plus basic DOCX or limited DOCX;
- CSV template and small-row preview;
- article CTAs and examples.

Possible limits:

- CSV processing up to 5-10 rows;
- limited saved presets, for example 3 recipients and 1 sender;
- DOCX export with basic template only;
- no batch DOCX.

Do not lock too early:

- core generation;
- visible warnings;
- confidence;
- basic copy;
- enough explanation to trust the tool;
- SEO article-to-tool flow.

Locking these too early would reduce search conversion and make the tool feel like a paywall before proof.

### Starter

For individuals and occasional office users.

Paid value:

- more local presets, for example 25 recipients and 5 senders;
- unlimited basic DOCX export;
- additional standard profiles: statement to director, memo, request, complaint;
- one-click scenario presets from articles;
- clean export templates without extra friction;
- saved manual case corrections.

Possible price model:

- low monthly price;
- or one-time lifetime for personal use if payments are easier to validate.

Why users pay:

- they use the tool repeatedly and want less retyping;
- DOCX output saves formatting time;
- scenario presets reduce mistakes.

### Pro

For admin assistants, HR/accounting/legal ops, small business teams.

Paid value:

- larger CSV batches, for example 250-1000 rows;
- batch DOCX export;
- bulk warning report;
- import/export preset library;
- organization sender profiles;
- reviewed template packs included;
- priority support or feedback channel.

Possible limits:

- free small batch, Starter medium batch, Pro large batch;
- fair-use export limits to avoid abuse;
- no cloud storage required in first version.

Why users pay:

- batch processing and repeat templates save measurable office time;
- warnings reduce document QA workload;
- local-first privacy is safer for sensitive internal data.

### One-Time Template Packs

Use when recurring subscription is too much for episodic users.

Examples:

- "Заявления работодателю";
- "Школа и детский сад";
- "Госорганы и жалобы";
- "Служебные записки";
- "ИП и ООО";
- "Business letter and memo pack" later for EN.

Paid value:

- reviewed scenarios;
- better document wording placeholders;
- DOCX styles;
- article-linked flows.

Do not sell one-time packs as legal guarantees. Sell them as formatting and editable document starting points.

---

## 8. SEO-Embedded Product Logic

Articles should not only educate; they should open the tool in the correct state.

Current article rules to preserve:

- articles live in Cloudflare D1;
- frontend consumes Worker API;
- RU and EN articles must have `language` and `translation_key`;
- RU articles link to `/ru/...`;
- EN articles link to `/en/...`;
- `tool_slug` can connect article CTA to `generator-adresata`;
- do not edit Worker source unless it exists in the repo.

Recommended article-to-tool mapping:

- "Как написать Кому в заявлении" -> `/ru/generator-adresata/?scenario=application-to-director&focus=to`
- "Как оформить От кого в заявлении" -> `/ru/generator-adresata/?scenario=application&focus=from`
- "Шапка заявления директору" -> `/ru/generator-adresata/?scenario=application-director&profile=ru-official`
- "Служебная записка: как оформить" -> `/ru/generator-adresata/?scenario=memo&profile=ru-official`
- "Обращение по имени отчеству" -> `/ru/generator-adresata/?focus=greeting`
- "Как подготовить несколько адресатов" -> `/ru/generator-adresata/?scenario=csv-bulk`
- "Как скачать заявление в DOCX" -> `/ru/generator-adresata/?scenario=application&export=docx`

EN articles should not promise real EN standard behavior until the product has a real EN mode.

Near-term EN stance:

- EN articles may explain Russian document formatting for foreigners and link to the current tool honestly.
- EN business-letter and memo articles should wait until EN profiles exist.
- Future EN CTAs should map to `?profile=en-business-letter`, `?scenario=en-memo`, etc.

The best SEO loop:

1. Article answers a concrete formatting question.
2. CTA opens the matching scenario.
3. Tool shows a preselected profile and example.
4. User generates result.
5. Copy/DOCX/CSV events indicate conversion.

---

## 9. Metrics

Track these product events without storing personal names, organizations, document text, or CSV content.

Core events:

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
- `checkout_started`

Recommended properties:

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
- `confidence_bucket` (`high`, `medium`, `low`)
- `csv_rows_bucket` (`1-5`, `6-50`, `51-250`, `250+`)
- `export_type`
- `plan_context` (`free`, `starter`, `pro`)

Do not track:

- full names;
- organization names;
- document text;
- raw CSV rows;
- addresses;
- phone numbers;
- passport or legal identifiers.

---

## 10. Risks

### Too Broad Product

Risk: the tool becomes a document editor, AI assistant, CRM, and template site at once.

Mitigation: keep the core job narrow: addressee/header/salutation/export.

### Weak EN Logic

Risk: EN is only translated RU logic and feels fake or misleading.

Mitigation: keep RU-first, preserve EN route, but define real EN profiles before serious EN SEO or monetization.

### Unclear Paid Value

Risk: users see no reason to pay because the free generator solves everything.

Mitigation: monetize repeat workflows, not trust-critical first use: presets, larger CSV, batch DOCX, reviewed packs.

### Low Trust in Cases

Risk: users do not trust name and position inflection.

Mitigation: warnings, confidence, explanations, manual overrides, visible conservative behavior on risky names.

### SEO Pages without Conversion

Risk: articles rank but users do not enter the tool.

Mitigation: scenario CTAs, article-specific examples, analytics from article slug to generated result.

### Premature Backend

Risk: payment/licensing infrastructure distracts before users prove the value.

Mitigation: keep frontend-first MVP; add backend later only for checkout, license checks, webhooks, and premium limits.

### Competing with AI Services

Risk: messaging drifts into "generate any letter" and competes with larger AI platforms.

Mitigation: position as deterministic standards-first formatting, not prose generation.

---

## 11. Recommended Development Order

### Stage 1: PRD

Create product frame, scope, non-goals, paid value, SEO loop, and risks. This document is the output of Stage 1.

### Stage 2: Audit Current AddresseeGenerator

Document current behavior of:

- UI states;
- formatter input/output contract;
- warning codes;
- confidence rules;
- CSV limits and validation;
- DOCX structure;
- route/SEO/prerender integration;
- RU and EN copy mismatch.

Output: `ADDRESSEE_CURRENT_STATE_AUDIT.md`.

### Stage 3: Refactor Formatter Around Profiles

Introduce explicit profiles without changing UI first:

- `RU_OFFICIAL_STANDARD`;
- `RU_SIMPLE_BUSINESS`;
- later `EN_BUSINESS_LETTER`.

Keep tests green and preserve current result shape where possible.

### Stage 4: Trust Layer

Add structured explanations:

- why the name was declined or not declined;
- why position is trusted or warned;
- why confidence is high/medium/low;
- what user should check manually.

### Stage 5: UX Redesign

Redesign around scenarios and confidence:

- scenario selector;
- profile selector;
- focused result blocks;
- explanation panel;
- saved presets;
- clearer CSV area.

Do not redesign before the formatter/profile contract is stable.

### Stage 6: RU Paid MVP

Ship RU-first MVP:

- official/simple profiles;
- statement, business letter, memo;
- copy and DOCX;
- small CSV free, larger CSV premium hook;
- local presets;
- clear pricing entry points.

### Stage 7: Tests and Regression Suite

Expand checks for:

- common Russian names;
- risky surnames;
- initials;
- foreign/Latin/mixed names;
- manual case overrides;
- profiles;
- CSV import/export;
- DOCX output;
- article scenario links.

### Stage 8: SEO Funnel and Premium Hooks

Connect articles to scenarios, track conversion events, and add non-blocking premium limits.

Backend/licensing comes later only after real usage signals:

- checkout;
- license validation;
- webhook fulfillment;
- premium-limit enforcement;
- optional account/team features.

---

## 12. Current Implementation Facts to Preserve

The existing code already includes useful foundations:

- route `/generator-adresata` with RU/EN localized paths;
- `AddresseeGenerator.jsx` with recipient, sender, case override, settings, result, bulk CSV, and export UI;
- `formatAddressee()` returning `blocks.to`, `blocks.from`, `blocks.greeting`, `blocks.letter`, `blocks.documentText`, `warnings`, `confidence`, `manualReviewRequired`;
- warning codes in `addresseeTypes.js`;
- Russian dative/genitive helper logic in `addresseeNameCases.js`;
- CSV import/export helpers and template;
- DOCX export helper using `docx`;
- integration/export/formatter check scripts;
- prerender content in `generate-pages.js`;
- article draft cluster for addressee topics.

Do not break these while moving toward the paid MVP.

