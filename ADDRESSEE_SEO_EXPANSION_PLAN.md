# Addressee SEO Expansion Plan

## 1. Goal

Expand the SEO cluster around "кому/от кого/шапка заявления/служебная записка/жалоба/запрос/деловое письмо" to funnel users into the generator. Primary language is RU; EN only where it makes sense for the existing tool.

---

## 2. Current Published Cluster

| id | slug | language | translation_key | scenarioCta | focus | intent covered |
|----|------|----------|-----------------|-------------|-------|----------------|
| 75 | generator-adresata-kak-pravilno-ukazat-adresata | ru | addressee-generator-how-to-write | `{"scenario":"custom","source":"article","translation_key":"addressee-generator-how-to-write"}` | — | thin intro article |
| 76 | how-to-write-addressee-in-business-letter | en | addressee-generator-how-to-write | `{"scenario":"business-letter","source":"article","translation_key":"addressee-generator-how-to-write"}` | — | thin intro EN |

**Stage-18 drafts ready in `BD/article-drafts/stage-18-addressee/`:**

| slug | language | translation_key | scenarioCta | status |
|------|----------|-----------------|-------------|--------|
| kak-napisat-komu-v-zayavlenii | ru | addressee-to-field-application | `{"scenario":"application","focus":"to"}` | draft |
| kak-oformit-ot-kogo-v-zayavlenii | ru | addressee-from-field-application | `{"scenario":"application","focus":"from"}` | draft |
| obrazets-shapki-zayavleniya | ru | application-header-example | `{"scenario":"application-director"}` | draft |
| russian-application-header-example | en | application-header-example | `{"scenario":"application-director"}` | draft |
| how-to-write-to-field-in-russian-application | en | addressee-to-field-application | `{"scenario":"application","focus":"to"}` | draft |
| how-to-format-from-field-in-russian-documents | en | addressee-from-field-application | `{"scenario":"application","focus":"from"}` | draft |

---

## 3. Keyword Cluster Strategy

### 3.1 Заявления (Statements)

Core queries:
- кому в заявлении
- от кого в заявлении
- шапка заявления
- заявление директору школы
- заявление работодателю
- заявление в УК
- заявление в администрацию
- заявление в детский сад
- заявление в вуз/деканат
- заявление генеральному директору
- заявление ИП

### 3.2 Служебные документы (Internal Memos)

Core queries:
- служебная записка кому от кого
- служебная записка директору
- объяснительная записка кому от кого

### 3.3 Жалобы/запросы (Complaints/Requests)

Core queries:
- жалоба в организацию кому
- запрос в организацию как оформить
- письмо-запрос образец

### 3.4 Деловое письмо (Business Letter)

Core queries:
- уважаемый по имени отчеству
- как склонять ФИО в письме
- обращение в деловом письме

### 3.5 Падежи и ФИО (Case Inflection)

Core queries:
- дательный падеж ФИО
- родительный падеж ФИО
- склонение имени отчества в обращении
- несклоняемые фамилии

---

## 4. Next 20 Article Candidates

### Cluster A — Заявления: Кому / От кого (8 articles)

| # | priority | language | proposed slug | proposed title | target intent | primary keyword | scenarioCta | focus | translation_key | tool CTA copy | monetization hook | status |
|---|----------|----------|---------------|----------------|---------------|-----------------|-------------|-------|-----------------|--------------|-------------------|--------|
| 1 | P1 | ru | komu-v-zayavlenii | Как написать «Кому» в заявлении | BOFU | кому в заявлении | application | to | addressee-to-field-application | Оформить «Кому» | — | draft-ready |
| 2 | P1 | ru | ot-kogo-v-zayavlenii | Как оформить «От кого» в заявлении | BOFU | от кого в заявлении | application | from | addressee-from-field-application | Оформить «От кого» | — | draft-ready |
| 3 | P1 | ru | shapka-zayavleniya-obrazets | Шапка заявления — готовые образцы | BOFU | шапка заявления образец | application-director | — | application-header-example | Создать шапку заявления | DOCX template pack | draft-ready |
| 4 | P2 | ru | zayavlenie-rabotodatelyu-obrazets | Заявление работодателю: как оформить | BOFU | заявление работодателю образец | application-director | — | application-employer | Заявление работодателю | Пакет заявлений 299 ₽ | later |
| 5 | P2 | ru | zayavlenie-v-administratsiyu | Заявление в администрацию: кому писать | BOFU | заявление в администрацию | application | to | addressee-administration | Заявление в администрацию | Пакет заявлений 299 ₽ | later |
| 6 | P2 | ru | zayavlenie-v-shkolu-detsad | Заявление в школу или детский сад | BOFU | заявление в школу образец | application-director | — | application-school | Заявление в школу | Пакет заявлений 299 ₽ | later |
| 7 | P3 | ru | zayavlenie-generalnomu-direktoru | Заявление генеральному директору ООО | BOFU | заявление генеральному директору | application-director | — | application-ceo | Заявление директору | Пакет заявлений 299 ₽ | later |
| 8 | P3 | ru | zayavlenie-ip | Заявление индивидуальному предпринимателю | BOFU | заявление ИП образец | application | to | addressee-ip | Заявление ИП | Пакет заявлений 299 ₽ | later |

### Cluster B — Служебные записки (3 articles)

| # | priority | language | proposed slug | proposed title | target intent | primary keyword | scenarioCta | focus | translation_key | tool CTA copy | monetization hook | status |
|---|----------|----------|---------------|----------------|---------------|-----------------|-------------|-------|-----------------|--------------|-------------------|--------|
| 9 | P1 | ru | sluzhebnaya-zapiska-komu-ot-kogo | Служебная записка: кому и от кого | BOFU | служебная записка кому от кого | memo | — | memo-recipient-from | Создать блок записки | Офисный пакет 490 ₽ | later |
| 10 | P2 | ru | obyasnitelnaya-zapiska-obrazets | Объяснительная записка: как оформить | BOFU | объяснительная записка образец | custom | — | explanatory-note | Офисный пакет 490 ₽ | later |
| 11 | P3 | ru | sluzhebnaya-zapiska-direktoru | Служебная записка директору: образец | BOFU | служебная записка директору | memo | — | memo-director | Офисный пакет 490 ₽ | later |

### Cluster C — Жалобы / Запросы (3 articles)

| # | priority | language | proposed slug | proposed title | target intent | primary keyword | scenarioCta | focus | translation_key | tool CTA copy | monetization hook | status |
|---|----------|----------|---------------|----------------|---------------|-----------------|-------------|-------|-----------------|--------------|-------------------|--------|
| 12 | P1 | ru | zhалоба-v-organizatsiyu-komu | Жалоба в организацию: кому адресовать | BOFU | жалоба в организацию кому | complaint | — | complaint-recipient | Оформить адресат жалобы | DOCX шаблон жалобы | later |
| 13 | P2 | ru | pisimo-zapros-obrazets | Письмо-запрос: как оформить адресата | BOFU | письмо-запрос образец | request | — | request-letter | Создать письмо-запрос | DOCX шаблон | later |
| 14 | P3 | ru | zhaloba-v-gosorgan | Жалоба в госорган: как правильно оформить | BOFU | жалоба в госорган образец | complaint | — | complaint-government | Оформить жалобу | DOCX шаблон | later |

### Cluster D — Деловое письмо / Обращение (3 articles)

| # | priority | language | proposed slug | proposed title | target intent | primary keyword | scenarioCta | focus | translation_key | tool CTA copy | monetization hook | status |
|---|----------|----------|---------------|----------------|---------------|-----------------|-------------|-------|-----------------|--------------|-------------------|--------|
| 15 | P1 | ru | uvazhaemyi-po-imeni-otchestvu | Обращение «Уважаемый» по имени и отчеству | BOFU | уважаемый по имени отчеству | custom | salutation | salutation-by-name | Создать обращение | DOCX шаблон | later |
| 16 | P2 | ru | delovoe-pismo-struktura | Деловое письмо: структура и примеры | MOFU | деловое письмо образец | business-letter | — | business-letter-structure | Создать деловое письмо | DOCX шаблон | later |
| 17 | P3 | en | how-to-address-russian-business-letter | How to Address a Russian Business Letter | BOFU | how to address a business letter | business-letter | — | addressee-business-letter-en | Generate addressee block | DOCX template | later |

### Cluster E — Падежи и ФИО (3 articles)

| # | priority | language | proposed slug | proposed title | target intent | primary keyword | scenarioCta | focus | translation_key | tool CTA copy | monetization hook | status |
|---|----------|----------|---------------|----------------|---------------|-----------------|-------------|-------|-----------------|--------------|-------------------|--------|
| 18 | P1 | ru | datelnyi-padezh-fio | Дательный падеж ФИО: как правильно | BOFU | дательный падеж ФИО | custom | to | case-dative-fio | Проверить склонение | — | later |
| 19 | P2 | ru | roditelnyi-padezh-fio | Родительный падеж ФИО: как правильно | BOFU | родительный падеж ФИО | custom | from | case-genitive-fio | Проверить склонение | — | later |
| 20 | P2 | ru | ne sklonyayemyye-familii | Несклоняемые фамилии: как писать «Кому» | BOFU | не склоняемые фамилии | custom | to | case-uncdeclinable-fio | Проверить склонение | — | later |

**Total: 20 article candidates**

---

## 5. Recommended First 8 Drafts

These are the highest-priority drafts to write next, after the existing Stage-18 drafts:

| # | title | scenario | focus | translation_key | rationale |
|---|-------|----------|-------|----------------|-----------|
| 9 | Служебная записка: кому и от кого | memo | — | memo-recipient-from | High BOFU intent, clear memo scenario, closes internal-documents gap |
| 12 | Жалоба в организацию: кому адресовать | complaint | — | complaint-recipient | High BOFU intent, complaint scenario |
| 13 | Письмо-запрос: как оформить адресата | request | — | request-letter | Complements complaint cluster, request scenario |
| 15 | Обращение «Уважаемый» по имени и отчеству | custom | salutation | salutation-by-name | High-frequency salutation question, closes greeting gap |

**Current Stage-18 drafts to publish first:**
1. `kak-napisat-komu-v-zayavlenii` — P1, application + to focus
2. `kak-oformit-ot-kogo-v-zayavlenii` — P1, application + from focus
3. `obrazets-shapki-zayavleniya` — P1, application-director (header example)
4. `russian-application-header-example` — EN pair for above

**Recommended next 4 drafts after Stage-18:**
5. `sluzhebnaya-zapiska-komu-ot-kogo` — memo scenario
6. `zhalkoba-v-organizatsiyu-komu` — complaint scenario
7. `pismo-zapros-obrazets` — request scenario
8. `uvazhaemyi-po-imeni-otchestvu` — salutation focus

---

## 6. Internal Linking Plan

### Hub articles (link to all cluster articles)
- `kak-napisat-komu-v-zayavlenii` → links to: `shapka-zayavleniya-obrazets`, `ot-kogo-v-zayavlenii`
- `kak-oformit-ot-kogo-v-zayavlenii` → links to: `shapka-zayavleniya-obrazets`, `komu-v-zayavlenii`
- `obrazets-shapki-zayavleniya` → links to: `komu-v-zayavlenii`, `ot-kogo-v-zayavlenii`, `zayavlenie-rabotodatelyu-obrazets`

### Spoke articles (link to hub + tool)
- `sluzhebnaya-zapiska-komu-ot-kogo` → links to: `shapka-zayavleniya-obrazets`
- `zhalkoba-v-organizatsiyu-komu` → links to: `komu-v-zayavlenii`
- `pismo-zapros-obrazets` → links to: `komu-v-zayavlenii`
- `uvazhaemyi-po-imeni-otchestvu` → links to: `shapka-zayavleniya-obrazets`

### Avoid cannibalization
- Each article targets one specific query intent
- Hub articles (Кому, От кого, Шапка) cover the core grammar
- Spoke articles cover specific document types and link to hub articles, not to each other
- All articles link to the generator tool with scenario-specific CTA

---

## 7. CTA Mapping

| article slug | CTA URL | scenario | focus | source | article |
|--------------|---------|----------|-------|--------|---------|
| kak-napisat-komu-v-zayavlenii | `/ru/generator-adresata/?scenario=application&focus=to&source=article&article=addressee-to-field-application` | application | to | article | addressee-to-field-application |
| kak-oformit-ot-kogo-v-zayavlenii | `/ru/generator-adresata/?scenario=application&focus=from&source=article&article=addressee-from-field-application` | application | from | article | addressee-from-field-application |
| obrazets-shapki-zayavleniya | `/ru/generator-adresata/?scenario=application-director&source=article&article=application-header-example` | application-director | — | article | application-header-example |
| russian-application-header-example | `/en/generator-adresata/?scenario=application-director&source=article&article=application-header-example` | application-director | — | article | application-header-example |
| sluzhebnaya-zapiska-komu-ot-kogo | `/ru/generator-adresata/?scenario=memo&source=article&article=memo-recipient-from` | memo | — | article | memo-recipient-from |
| zhalkoba-v-organizatsiyu-komu | `/ru/generator-adresata/?scenario=complaint&source=article&article=complaint-recipient` | complaint | — | article | complaint-recipient |
| pismo-zapros-obrazets | `/ru/generator-adresata/?scenario=request&source=article&article=request-letter` | request | — | article | request-letter |
| uvazhaemyi-po-imeni-otchestvu | `/ru/generator-adresata/?focus=salutation&source=article&article=salutation-by-name` | custom | salutation | article | salutation-by-name |

**scenarioCta values used so far:**
- `application` + `focus=to`
- `application` + `focus=from`
- `application-director`
- `memo`
- `complaint`
- `request`
- `custom` + `focus=salutation`

---

## 8. Monetization Hooks

| article | monetization hook | offer |
|---------|-------------------|-------|
| obrazets-shapki-zayavleniya | DOCX template pack | «Пакет заявлений и шапок» 299 ₽ |
| zayavlenie-rabotodatelyu-obrazets | DOCX template pack | «Пакет заявлений работодателю» 299 ₽ |
| zayavlenie-v-administratsiyu | DOCX template pack | «Пакет заявлений в госорганы» 299 ₽ |
| sluzhebnaya-zapiska-komu-ot-kogo | Office pack | «Офисный пакет» 490–990 ₽ (записки + письма + жалобы) |
| delovoe-pismo-struktura | DOCX template | «Деловое письмо DOCX» 199 ₽ |

No payment mechanics added at this stage. Hooks are noted for future offer pages.

---

## 9. Draft Creation Prompt

```
Создать 4 новых article JSON files в BD/content-staging/:

1. sluzhebnaya-zapiska-komu-ot-kogo.json
   - language: ru
   - translation_key: memo-recipient-from
   - slug: sluzhebnaya-zapiska-komu-ot-kogo
   - title: Служебная записка: кому и от кого — правила оформления
   - scenarioCta: {"scenario":"memo","source":"article","translation_key":"memo-recipient-from"}
   - status: draft
   - content: explain memo header structure (Кому/От кого in memo), when to use memo vs application, example blocks, CTA to /ru/generator-adresata/?scenario=memo

2. zhaloba-v-organizatsiyu-komu.json
   - language: ru
   - translation_key: complaint-recipient
   - slug: zhaloba-v-organizatsiyu-komu
   - title: Жалоба в организацию: кому адресовать — образец и правила
   - scenarioCta: {"scenario":"complaint","source":"article","translation_key":"complaint-recipient"}
   - status: draft
   - content: complaint addressee rules, who to address complaint to, complaint header structure, CTA to /ru/generator-adresata/?scenario=complaint

3. pisimo-zapros-obrazets.json
   - language: ru
   - translation_key: request-letter
   - slug: pisimo-zapros-obrazets
   - title: Письмо-запрос: как оформить адресата — образец
   - scenarioCta: {"scenario":"request","source":"article","translation_key":"request-letter"}
   - status: draft
   - content: request letter structure, how to address recipient in request, example blocks, CTA to /ru/generator-adresata/?scenario=request

4. uvazhaemyi-po-imeni-otchestvu.json
   - language: ru
   - translation_key: salutation-by-name
   - slug: uvazhaemyi-po-imeni-otchestvu
   - title: Обращение «Уважаемый» по имени и отчеству — правила и примеры
   - scenarioCta: {"scenario":"custom","focus":"salutation","source":"article","translation_key":"salutation-by-name"}
   - status: draft
   - content: how to write "Уважаемый Иван Иванович" correctly, when to use full name vs short form, salutation rules, CTA to /ru/generator-adresata/?focus=salutation

For each file:
- Use BD/article.template.json as the schema
- Fill all required fields: language, translation_key, slug, title, excerpt, content, status, author, seo_title, seo_description
- Set scenarioCta correctly per the spec above
- Do NOT publish (status=draft)
- After creating files, run: powershell -ExecutionPolicy Bypass -File ".\BD\check-article.ps1" "<slug>" for each
- Report any errors
```

---

## 10. Notes

- All new articles must use `tool_slug: "generator-adresata"` to enable scenario CTA routing
- Only use `focus` values: `to`, `from`, `salutation` (from VALID_FOCUS_VALUES in articleFunnel.js)
- Only use scenarios from VALID_SCENARIO_QUERY_VALUES: `application`, `application-director`, `memo`, `complaint`, `request`, `business-letter`, `custom`, `csv-bulk`
- EN articles should not be created unless there is a specific audience: foreigners, expats, or business users who deal with Russian documents
- Do not create future EN-mode scenarios (memo, complaint, request, business-letter) in EN articles until real EN mode exists
- All articles are RU-first; EN is secondary and optional
- translation_key must be stable and shared by RU/EN pairs
- Do not use `/en/generator-adresata/` links in EN articles if the tool does not have a real EN mode yet