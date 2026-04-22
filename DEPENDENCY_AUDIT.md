# Dependency Audit

## 1. Installed Dependencies

| Package | Version | Type | Purpose |
|---|---|---|---|
| `react` | 18.3.1 | runtime | UI framework |
| `react-dom` | 18.3.1 | runtime | DOM renderer |
| `react-router-dom` | 6.30.3 | runtime | Routing |
| `react-helmet-async` | 2.0.5 | runtime | Document head management |
| `lucide-react` | 1.8.0 | runtime | Icon library |
| `qrcode` | 1.5.4 | runtime | QR code generation |
| `jspdf` | 4.2.1 | runtime | PDF generation |
| `chart.js` | 4.5.1 | runtime | Charting |
| `react-chartjs-2` | 5.3.1 | runtime | Chart.js React wrapper |
| `expr-eval` | 2.0.2 | runtime | Math expression parsing |
| `mathjs` | 15.2.0 | runtime | Math library |
| `node-fetch` | 3.3.2 | runtime | Fetch API polyfill |

### devDependencies (not covered here)
`vite`, `@vitejs/plugin-react`, `vitest`, `@testing-library/*`, `jsdom`, `sharp`

---

## 2. Dependency Usage Analysis

### 2.1 `mathjs` — **UNUSED (Remove)**

**Status:** Listed in `package.json` AND referenced in `vite.config.js` manualChunks, but **zero imports** in any source file.

Searched entire codebase for `mathjs`, `math.js`, `math.parse`, `math.evaluate` — no matches. The `vite.config.js` defines a `math-vendor` chunk for it, but since nothing imports it, the chunk is never created and the package is never loaded.

**Action:** Remove from `package.json` and remove the `math-vendor` chunk from `vite.config.js`.

---

### 2.2 `node-fetch` — **Should Use Native Fetch**

**File:** `api/seo-audit.js:3`

```js
import fetch from 'node-fetch'
```

This is a Cloudflare Worker. Cloudflare Workers have **native `fetch` API** — `node-fetch` is not needed and adds unnecessary overhead (~55KB).

**Action:** Replace `import fetch from 'node-fetch'` with native `fetch` (available globally in Worker runtime). Remove from `package.json`.

---

### 2.3 `lucide-react` — **Used Correctly, Minor Concern**

**Files:** `src/icons/map.js` (named imports), `src/components/Icon.jsx` (direct import of `CircleHelp`)

21 icons are imported by name and placed into `iconMap`:
```
Calculator, Rocket, LinkIcon, Lock, Calendar, Clock3, QrCode,
TrendingUp, CreditCard, Type, Tag, Dice5, Lightbulb, BarChart3,
LayoutDashboard, FileText, Check, Copy, Wrench, Pin, Search,
Eye, EyeOff, RefreshCw
```

**Positive:** Named imports are used, which enables tree-shaking. Bundler should include only these 21 icons.

**Concern:** `Icon.jsx` also does `import { CircleHelp } from 'lucide-react'` for the fallback. Since `CircleHelp` is a single 1KB icon, the overhead is negligible.

**Verdict:** No change needed. Tree-shaking should work with named imports. If bundle analysis shows lucide-react includes all icons instead of just 22, consider replacing with inline SVG components.

---

### 2.4 `chart.js` + `react-chartjs-2` — **Heavy but Lazy-Loaded**

**File:** `src/components/calculator/GraphPanel.jsx` (lazy loaded via `React.lazy`)

```js
const GraphPanel = lazy(() => import('../components/calculator/GraphPanel'))
```

Inside GraphPanel:
```js
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, ... } from 'chart.js'
```

**Size:** chart.js ~700KB minified+gzipped. This is heavy but:
- Only loaded when user navigates to Calculator and switches to Graph mode
- Already lazy-loaded — does not affect initial page load
- Used only for function graphing (a secondary Calculator feature)

**Alternative consideration:** For simple 2D line graphs, a lighter alternative like `framer-motion` (for animation) is irrelevant. The actual lighter alternative for charts would be `recharts` (~150KB) or `victory` (~300KB). However, `chart.js` is already deferred and functional.

**Action:** No immediate change. Consider `recharts` as a lighter drop-in replacement if graph performance becomes an issue.

---

### 2.5 `jspdf` — **Heavy but Lazy-Loaded**

**File:** `src/pages/QRCodeGenerator.jsx:917`

```js
const { jsPDF } = await import('jspdf')
```

**Size:** ~500KB minified+gzipped.

**Positive:** Already dynamically imported — only loads when user clicks Download → PDF format.

**Action:** No change needed. Lazy loading is the correct pattern for PDF generation.

---

### 2.6 `qrcode` — **Already Lazy-Loaded**

**File:** `src/pages/QRCodeGenerator.jsx:495`

```js
import('qrcode').then((module) => { ... })
```

**Size:** ~25KB minified+gzipped. Negligible.

**Positive:** Dynamic import used — library loads once when the QR page mounts.

**Action:** No change needed.

---

### 2.7 `expr-eval` — **Appropriately Small, Direct Import**

**Files:**
- `src/utils/calculator.js:1` — direct import for calculator arithmetic
- `src/utils/mathParser.js:5` — dynamic import in `loadParserModule()`

**Size:** ~15KB minified+gzipped.

**Purpose:** Parser for math expressions. `calculator.js` uses it for basic arithmetic. `mathParser.js` uses it for function compilation and evaluation.

**Note:** `mathjs` was previously used (and is still in package.json) but is now completely replaced by `expr-eval`. See section 2.1.

**Action:** No change needed.

---

### 2.8 `react-helmet-async` — **Required, Appropriate**

**Files:**
- `src/main.jsx` — `HelmetProvider` wraps the app
- `src/components/SEO.jsx` — `<Helmet>` for meta tags per page
- `src/pages/ArticlePage.jsx` — article-specific structured data
- `src/components/Breadcrumbs.jsx` — `<Helmet>` for canonical links

**Size:** ~15KB minified+gzipped. Lightweight and essential for per-page SEO.

**Action:** No change needed.

---

### 2.9 `react-router-dom` — **Required**

**Size:** ~120KB minified+gzipped. Standard for React SPA routing.

**Action:** No change needed.

---

### 2.10 Custom Utils with No External Dependencies

The following are custom utilities with no third-party package dependencies:
- `src/utils/calculator.js` — wraps `expr-eval`
- `src/utils/mathParser.js` — wraps `expr-eval`
- `src/utils/numberToWords.js` — pure JS, no dependencies
- `src/utils/numberToWordsUtils.js` — pure JS, no dependencies
- `src/utils/passwordGenerator.js` — pure JS, no dependencies
- `src/utils/urlUtils.js` — pure JS, no dependencies
- `src/utils/storage.js` — wraps localStorage/sessionStorage
- `src/utils/analytics.js` — custom analytics, no dependencies
- `src/utils/errorMonitor.js` — custom error handling, no dependencies

---

## 3. Category-Specific Evaluation

### 3.1 Charting

| Library | Size (gz) | Usage | Status |
|---|---|---|---|
| `chart.js` | ~700KB | `GraphPanel.jsx` | Lazy-loaded — OK |
| `react-chartjs-2` | wrapper | `GraphPanel.jsx` | Lazy-loaded — OK |

**Concern:** 700KB is large. However, the Calculator's graph feature is a secondary use case, and the component is lazy-loaded.

**Potential improvement:** If graph rendering becomes a bottleneck, replace with `recharts` (~150KB). However, `chart.js` has superior mathematical chart rendering (ticks, scales, smooth curves) which `recharts` may not match.

---

### 3.2 PDF / Export

| Library | Size (gz) | Usage | Status |
|---|---|---|---|
| `jspdf` | ~500KB | `QRCodeGenerator.jsx` | Lazy-loaded — OK |

**Concern:** 500KB is very heavy for PDF generation.

**Alternatives:**
- `pdfmake` (~400KB) — similar size
- `pdf-lib` (~200KB) — smaller but lower-level
- `jszip` + browser `Blob` — for simple cases

**Current usage:** Only for QR code PDF export (single canvas to PDF). The lazy-loading pattern means users who don't download PDF never pay the cost.

**Potential improvement:** `pdf-lib` is significantly lighter and sufficient for embedding a canvas/image into a PDF. Consider replacing jspdf with pdf-lib when time permits.

---

### 3.3 QR Generation

| Library | Size (gz) | Usage | Status |
|---|---|---|---|
| `qrcode` | ~25KB | `QRCodeGenerator.jsx` | Lazy-loaded — Good |

**Concerns with `qrcode` package:**
- No TypeScript types bundled (but `@types/qrcode` is not installed)
- API is callback-style in older versions; this project uses `^1.5.4` which supports promises

**Positive:** 25KB is very small, and the dynamic import pattern is already in place.

**Alternative:** `qrcode` wraps `qrcode-generator` (a smaller, pure JS QR encoder). Could replace with direct `qrcode-generator` import (~10KB) if the API difference is acceptable.

---

### 3.4 Math Utilities

| Library | Size (gz) | Usage | Status |
|---|---|---|---|
| `expr-eval` | ~15KB | `calculator.js`, `mathParser.js` | Direct import — Good |
| `mathjs` | ~500KB | None | **UNUSED — Remove** |

**Current setup:** `expr-eval` handles all math parsing needs:
- Basic arithmetic evaluation (`calculator.js`)
- Function parsing and graphing (`mathParser.js`)
- Operators restricted to arithmetic only (logical/comparison/assignment disabled)

**No `mathjs` usage:** Despite being in package.json, `mathjs` is not imported anywhere. All math needs are met by `expr-eval` (15KB vs 500KB for mathjs).

**Action:** Remove `mathjs`. The `math-vendor` chunk in `vite.config.js` should also be removed.

---

### 3.5 Icon Libraries

| Library | Size (gz) | Usage | Status |
|---|---|---|---|
| `lucide-react` | ~100KB+ | `Icon.jsx`, `map.js` | Named imports — OK |

**Usage:** 22 icons used (21 in `map.js` + `CircleHelp` in `Icon.jsx`).

**Tree-shaking:** Named imports should enable tree-shaking. The concern is that `iconMap` is a runtime object, and if the bundler cannot trace that only these 22 icons are accessed, the full lucide library (~100KB+ with 500+ icons) could be bundled.

**Mitigation:** Vite/Rollup uses esbuild for tree-shaking. Named imports from `lucide-react` like `import { Calculator } from 'lucide-react'` ARE tree-shakeable. The `iconMap` object receives only the named imports, so bundler should include only the 22 used icons.

**Potential improvement:** If bundle analysis shows full lucide bundle included, replace with:
1. **Inline SVG components** — Each icon is a small (~500B) React component. 22 icons = ~11KB total, zero runtime overhead. Recommended.
2. **@tabler/icons-react** — Alternative icon set, similar API

**Note:** `CircleHelp` in `Icon.jsx` is imported directly from `lucide-react` and used as fallback. This could be replaced with a custom SVG.

---

## 4. Dependency Cleanup Plan

### Remove (Safe to Remove — Zero Usage)

| Package | Reason | Risk |
|---|---|---|
| `mathjs` | No imports anywhere. Replaced by `expr-eval`. | None |

### Replace (Low Risk — Drop-in)

| Package | Replace With | Reason | Risk |
|---|---|---|---|
| `node-fetch` | Native `fetch` (Cloudflare Worker global) | Workers have built-in fetch. `node-fetch` adds 55KB unnecessarily. | Low — just remove import line |

### Consider (Medium-Term, Not Urgent)

| Package | Consider | Reason |
|---|---|---|
| `jspdf` | `pdf-lib` | `pdf-lib` is ~200KB vs 500KB. Sufficient for canvas-to-PDF use case. |
| `lucide-react` | Inline SVG components | 22 icons × ~500B = ~11KB total vs ~100KB+ with tree-shaking risk. Eliminates dependency entirely. |

### No Change Needed

| Package | Reason |
|---|---|
| `react`, `react-dom`, `react-router-dom` | Core framework |
| `react-helmet-async` | Essential for SEO, lightweight |
| `qrcode` | Already lazy-loaded, only 25KB |
| `chart.js` + `react-chartjs-2` | Lazy-loaded, heavy but appropriate for functionality |
| `expr-eval` | Lightweight, only 15KB |
| `lucide-react` | Tree-shaking should work; low priority refactor |

---

## 5. Bundle Chunk Analysis (Current)

From `vite.config.js` manual chunks:

| Chunk | Libraries | Lazy? |
|---|---|---|
| `helmet` | `react-helmet-async` | No — needed on initial load for SEO |
| `chart-vendor` | `chart.js` + `react-chartjs-2` | Yes — only loaded with Calculator graph |
| `math-vendor` | `mathjs` | **Never created** (mathjs not imported) |
| `qr-vendor` | `qrcode` | No — imported dynamically but chunk still created on build |
| `react-vendor` | `react` + `react-dom` + `react-router-dom` | No — core runtime |

**Note:** `qr-vendor` chunk is created even though `qrcode` is dynamically imported. This means the `qrcode` library is in the main bundle, not lazy-loaded by chunk. The dynamic `import()` in the component only prevents the *module execution* until needed, but Rollup still includes it in the vendor chunk.

**Improvement for `qr-vendor`:** To truly lazy-load qrcode, it should be in its own chunk that is only loaded when the QR page loads. Currently, `qrcode` is in `qr-vendor` which may be loaded on initial page load depending on the build.

---

## 6. Summary of Actions

### Immediate (Remove Now)

1. **Remove `mathjs`** from `package.json` — unused
2. **Remove `math-vendor`** chunk from `vite.config.js` — dead code
3. **Replace `node-fetch`** with native `fetch` in `api/seo-audit.js` — unnecessary in Cloudflare Worker

### Future (Nice to Have)

4. **Replace `lucide-react`** icons with inline SVG components — eliminates 100KB+ dependency, saves ~90KB
5. **Replace `jspdf`** with `pdf-lib` — saves ~300KB for PDF export feature
6. **Audit `qr-vendor` chunk** — verify qrcode is truly lazy-loaded and not in initial bundle
