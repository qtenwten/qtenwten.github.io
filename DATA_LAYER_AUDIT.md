# Data Layer Audit — State Management & Caching

## 1. All Data Fetching Points

### Runtime (browser)

| Location | Type | Fetch Function | Cache | Storage |
|---|---|---|---|---|
| `articlesApi.js` | Remote API | `fetchArticles()`, `fetchArticleBySlug()` | `sessionStorage` | articles index + detail |
| `articlesApi.js` | Inline JSON | `readInlineJsonPayload()` | none | prerendered HTML payload |
| `seoAuditApi.js` | Remote API | `requestWorkerAudit()` | `seoAuditCache` (in-memory) | SEO audit results |
| `Feedback.jsx:85` | Remote API | `fetch()` to `apifeedback.qten.workers.dev` | none | form submission |
| `URLShortener.jsx:65` | Remote API | `fetch()` to `is.gd/create.php` | none | URL shortening |
| `SEOAudit.jsx:29` | Browser fetch | `analyzeSEO()` — fetches target URL directly (CORS) | none | client-side page audit |
| `GraphPanel.jsx` | None | synchronous | none | expression parsing |

### Build-time only

| Location | Type | Source |
|---|---|---|
| `generate-pages.js:188` | `fetch()` to Worker API | article index for prerender |
| `generate-pages.js:219` | `fetch()` to Worker API | article detail for each slug |

---

## 2. State Storage Map

### Contexts (global state)

| Context | State Stored | Where It Lives |
|---|---|---|
| `LanguageContext` | `language` ('ru'\|'en'), `t()` function | React context + localStorage |
| `ArticleStoreContext` | `articlesIndex[]`, `currentArticle`, `indexStatus`, `detailStatus`, `indexError`, `detailError` | React state inside context |
| `BreadcrumbsContext` | `articleTitle` (string) | React state — minimal |
| `ThemeContext` | `theme` ('light'\|'dark'), `toggleTheme()` | React state + localStorage |

### Local component state

| Page/Component | Local State Variables |
|---|---|
| `SEOAudit` | `url`, `loading`, `result`, `error` |
| `SEOAuditPro` | `url`, `loading`, `result`, `error`, `checkFilter`, `rawOpen` |
| `URLShortener` | `longUrl`, `shortUrl`, `loading`, `error`, `history` |
| `Feedback` | `formData`, `status` ('idle'\|'sending'\|'success'\|'pending'\|'error'), `statusMessage` |
| `NumberToWords` | `number`, `currency`, `withMinor`, `taxMode`, `taxRate`, `separator`, `pinnedVariantId`, `result` |
| `VATCalculator` | `amount`, `rate`, `mode`, `result` |
| `RandomNumber` | `min`, `max`, `count`, `unique`, `result`, `error` |
| `CompoundInterest` | `principal`, `rate`, `years`, `compoundFrequency`, `monthlyContribution`, `result` |
| `DateDifferenceCalculator` | `mode`, `startDate`, `endDate`, `startDateTime`, `endDateTime`, `targetDateTime`, `countdown`, `countdownError` |
| `QRCodeGenerator` | ~15 state variables (qrType, qrForm, qrSize, colors, logo, qrCodeLib, etc.) |
| `CalculatorPanel` | `result`, `error` |
| `GraphPanel` | `error` |

### Cached API results

| Cache | Location | Mechanism | TTL | What's Cached |
|---|---|---|---|---|
| Articles index | `articlesApi.js` ↔ `ArticleStoreContext` | `sessionStorage` | 10 min | Full article list |
| Article detail | `articlesApi.js` ↔ `ArticleStoreContext` | `sessionStorage` | 10 min | Per-slug article |
| SEO audit | `SEOAuditPro.jsx` | `APICache` (in-memory `Map`) | 10 min | Per-URL audit result |
| Theme | `ThemeContext` | `localStorage` | permanent | `'dark'`\|`'light'` |
| Language | `LanguageContext` | `localStorage` | permanent | `'ru'`\|`'en'` |
| URL shortener history | `URLShortener.jsx` | `localStorage` | permanent | array of `{long, short, date}` |

### Derived state

| Location | Derivation |
|---|---|
| `ArticlePage.jsx:42-44` | `localizedRelatedArticles = filterArticlesForLanguage(allArticles, language)` — computed on every render |
| `ArticlePage.jsx:65-73` | `translatedSlugs` — finds RU/EN slugs by `translationKey` from index |
| `ArticlesIndex.jsx` | `featuredArticle = articles[0]`, `sidebarArticles = articles.slice(1,4)` — derived from articles array |
| `ArticlePage.jsx:91-95` | `visibleRelatedArticles` — filters and slices `localizedRelatedArticles` |
| `ArticleStoreContext.jsx:45-47` | `getVisibleArticles(language)` — `filterArticlesForLanguage` over `articlesIndex` |

---

## 3. Duplicated Fetch Logic

### Pattern 1: Duplicate readCachedArticlesIndex / readInitialArticlesIndex

`useLanguageSwitcher.js:76-79` reads both initial and cached articles index directly from `articlesApi.js`:

```js
const seededTargetIndex = readInitialArticlesIndex(newLang)
const cachedTargetIndex = readCachedArticlesIndex()
const translatedFromCache = findTranslatedSlug(
  seededTargetIndex.length ? seededTargetIndex : cachedTargetIndex,
  translationKey,
  newLang,
)
```

This is the **same data** that `ArticleStoreContext` already manages, but `useLanguageSwitcher` re-reads it directly from the API module instead of using the context. The context and the hook both import from `articlesApi.js`, but the hook duplicates the cache-reading logic.

### Pattern 2: SEO audit — two fetch paths in one place

`SEOAuditPro.jsx:104-143` has two fetch strategies in one function:

1. **Primary**: `requestWorkerAudit()` → Worker API
2. **Fallback**: `analyzeSEO()` → direct browser fetch of target URL (CORS)

The fallback is triggered only on network/parse failure. Both paths share the same `setLoading(true/false)`, `setResult()`, `setError()` calls — but the fallback is buried inside the `catch` block and doesn't set `loading(false)` in its own path correctly (it relies on the outer `finally`).

### Pattern 3: URL shortener — raw fetch, no abstraction

`URLShortener.jsx:65` does a raw `fetch()` call inline:

```js
const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(urlToShorten)}`, { signal })
```

No API client module. No error normalization. Error handling is inline in the `runRequest` wrapper but the fetch itself is not abstracted.

### Pattern 4: Feedback — raw fetch with inline timeout

`Feedback.jsx:85` also does a raw `fetch()` with a manual `setTimeout`/`clearTimeout` for timeout handling — not using `useAsyncRequest`'s built-in abort mechanism:

```js
const timeoutId = window.setTimeout(() => { abort() }, FEEDBACK_REQUEST_TIMEOUT_MS)
// ... then manually clearTimeout in finally
```

---

## 4. Repeated Loading/Error Handling

### LoadingState component

Two interfaces for loading/error:

**Interface A** — `status` string: `'idle' | 'loading' | 'success' | 'error'`
- Used by: `ArticleStoreContext` (`indexStatus`, `detailStatus`)
- Used by: `ArticlesIndex`, `ArticlePage` via `useArticlesIndex()` / `useArticleDetail()`
- Consumed by: `LoadingState` component (renders skeletons or error state)

**Interface B** — separate `loading` boolean + `error` string
- Used by: `SEOAudit`, `SEOAuditPro`, `URLShortener`, `Feedback`

**Interface C** — `result` + implicit loading (result is synchronous)
- Used by: `NumberToWords`, `VATCalculator`, `RandomNumber`, `CompoundInterest`, `CalculatorPanel`, `GraphPanel`

### Error handling patterns

| Page | Error State | Error Display | Retry |
|---|---|---|---|
| `ArticlesIndex` | `indexError` from context | `LoadingState` with `errorTitle/errorDescription` | `refetch()` |
| `ArticlePage` | `detailError` from context | `LoadingState` with conditional 404 message | `refetch()` |
| `SEOAudit` | `error` local state | inline `ResultNotice` with hardcoded Cyrillic | none |
| `SEOAuditPro` | `error` local state | inline `ResultNotice` | none |
| `URLShortener` | `error` local state | `<div className="error">` | none |
| `Feedback` | `status` enum | `alert` divs with role="alert" | none |
| `NumberToWords` | none (sync) | none | none |
| `QRCodeGenerator` | `generationError` local state | inline text | none |

### LoadingState language detection (URL inspection — BAD)

`LoadingState.jsx:36-47` inspects `window.location.pathname` to determine error message language:

```jsx
{window.location.pathname.startsWith('/en')
  ? 'Could not load data'
  : 'Не удалось загрузить данные'}
```

Should use `LanguageContext` instead. This is a known issue (noted in I18N_AUDIT).

---

## 5. Inconsistent Caching

### Cache key mismatch — CRITICAL (already documented in CONTENT_PIPELINE.md)

```
articlesApi.js:6    → ARTICLES_INDEX_CACHE_KEY = 'qsen:articles:index:v4'   (WRITES)
ArticleStoreContext.jsx:16 → ARTICLE_INDEX_KEY  = 'qsen:articles:index:v5'    (READS)
```

The API client writes to `v4` but the context reads from `v5`. Session storage cache is effectively broken for the articles index.

### Article detail cache key mismatch — OK (pattern matches)

```
articlesApi.js:7    → ARTICLE_DETAIL_CACHE_PREFIX = 'qsen:articles:detail:'  (WRITES)
ArticleStoreContext.jsx:17 → ARTICLE_DETAIL_KEY = slug => `...detail:${slug}`  (READS)
```

These match in pattern so detail cache works.

### SEO audit cache — separate from articles cache

`seoAuditCache` is an `APICache` class (in-memory `Map` with TTL). It's a completely different caching system from the `sessionStorage`-based article cache. No shared infrastructure.

### localStorage wrappers vs direct usage

`storage.js` provides `safeGetItem`/`safeSetItem` with try/catch, but:
- `ThemeContext` uses it (good)
- `LanguageContext` uses it (good)
- `URLShortener` uses it directly (`safeSetItem('urlShortenerHistory', JSON.stringify(...))`)
- `useLanguageSwitcher` uses `safeSetItem` directly for language persistence

No enforcement mechanism — any component can use raw `localStorage`.

---

## 6. Side Effects Inside Contexts

### `ArticleStoreContext` — fetch inside context callback (side effect)

`ArticleStoreContext.jsx:49-69` — `fetchIndex` is a `useCallback` that calls `fetchArticles()` (async) and updates state:

```js
const fetchIndex = useCallback(async (language, { force = false } = {}) => {
  // ...
  const items = await fetchArticles(lang)
  setArticlesIndex(items)
  writeCachedArticlesIndex(items)
  // ...
}, [])
```

This is normal — callbacks that trigger fetches are expected in contexts.

### `useLanguageSwitcher` — data access as side effect (ABNORMAL)

`useLanguageSwitcher.js:32-36` reads from cache during a **render** (not inside a useEffect or event handler):

```js
function readTranslationKeyForCurrentArticle(slug, currentLanguage) {
  const seeded = readInitialArticleDetail(slug, currentLanguage)
  const cached = seeded || readCachedArticleDetail(slug, currentLanguage)  // ← called during render
  return cached?.translationKey || cached?.translation_key || ''
}
```

This is called inside `switchLanguage()` (line 74), which is an event handler — so it's not during render. But the function reads `readCachedArticleDetail` which touches `sessionStorage` synchronously.

### `LanguageContext` — useEffect on pathname change

`LanguageContext.jsx:23-44` — `useEffect` runs on every `location.pathname` change, reads `navigator.language`, writes to localStorage:

```js
useEffect(() => {
  // ...
  const browserLang = navigator.language.toLowerCase()
  const detectedLang = browserLang.startsWith('ru') ? 'ru' : 'en'
  setLanguage(detectedLang)
  safeSetItem('language', detectedLang)
}, [location.pathname])
```

This side-effect (localStorage write) is inside `useEffect` — correct.

### `ThemeContext` — useLayoutEffect for synchronous theme apply

`ThemeContext.jsx:33-39` — `useLayoutEffect` for DOM + localStorage writes:

```js
useLayoutEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)
  document.body?.setAttribute('data-theme', theme)
  safeSetItem(THEME_STORAGE_KEY, theme)
  document.documentElement.removeAttribute('data-theme-init')
}, [theme])
```

Correct — synchronous DOM write before paint prevents flicker.

---

## 7. Places That Need Unified Store / Hook / Abstraction

### 7.1 useAsyncRequest — already exists but underused

`useAsyncRequest` provides request deduplication and abort. It's used by:
- `URLShortener` ✓
- `Feedback` ✓
- `SEOAuditPro` ✓

It's **NOT used by**:
- `SEOAudit` — manual loading/error state (should use it)
- All article pages — they go through context (different pattern — acceptable)

**Recommendation:** Extract a `useRemoteRequest` hook that wraps `useAsyncRequest` with loading/error state management.

### 7.2 No shared API client for URLShortener and Feedback

Both `URLShortener.jsx` and `Feedback.jsx` have inline `fetch()` calls with error handling that duplicates patterns in `articlesApi.js` and `seoAuditApi.js`.

**Recommendation:** Create `src/api/urlShortenerApi.js` and `src/api/feedbackApi.js` with:
- `requestJson()` wrapper (like `articlesApi.js`)
- Timeout handling
- Error normalization
- `sessionStorage` caching where appropriate

### 7.3 No unified data-fetching hook for tool pages

Each tool page that fetches has its own `useState` + `useEffect` or `useAsyncRequest` pattern. There is no `useFetch` or `useRemoteData` hook.

**Recommendation:** Create `useRemoteData(fetchFn, { cacheKey, ttl })` that:
- Manages `data`, `loading`, `error` state
- Reads from `sessionStorage` cache if available and fresh
- Writes to `sessionStorage` on success
- Supports abort via `useAsyncRequest`

### 7.4 ArticleStoreContext does too much

`ArticleStoreContext` manages:
1. Articles **index** (list of all articles)
2. Article **detail** (current article)
3. Cache read/write
4. Language filtering
5. Fetch orchestration

**Problems:**
- `fetchIndex` and `fetchDetail` are tightly coupled
- `getVisibleArticles` re-filters on every call even though `articlesIndex` doesn't change that often
- Initial payload reading is done via `readInitialArticlesIndex('ru')` hardcoded — should detect language from context

**Recommendation:** Split into `ArticleIndexContext` and `ArticleDetailContext`, or create separate hooks: `useArticleIndex()` (already exists via re-export) and `useArticleDetail()`.

### 7.5 LoadingState needs context, not URL inspection

`LoadingState` determines language by inspecting `window.location.pathname`. Should accept `language` prop or use `useLanguage()` inside.

### 7.6 No shared error display abstraction

Error display is done differently everywhere:
- `LoadingState` (for article pages)
- `ResultNotice` with hardcoded `tone="error"` (SEOAudit, SEOAuditPro)
- `<div className="error">` (URLShortener)
- `alert` divs (Feedback)

**Recommendation:** Create a `<ErrorMessage>` or `<StatusMessage>` component that accepts `type`, `message`, and handles role/aria-live correctly.

---

## 8. Problems Summary

| # | Problem | Severity | Location |
|---|---|---|---|
| D1 | Cache key mismatch `v4` vs `v5` — articles index cache broken | **Critical** | `articlesApi.js:6`, `ArticleStoreContext.jsx:16` |
| D2 | `LoadingState` uses `window.location.pathname` for language instead of context | Medium | `LoadingState.jsx:36,45` |
| D3 | `useLanguageSwitcher` reads article cache directly instead of using `ArticleStoreContext` | Medium | `useLanguageSwitcher.js:76-82` |
| D4 | `URLShortener` and `Feedback` have inline `fetch()` with no shared API client | Medium | `URLShortener.jsx:65`, `Feedback.jsx:85` |
| D5 | `SEOAudit` doesn't use `useAsyncRequest` — manual loading/error management | Low | `SEOAudit.jsx:14-45` |
| D6 | `seoAuditCache` is a separate in-memory cache system with no shared infrastructure | Low | `apiCache.js` |
| D7 | `ArticleStoreContext` re-filters `getVisibleArticles` on every call (no memoization of filtered result) | Low | `ArticleStoreContext.jsx:45-47` |
| D8 | `fetchDetail` in context always sets `setDetailStatus('loading')` even when initial data was found | Low | `ArticleStoreContext.jsx:88` |
| D9 | `LanguageContext` reads `navigator.language` on every pathname change — minor perf | Low | `LanguageContext.jsx:34` |
| D10 | `ArticleStoreContext` hardcodes `readInitialArticlesIndex('ru')` instead of using current language | Low | `ArticleStoreContext.jsx:27` |

---

## 9. Recommended Architecture

```
src/
  api/
    articlesApi.js       ← existing
    urlShortenerApi.js   ← NEW: wraps is.gd fetch
    feedbackApi.js       ← NEW: wraps feedback worker fetch
    seoAuditApi.js       ← existing (already separate)
    apiCache.js          ← existing (APICache class)

  hooks/
    useAsyncRequest.js   ← existing
    useRemoteData.js     ← NEW: unified data fetch hook
                              - manages loading/error/data state
                              - sessionStorage cache
                              - abort support via useAsyncRequest
                              - SSR-safe (no sessionStorage on server)

  contexts/
    LanguageContext.jsx    ← existing
    ThemeContext.jsx       ← existing
    BreadcrumbsContext.jsx ← existing
    ArticleIndexContext.jsx ← NEW: split from ArticleStoreContext
                                  - articlesIndex, indexStatus, indexError
                                  - fetchIndex(), getVisibleArticles()
                                  - readInitialArticlesIndex / readCachedArticlesIndex / writeCachedArticlesIndex
    ArticleDetailContext.jsx ← NEW: split from ArticleStoreContext
                                   - currentArticle, detailStatus, detailError
                                   - fetchDetail(), clearDetail()
                                   - readInitialArticleDetail / readCachedArticleDetail / writeCachedArticleDetail

  components/
    LoadingState.jsx    ← refactor: accept language prop or use useLanguage()
    ErrorMessage.jsx     ← NEW: unified error display (role="alert", aria-live)
    StatusMessage.jsx    ← NEW: unified status display (success/error/pending/info)
```

---

## 10. Quick Wins (no refactor needed)

1. **Fix D1:** Change `ARTICLES_INDEX_CACHE_KEY` in `articlesApi.js:6` from `v4` to `v5`
2. **Fix D10:** Change `readInitialArticlesIndex('ru')` to `readInitialArticlesIndex('ru')` but also call `readInitialArticlesIndex(languageRef.current)` for the actual language
3. **Fix D8:** In `fetchDetail`, check if `initial` was found and skip `setDetailStatus('loading')` in that path
4. **Fix D2:** Add `language` prop to `LoadingState` (optional, falls back to URL inspection for backward compat)
