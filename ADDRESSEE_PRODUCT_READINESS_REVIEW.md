# ADDRESSEE PRODUCT READINESS REVIEW

Дата: 2026-05-10
Ветка: `main` (caa243d)
Контекст: Phase 10 — предварительный аудит перед первыми пользователями и первыми продажами

---

## 1. Executive Summary

**Готовность по шкале 0–100:** 72/100

Инструмент готов к показу первым пользователям. Код стабилен (614+ тестов проходят), core generation работает, UI устоялся. Можно начинать SEO-публикацию статей и направлять трафик.

**Можно ли показывать пользователям:** Да, с оговорками —第一批 пользователей лучше брать из числа уже знакомых с документооборотом, не в открытом SEO-трафике.

**Главный риск:** Инструмент выглядит сложнее, чем есть. Первый экран перегружен блоками (scenario selector + presets + Trust Layer + form + bulk section), и пользователь может не понять, что делать за первые 5 секунд. Premium-хинты упоминают "Pro" слишком рано и без контекста, что может отпугнуть.

**Главный шанс заработать:** DOCX export как первое платное действие. Пользователь, который уже сгенерировал результат и хочет скачать чистый Word-файл — это горячий лид. Цена 199–299 ₽ за "чистый DOCX" — реалистичная точка входа.

---

## 2. What Works Well

1. **Formatter stability** — 614 тестов проходят, падежи работают, warnings покрывают все опасные случаи.
2. **Trust Layer** — компактный, информативный, не перегружает экран. Confidence + warnings + explanations — правильная модель.
3. **Scenario-first UX** — сценарии понятны даже без документации. Заявление, записка, жалоба, письмо — это нативный русский язык.
4. **Local presets** — приватно, без регистрации, достаточный лимит для первичного использования (10/5).
5. **CSV bulk** — рабочий путь для "несколько адресатов", лимит 50 строк — достаточный для free tier.
6. **DOCX export** — чистый результат, экономит время. Это главный premium candidate.
7. **Analytics funnel** — события без персональных данных, покрывают весь lifecycle.
8. **Privacy-first positioning** — "данные в браузере" понятно и не требует пояснений.
9. **Article funnel** — статьи → tool → scenario работает на уровне query params.
10. **No-backend monetization logic** — premium hints уже есть, limit tracking работает, можно подключить оплату без сервера.

---

## 3. Current Friction

### 3.1. Первый экран перегружен

Видно сразу:
- Scenario selector (8 карточек)
- Presets section (recipient + sender)
- Trust Layer
- Form fields (recipient + sender + settings)
- Bulk section (если выбран csvBulk)

Для нового пользователя это много. Он не знает, с чего начать.

**Рекомендация:** Bulk-секцию скрыть по умолчанию. Trust Layer показывать только после генерации. Presets — только если уже есть сохранённые.

### 3.2. Manual case overrides видны слишком рано

"Ручная проверка падежей" — это advanced-функция, но она спрятана в `<details>`, который открыт по умолчанию в некоторых браузерах. Пользователь может испугаться, увидев "падежи" до того, как понял основную задачу.

**Рекомендация:** Убедиться, что `<details>` закрыт по умолчанию. Добавить подсказку "Только если результат требует проверки".

### 3.3. Premium-хинты без контекста цены

Тексты:
- `exportPremiumHint`: "DOCX-шаблоны для массовых рассылок и интеграций могут стать Pro-функцией."
- `bulk.proHint`: "Сейчас можно обработать до 50 строк за раз. Массовая обработка больших списков может быть вынесена в Pro-режим."
- `limitClose`: "Осталось {remaining} мест. Больше адресатов — в Pro-версии."

Эти сообщения:
- Не говорят, сколько стоит Pro
- Не объясняют, что входит в Pro
- "Pro" звучит как дорогой SaaS, а не как "199 ₽ один раз"

**Рекомендация:** Изменить тон на " DOCX-шаблон можно скачать за 199 ₽. Больше строк — за 299 ₽." Без слова "Pro".

### 3.4. Примеры запускают результат сразу

При клике на пример (`handleLoadExample`) сразу происходит генерация. Это удобно для power users, но может сбить нового пользователя: он не понял, что заполнил форму, и уже видит результат.

### 3.5. Нет явного "бесплатный генератор — навсегда"

Пользователь видит premium hints, но не видит явного "базовый функционал бесплатный". Это создаёт неопределённость.

**Рекомендация:** Добавить в секцию результата строку: "Копировать — бесплатно. DOCX — 199 ₽." или аналог.

---

## 4. Monetization Readiness

### Что уже есть

| Premium moment | Реализация | Готовность |
|---|---|---|
| DOCX export | `downloadAddresseeDocx()` | Готов, работает |
| Preset limit | 10 recipient / 5 sender | Готов, soft limit |
| CSV bulk limit | 50 rows | Готов, работает |
| Premium analytics | `trackAddresseeExportFormatInterest`, `trackAddresseePremiumIntent` | Готов |
| Premium hints | locale strings | Готов, но тон не оптимален |

### Что слишком рано

- "Pro" как бренд без цены — отпугивает
- Bulk Pro hint до того, как пользователь загрузил CSV
- Preset limit close message до того, как пользователь сохранил хотя бы один preset

### Что лучше убрать/смягчить

1. Слово "Pro" заменить на "расширенная версия" или конкретную цену
2. `bulk.proHint` показывать только после загрузки CSV > 30 строк
3. `exportPremiumHint` показывать только после клика на DOCX (если это первое препятствие)

### Первая монетизация: что продавать

**Набор Premium Intent signals уже готов:**
- `addressee_premium_intent: docx_export_interest` — DOCX clicked
- `addressee_premium_intent: preset_limit_reached` — hit preset limit
- `addressee_premium_intent: bulk_approaching_limit` — 40+ rows

Этих сигналов достаточно, чтобы понять: пользователь хочет платить, но ещё не готов. Нужен простой оффер.

---

## 5. Recommended First Paid Offer

### Вариант A. 199 ₽ — "Чистый DOCX"

**Что входит:**
- Неограниченные DOCX-скачивания single result
- Все 7 document templates (заявление, письмо, записка, жалоба, запрос, объяснительная, приказ)
- Результат без watermark и без "черновик"

**Кому подходит:**
- Офисные работники, которые сделали 1–3 документа и хотят скачать
- Студенты/родители для разовых заявлений

**Почему заплатит:**
- Сэкономит 5–15 минут на форматирование в Word
- Не нужно перепечатывать "Кому" и "От кого"
- Результат выглядит профессионально сразу

**Что нужно:**
- Frontend: кнопка "Скачать DOCX (199 ₽)" без backend
- Реализация: показ цены → редирект на страницу оплаты (ЮKassa/СБП) → возврат с флагом → DOCX разблокирован в сессии
- Без backend-валидации: можно через cookies/sessionStorage отмечать оплаченный оффер

**Можно ли без backend:**技术上可以 через cookies + проверка в UI. Не 100% secure, но достачно для первого MVP.

---

### Вариант B. 299 ₽ — "Пакет заявлений и шапок"

**Что входит:**
- Все templates из Варианта A
- 25 recipient presets (вместо 10)
- 10 sender presets (вместо 5)
- Приоритет в queue при CSV bulk

**Кому подходит:**
- Регулярные пользователи: HR, бухгалтерия, администрация
- 5–20 документов в месяц

**Почему заплатит:**
- Presets экономят время при повторных обращениях
- Больше local storage — удобно для постоянных адресатов
- Bulk обрабатывает больше строк

**Что нужно:**
- Требует увеличения лимитов в `addresseePresets.js`
- Проверка лимитов уже есть, нужно только менять константы

**Можно ли без backend:** Да, через sessionStorage + проверку текущего плана в UI.

---

### Вариант C. 490–990 ₽ — "Офисный пакет"

**Что входит:**
- Вариант B +
- CSV до 250 строк за раз
- Batch DOCX (скачать все результаты bulk одним файлом)
- Экспорт preset library как JSON
- Импорт preset library

**Кому подходит:**
- Power users: офис-менеджеры, кадровики, юристы
- Регулярные массовые рассылки

**Почему заплатит:**
- Batch DOCX — экономия 30–60 минут при 50+ документах
- CSV 250 rows покрывает большинство реальных сценариев

**Что нужно:**
- Batch DOCX: `addresseeDocxExport.js` должен поддерживать multiple rows
- Функция уже есть partial, нужно расширить

**Можно ли без backend:** Batch DOCX без backend возможен (client-side). Лимиты — через sessionStorage.

---

### Рекомендация по первому офферу

**Начать с Варианта A (199 ₽) как one-time purchase.**

Причины:
1. Простейшая интеграция: одна кнопка, одна цена
2. ЮKassa поддерживает one-time payments через СБП
3. "Скачать DOCX" — это конкретное действие, которое пользователь уже хочет сделать
4. Нет нужды в backend-валидации для MVP: sessionStorage enough
5. 199 ₽ — это нестрашно, это "чай в кафе"

---

## 6. SEO Content Plan

### Первые 20 статей

| # | Тема | Scenario | Focus | CTA |
|---|---|---|---|---|
| 1 | Как написать "Кому" в заявлении | application | to | /ru/generator-adresata/?scenario=application&focus=to |
| 2 | Как оформить "От кого" в заявлении | application | from | /ru/generator-adresata/?scenario=application&focus=from |
| 3 | Шапка заявления директору | applicationDirector | to | /ru/generator-adresata/?scenario=application-director |
| 4 | Служебная записка: как оформить | memo | — | /ru/generator-adresata/?scenario=memo |
| 5 | Как правильно обратиться к руководителю | businessLetter | salutation | /ru/generator-adresata/?focus=salutation |
| 6 | Жалоба: образец и правила оформления | complaint | — | /ru/generator-adresata/?scenario=complaint |
| 7 | Запрос в госорган: как составить | request | — | /ru/generator-adresata/?scenario=request |
| 8 | ИП и ООО: образец письма | businessLetter | — | /ru/generator-adresata/?scenario=businessLetter |
| 9 | Как сделать несколько адресатов из CSV | csvBulk | — | /ru/generator-adresata/?scenario=csv-bulk |
| 10 | DOCX заявление: как скачать | application | export=docx | /ru/generator-adresata/?scenario=application&export=docx |
| 11 | Падежи в русских ФИО: дательный и родительный | custom | — | /ru/generator-adresata/?scenario=custom |
| 12 | Несклоняемые фамилии: как писать "Кому" | custom | to | /ru/generator-adresata/?focus=to |
| 13 | Обращение по имени и отчеству | custom | salutation | /ru/generator-adresata/?focus=salutation |
| 14 | Деловое письмо: структура и примеры | businessLetter | — | /ru/generator-adresata/?scenario=businessLetter |
| 15 | Школа и детский сад: заявления | application | — | /ru/generator-adresata/?scenario=application |
| 16 | Объяснительная записка: как оформить | custom | — | /ru/generator-adresata/?scenario=custom |
| 17 | Приказ: правила оформления | custom | — | /ru/generator-adresata/?scenario=custom |
| 18 | Коммерческое предложение: образец | custom | — | /ru/generator-adresata/?scenario=custom |
| 19 | Как сохранить адресата в браузере | — | — | /ru/generator-adresata/ |
| 20 | Топ-10 ошибок в оформлении заявлений | application | — | /ru/generator-adresata/?scenario=application |

### Какие CTA использовать

Для каждой статьи:
1. CTA в конце статьи: "Попробуйте бесплатно" → открывает tool в нужном scenario
2. Inline CTA: "Вставьте ФИО в генератор" → фокус на поле `fullName`
3. Sidebar CTA: "Скачать DOCX за 199 ₽" → только если user уже видел результат

---

## 7. Next Technical Phase Recommendation

### Выбор: Вариант 1 — UX copy simplification and launch polish

**Обоснование:**

Перед тем как подключать оплату, нужно сделать tool готовым к массовому пользователю. Это означает:

1. **Убрать барьеры восприятия** — fewer blocks на первом экране, понятный flow
2. **Исправить тон premium hints** — убрать "Pro", добавить цену, сделатьoffer конкретным
3. **Убедиться, что бесплатный generation не выглядит урезанным** — copy/copy-all остаются бесплатными навсегда
4. **Проверить mobile UX** — экран должен быть понятен за 3 секунды

Phase 11 как UX copy simplification позволяет:
- Не ломать formatter/contracts
- Не менять routes/SEO
- Не добавлять backend
- Сфокусироваться только на Пользовательском восприятии

**Что НЕ входит в Phase 11:**
- Backend/payment
- Новые premium gates
- Новые routes
- Новые сценарии
- Редизайн

---

## 8. Backlog

### Must before public traffic

1. **Убрать "Pro" из premium hints** — заменить на цену или убрать
2. **Скрыть bulk section по умолчанию** — показывать только при `scenario=csvBulk`
3. **Trust Layer показывать только после генерации** — не до
4. **Добавить "бесплатно навсегда" заметку** — рядом с copy buttons
5. **Проверить `<details>` defaults** — advanced overrides должны быть закрыты

### Should before monetization

1. **Настроить tone premium hints** — "DOCX 199 ₽" вместо "may become Pro"
2. **Убедиться, что examples не пугают** — chip click → generate работает ожидаемо
3. **Mobile scroll depth check** — результат виден без скролла после генерации
4. **Добавить цену в export section** — "Скачать DOCX (199 ₽)"
5. **Проверить bulk limit message timing** — показывать только при > 30 rows

### Later

1. Pricing page (static, no backend)
2. ЮKassa one-time payment integration
3. Batch DOCX для варианта C
4. EN business letter mode
5. Team presets (требует backend)
6. Branded templates (требует backend)

---

## 9. Risks

### Технические
- **sessionStorage enough для first payment MVP?** Да, но это не 100% secure. Power users смогут обойти. Приемлемо для первого MVP.
- **DOCX client-side generation** — работает, проверено. No server required.

### Продуктовые
- **Инструмент выглядит сложнее, чем есть** — риск: пользователь уходит без генерации. Решение: упростить первый экран.
- **Premium hints отпугивают до покупки** — "Pro" звучит как дорого. Решение: убрать "Pro", назвать цену.
- **Примеры генерируют сразу** — это фича, но может сбить нового пользователя. Пока оставить.

### SEO
- **Статьи есть, но не опубликованы** — нужен publishing sprint. Article drafts в `BD/article-drafts/stage-18-addressee/` готовы к публикации.
- **Article → tool → purchase funnel** — работает на уровне query params, но нет обратной связи от tool к article. Analytics events покрывают это.

### Монетизация
- **199 ₽ one-time — слишком дёшево?** Для РФ аудитории — нормально. Проблема: операционные расходы на обработку платежей. Решение: собирать через ЮKassa с комиссией ~3–5%.
- **Что если никто не купит?** Monetization signals уже есть. Если signals есть, а продаж нет — проблема в конверсии, не в продукте. Нужен CRO.

### Доверие
- **"Данные в браузере"** — достаточно ли явно? Стоит добавить notice в footer presets section: "Все данные хранятся только в вашем браузере. Мы не видим ваши документы."
- **DOCX за 199 ₽ — не watermark?** Бесплатный DOCX preview должен показывать результат, но watermark не нужен. Результат и так "черновой".

---

## 10. Exact Next Prompt

```
Выполнить Phase 11: Addressee UX Copy Simplification and Launch Polish.

Цель: подготовить tool к массовому пользователю перед началом монетизации и SEO-публикацией.

Что сделать:

1. Premium hints tone fix:
   - В ru.json и en.json заменить все premium hints, содержащие "Pro", на нейтральный тон с ценой
   - exportPremiumHint: вместо "могут стать Pro-функцией" → "Скачать DOCX за 199 ₽"
   - bulk.proHint: показывать только если bulkInput.length > 30 символов И строк > 10
   - limitClose: убрать слово "Pro", оставить "{remaining} мест"

2. First screen visibility:
   - Bulk section: скрыть по умолчанию (CSS: display: none), показывать только для csvBulk scenario
   - Trust Layer: спрятать до первой генерации (result === null → не рендерить)
   - Presets section: показывать только если recipientPresets.length > 0 || senderPresets.length > 0

3. Free forever notice:
   - В секции результата, рядом с кнопкой "Копировать всё", добавить строку:
     RU: "Копировать — бесплатно и без ограничений"
     EN: "Copy is free and unlimited"
   - Это должен быть `<p className="addr-gen-free-notice">`, стиль — мелкий, серый, под кнопками

4. Advanced overrides `<details>` check:
   - Убедиться, что `<details>` с advanced case overrides имеет `open` атрибут только если одно из полей recipientDativeName/senderGenitiveName уже заполнено
   - Если оба пустые — `<details>` закрыт

5. Проверить mobile scroll depth:
   - После генерации результат должен быть видим без скролла на экране 390px
   - Проверить вручную:打开 инструмент → выбрать scenario → заполнить ФИО → сгенерировать → результат виден?

6. После изменений запустить checks:
   npm run check:addressee
   npm run check:addressee:presets
   npm run check:addressee:analytics
   npm run check:addressee:scenario-ux
   npm run check:addressee:trust-layer
   npm run check:addressee:ui-i18n
   npm run check:addressee:mobile-qa
   npm run check:article-funnel

НЕ делать:
- НЕ менять formatter contracts
- НЕ менять routes/SEO
- НЕ добавлять backend
- НЕ добавлять оплату
- НЕ менять scenario selectors
- НЕ менять preset storage logic
```

---

## Confirmation

**Код НЕ изменялся на этом шаге.** Все изменения — только документация и аналитика. Никаких правок в `src/`, `scripts/`, `locales/`, или任何 файлах кода.

Рабочий tree clean: подтверждено в Шаге 1.
Все checks прошли: результаты в шаге 2.
