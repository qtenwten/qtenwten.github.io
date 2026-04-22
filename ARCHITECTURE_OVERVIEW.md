# Architecture Overview — QSEN Utility Tools Site

## 1. Architectural Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  PAGES LAYER         │  13 tool pages + Home + Articles + etc.  │
│                      │  Self-contained, co-located CSS          │
├─────────────────────────────────────────────────────────────────┤
│  COMPONENTS LAYER    │  Shared UI + ToolPageShell + SEO          │
├─────────────────────────────────────────────────────────────────┤
│  CONTEXTS LAYER      │  Language │ Theme │ ArticleStore │ Breadcrumbs│
├─────────────────────────────────────────────────────────────────┤
│  HOOKS LAYER         │  useAsyncRequest │ useLanguageSwitcher   │
├─────────────────────────────────────────────────────────────────┤
│  UTILS LAYER         │  Business logic (calculators, generators)│
├─────────────────────────────────────────────────────────────────┤
│  API LAYER           │  articlesApi.js (Worker API client)       │
├─────────────────────────────────────────────────────────────────┤
│  CONFIG LAYER        │  routeRegistry │ routeSeo │ searchIndex   │
├─────────────────────────────────────────────────────────────────┤
│  BUILD-TIME LAYER   │  generate-pages.js (prerender + sitemap)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow Map

```
                    ┌──────────────────────────────────┐
                    │     index.html (static HTML)    │
                    │  + prerendered page shells       │
                    │  + __ARTICLES_INDEX_DATA__        │
                    │  + __ARTICLE_DETAIL_DATA__        │
                    └──────────────┬───────────────────┘
                                   │ hydration
                    ┌──────────────▼───────────────────┐
                    │         main.jsx                 │
                    │  capturePrerenderJsonPayloads()  │
                    │  → window.__QSEN_PRERENDER_DATA__│
                    └──────────────┬───────────────────┘
                                   │ createRoot / hydrateRoot
                    ┌──────────────▼───────────────────┐
                    │            App.jsx                │
                    │  BrowserRouter → Routes → Pages   │
                    │  ScrollManager (scroll position) │
                    │  Focus management on navigation   │
                    └──────────────┬───────────────────┘
                                   │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
    ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
    │  Contexts  │          │   Pages   │          │  Config   │
    │            │          │           │          │           │
    │ Language   │          │ ToolPage  │◄────────│ routeRegistry │
    │ Theme      │          │ Home      │          │ routeSeo  │
    │ ArticleStore│          │ QRCode    │          └───────────┘
    │ Breadcrumbs│          │ Articles  │
    └─────┬──────┘          └─────┬─────┘
          │                       │
          │           ┌───────────┴───────────┐
          │           │                       │
    ┌─────▼───────────▼─────┐    ┌────────────▼────────┐
    │     articlesApi.js     │    │      utils/         │
    │                        │    │  (business logic)   │
    │ fetchArticles()        │    │  numberToWords      │
    │ fetchArticleBySlug()   │    │  vatCalculator      │
    │ readInitialArticles()  │    │  passwordGenerator │
    │ sessionStorage cache   │    │  seoAudit*.js       │
    └───────────┬────────────┘    └─────────────────────┘
                │                        │
                │  fetch / cache         │ direct import
                ▼                        ▼
    ┌─────────────────────────────────────────┐
    │   Cloudflare Worker API                  │
    │   https://fancy-scene-deeb.qten.workers │
    └─────────────────────────────────────────┘

  SEO/PRE-RENDER PIPELINE:

    build time: generate-pages.js
                │
                ├─► fetch articles from Worker API
                ├─► build prerendered HTML per locale
                │   (tool pages, home, articles index, article detail)
                └─► sitemap.xml
                    │
                    ▼
                dist/*.html (static files)
```

### Rendering Paths

| Page | Strategy |
|------|----------|
| Tool pages (most) | Pre-rendered shell + client hydration |
| `/qr-code-generator` | Client-only (no pre-render) |
| `/articles` | Client-only (no pre-render) |
| `/articles/:slug` | Pre-rendered + client hydration |
| Home `/` | Pre-rendered + skip hydration |
| Error pages | Client-side only |

---

## 3. Responsibility Zones

### 3.1 Routing
**Files**: `App.jsx`, `routes/lazyPages.js`, `config/routeRegistry.js`

- **Route registration** (`routeRegistry.js`): path → componentKey mapping, category metadata, showOnHome flags
- **Lazy loading** (`lazyPages.js`): all pages use `lazy()` with attached `.preload()` for prefetching
- **Route rendering** (`App.jsx`): doubled routes for `/ru/*` and `/en/*`, article routes, legacy redirects
- **Idle prefetch**: `preloadLikelyRoutes()` called via `requestIdleCallback` on mount

**Issue**: Route config is duplicated across `routeRegistry.js` and `routeSeo.js`.

### 3.2 Content / Articles
**Files**: `api/articlesApi.js`, `contexts/ArticleStoreContext.jsx`, `pages/ArticlePage.jsx`, `pages/ArticlesIndex.jsx`, `utils/articleLanguage.js`, `utils/articleNormalization.js`, `lib/articleLanguage.js`

- **API layer** (`articlesApi.js`): fetch, cache (sessionStorage), reads pre-rendered payloads
- **State** (`ArticleStoreContext.jsx`): index + detail state, language filtering, cache key mismatch bug
- **Article pages**: SSR-like data injection via inline JSON (`__ARTICLES_INDEX_DATA__`, `__ARTICLE_DETAIL_DATA__`)
- **Normalization**: `articleNormalization.js` handles field mapping (snake_case ↔ camelCase)
- **Language detection**: `articleLanguage.js` uses cyrillic/latin ratio heuristic

**Issues**:
- `src/lib/articleLanguage.js` is an exact duplicate of `src/utils/articleLanguage.js`
- `ArticleStoreContext` has ballooned to 191 lines with mixed responsibilities
- `ArticlePage.jsx` is a **God Object** — handles SEO, hreflang, analytics, related articles, translation switching, all in one component

### 3.3 Analytics
**Files**: `utils/analytics.js`

- Singleton `AnalyticsService` with in-memory handlers array
- `on()` / `emit()` pattern — pages subscribe via `analytics.track*()` methods
- Also pushes to `window.gtag` (Google Analytics)
- Session ID generated client-side: `qsen_${timestamp}_${random}`

**Issue**: Analytics service is global mutable singleton with no cleanup on unmount.

### 3.4 i18n
**Files**: `contexts/LanguageContext.jsx`, `locales/ru.json`, `locales/en.json`

- Flat JSON key-value store (e.g., `tools.vatCalculator.title`)
- `t(key)` function traverses nested keys at runtime
- Language detection: URL path → localStorage → navigator.language
- No build-time key validation; DEV-only warnings in `routeRegistry.js`

**Issue**: No compile-time checking of translation keys.

### 3.5 Theming
**Files**: `contexts/ThemeContext.jsx`, `utils/storage.js`

- `data-theme` attribute on `<html>` + `<body>`
- Blocking inline script sets `window.__QSEN_INITIAL_THEME__` before first paint
- Sync `useLayoutEffect` prevents flicker
- localStorage persistence via `safeSetItem` wrapper

**Note**: Well-implemented — prevents FOUC effectively.

### 3.6 Caching
**Files**: `api/articlesApi.js`, `utils/apiCache.js`

- **Article API**: sessionStorage with TTL (10 min)
- **Cache key mismatch**: `articlesApi.js` uses `v4`, `ArticleStoreContext.jsx` uses `v5` — stale/missing data on client
- **In-memory cache**: `APICache` class with TTL in `apiCache.js` (used for SEO audit results)
- **Pre-rendered data**: captured in `main.jsx` before hydration via `capturePrerenderJsonPayloads()`

### 3.7 Error Handling
**Files**: `components/ErrorBoundary.jsx`, `components/AppErrorBoundary.jsx`, `utils/errorMonitor.js`

- `ErrorBoundary` (class component): catches React errors, shows fallback UI with language detection from URL path
- `AppErrorBoundary`: wraps entire app in `App.jsx`
- `errorMonitor.js`: global window listeners for `error` and `unhandledrejection`, in-memory buffer of 50 errors, only active in PROD

**Issue**: `ErrorBoundary` does `window.location.pathname.startsWith('/en')` — this is logic leakage into the rendering component.

### 3.8 Loading States
**Files**: `components/LoadingState.jsx`, `components/RouteSkeleton.jsx`, `hooks/useAsyncRequest.js`

- `LoadingState`: handles idle/loading/success/error states with skeleton UI and retry action
- `RouteSkeleton`: Suspense fallback during React lazy loading
- `useAsyncRequest`: request deduplication, stale request detection, task marking for async effects

---

## 4. Bottlenecks, Coupling, God Objects, Weak Module Boundaries

### 4.1 Bottlenecks

**ArticleStoreContext (191 lines)** — single context doing too much:
- Manages articles index state
- Manages current article detail state
- Two separate data fetching flows with different cache strategies
- Language ref + language switch callback
- TTL-based sessionStorage caching

**ArticlePage.jsx (~200 lines)** — violates Single Responsibility:
- SEO meta tags + structuredData + hreflang + canonical
- Analytics tracking (`trackArticleViewed`)
- Related articles computation + rendering
- Translation key logic for multilingual slugs
- Breadcrumb title propagation
- `useArticleDetail` + `useArticlesIndex` + `useBreadcrumbs` — 3 context hooks

**generate-pages.js (749 lines)** — monolithic build script:
- 400+ lines for `buildHomePrerenderContent()` (category markup, trust badges, tool cards, article cards — all inline HTML strings)
- Hardcoded sets duplicate route metadata
- No separation between fetching, transforming, generating

### 4.2 Coupling

| Relationship | Coupling Type |
|--------------|---------------|
| `articlesApi.js` imports `utils/articleNormalization.js` | Low — good separation |
| `generate-pages.js` imports from `src/utils/` and `src/config/` | High — build-time code depends on app code |
| `App.jsx` imports `pages/RandomNumber.css` | Cross-page CSS import |
| `articlesApi.js` ↔ `ArticleStoreContext.jsx` | Cache key version mismatch coupling |
| `ArticlePage.jsx` imports `utils/analytics` directly | Analytics coupling in page component |
| `SEO.jsx` depends on `routeSeo.js` for defaults | Config coupling in component |
| `ErrorBoundary.jsx` checks `window.location.pathname` | URL coupling in error boundary |

### 4.3 God Objects

1. **ArticlePage.jsx** — handles: SEO, analytics, related articles, multilingual routing, breadcrumbs, article fetching — should be split into `ArticleSeo`, `ArticleContent`, `RelatedArticles`, `ArticlePageController`
2. **ArticleStoreContext.jsx** — manages two independent data domains (index + detail) with different lifecycles, should be split into two contexts or use a reducer
3. **Home.jsx** — has inline JSX for 4 category icons instead of using `Icon` component

### 4.4 Weak Module Boundaries

- **Config ↔ Build**: `routeRegistry.js` and `routeSeo.js` are two separate configs for the same data (routes). Build script has a third opinion (`TOOL_PAGE_SHELL_PATHS`, `CLIENT_RENDER_TOOL_PATHS`, `PRERENDER_TOOL_HERO_CONFIG`)
- **`src/lib/` vs `src/utils/`**: unclear why `lib/` exists — it contains only an exact duplicate of `articleLanguage.js`
- **Utils**: `numberToWords.js` and `numberToWordsUtils.js` are complementary but `numberToWordsUtils.js` has no imports from `numberToWords.js` — potential drift
- **SEO split**: runtime (`SEO.jsx`) vs static config (`routeSeo.js`) vs build-time injection (`generate-pages.js`) — three places for the same concern

### 4.5 Duplicated Code

| File A | File B | Type |
|--------|--------|------|
| `src/utils/articleLanguage.js` | `src/lib/articleLanguage.js` | **Exact duplicate** |
| `routeRegistry.js` | `routeSeo.js` | Same route data, different shape |
| `generate-pages.js` (path sets) | `routeRegistry.js` | Hardcoded path lists duplicate registry metadata |
| `src/components/ErrorBoundary.jsx` | `src/components/AppErrorBoundary.jsx` | Both error boundary implementations |
| `numberToWords.js` (pluralize) | `numberToWordsUtils.js` (pluralizeMinor) | Same pluralization logic, different currencies |

---

## 5. Architectural Improvement Recommendations

### Priority 1: Critical Bugs (High Impact / Low Effort / Low Risk)

**1. Fix cache key mismatch** (`articlesApi.js` v4 vs `ArticleStoreContext.jsx` v5)
- Impact: Silent data loss — sessionStorage cache written by API not readable by store
- Effort: 1 line fix
- Risk: Low — fixes stale data bug

**2. Delete `src/lib/` directory** (contains only exact duplicate of `articleLanguage.js`)
- Impact: Removes maintenance hazard, resolves confusion about module purpose
- Effort: 1 delete operation
- Risk: Low — verify no imports to `src/lib/` before deleting

### Priority 2: Data Consistency (Medium Impact / Medium Effort / Low Risk)

**3. Derive `routeSeo.js` from `routeRegistry.js` + locale strings**
- Instead of maintaining 300 lines of static SEO data, auto-generate titles from `titleKey` + locale
- Impact: Single source of truth for routes; adding new route = update one file
- Effort: ~2 hours refactoring
- Risk: Medium — requires careful migration, SEO values must be preserved

**4. Extract hardcoded path sets from `generate-pages.js`**
- `TOOL_PAGE_SHELL_PATHS`, `CLIENT_RENDER_TOOL_PATHS`, `PRERENDER_TOOL_HERO_CONFIG` should be computed from `routeRegistry.js` metadata
- Impact: Eliminates duplicate metadata maintenance
- Effort: ~1-2 hours
- Risk: Low — purely mechanical refactor

### Priority 3: Component Refactoring (High Impact / High Effort / Medium Risk)

**5. Split `ArticlePage.jsx`** into smaller focused components:
- `ArticleSeo` — SEO meta, structuredData, hreflang, canonical
- `ArticleContent` — content rendering with `ArticleMarkdown`
- `RelatedArticles` — sidebar with related articles
- `ArticlePageController` — orchestrates data fetching and wires children

**6. Split `ArticleStoreContext.jsx`** into two contexts:
- `ArticleIndexContext` — manages articles index
- `ArticleDetailContext` — manages current article

### Priority 4: Build Architecture (Medium Impact / High Effort / Medium Risk)

**7. Extract prerender content building from `generate-pages.js` into dedicated modules**
- `lib/prerender/home.js`, `lib/prerender/toolPage.js`, `lib/prerender/article.js`
- Impact: Improved maintainability, testability of prerender logic
- Effort: ~4-6 hours
- Risk: Medium — breaking changes to build output

**8. Replace inline HTML string building with template approach or JSX output**
- Current approach: 400+ lines of HTML string concatenation in `buildHomePrerenderContent()`
- Alternative: Use Vite plugin to pre-render React components at build time
- Impact: Better type safety, less error-prone
- Effort: ~8 hours
- Risk: High — significant change to build pipeline

### Priority 5: Cleanup & Polish (Low Impact / Low Effort / Low Risk)

**9. Audit `numberToWordsUtils.js` usage**
- Check if it's imported anywhere; if not, delete
- If yes, review overlap with `numberToWords.js` and consider merging

**10. Move page-level CSS to component-level or global**
- `App.jsx` imports `pages/RandomNumber.css` — unusual cross-page import
- Consolidate into `src/styles/` or co-located with component

### Summary Table

| # | Improvement | Impact | Effort | Risk |
|---|-------------|--------|--------|------|
| 1 | Fix cache key v4/v5 mismatch | HIGH | LOW | LOW |
| 2 | Delete `src/lib/` | MEDIUM | LOW | LOW |
| 3 | Derive routeSeo from routeRegistry | HIGH | MEDIUM | LOW |
| 4 | Extract path sets from build script | MEDIUM | MEDIUM | LOW |
| 5 | Split ArticlePage.jsx | HIGH | HIGH | MEDIUM |
| 6 | Split ArticleStoreContext | MEDIUM | HIGH | MEDIUM |
| 7 | Modularize generate-pages.js | MEDIUM | HIGH | MEDIUM |
| 8 | Replace inline HTML with template approach | MEDIUM | HIGH | HIGH |
| 9 | Audit numberToWordsUtils.js | LOW | LOW | LOW |
| 10 | Consolidate page CSS | LOW | LOW | LOW |

**Recommended order**: Start with #1 (cache bug) and #2 (dead code), then #3 and #4 (data consistency), then #5 (component split) if scope allows.