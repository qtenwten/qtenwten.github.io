# Page Flow Map — QSEN Utility Tools Site

## 1. Complete Route Inventory

### 1.1 All Routes

| Route | Component | Language | Purpose |
|-------|-----------|----------|---------|
| `/` | `Home` | — | Root redirect (redirects to `/ru/`) |
| `/ru/` | `Home` | RU | Homepage Russian |
| `/en/` | `Home` | EN | Homepage English |
| `/ru/number-to-words` | `NumberToWords` | RU | Сумма прописью |
| `/en/number-to-words` | `NumberToWords` | EN | Number to words |
| `/ru/vat-calculator` | `VATCalculator` | RU | Калькулятор НДС |
| `/en/vat-calculator` | `VATCalculator` | EN | VAT Calculator |
| `/ru/random-number` | `RandomNumber` | RU | Генератор случайных чисел |
| `/en/random-number` | `RandomNumber` | EN | Random Number Generator |
| `/ru/calculator` | `Calculator` | RU | Графический калькулятор |
| `/en/calculator` | `Calculator` | EN | Graphing Calculator |
| `/ru/date-difference` | `DateDifferenceCalculator` | RU | Калькулятор дней |
| `/en/date-difference` | `DateDifferenceCalculator` | EN | Date Difference Calculator |
| `/ru/compound-interest` | `CompoundInterest` | RU | Калькулятор сложных % |
| `/en/compound-interest` | `CompoundInterest` | EN | Compound Interest Calculator |
| `/ru/seo-audit` | `SEOAudit` | RU | Экспресс SEO-аудит |
| `/en/seo-audit` | `SEOAudit` | EN | SEO Audit |
| `/ru/meta-tags-generator` | `MetaTagsGenerator` | RU | Генератор мета-тегов |
| `/en/meta-tags-generator` | `MetaTagsGenerator` | EN | Meta Tags Generator |
| `/ru/seo-audit-pro` | `SEOAuditPro` | RU | SEO-аудит PRO |
| `/en/seo-audit-pro` | `SEOAuditPro` | EN | SEO Audit PRO |
| `/ru/qr-code-generator` | `QRCodeGenerator` | RU | Генератор QR-кодов |
| `/en/qr-code-generator` | `QRCodeGenerator` | EN | QR Code Generator |
| `/ru/url-shortener` | `URLShortener` | RU | Сокращатель ссылок |
| `/en/url-shortener` | `URLShortener` | EN | URL Shortener |
| `/ru/feedback` | `Feedback` | RU | Обратная связь |
| `/en/feedback` | `Feedback` | EN | Feedback |
| `/ru/password-generator` | `PasswordGenerator` | RU | Генератор паролей |
| `/en/password-generator` | `PasswordGenerator` | EN | Password Generator |
| `/ru/articles` | `ArticlesIndex` | RU | Статьи index |
| `/en/articles` | `ArticlesIndex` | EN | Articles index |
| `/ru/articles/:slug` | `ArticlePage` | RU | Статья detail |
| `/en/articles/:slug` | `ArticlePage` | EN | Article detail |
| `/ru/search` | `SearchResults` | RU | Поиск |
| `/en/search` | `SearchResults` | EN | Search |
| `/ru/*` | `NotFound` | RU | 404 RU |
| `/en/*` | `NotFound` | EN | 404 EN |
| `*` | `NotFound` | — | 404 generic |

### 1.2 Legacy Redirect Routes

All routes without language prefix redirect to `/ru/`:
- `/number-to-words` → `/ru/number-to-words`
- `/vat-calculator` → `/ru/vat-calculator`
- `/random-number` → `/ru/random-number`
- `/calculator` → `/ru/calculator`
- `/time-calculator` → `/ru/date-difference` (note: path mismatch)
- `/date-difference` → `/ru/date-difference`
- `/compound-interest` → `/ru/compound-interest`
- `/seo-audit` → `/ru/seo-audit`
- `/meta-tags-generator` → `/ru/meta-tags-generator`
- `/seo-audit-pro` → `/ru/seo-audit-pro`
- `/qr-code-generator` → `/ru/qr-code-generator`
- `/url-shortener` → `/ru/url-shortener`
- `/feedback` → `/ru/feedback`
- `/password-generator` → `/ru/password-generator`
- `/articles` → `/ru/articles`

### 1.3 Page Purposes

| Page | Primary User Goal | Tool Category |
|------|------------------|---------------|
| `Home` | Discover and navigate to a tool | Entry point |
| `NumberToWords` | Convert number to words for documents | Converter |
| `VATCalculator` | Calculate VAT for invoices | Calculator |
| `RandomNumber` | Generate random numbers | Generator |
| `Calculator` | Calculate expressions, plot graphs | Calculator |
| `DateDifferenceCalculator` | Calculate days between dates | Calculator |
| `CompoundInterest` | Calculate investment growth | Calculator |
| `SEOAudit` | Quick SEO check | SEO Tool |
| `MetaTagsGenerator` | Generate meta tags | SEO Tool |
| `SEOAuditPro` | Deep SEO analysis with share | SEO Tool |
| `QRCodeGenerator` | Create QR codes | Generator |
| `URLShortener` | Shorten URLs | Generator |
| `Feedback` | Send message to site team | Contact |
| `PasswordGenerator` | Generate secure passwords | Generator |
| `ArticlesIndex` | Browse articles | Content |
| `ArticlePage` | Read article | Content |
| `SearchResults` | Find tools by query | Search |

---

## 2. User Scenarios

### 2.1 Primary Scenarios

**Scenario A: Tool Discovery & Usage (most common)**
```
1. User lands on Home (RU or EN)
2. Scans category sections (generators/calculators/converters/tools)
3. Clicks tool card
4. Uses tool (input → result → copy/download)
5. Returns home via Header logo or breadcrumb
```

**Scenario B: Direct Tool URL (SEO/social)**
```
1. User clicks link from Google/social/email (e.g., /ru/vat-calculator)
2. Page loads (pre-rendered shell + hydration)
3. Uses tool immediately
4. May switch language via switcher
```

**Scenario C: Search for Tool**
```
1. User goes to /ru/search or /search
2. Types query in search box
3. Results appear (filtered from ROUTE_REGISTRY via searchIndex)
4. Clicks result → navigates to tool page
```

**Scenario D: Read Article**
```
1. User navigates to /ru/articles or /en/articles
2. Browses article list (featured + sidebar + grid)
3. Clicks article card
4. Reads article (may click related tools in article content)
5. Back to articles index or home
```

**Scenario E: Multilingual Use**
```
1. User on /ru/vat-calculator
2. Clicks language switcher → goes to /en/vat-calculator
3. Same tool, English locale
4. Breadcrumb reflects current language
```

### 2.2 Secondary Scenarios

**Scenario F: SEO Audit & Share**
```
1. User on /ru/seo-audit-pro
2. Enters URL
3. Gets audit results (score, categories, checks)
4. Clicks share button → copies URL with ?url=...&score=...&issues=...
5. Sends link to colleague
6. Colleague opens link → sees pre-populated URL + error message → clicks Analyze
```

**Scenario G: Contact/Feedback**
```
1. User navigates to /ru/feedback
2. Fills form (name, email, message)
3. Submits → async request to feedback Worker
4. Sees success/pending/error state
```

**Scenario H: Calculator History**
```
1. User on /ru/calculator
2. Enters expressions, gets results
3. History panel accumulates entries
4. Restores previous expression by clicking history item
5. History persists in localStorage
```

---

## 3. Entry Points

### 3.1 Key Entry Points

| Entry | Type | Target |
|-------|------|--------|
| `qsen.ru/` (root) | Redirect | → `/ru/` via `window.location.replace` |
| `qsen.ru/ru/` | Pre-rendered | Home RU |
| `qsen.ru/en/` | Pre-rendered | Home EN |
| Social links | Direct | Tool pages (e.g., `/ru/qr-code-generator`) |
| Google search | Direct | Tool pages or home |
| Articles | Direct | `/ru/articles/:slug` |

### 3.2 Navigation Entry Points

| Element | Location | Destination |
|---------|----------|-------------|
| Logo | Header | `/{language}/` |
| Articles link | Header | `/{language}/articles/` |
| Search link | Header | `/{language}/search` |
| Language switcher | Header | Switches `/ru/` ↔ `/en/` |
| Theme switcher | Header | Toggles dark/light |
| Category tool cards | Home | Tool pages |
| Search results | Search page | Tool pages |
| RelatedTools | Tool pages (bottom) | Other tool pages |
| Article tool badge | Article cards | Linked tool page |
| Article "Use tool" CTA | Article detail | Linked tool page |

---

## 4. CTAs, Forms, and Transitions

### 4.1 Call-to-Action Patterns

| Page | Primary CTA | Secondary CTA |
|------|-------------|---------------|
| Home | Tool cards (click) | Search box |
| NumberToWords | Copy button | Pin variant |
| VATCalculator | Copy result | Clear |
| QRCodeGenerator | Download (PNG/SVG/PDF) | Format selector, Clear, Reset style |
| SEOAuditPro | Analyze button | Share button |
| Feedback | Submit button | — |
| SearchResults | Tool card click | — |
| ArticlesIndex | Article card click | "Use tool" badge links |
| ArticlePage | Back to articles | Related article links |

### 4.2 Forms

| Form | Fields | Validation | Submission |
|------|--------|------------|------------|
| `QRCodeGenerator` | Dynamic (type-based) — text/url/email/phone/SMS/WiFi | Per type (email regex, phone pattern) | No form submit, live preview |
| `VATCalculator` | amount (text), mode (select), rate (select) | Number filtering on input | No submit, live calculation |
| `NumberToWords` | number (text), tax (select), currency (select), separator (select), withMinor (checkbox) | Number filtering on input | No submit, live variants |
| `SEOAuditPro` | URL (text input) | `normalizeAuditUrl()` validates URL format | POST to Worker API |
| `Feedback` | name, email, message, website (honeypot) | email regex, message required | POST to feedback Worker |
| `SearchResults` | q (search input) | None | URL param update, no server |

### 4.3 Transitions

| From | To | Mechanism |
|------|---|-----------|
| Home → Tool | Tool card click | React Router link |
| Tool → Related | RelatedTools click | React Router link |
| Language switch | Same tool, other lang | `navigate()` with locale switch |
| Articles list → Article | Article card click | React Router link |
| Article → Tool (in content) | Link in article markdown | External Link |
| SEOAuditPro → Share | Share button | Clipboard API → prompt fallback |
| QRCodeGenerator → Download | Format button | Canvas toBlob → anchor download |

---

## 5. Conversion Points

### 5.1 Macro Conversions (site goals)

| Goal | Metric | Funnel |
|------|--------|--------|
| Tool usage | Sessions with calculation/download | Landing → Tool → Action |
| Article read | Article page views | Home → Articles → Article |
| QR download | File download event | QR page → Download click |
| Feedback sent | Successful form submit | Feedback page → Submit |

### 5.2 Micro Conversions (per page)

| Page | Micro-conversion | Indicator |
|------|-----------------|-----------|
| Home | Tool card click | `preloadRoute` on hover |
| NumberToWords | Copy button click | `CopyButton` analytics |
| QRCodeGenerator | Download click | Format selection |
| SEOAuditPro | Analyze submit | API call made |
| Feedback | Form submit click | `runRequest` triggered |
| ArticlesIndex | Article card hover | `preloadRoute('/articles')` |

---

## 6. Weak Points and UX Issues

### 6.1 Routing Weaknesses

**Issue 1: `time-calculator` legacy redirect points to `/ru/date-difference`**
- `routeRegistry` has path `/date-difference`
- `LEGACY_ROUTE_REDIRECTS` maps `/time-calculator` → `/ru/date-difference`
- This is correct, but inconsistent naming — if a user bookmarks `/time-calculator` they land on `/ru/date-difference` with the correct tool but URL changes (302)
- **Risk**: User loses mental context when URL changes

**Issue 2: Article URL language switching uses slug guessing**
- `ArticlePage.jsx` finds `translatedSlugs` by matching `translationKey` across articles
- If the EN version of an article has a different slug than the RU version (allowed per architecture rules), the switching works
- But if slug lookup fails, fallback is `/ru/articles` (list page, not the same article)
- **Risk**: Inconsistent article language switching if slugs diverge

**Issue 3: `/articles/:slug` (no language) → redirect to `/ru/articles/:slug`**
- `LegacyArticleRedirect` component does this
- But what if the article is English-only? It would redirect to RU version which doesn't exist
- **Risk**: English-only articles show RU article list instead of the article

### 6.2 UX Issues

**Issue 4: No loading skeleton for some tool pages**
- `QRCodeGenerator` is client-only (no pre-render) — shows blank during qrcode library load
- `ArticlesIndex` shows skeleton via `LoadingState`
- `NumberToWords` shows full tool page with empty input
- **Risk**: Inconsistent perceived loading experience

**Issue 5: No empty state for tool pages (only result display)**
- `VATCalculator` shows nothing when amount is empty — no guidance text
- `NumberToWords` shows input + options but zero result area until number entered
- `QRCodeGenerator` shows placeholder in preview area
- **Risk**: User unsure what to do when no input yet

**Issue 6: Search results page has `noindex,follow`**
- `/ru/search` and `/en/search` are blocked from search indexing
- This is intentional (duplicate content with tool pages)
- However, if Google indexes tool pages before home, search may not help discovery
- **Risk**: Search functionality is invisible to search engines

**Issue 7: SEO Audit Pro share flow is fragile**
- Share URL: `?url=...&score=...&issues=...`
- Only error text is stored in URL params, not full audit result
- When colleague opens link: URL pre-populated, error shown, user must click "Analyze" again
- **Risk**: Sharing doesn't preserve full audit — recipient must re-run

**Issue 8: No URL persistence for tool state**
- VATCalculator state (amount, mode, rate) stored in localStorage but not URL
- NumberToWords state (number, currency, tax) stored in localStorage
- QRCodeGenerator state is only in React state (lost on navigation)
- **Risk**: Refresh loses state; shared links don't restore tool state

**Issue 9: RelatedTools shows ALL tools, not related ones**
- `RelatedTools.jsx` shows all tools from `getHomeRouteEntries()` except current
- No actual "related" logic — just all-other-tools
- **Risk**: User sees irrelevant tool suggestions

**Issue 10: No breadcrumb on NotFound page**
- `NotFound` component catches all `/*` routes including `/ru/*` and `/en/*`
- But there's no breadcrumb trail showing how they got there
- **Risk**: User disoriented when hitting 404

### 6.3 Data/State Issues

**Issue 11: No optimistic UI for Feedback**
- Form shows spinner, then success/error
- If network times out after user closed tab, they never know if it succeeded
- **Risk**: User uncertainty about submission success

**Issue 12: ArticleStoreContext language ref doesn't trigger re-renders**
- `languageRef.current` is set but never causes context re-render
- Components using `useArticlesIndex(language)` get correct data via `fetchIndex(language)` in useEffect
- But `language` as React state in context would be cleaner
- **Risk**: Potential stale closures if ref sync fails

**Issue 13: No pagination for articles**
- `ArticlesIndex` shows all articles (sliced: featured[0], sidebar[1-3], editorial[1-7])
- No pagination controls — if Worker returns 100 articles, all are loaded
- **Risk**: Performance degradation with large article count

---

## 7. Page Structure Summary

### Tool Page Anatomy (most pages)
```
┌─────────────────────────────────────┐
│ SEO component (title, description)   │
├─────────────────────────────────────┤
│ ToolPageShell                       │
│  ├─ ToolPageHero (title, subtitle)  │
│  ├─ ToolControls (inputs, forms)     │
│  │    └─ ResultSection (output)     │
│  ├─ ToolHelp                        │
│  │    └─ ToolDescriptionSection     │
│  │        └─ ToolFaq                │
│  ├─ ToolRelated                     │
│  │    └─ RelatedTools               │
│  └─ (Some have ToolPageLayout)      │
└─────────────────────────────────────┘
```

### Article Page Anatomy
```
┌─────────────────────────────────────┐
│ SEO + Helmet (hreflang, canonical)  │
├─────────────────────────────────────┤
│ ToolPageShell                       │
│  ├─ LoadingState (article fetch)    │
│  │    └─ article-layout             │
│  │         ├─ article-header-card   │
│  │         ├─ article-content-card  │
│  │         │    └─ ArticleMarkdown   │
│  │         └─ articles-related-card  │
│  └─ (no ToolHelp/ToolRelated)        │
└─────────────────────────────────────┘
```

---

## 8. Summary

**15 tool pages** + Home + Search + Articles + Feedback + 404

**Entry points**: Root redirect, home categories, search, direct links

**CTAs**: Tool cards, copy buttons, download buttons, analyze button, form submit

**Conversion points**: Tool usage, article views, QR downloads, feedback submissions

**Top UX issues**:
1. Share flow for SEO Audit Pro doesn't preserve full state
2. RelatedTools shows ALL tools, not related ones  
3. Article language switching fallback is list page instead of article
4. No URL-persisted tool state (shared links don't restore context)
5. Some tool pages have no guidance when input is empty