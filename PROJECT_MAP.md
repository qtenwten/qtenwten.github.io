# Project Structure Map — QSEN Utility Tools Site

## 1. Directory Overview

```
src/
├── api/               # Data layer — articles API client
├── components/        # Shared UI components
│   ├── articles/      # Article-specific components
│   ├── calculator/    # Calculator-specific components
│   └── *.jsx/css      # Standalone components
├── config/            # Static configuration (routes, SEO)
├── contexts/          # React contexts (state management)
├── hooks/             # Custom React hooks
├── icons/             # (empty/implied via lucide-react)
├── lib/               # Unclear purpose — contains duplicate code
├── locales/           # i18n JSON files (ru.json, en.json)
├── pages/             # Page components + page-level CSS
├── routes/            # Lazy page loading + route preloading
├── styles/            # Global styles
├── utils/             # Business logic utilities
└── main.jsx           # React entry point

scripts/
└── generate-pages.js  # Pre-render/build-time page generation

BD/                    # Article publishing workflow (out of scope for frontend map)
```

## 2. Entry Points

| File | Purpose |
|------|---------|
| `src/main.jsx` | React hydration/mounting — captures prerender payloads |
| `src/App.jsx` | Main router, layout shell, ScrollManager, locale switch logic |
| `scripts/generate-pages.js` | Build-time HTML generator for static hosting |

## 3. Layer Analysis

### Pages Layer (`src/pages/`)

13 tool pages + Home + ArticlesIndex + ArticlePage + SearchResults + NotFound + Feedback

**Pattern**: Each page is a self-contained unit with co-located CSS (`*.css`).
- No shared page base class
- Mixed patterns: some use `ToolPageShell`, some use custom wrappers
- `RandomNumber.css` imported in `App.jsx` (跨页导入 — smell)

**Pages that are fully client-rendered**: `/qr-code-generator`, `/articles`
**Pages with pre-rendered shells**: Most others via `generate-pages.js`

### Components Layer (`src/components/`)

| Component | Purpose |
|-----------|---------|
| `Header`, `Footer` | Layout shell |
| `ToolPageShell` | Common tool page wrapper |
| `ToolDescriptionSection` | Tool hero/description block |
| `ResultSection` | Calculation result display |
| `RelatedTools` | Cross-link to related tools |
| `LanguageSwitcher`, `ThemeSwitcher` | Preference controls |
| `SEO` | Runtime meta tag injection (uses react-helmet-async) |
| `LoadingState`, `RouteSkeleton` | Loading states |
| `ErrorBoundary`, `AppErrorBoundary` | Error handling |
| `Breadcrumbs` | Navigation breadcrumb trail |
| `CopyButton`, `CustomSelect`, `LineChart`, `Icon` | Utility UI |
| `calculator/` | HistoryPanel, GraphPanel, ModeSwitcher, CalculatorPanel |
| `articles/` | ArticleMarkdown |

**Observation**: `SEO.jsx` is a runtime wrapper; actual SEO config lives in `routeSeo.js`. Two concerns split across layers.

### Business Logic Layer (`src/utils/`)

```
utils/
├── analytics.js        # Event tracking (tracks: article views, tool usage)
├── apiCache.js         # Generic API caching with TTL
├── calculator.js       # Generic math expression parser (uses mathjs)
├── compoundInterest.js # Compound interest calculations
├── dateDifference.js   # Date diff + countdown logic
├── errorMonitor.js     # Error tracking/Reporting
├── graphUtils.js       # Chart data preparation for chart.js
├── iconMap.js          # SVG icon paths (getIconSvg returns raw SVG string)
├── mathParser.js       # Expression parsing (delegates to calculator.js)
├── numberInput.js      # Numeric input handling (formatting/parsing)
├── numberToWords.js    # Number → spoken words conversion
├── numberToWordsUtils.js  # (appears to be duplicate utilities)
├── passwordGenerator.js # Password generation logic
├── randomGenerator.js  # Random number generation
├── storage.js          # localStorage/sessionStorage safe wrappers
├── urlUtils.js         # URL manipulation helpers
├── vatCalculator.js    # VAT extraction/addition calculations
├── articleLanguage.js  # Language detection for articles (cyrillic vs latin)
├── articleNormalization.js # Article field normalization (normalizes API responses)
└── seoAudit*.js        # SEO audit checks, normalization, UI copy, API calls
```

**Key observations**:
- `numberToWords.js` and `numberToWordsUtils.js` likely duplicate each other
- `iconMap.js` exports `getIconSvg` returning raw SVG strings — used by build script too
- `articleLanguage.js` in `utils/` is **IDENTICAL** to `lib/articleLanguage.js`
- `calculator.js` and `mathParser.js` — possible overlap

### API/Data Layer (`src/api/`)

```
api/
└── articlesApi.js   # Worker API client — fetch, cache, read pre-rendered payloads
                     # Exports: fetchArticles, fetchArticleBySlug,
                     # readInitialArticlesIndex, readCached*, writeCached*
```

**Business logic location**: Article normalization lives in `utils/articleNormalization.js`, API layer imports and uses it — good separation.

### State Management (`src/contexts/`)

| Context | Purpose |
|---------|---------|
| `LanguageContext` | i18n — language detection from URL/storage/navigator, `t()` function |
| `ThemeContext` | Dark/light theme preference |
| `ArticleStoreContext` | Article index + current article — fetching, caching, sessionStorage fallback |
| `BreadcrumbsContext` | Breadcrumb trail state, article title propagation |

**Observation**: `ArticleStoreContext` and `BreadcrumbsContext` are tightly coupled to article system. `BreadcrumbsContext` has `setArticleTitle()` which is article-specific.

### Configuration Layer (`src/config/`)

| File | Purpose |
|------|---------|
| `routeRegistry.js` | Route definitions — path, component, titleKey, descriptionKey, category metadata |
| `routeSeo.js` | Static SEO config — title, description, h1, keywords, image, robots, sitemap flags per route per language. Also helpers to get localized paths/URLs |
| `searchIndex.js` | Search-related config |

**Observation**: `routeSeo.js` is ~300 lines of static data — duplicative with what could be derived from `routeRegistry.js` + locale strings.

### Routes Layer (`src/routes/`)

```
routes/
└── lazyPages.js  # Lazy imports for all pages + preloadLikelyRoutes() for idle callback preloading
```

Pattern: `createLazyPage()` wraps `lazy()` and attaches `.preload()` for route prefetching.

### Locales (`src/locales/`)

- `ru.json`, `en.json` — flat key-value i18n (e.g., `tools.vatCalculator.title`)

**Observation**: Translation keys hardcoded as strings — no build-time validation. DEV-only warnings in `routeRegistry.js` check required fields.

### Styles (`src/styles/`)

- `index.css` — global styles
- `calculator.css` — calculator-specific

**Page-level CSS**: `src/pages/*.css` (QRCodeGenerator, PasswordGenerator, SearchResults, RandomNumber, DateDifferenceCalculator, Home, Feedback, Articles, ToolDescriptionSection)

**Observation**: CSS distribution is inconsistent — some in `styles/`, some co-located with pages.

### Scripts/Build-time (`scripts/generate-pages.js`)

749-line script that:
1. Fetches articles index + article details from Worker API
2. Generates pre-rendered HTML for all routes (tool pages, home, articles)
3. Injects SEO meta tags
4. Builds sitemap.xml

**Dependencies on src code**:
- Imports from `src/config/routeSeo.js`, `src/config/routeRegistry.js`
- Imports from `src/utils/articleLanguage.js`, `src/utils/articleNormalization.js`
- Imports from `src/utils/iconMap.js`

**Observation**: Build script has hardcoded path sets (e.g., `TOOL_PAGE_SHELL_PATHS`, `CLIENT_RENDER_TOOL_PATHS`, `PRERENDER_TOOL_HERO_CONFIG`) that duplicate route registry metadata.

## 4. Cross-Cutting Concerns & Problems

### 4.1 Duplicated Code

| Duplicate | Location |
|-----------|----------|
| `articleLanguage.js` (IDENTICAL) | `src/utils/articleLanguage.js` AND `src/lib/articleLanguage.js` |

Both files contain the exact same `detectArticleLanguage()`, `articleMatchesLanguage()`, `filterArticlesForLanguage()` with identical implementation. One is imported by `articlesApi.js`, the other by... unknown. `src/lib/` seems unnecessary.

**Risk**: Maintenance inconsistency — changes to one won't appear in the other.

### 4.2 Route Data Duplication

`routeRegistry.js` defines `ROUTE_REGISTRY` with `path`, `componentKey`, `titleKey`, `descriptionKey`, `categoryKey`, `icon`, `showOnHome`.

`routeSeo.js` defines `ROUTE_SEO` with identical paths, plus `title`, `description`, `h1`, `keywords`, `image` — all statically written, duplicating what could be constructed from `routeRegistry` + locale strings.

**Risk**: When adding a new route, developer must update 3+ files (routeRegistry, routeSeo, lazyPages). No single source of truth.

### 4.3 Build Script Duplication

`generate-pages.js` has:
- `PRERENDER_TOOL_HERO_CONFIG` — hardcoded per-path config
- `TOOL_PAGE_SHELL_PATHS` — Set of paths that use ToolPageShell
- `CLIENT_RENDER_TOOL_PATHS` — Set of paths that skip hydration

These duplicate metadata already in `routeRegistry.js` (like `showOnHome`, etc.).

**Risk**: Adding a new tool page requires updating the route registry AND the build script with hardcoded booleans.

### 4.4 CSS Scattering

CSS exists in 4 locations:
1. `src/styles/index.css` — global
2. `src/styles/calculator.css` — shared calculator styles
3. `src/components/*.css` — component styles
4. `src/pages/*.css` — page-specific styles

Page-level CSS for RandomNumber is imported in `App.jsx` (cross-page import — unusual).

### 4.5 SEO Split

SEO logic is split:
- `routeSeo.js` — static title/description/h1/keywords per route
- `scripts/generate-pages.js` — injects meta tags from routeSeo into HTML
- `src/components/SEO.jsx` — runtime meta tag rendering via react-helmet-async

Article detail pages have SEO logic inside `ArticlePage.jsx` (structuredData, og tags, canonical, hreflang).

### 4.6 Potential Unused Files

`src/utils/numberToWordsUtils.js` — may be a leftover/duplicate. Needs audit to see if it's imported anywhere.

### 4.7 Article Index Cache Key Mismatch

`articlesApi.js` uses `ARTICLES_INDEX_CACHE_KEY = 'qsen:articles:index:v4'`
`ArticleStoreContext.jsx` exports `ARTICLE_INDEX_KEY = 'qsen:articles:index:v5'`

**Version mismatch** — sessionStorage cache written by API won't be read by store. Potential stale/missing data on client.

## 5. Structural Summary

```
LAYER                      HEALTH   NOTES
─────────────────────────────────────────────────────────
Pages                      GOOD     Self-contained, consistent pattern
Components                 OK       Some duplication of concerns (SEO)
Business Logic (utils/)    MEDIUM   Duplicates, mixed responsibilities
API/Data (api/)            OK       Clean separation from business logic
State (contexts/)          OK       Clear separation, article store is heavy
Config                     WEAK     Duplication, hardcoded sets in build
Routes                     GOOD     Simple lazy loading pattern
i18n (locales/)            OK       Flat structure, no runtime validation
Styles                     MEDIUM   Scattered, inconsistent co-location
Build-time (scripts/)      WEAK     749 lines, hardcoded duplicates
```

## 6. Recommendations (High-Impact / Low-Risk / Low-Effort)

1. **Delete `src/lib/`** — it only has a duplicate `articleLanguage.js`. Consolidate imports to `src/utils/articleLanguage.js`.

2. **Audit `numberToWordsUtils.js`** — check if it's used anywhere. If not, delete. If yes, compare with `numberToWords.js` and merge/deduplicate.

3. **Fix cache key mismatch** — align `ARTICLES_INDEX_CACHE_KEY` version in `articlesApi.js` with `ARTICLE_INDEX_KEY` in context, or remove the context constant and import from API.

4. **Extract hardcoded path sets from build script** — `TOOL_PAGE_SHELL_PATHS`, `CLIENT_RENDER_TOOL_PATHS` should be derived from `routeRegistry.js` properties.

5. **Add route metadata to routeSeo derivation** — `routeSeo.js` should be generated from `routeRegistry.js` + locale strings, not manually maintained.

6. **Consider moving page-level CSS to component CSS** — `src/pages/*.css` could be moved to `src/components/` if they're shared, or consolidated into `src/styles/`.

Items above are ordered by impact/risk ratio. No refactoring of architecture or component patterns — just cleanup of clear redundancies.