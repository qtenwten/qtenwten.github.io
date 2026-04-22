# Content Pipeline Analysis — Article System

## 1. Article Data Flow (full path)

```
Cloudflare D1 (source of truth)
  │
  ▼
Cloudflare Worker API (https://fancy-scene-deeb.qten.workers.dev)
  │  Public routes: GET /articles, GET /articles/:slug
  │  Admin routes: POST /admin/articles, PATCH /admin/articles/:id, POST /admin/articles/:id/publish
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│  RUNTIME (browser)                                               │
│                                                                 │
│  articlesApi.js (API client)                                     │
│    fetchArticles(language)          → /articles                  │
│    fetchArticleBySlug(slug, lang)   → /articles/:slug           │
│    readInlineJsonPayload(scriptId)   ← __ARTICLES_INDEX_DATA__  │
│                                        ← __ARTICLE_DETAIL_DATA__ │
│    readSessionCache(key)             sessionStorage             │
│    writeSessionCache(key, value)                             │
│                                                                 │
│  ArticleStoreContext.jsx (state manager)                        │
│    fetches via articlesApi                                     │
│    manages articlesIndex + currentArticle state                │
│                                                                 │
│  ArticlePage.jsx / ArticlesIndex.jsx (consumers)                │
│    useArticleDetail(slug, language)                             │
│    useArticlesIndex(language)                                   │
│                                                                 │
│  SEO.jsx (runtime SEO tag injection)                            │
│    getRouteSeo(language, path) ← routeSeo.js                    │
│    article structuredData passed as prop                        │
│                                                                 │
│  ArticleMarkdown.jsx (renderer)                                 │
│    custom markdown parser — no external lib                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  BUILD TIME (generate-pages.js, Node.js)                        │
│                                                                 │
│  fetchArticlesIndex()           → /articles                     │
│    normalizeArticleIndexItem    ← from articleNormalization.js │
│    filterArticlesForLanguage    ← from articleLanguage.js      │
│                                                                 │
│  fetchArticleDetails(indexItems)  → /articles/:slug each       │
│    normalizeArticleDetailItem    ← from articleNormalization.js│
│                                                                 │
│  For each article:                                              │
│    articleMatchesLanguage(article, 'ru')                       │
│    articleMatchesLanguage(article, 'en')                       │
│    buildArticleDetailPage(language, article, availableLangs)   │
│                                                                 │
│  injectSeo()                                                    │
│    buildSeoTags()         ← ROUTE_SEO from routeSeo.js          │
│    buildArticleDetailPage() ← uses normalizeArticle fields     │
│                                                                 │
│  buildSitemap()                                                  │
│    lastmod = new Date().toISOString()  ← always TODAY         │
│    articleSlugLanguages[slug] = [ru, en]  ← available langs    │
│                                                                 │
│  Output: dist/{ru,en}/articles/{slug}/index.html               │
│          dist/sitemap.xml                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Cache Key Mismatch (CRITICAL BUG)

**Location:** `src/api/articlesApi.js:6` vs `src/contexts/ArticleStoreContext.jsx:16`

```
articlesApi.js line 6:
  const ARTICLES_INDEX_CACHE_KEY = 'qsen:articles:index:v4'   ← WRITES here

ArticleStoreContext.jsx line 16:
  export const ARTICLE_INDEX_KEY = 'qsen:articles:index:v5'   ← READS here (different key!)
```

**Effect on article detail:**

```
articlesApi.js line 7:
  const ARTICLE_DETAIL_CACHE_PREFIX = 'qsen:articles:detail:'   ← writes

ArticleStoreContext.jsx line 17:
  export const ARTICLE_DETAIL_KEY = (slug) => `qsen:articles:detail:${slug}`  ← reads (same pattern, OK)
```

The index cache mismatch causes `readCachedArticlesIndex()` (API) to always return `[]` while `writeCachedArticlesIndex()` (context) writes to `v5`. The next load reads `v5` but the API wrote to `v4`.

**Effect on article detail:** The detail cache key pattern matches (`qsen:articles:detail:slug`), but because the index is always empty, `getVisibleArticles()` always filters against an empty array, so related articles are never found from cache — every navigation to related articles triggers a refetch.

---

## 3. Normalization — Duplicated Logic

**File:** `src/utils/articleNormalization.js`

| Function | Used by | Output |
|---|---|---|
| `normalizeArticleBase` | only `normalizeArticleListItem` | id, slug, language, translationKey, title, excerpt, author, coverImage, publishedAt, toolSlug |
| `normalizeArticleListItem` | `articlesApi.js` (as `sharedNormalizeListItem`) | base + seoTitle, seoDescription |
| `normalizeArticle` | `articlesApi.js` (as `sharedNormalizeArticle`) | base + content, status |
| `normalizeArticleIndexItem` | `generate-pages.js` | alias of `normalizeArticleListItem` — **identical** |
| `normalizeArticleDetailItem` | `generate-pages.js` | base + seoTitle, seoDescription, content, status |

**Problems:**

1. `normalizeArticleIndexItem` is a pure alias of `normalizeArticleListItem` — no reason to exist
2. `normalizeArticle` and `normalizeArticleListItem` differ only by `+content, +status` — could be one function with optional fields
3. `normalizeArticleDetailItem` re-declares `seoTitle`/`seoDescription` which are already in `normalizeArticleListItem` (via spread)
4. API client (`articlesApi.js`) imports as `sharedNormalizeListItem` and `sharedNormalizeArticle` — renaming creates confusion about which is which
5. Build script (`generate-pages.js`) imports `normalizeArticleIndexItem` and `normalizeArticleDetailItem` — different names for effectively the same operations

---

## 4. Language Detection — Duplicated Logic

**File:** `src/utils/articleLanguage.js` (58 lines)

```
detectArticleLanguage(article)
  → if explicit language field → return it
  → sanitize text (remove URLs, markdown, symbols)
  → count Cyrillic vs Latin characters
  → cyrillicCount > latinCount ? 'ru' : 'en'

articleMatchesLanguage(article, language)
  → if language not ru/en → return true
  → if article has explicit language → compare
  → else → detectArticleLanguage()

filterArticlesForLanguage(items, language)
  → items.filter(articleMatchesLanguage(item, language))
```

**Duplicate:** `src/lib/articleLanguage.js` is **byte-for-byte identical**. It is never imported by any file.

**Usage map:**

| File | Imports | Uses |
|---|---|---|
| `articlesApi.js` | `articleMatchesLanguage`, `filterArticlesForLanguage` | filtering fetched articles |
| `ArticleStoreContext.jsx` | `articleMatchesLanguage`, `filterArticlesForLanguage` | `getVisibleArticles()` |
| `ArticlePage.jsx` | `articleMatchesLanguage`, `filterArticlesForLanguage` | related articles filtering, visible article check |
| `generate-pages.js` | `articleMatchesLanguage`, `filterArticlesForLanguage` | prerender language filtering |

All three runtime callers use the **same two functions** — no variation.

---

## 5. SEO — Triple-Layer Duplication

**Three places where SEO title/description are defined:**

### Layer 1: `src/config/routeSeo.js` (static config, ~300 lines)

```js
ROUTE_SEO['/articles'] = {
  ru: { title, description, keywords, h1, image, robots, includeInSitemap }
  en: { same structure }
}
getRouteSeo(language, path)     // merges with defaults
getAllLocalizedSeoPages()       // expands to both languages
buildSeoTags()                  // generates <meta> strings for build
buildArticleDetailPage()        // generates per-article SEO
```

### Layer 2: `src/components/SEO.jsx` (runtime component)

```jsx
const routeSeo = getRouteSeo(language, cleanPath)  // ← reads routeSeo.js
const fullTitle = title || routeSeo.title         // ← overrides from props
const fullDescription = description || routeSeo.description
```

- Reads from `routeSeo.js` for fallback
- Article pages override via `title`/`description` props
- Always outputs hreflang for **both** ru and en, regardless of whether translations exist

### Layer 3: `generate-pages.js` (build-time HTML generation)

```js
// Uses routeSeo.js's getAllLocalizedSeoPages() + buildSeoTags()
// Injects full <meta> string via replaceOrInsert()
// For articles: buildArticleDetailPage() uses article.seoTitle / article.seoDescription
```

### Layer 4: `locales/ru.json` and `locales/en.json`

```json
"seo.articles.title": "...",
"seo.articles.description": "...",
"seo.articles.keywords": "..."
```

These duplicate the article list SEO from `routeSeo.js`, but are only used by runtime `SEO.jsx` via `t('seo.articles.title')` on `ArticlesIndex` page.

**Problem:** If you change article list SEO in `routeSeo.js`, you may also need to change `locales/` — and vice versa. No single source of truth.

---

## 6. Build Script ↔ Runtime Code — Implicit Dependencies

| Dependency | Location | Risk |
|---|---|---|
| `routeSeo.js` `ROUTE_SEO`, `getLocalizedRouteUrl()`, `normalizeSeoPath()`, `getRouteSeo()` | imported by both `generate-pages.js` AND runtime `SEO.jsx` | If `routeSeo.js` changes, both build and runtime break |
| `articleLanguage.js` `articleMatchesLanguage`, `filterArticlesForLanguage` | imported by both `generate-pages.js` AND runtime `articlesApi.js`, `ArticlePage.jsx`, `ArticleStoreContext.jsx` | Must keep in sync manually |
| `articleNormalization.js` `normalizeArticleIndexItem`, `normalizeArticleDetailItem` | only `generate-pages.js` | API client uses different normalization names |
| `iconMap.js` `getIconSvg()` | only `generate-pages.js` | Runtime uses `lucide-react` — no coupling |
| `ROUTE_REGISTRY` | imported by both `generate-pages.js` AND runtime `App.jsx` | Build-time tool list must match runtime routes |
| `__ARTICLES_INDEX_DATA__` script ID | `generate-pages.js` writes, `articlesApi.js` reads | If script ID changes, runtime breaks silently |
| `__ARTICLE_DETAIL_DATA__` script ID | same | same |
| `__QSEN_PRERENDER_DATA__` global | `generate-pages.js` writes nested JSON, `main.jsx` reads via `capturePrerenderJsonPayloads()` | If JSON structure changes, hydration fails |
| `localeMessages` loaded from `src/locales/ru.json` + `en.json` | only `generate-pages.js` | Runtime uses `LanguageContext` + `import` — different mechanism |

**Implicit coupling risk:** The build script reads `src/locales/*.json` at **build time** via `fs.readFileSync()`, while runtime reads them via Vite's static import mechanism. If the JSON structure diverges, build outputs wrong SEO copy.

---

## 7. Target Content Pipeline Architecture

```
                        ┌─────────────────────────┐
                        │   Cloudflare D1          │
                        │   (source of truth)      │
                        └────────────┬────────────┘
                                     │ D1 query
                        ┌────────────▼────────────┐
                        │  Cloudflare Worker API   │
                        │  Public: GET /articles   │
                        │          GET /articles/:slug
                        │  Admin: POST/PATCH /admin│
                        └────────────┬────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                │
         ┌───────────▼──────────┐      ┌─────────────▼──────────┐
         │  BUILD TIME          │      │  RUNTIME                │
         │  (generate-pages.js) │      │  (articlesApi.js)      │
         │                      │      │                         │
         │  1. fetchArticles()   │      │  1. readInlinePayload() │
         │  2. normalize once    │      │  2. readSessionCache()   │
         │  3. inject into HTML  │      │  3. fetch if needed     │
         │  4. generate sitemap  │      │                         │
         └───────────────────────┘      └─────────────────────────┘
                           │                       │
              ┌─────────────┴───────────────────────┘
              │
   ┌──────────▼──────────────────────────────────────────┐
   │  UNIFIED NORMALIZATION LAYER (articleNormalization.js)│
   │                                                        │
   │  normalizeArticle(item, { includeContent, includeSeo })│
   │    → always returns: id, slug, language, translationKey│
   │                   title, excerpt, author, coverImage   │
   │                   publishedAt, toolSlug                │
   │    → optional: seoTitle, seoDescription, content, status│
   │                                                        │
   │  Single function. All callers use same import.          │
   └────────────────────────────────────────────────────────┘
              │
   ┌──────────▼──────────────────────────────────────────┐
   │  UNIFIED LANGUAGE LAYER (articleLanguage.js)          │
   │                                                        │
   │  detectLanguage(article)    — explicit field fallback   │
   │  matchesLanguage(a, lang)  — shared by ALL consumers   │
   │  filterByLanguage(items, lang)                        │
   │                                                        │
   │  Delete src/lib/articleLanguage.js (dead code)         │
   └────────────────────────────────────────────────────────┘
              │
   ┌──────────▼──────────────────────────────────────────┐
   │  UNIFIED CACHE LAYER (articlesCache.js)              │
   │                                                        │
   │  CACHE_VERSION = 'v5'   ← single constant            │
   │  KEYS.index   = `qsen:articles:index:${CACHE_VERSION}`│
   │  KEYS.detail  = (slug) => `qsen:articles:detail:${CACHE_VERSION}:${slug}`
   │                                                        │
   │  articlesApi.js   ← WRITES using KEYS                │
   │  ArticleStoreContext.jsx ← READS using KEYS          │
   └────────────────────────────────────────────────────────┘
              │
   ┌──────────▼──────────────────────────────────────────┐
   │  UNIFIED SEO LAYER                                   │
   │                                                        │
   │  src/config/articleSeo.js (new file)                 │
   │    ARTICLE_LIST_SEO = { ru: {...}, en: {...} }      │
   │    getArticleSeo(language, article)                  │
   │                                                        │
   │  Used by:                                             │
   │    - SEO.jsx (runtime fallback)                       │
   │    - generate-pages.js (build-time)                   │
   │    - sitemap generation                              │
   │                                                        │
   │  Remove duplicate keys from locales/                 │
   │  (seo.articles.* lives in articleSeo.js now)         │
   └────────────────────────────────────────────────────────┘
              │
   ┌──────────▼──────────────────────────────────────────┐
   │  PRERENDER PAYLOAD (embedded JSON)                   │
   │                                                        │
   │  __ARTICLE_INDEX_DATA__  = { items: [...], langs: { [slug]: [ru, en] } }
   │  __ARTICLE_DETAIL_DATA__ = { ...article, availableLangs: [ru, en] }
   │                                                        │
   │  availableLangs allows runtime to know which hreflang │
   │  links are valid without re-detecting language         │
   │                                                        │
   │  Sitemap lastmod = article.publishedAt (from D1)      │
   └────────────────────────────────────────────────────────┘
```

---

## 8. Problems Summary

| # | Problem | Severity | Files Affected |
|---|---|---|---|
| P1 | Cache key mismatch (v4 vs v5) for articles index — every load hits API | **Critical** | `articlesApi.js`, `ArticleStoreContext.jsx` |
| P2 | `src/lib/articleLanguage.js` is dead duplicate — never imported | Low (maintenance) | `src/lib/` |
| P3 | 5 normalization functions where 1 would suffice | Medium (maintenance) | `articleNormalization.js`, `articlesApi.js`, `generate-pages.js` |
| P4 | SEO data triplicated: `routeSeo.js` + `SEO.jsx` + `locales/` | Medium | `routeSeo.js`, `SEO.jsx`, `locales/`, `generate-pages.js` |
| P5 | Sitemap `lastmod` always today's date, not `publishedAt` | Medium (SEO) | `generate-pages.js:675` |
| P6 | `/articles/:slug` always redirects to `/ru/` — English articles break | Medium (SEO) | `App.jsx:225-228` |
| P7 | Runtime `SEO.jsx` always outputs hreflang for both ru+en regardless of translation existence | Low (SEO) | `SEO.jsx:65-67` |
| P8 | Build script fetches all article details (N+1 requests) even if not needed | Low (performance) | `generate-pages.js:236-248` |
| P9 | `normalizeArticleDetailItem` re-declares seoTitle/seoDescription already in `normalizeArticleListItem` | Low (correctness) | `articleNormalization.js:38-46` |
| P10 | Pre-rendered article detail HTML embeds full article content but client re-fetches anyway when slug matches | Low (performance) | `generate-pages.js`, `ArticleStoreContext.jsx` |

---

## 9. Recommendations Priority

### Quick Wins (P1, P2, P5)
1. **P1 Fix:** Change `ARTICLES_INDEX_CACHE_KEY` in `articlesApi.js:6` from `v4` to `v5` — aligns with `ArticleStoreContext.jsx:16`
2. **P2 Fix:** Delete `src/lib/articleLanguage.js` — dead code, no imports
3. **P5 Fix:** In `generate-pages.js:675`, replace `new Date().toISOString()` with article's `publishedAt` field from `buildSitemap()` loop

### Medium Changes (P3, P4, P6)
4. **P3 Fix:** Consolidate normalization — keep only `normalizeArticle(item, options)`. Update all callers (`articlesApi.js`, `generate-pages.js`) to use single function
5. **P4 Fix:** Extract article-list SEO into `src/config/articleSeo.js`, consumed by both runtime and build. Remove `seo.articles.*` from `locales/` (they duplicate `routeSeo.js`)
6. **P6 Fix:** `LegacyArticleRedirect` should accept a query param or redirect to `/ru/articles` with a note, not silently redirect English articles to Russian list

### Deep Refactors (P7, P8, P9, P10)
7. **P7 Fix:** Add `availableLangs` to prerendered article payload — runtime reads it to conditionally render hreflang
8. **P8 Fix:** Fetch only article metadata (no content) for prerender index, fetch full content only for first N articles or when explicitly needed
9. **P9 Fix:** Remove duplicate field declarations from `normalizeArticleDetailItem` (rely on spread from `normalizeArticleListItem`)
10. **P10 Fix:** Session cache read in `fetchDetail` should short-circuit if prerendered data matched — currently it always proceeds to `setDetailStatus('loading')` even when initial data was found
