# Performance Audit — QSEN Utility Tools Site

## 1. Bundle Analysis

### 1.1 Vendor Chunks (vite.config.js manualChunks)

| Chunk | Contents | Size Impact | Status |
|-------|----------|------------|--------|
| `helmet` | react-helmet-async | Medium | ✅ OK |
| `chart-vendor` | chart.js + react-chartjs-2 | HIGH | ✅ OK — lazy via `lazy()` in Calculator |
| `math-vendor` | mathjs | HIGH | ❌ DEAD — NOT imported anywhere |
| `qr-vendor` | qrcode | HIGH | ✅ OK — dynamically imported |
| `react-vendor` | react + react-dom + react-router-dom | High | ✅ Required |

### 1.2 Heavy Dependencies

| Dependency | Where Used | Import Type | Problem |
|------------|-----------|-------------|---------|
| `mathjs` | Nowhere in source | — | **DEAD — NOT imported** |
| `qrcode` | QRCodeGenerator.jsx:495 | Dynamic `import()` | ✅ OK |
| `jspdf` | QRCodeGenerator.jsx:917 | Dynamic `import()` | ✅ OK |
| `chart.js` + `react-chartjs-2` | GraphPanel.jsx | Static in lazy-loaded component | ✅ OK |
| `lucide-react` | icons/map.js + Icon.jsx | **Static** | ❌ All 24 icons bundled |
| `expr-eval` | calculator.js | Static | ✅ Small lib |
| `node-fetch` | package.json | — | ❌ NOT imported anywhere |

### 1.3 Dead Dependencies

These packages are in `package.json` dependencies but NOT imported anywhere in source:

- **`mathjs`** — configured in manualChunks, but `calculator.js` uses `expr-eval` instead
- **`node-fetch`** — not imported, not used

### 1.4 Bundle Size Issues

**`lucide-react`** is statically imported in `src/icons/map.js`:
```js
import { BarChart3, Calendar, Calculator, Check, Clock3, Copy, CreditCard,
  Dice5, Eye, EyeOff, FileText, LayoutDashboard, Lightbulb, Link as LinkIcon,
  Lock, Pin, QrCode, RefreshCw, Rocket, Search, Tag, TrendingUp, Type, Wrench
} from 'lucide-react'
```
That's **24 icons** imported statically. Only ~16 are used in `iconMap`.

The build does NOT split lucide-react into its own chunk. It goes into the main bundle or a shared vendor chunk.

---

## 2. Heavy Pages

| Page | Est. JS Weight | Key Issue |
|------|----------------|-----------|
| `QRCodeGenerator` | HIGH (~200KB+ with qrcode + jspdf) | Canvas rendering, SVG builder, PDF export, 1567 lines |
| `NumberToWords` | HIGH (~50KB) | 11 format variants generated per keystroke, 10 utils imported |
| `SEOAuditPro` | MEDIUM-HIGH | Multiple useMemo, complex result rendering, 634 lines |
| `ArticlesIndex` | MEDIUM | Article list rendering, image lazy loading |
| `Calculator` (GraphPanel) | MEDIUM (lazy) | chart.js + react-chartjs-2 loaded on navigation |
| `Home` | LOW-MEDIUM | Tool grid + articles, mostly static |

---

## 3. Cause Analysis

### 3.1 Unused Dependencies (Dead Weight)

**`mathjs`** in `package.json` → not imported → still in node_modules → may be picked up by some Vite optimization or left unused.

**`node-fetch`** in `package.json` → not imported anywhere.

### 3.2 Static Imports That Should Be Dynamic

**`lucide-react` (icons/map.js)** — all 24 icons imported statically, goes into main/vendor bundle. Even though icons are tree-shakeable in theory, the named imports in `icons/map.js` create a static import that Vite bundles together.

**Fix**: Either use `getIconSvg()` from `utils/iconMap.js` at runtime (returns raw SVG strings — already exists!), or dynamically import only the icons that are used.

**Note**: The build script already uses `getIconSvg()` (raw SVG strings) for pre-rendered HTML. The runtime uses `lucide-react` via `Icon` component. Two different icon systems.

### 3.3 Per-Page Dynamic Imports

- `qrcode` — ✅ dynamically imported on QR page
- `jspdf` — ✅ dynamically imported on PDF export only
- `GraphPanel` — ✅ lazy loaded via `lazy()` in Calculator

Good pattern. No issue here.

---

## 4. Performance Issue Inventory

### 4.1 Lazy Loading Audit

| Page | Lazy? | Notes |
|------|-------|-------|
| Most pages | ✅ `lazy()` | All pages use `createLazyPage()` |
| `GraphPanel` | ✅ `lazy()` | Loaded when user navigates to calculator |
| `qrcode` | ✅ Dynamic `import()` | Only when QR page mounts |
| `jspdf` | ✅ Dynamic `import()` | Only on PDF export click |

**Good**: Pages are lazy loaded. QR-heavy libs are not loaded until needed.

**Issue**: `icons/map.js` imports 24 lucide-react icons statically — these are NOT lazy loaded and appear in the initial bundle.

### 4.2 Data Fetching

| Flow | Caching | Issue |
|------|---------|-------|
| Articles Index | sessionStorage v5 + prerender JSON | Cache key mismatch with articlesApi v4 |
| Article Detail | sessionStorage + prerender JSON | OK |
| SEO Audit | In-memory `seoAuditCache` (10min TTL) | OK |
| URL Shortening | No cache, direct to is.gd API | OK |
| Feedback | No cache | OK |

**Issue**: Articles cache key mismatch (v4 vs v5) — every page load hits API instead of cache.

### 4.3 Re-render Hotspots

**`NumberToWords.jsx`** — every state change triggers full `generateVariants()` (11 formats, complex string ops):
```js
const variants = useMemo(() => {
  return result ? generateVariants() : []
}, [result, number, currency, taxMode, taxRate, separator, withMinor, language])
```
`generateVariants()` creates 11 objects with string manipulation. `debounceTimer` is used but `useEffect` runs on every dep change anyway.

**`Home.jsx`** — `buildSearchIndex(language, t)` in `useMemo`:
```js
const searchIndex = useMemo(() => buildSearchIndex(language, t), [language, t])
```
`searchRoutes(searchIndex, trimmedQuery)` is also in `useMemo` — good.

**`ArticlePage.jsx`** — `localizedRelatedArticles` and `visibleRelatedArticles` both computed with `useMemo` — OK.

**`SEOAuditPro.jsx`** — `visibleCategories` uses `useMemo` — OK.

### 4.4 Loading States

| Page | Skeleton? | Issue |
|------|-----------|-------|
| ArticlesIndex | ✅ `LoadingState` with skeleton | OK |
| ArticlePage | ✅ `LoadingState` with skeleton | OK |
| SEOAuditPro | ✅ Inline spinner during API call | OK |
| QRCodeGenerator | ❌ Blank during qrcode lib load | **Issue** — 1-2 sec blank |
| Home | N/A (static prerender) | OK |
| NumberToWords | N/A (instant) | OK |

**Issue**: QRCodeGenerator is fully client-rendered, shows nothing while `qrcode` library loads dynamically.

### 4.5 Image/Icon Strategy

| Asset | Strategy | Issue |
|-------|----------|-------|
| Site logo | `/src/assets/qsen-logo-transparent.png` | Vite hash-based filename in dist — ✅ |
| Article cover images | From Worker API (user-uploaded) | ✅ Lazy loaded |
| Tool icons | `lucide-react` via `Icon` component | ❌ 24 icons statically bundled |
| Category icons (Home) | Inline SVG JSX strings | ✅ No icon lib needed |
| build-time icons | `getIconSvg()` raw SVG strings | ✅ Pre-rendered HTML |

**Issue**: `lucide-react` brings 24 icons statically. Only ~16 are used.

### 4.6 PDF/Export Logic

- `jspdf` — dynamically imported only on PDF button click in QRCodeGenerator ✅
- No PDF export on other pages
- SVG export in QRCodeGenerator is hand-rolled (no library) ✅

Good — no heavy export libs loaded upfront.

---

## 5. Core Web Vitals Assessment

### 5.1 LCP (Largest Contentful Paint)

**Target**: < 2.5s

**Analysis**:
- Most pages are pre-rendered shell + hydration
- Home page: pre-rendered with full content → LCP should be fast
- Tool pages: pre-rendered shell → LCP is the header logo + title
- QRCodeGenerator: **client-only** — shows blank until qrcode lib loads (~1-2s)
- Articles: pre-rendered shells with JSON data payloads

**Risk**: QRCodeGenerator has **no pre-render**, so first meaningful paint waits for JS + qrcode lib load.

**Recommendations**:
- Pre-render QRCodeGenerator shell (at least the hero section)
- Inline critical CSS for header/logo

### 5.2 CLS (Cumulative Layout Shift)

**Target**: < 0.1

**Analysis**:
- Logo image has explicit `width="48" height="48"` in build script ✅
- Article cover images have explicit dimensions? Need to check
- Tool cards — no layout shift expected
- Pre-rendered pages have static HTML — minimal shift
- `QRCodeGenerator` canvas: fixed size preview stage ✅

**Risk**: Font loading (if any custom fonts) or image loading without explicit dimensions.

**Issue**: `LoadingState` skeleton cards have fixed CSS dimensions — should be OK. But `QRCodeGenerator` preview area might shift from empty to canvas.

### 5.3 TTI (Time to Interactive)

**Target**: < 3.8s

**Analysis**:
- Pre-rendered pages hydrate quickly (React 18 hydrateRoot)
- `QRCodeGenerator`: ~1-2s for qrcode lib load on top of hydration
- `Calculator` with GraphPanel: chart.js loads on calculator navigation (~500KB)
- `SEOAuditPro`: Network call to Worker API — not blocking hydration

**Risk**: Heavy pages after hydration but before interaction:
1. QRCodeGenerator — must load qrcode before any interaction
2. Calculator → GraphPanel — must load chart.js before graph works
3. NumberToWords — instant (lightweight)

**Recommendations**:
- Pre-render QRCodeGenerator shell (reduces TTI by ~1s)
- Consider preloading qrcode lib on QR page hover (not just on mount)

### 5.4 INP (Interaction to Next Paint)

**Target**: < 200ms

**Analysis**:
- Most interactions are simple state updates
- `NumberToWords` debounce: 300ms — acceptable
- CopyButton: instant (navigator.clipboard)
- QRCodeGenerator download: async but not blocking main thread
- Search: synchronous useMemo filter — should be fast (< 50ms)

**Risk**: `buildSearchIndex` called on every language change or query change — but memoized.

---

## 6. Improvement Priority List

### P0 — Critical (Fix Now)

**P0-1: Fix articles cache key mismatch**
- File: `src/api/articlesApi.js` line 6
- Change `ARTICLES_INDEX_CACHE_KEY` from `v4` to `v5`
- Impact: HIGH — eliminates silent cache misses on every article page load
- Effort: 1 line

**P0-2: Pre-render QRCodeGenerator shell**
- File: `scripts/generate-pages.js`
- Add `/qr-code-generator` to prerender pipeline
- Impact: LCP improvement ~1-2s, TTI improvement
- Effort: 1-2 hours
- Risk: LOW

### P1 — High (Fix Soon)

**P1-1: Remove dead dependencies**
- `mathjs` from package.json — not imported anywhere
- `node-fetch` from package.json — not imported anywhere
- Impact: Smaller node_modules, faster installs, no accidental bundling
- Effort: 1 line each

**P1-2: Audit and reduce lucide-react imports**
- `src/icons/map.js` imports 24 icons statically
- Only ~16 are used in iconMap
- Remaining 8 are dead weight: `BarChart3`, `Check`, `Clock3`, `CreditCard`, `Dice5`, `Eye`, `EyeOff`, `Wrench`
- Impact: ~15-30KB saved from bundle
- Effort: 2 hours

**P1-3: Memoize `generateVariants()` in NumberToWords**
- Currently `variants` useMemo depends on 7 values
- `generateVariants()` is heavy (11 format objects with string ops)
- Add `debounceTimer` to avoid rapid re-computation on keystroke
- Impact: Reduced CPU on every keystroke
- Effort: 30 minutes

**P1-4: Fix QRCodeGenerator loading state**
- Show skeleton/placeholder while qrcode lib loads
- Currently: blank screen for 1-2 seconds
- Impact: Better perceived performance, no blank content flash
- Effort: 1 hour

### P2 — Medium (Nice to Have)

**P2-1: Preload qrcode library on QR page hover**
- Currently loaded only on component mount
- Could load on `onMouseEnter` of QR page link in RelatedTools
- Impact: Faster TTI for QR page
- Effort: 1 hour

**P2-2: Add `loading="lazy"` and explicit dimensions to article images**
- Check if article cover images have explicit width/height
- Impact: Better CLS
- Effort: 1 hour

**P2-3: Consider replacing lucide-react with getIconSvg()**
- `getIconSvg()` returns raw SVG strings — no lib at runtime
- Build script already uses it successfully
- Would eliminate ~50KB of lucide-react from bundle
- Impact: Faster initial load
- Effort: 4-6 hours (testing across all icon usages)

**P2-4: Dynamic import lucide-react icons individually**
- Instead of static `import { A, B, C } from 'lucide-react'`
- Use `import('lucide-react').then({ A, B, C })` for only needed icons
- Or use Vite's `optimizeDeps.include` pattern
- Impact: Smaller initial bundle
- Effort: 2-3 hours

**P2-5: Reduce ArticlePage re-renders**
- `translatedSlugs` useMemo recomputes on every `localizedRelatedArticles` change
- `visibleRelatedArticles` filters 3 items from full list on every render
- Consider memoizing at a higher level
- Impact: Fewer unnecessary re-renders on language switch
- Effort: 1-2 hours

---

## 7. Summary

| Priority | Count | Total Effort |
|----------|-------|--------------|
| P0 | 2 | ~2-3 hours |
| P1 | 4 | ~4-5 hours |
| P2 | 5 | ~10-13 hours |

**Biggest wins for least effort**:
1. Fix cache key (1 line, immediate performance fix)
2. Remove dead deps `mathjs` + `node-fetch` (2 lines, cleaner)
3. Pre-render QRCodeGenerator shell (2 hours, significant LCP/TTI improvement)
4. Audit lucide-react imports (2 hours, ~15-30KB saved)

**Architecture is generally sound**:
- Lazy page loading ✅
- Dynamic imports for heavy libs ✅
- Pre-rendering for most pages ✅
- Manual chunk splitting ✅

**Main gaps**: Dead dependencies, QR page not pre-rendered, lucide-react statically bundled, and some re-render hotspots in NumberToWords.