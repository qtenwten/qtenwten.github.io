# Refactor Plan — QSEN Utility Tools Site

## Prioritization Categories

- **Quick Wins**: ≤1 hour, low risk, immediate improvement
- **Medium Changes**: 2-8 hours, medium risk, significant improvement
- **Deep Refactors**: 8+ hours, higher risk, architectural overhaul

---

## Problem 1: Cache Key Version Mismatch

### Why It Is a Problem
`articlesApi.js` writes sessionStorage with key `qsen:articles:index:v4`, but `ArticleStoreContext.jsx` reads using key `qsen:articles:index:v5`. This means every article index fetch bypasses the cache and hits the API, causing unnecessary network requests and slower page loads for returning users.

### Risks
- Silent performance degradation on every article list page visit
- User perceives site as slower than it should be
- Increases Worker API load unnecessarily

### Affected Files
- `src/api/articlesApi.js` (line 6: `ARTICLES_INDEX_CACHE_KEY`)
- `src/contexts/ArticleStoreContext.jsx` (line 16: `ARTICLE_INDEX_KEY`)

### How to Fix
1. Change `ARTICLES_INDEX_CACHE_KEY` in `articlesApi.js` from `v4` to `v5`
2. Verify both files use the same constant (consider exporting from one and importing in the other)

**Or**: Remove `ARTICLE_INDEX_KEY` constant from context and import from `articlesApi.js` directly.

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | HIGH — eliminates silent cache misses on every visit |
| Effort | 15 minutes |
| Risk | LOW — single-line change, no behavior change |

---

## Problem 2: Dead Code — `src/lib/` Directory

### Why It Is a Problem
`src/lib/articleLanguage.js` is byte-for-byte identical to `src/utils/articleLanguage.js`. The `lib/` directory has no clear purpose (it's not a library, it's not a helper, it contains one duplicate file). This creates maintenance risk: if you fix a bug in one, you may forget the other.

### Risks
- Developers waste time trying to understand why there are two identical files
- Future changes may be applied to only one copy, leaving the other stale
- Confuses import paths — developers may import from `lib/` without knowing it's dead code

### Affected Files
- `src/lib/articleLanguage.js` (entire file — candidate for deletion)
- All files that import from `src/lib/` (need to verify and redirect)

### How to Fix
1. Search for any imports matching `from '../lib/` or `from '../lib/articleLanguage'` or `from '../lib/articleLanguage.js'`
2. Redirect those imports to `src/utils/articleLanguage.js`
3. Delete `src/lib/` directory
4. Verify no other files exist in `src/lib/`

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | MEDIUM — removes maintenance hazard |
| Effort | 30 minutes (audit imports, then delete) |
| Risk | LOW — delete only after verifying no imports remain |

---

## Problem 3: Route Data Triplication

### Why It Is a Problem
Route information is maintained in three separate places with no single source of truth:

1. `src/config/routeRegistry.js` — defines `ROUTE_REGISTRY` with path, componentKey, titleKey, descriptionKey, category, icon, showOnHome
2. `src/config/routeSeo.js` — defines `ROUTE_SEO` with the same paths, plus title, description, h1, keywords — all statically written
3. `scripts/generate-pages.js` — hardcodes `TOOL_PAGE_SHELL_PATHS`, `CLIENT_RENDER_TOOL_PATHS`, `PRERENDER_TOOL_HERO_CONFIG` — separate boolean/feature flags not derived from routeRegistry

When a developer adds a new tool, they must update 3+ files. Inconsistencies are not caught at build time.

### Risks
- Adding a new tool page requires fixing multiple files — error-prone
- SEO metadata can go out of sync with route definitions
- Build script paths can contradict route registry flags
- No validation that routeRegistry and routeSeo agree on which routes exist

### Affected Files
- `src/config/routeRegistry.js`
- `src/config/routeSeo.js`
- `scripts/generate-pages.js`

### How to Fix (3 steps)

**Step 1 — Add computed properties to routeRegistry**
Add fields to each route entry: `showInSearch`, `breadcrumbMode`, `heroConfig` — anything needed by the build script.

**Step 2 — Generate routeSeo from routeRegistry + locale strings**
Replace static `ROUTE_SEO` with a function that derives SEO data from `ROUTE_REGISTRY` entries + `locales/ru.json` / `en.json`:
```js
function buildRouteSeo(route, locale) {
  return {
    title: t(route.titleKey),
    description: t(route.descriptionKey),
    h1: t(route.titleKey),
    // ...
  }
}
```
Keep manual overrides possible for pages that need custom SEO copy.

**Step 3 — Derive build script path sets from routeRegistry**
Replace `TOOL_PAGE_SHELL_PATHS` with a computed set:
```js
const TOOL_PAGE_SHELL_PATHS = new Set(
  ROUTE_REGISTRY.filter(r => r.useShell).map(r => r.path)
)
```

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | HIGH — single source of truth for routes |
| Effort | 4-6 hours |
| Risk | MEDIUM — need to preserve SEO values for all existing pages |

---

## Problem 4: `ArticleStoreContext.jsx` — God Object (191 lines, 2 data domains)

### Why It Is a Problem
This context manages two completely independent data domains:
1. **Articles index** — list of all articles, fetched once, filtered by language
2. **Article detail** — single article, fetched on navigation, has separate loading/error states

These have different lifecycles, different caching strategies, and different consumers. Mixing them in one context creates:
- Confusing state shape (two statuses, two errors, two sets of methods)
- `languageRef` leakage — language is stored as a ref AND accessed via closure, not React state
- Hard to test independently
- Hard to extend (adding a third article-related concern would make it worse)

### Risks
- State updates in one domain trigger re-renders for components only interested in the other
- Language ref means context doesn't re-render when language changes — components using the context directly won't see language updates
- 191 lines is too large for a single-file context — the logic should be split

### Affected Files
- `src/contexts/ArticleStoreContext.jsx`

### How to Fix (2 steps)

**Step 1 — Split into two contexts**
```js
// ArticleIndexContext — manages articles list
// ArticleDetailContext — manages current article
```

**Step 2 — Move language to proper React state**
Replace `languageRef` with `language` in context state. Components that need to react to language changes should subscribe to the context.

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | MEDIUM — improves testability, reduces unnecessary re-renders |
| Effort | 6-8 hours |
| Risk | MEDIUM — changes context API, all consumers need updating |

---

## Problem 5: `ArticlePage.jsx` — God Object (~200 lines, 4 concerns mixed)

### Why It Is a Problem
`ArticlePage.jsx` mixes four distinct responsibilities in one file:

1. **SEO** — title, description, keywords, og tags, canonical, hreflang, structuredData
2. **Analytics** — `analytics.trackArticleViewed()` on mount
3. **Data orchestration** — `useArticleDetail`, `useArticlesIndex`, language filtering, translation key logic
4. **Rendering** — main article layout + related articles sidebar

This makes the component:
- Hard to test (can't test SEO logic in isolation)
- Hard to reuse parts (related articles logic is coupled to page)
- 200 lines long — difficult to navigate

### Risks
- Testing requires full render with API mock
- SEO changes risk breaking article content rendering
- Analytics logic is duplicated if another page needs similar tracking
- Adding a new article variant (e.g., compact list view) requires modifying the same file

### Affected Files
- `src/pages/ArticlePage.jsx`

### How to Fix (4 steps)

**Step 1 — Extract `ArticleSeo` component**
Move SEO rendering (Helmet, structuredData, hreflang, canonical) to `src/components/articles/ArticleSeo.jsx`:
```jsx
<ArticleSeo
  article={article}
  language={language}
  slug={slug}
  translatedSlugs={translatedSlugs}
/>
```

**Step 2 — Extract `ArticleRelated` component**
Move related articles computation and rendering to `src/components/articles/ArticleRelated.jsx`.

**Step 3 — Move analytics to hook**
Create `src/hooks/useArticleAnalytics.js`:
```js
useArticleAnalytics(article) // handles tracking on mount
```

**Step 4 — Simplify ArticlePage to orchestrator**
`ArticlePage` becomes a thin component that composes the extracted pieces and handles data fetching.

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | HIGH — enables isolated testing, reuse of components |
| Effort | 8-10 hours |
| Risk | MEDIUM — SEO and analytics logic must be preserved exactly |

---

## Problem 6: Monolithic `generate-pages.js` (749 lines)

### Why It Is a Problem
The build script is a single 749-line file with multiple concerns mixed together:
- Fetching articles from API
- Building prerendered HTML for different page types
- Injecting SEO meta tags
- Generating sitemap.xml

The HTML building is especially problematic — `buildHomePrerenderContent()` alone is ~400 lines of inline HTML string concatenation with complex nested markup logic.

This creates:
- No incremental testing — can't test article building without running entire script
- Duplicated HTML structure — the same components are rendered in build script AND in React components, meaning two places to update when UI changes
- Untestable — no unit tests for individual page builders

### Risks
- Any UI change requires updating both React components AND build script HTML strings
- Build script errors are hard to debug (no stack trace to specific function)
- Onboarding new developer is difficult — entire system understanding required
- Hard to extend for new page types

### Affected Files
- `scripts/generate-pages.js`

### How to Fix (3 steps)

**Step 1 — Split into modules**
```
scripts/
├── generate-pages.js      # main entry
├── lib/
│   ├── prerender/home.js
│   ├── prerender/toolPage.js
│   ├── prerender/article.js
│   ├── prerender/articleList.js
│   └── sitemap.js
```

**Step 2 — Replace inline HTML with template literals or dedicated template functions**
Extract markup builders into testable functions. Each builder receives page config and returns HTML string.

**Step 3 — Add basic unit tests for builders**
Test that `buildHomePrerenderContent()` produces expected markup structure.

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | MEDIUM — improves maintainability and testability |
| Effort | 10-12 hours |
| Risk | MEDIUM — changes build output, needs careful validation |

---

## Problem 7: CSS Scattered Across 4 Locations

### Why It Is a Problem
CSS exists in inconsistent locations:
1. `src/styles/index.css` — global styles
2. `src/styles/calculator.css` — shared calculator styles
3. `src/components/*.css` — component styles (e.g., `Footer.css`, `Header.css`)
4. `src/pages/*.css` — page-specific styles

Additional issue: `App.jsx` imports `pages/RandomNumber.css` — a cross-page import (RandomNumber.css is imported in `App.jsx`, not in `RandomNumber.jsx`).

This makes it hard to know where to add new styles and increases the risk of specificity conflicts.

### Risks
- New developers don't know where to put CSS
- Page-level CSS in `pages/` creates tight coupling — can't reuse shared page styles
- Cross-page CSS import in App.jsx is unusual and error-prone
- Changes to shared CSS may break page-specific styles

### Affected Files
- `src/App.jsx` (line 13: `import './pages/RandomNumber.css'`)
- Multiple `src/pages/*.css` files

### How to Fix (2 steps)

**Step 1 — Move RandomNumber.css import to RandomNumber.jsx**
Remove `import './pages/RandomNumber.css'` from `App.jsx`, add it to `src/pages/RandomNumber.jsx` where it belongs.

**Step 2 — Consolidate page CSS**
Move page-specific CSS from `src/pages/*.css` to either:
- `src/components/` if shared across pages
- `src/styles/page-specific.css` (or `src/styles/pages.css`) as a single module

Alternatively, keep co-located but establish a clear rule: global shared → `styles/`, page-specific → co-located with page component.

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | LOW — cosmetic improvement |
| Effort | 1-2 hours |
| Risk | LOW — CSS moves, no logic changes |

---

## Problem 8: `numberToWordsUtils.js` — Potential Unused Duplicate

### Why It Is a Problem
`src/utils/numberToWordsUtils.js` contains currency formatting utilities. It's not imported anywhere in the codebase — all currency formatting appears to be handled in `numberToWords.js`. If it's truly unused, it's dead code that creates maintenance confusion.

Even if it is used somewhere, `numberToWords.js` and `numberToWordsUtils.js` overlap — both contain currency pluralization logic (RU and EN).

### Risks
- If used somewhere, it's providing duplicate functionality with `numberToWords.js`
- If unused, it's dead code creating confusion
- Currency data duplication means future currency additions must be done twice

### Affected Files
- `src/utils/numberToWordsUtils.js`
- `src/utils/numberToWords.js`

### How to Fix
1. Search for any imports of `numberToWordsUtils.js`
2. If unused → delete it
3. If used → compare overlap with `numberToWords.js` and either merge into one file or clearly document why they're separate

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | LOW — cleanup task |
| Effort | 30 minutes (audit) |
| Risk | LOW — only delete after confirming no imports |

---

## Problem 9: `ErrorBoundary.jsx` — Logic Leakage

### Why It Is a Problem
`ErrorBoundary.jsx` checks `window.location.pathname.startsWith('/en')` to determine which language fallback text to show. This couples the error boundary to routing — if the site adds a new locale or changes path structure, this breaks.

Additionally, it's a class component in a project that otherwise uses function components — inconsistent style.

### Risks
- Adding `/uk/` locale would require updating error boundary
- Navigation library changes (e.g., switching from react-router-dom) would break language detection
- Inconsistent with rest of codebase

### Affected Files
- `src/components/ErrorBoundary.jsx`

### How to Fix
Replace URL inspection with context-based language detection:
```jsx
function ErrorBoundary() {
  const { language } = useLanguage()
  // Use language from context instead of URL
}
```

Or remove language-specific text entirely — show generic error message that doesn't require language detection.

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | LOW — cosmetic cleanup |
| Effort | 30 minutes |
| Risk | LOW — behavior preserved, only refactor |

---

## Problem 10: SEO Logic Split Across 3 Layers

### Why It Is a Problem
SEO handling is fragmented across three distinct places:

1. **Static config** (`routeSeo.js`) — title, description, keywords, h1 per route per language
2. **Runtime component** (`SEO.jsx`) — renders Helmet meta tags, reads from routeSeo as defaults
3. **Build-time injection** (`generate-pages.js`) — injects meta tags into prerendered HTML

Additionally, `ArticlePage.jsx` has its own SEO logic (structuredData, hreflang, canonical) separate from `SEO.jsx`.

This means:
- Changing a title requires updating routeSeo.js AND potentially build script
- Runtime SEO behavior isn't validated until page loads
- Article pages have different SEO behavior than tool pages

### Risks
- Inconsistency between pre-rendered meta tags and runtime meta tags
- Bugs found late (only visible after building and loading the page)
- Confusing for developers — which SEO approach do I use for new pages?

### Affected Files
- `src/config/routeSeo.js`
- `src/components/SEO.jsx`
- `scripts/generate-pages.js`
- `src/pages/ArticlePage.jsx`

### How to Fix
This is a design decision — options:

**Option A (Preferred)**: Consolidate on `SEO.jsx` as the single runtime SEO solution. Make `routeSeo.js` a derived config (from routeRegistry + locales). Remove SEO injection from build script — let React handle it at runtime (or use a Node.js pre-render approach).

**Option B**: Keep pre-rendered HTML but make it generated from the same components used at runtime, eliminating the duplication.

### Impact / Effort / Risk
| Metric | Value |
|--------|-------|
| Impact | HIGH — single SEO implementation |
| Effort | 12+ hours (requires rethinking prerender approach) |
| Risk | HIGH — significant change to build pipeline and SEO behavior |

---

## Recommended Implementation Order

### Quick Wins (do first)
| Order | Problem | Time |
|--------|---------|------|
| 1 | Fix cache key v4/v5 mismatch | 15 min |
| 2 | Delete `src/lib/` + redirect imports | 30 min |
| 3 | Audit `numberToWordsUtils.js` usage | 30 min |
| 4 | Move RandomNumber.css import to RandomNumber.jsx | 15 min |
| 5 | Fix ErrorBoundary URL inspection | 30 min |

### Medium Changes (do after quick wins)
| Order | Problem | Time |
|--------|---------|------|
| 6 | Derive routeSeo from routeRegistry + locales | 4-6 hrs |
| 7 | Extract path sets from build script | 1-2 hrs |
| 8 | Consolidate page CSS (establish rule) | 1 hr |

### Deep Refactors (do last, with testing)
| Order | Problem | Time |
|--------|---------|------|
| 9 | Split ArticleStoreContext into two contexts | 6-8 hrs |
| 10 | Split ArticlePage.jsx into ArticleSeo + ArticleRelated + hook | 8-10 hrs |
| 11 | Modularize generate-pages.js | 10-12 hrs |
| 12 | Consolidate SEO into single layer (Option A or B) | 12+ hrs |

---

## Summary

| Category | Count | Total Effort |
|----------|-------|--------------|
| Quick Wins | 5 | ~2 hours |
| Medium Changes | 3 | ~8 hours |
| Deep Refactors | 4 | ~40+ hours |

**Start with Problem 1 (cache mismatch)** — it's a silent bug causing real performance impact.

**Next, Problems 2-5** (quick wins) — clean up dead code and obvious issues before touching complex logic.

**Then Problems 6-8** (medium) — fix structural issues in config and build.

**Save deep refactors for when the codebase is more stable** — the quick wins and medium changes will make the deep refactors safer to attempt.