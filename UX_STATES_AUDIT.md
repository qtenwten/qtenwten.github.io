# UX States Audit — Loading, Error, Empty States

## 1. Loading States Inventory

### 1.1 Skeleton Components

| Component | Used For | Appearance | Animation |
|---|---|---|---|
| `RouteSkeleton` | Route-level lazy loading (`<Suspense>` fallback) | 3 cards: hero, tool inputs, content | Shimmer via CSS (`skeleton-line` gradient) |
| `LoadingState` skeleton (inside) | Article list / detail loading | Grid of `skeleton-card` with shimmer | `skeleton-shimmer` gradient 1.5s ease-in-out |
| Article list skeleton (inline HTML) | Prerendered article index | `article-card--skeleton` cards with shimmer | `article-skeleton-shimmer` 1.2s |
| GraphPanel skeleton | Calculator graph loading | Custom `graph-panel-skeleton` with `graph-skeleton-line` | None explicitly, but graph itself is async |

### 1.2 Spinners

| Component | Type | Used By |
|---|---|---|
| `InlineSpinner` | CSS circle spin, `aria-hidden` + `sr-only` label | SEOAudit, SEOAuditPro, URLShortener, Feedback (button state) |
| `LoadingSpinner` | CSS circle spin with label, `role="status"` | Not used by any page (exported but not imported) |
| CSS spinner via `.button-spinner` | Spinner inside button text | SEOAuditPro, URLShortener, Feedback |

### 1.3 Loading States by Page

| Page | Mechanism | Loading Indicator |
|---|---|---|
| ArticlesIndex | `useArticlesIndex` → `LoadingState` | Skeleton grid cards |
| ArticlePage | `useArticleDetail` → `LoadingState` | 1 skeleton card |
| SEOAudit | `loading: bool` local state | `InlineSpinner` inside button |
| SEOAuditPro | `loading: bool` local state + `useAsyncRequest` | `InlineSpinner` inside button |
| URLShortener | `loading: bool` local state + `useAsyncRequest` | `InlineSpinner` inside button |
| Feedback | `status: 'sending'` | `InlineSpinner` inside submit button |
| NumberToWords | None (sync, debounced) | No loading indicator |
| VATCalculator | None (sync) | No loading indicator |
| RandomNumber | None (sync) | No loading indicator |
| CompoundInterest | None (sync) | No loading indicator |
| DateDifferenceCalculator | None (sync) | No loading indicator |
| PasswordGenerator | None (sync) | No loading indicator |
| MetaTagsGenerator | None (sync) | No loading indicator |
| QRCodeGenerator | `qrCodeLib: null` initial + dynamic import | No visual indicator during lib load; blank preview area |

### 1.4 QRCodeGenerator — Client-Only Loading Issue

`QRCodeGenerator.jsx:492-511` dynamically imports `qrcode` library. During import (1-2 seconds), the page shows an empty preview area with no loading indicator. The state is:

```jsx
const [qrCodeLib, setQrCodeLib] = useState(null)
const [generationError, setGenerationError] = useState('')
```

If `qrCodeLib` is null, the preview shows an empty/placeholder state. No spinner is shown while the library loads.

---

## 2. Error Handling

### 2.1 Error Display Patterns

| Pattern | Component | Used By |
|---|---|---|
| `ResultNotice tone="error"` | `ResultSection.jsx` | SEOAudit, SEOAuditPro |
| `<div className="error">` | Inline HTML | RandomNumber, URLShortener (inline error) |
| `<div className="alert alert-error">` | Inline HTML with `role="alert"` | Feedback |
| `LoadingState` error state | `LoadingState.jsx` | ArticlesIndex, ArticlePage |
| `calc-error` class | Inline inside calculator | CalculatorPanel |
| `graph-error` class | Inline inside graph panel | GraphPanel |
| `generationError` text | Inline text near preview | QRCodeGenerator |
| `window.alert()` | Browser native | PasswordGenerator |

### 2.2 Error Handling Layers

#### Page-Level Error Boundaries

| Boundary | File | Wraps | Recovery |
|---|---|---|---|
| `AppErrorBoundary` | `AppErrorBoundary.jsx` | Entire app (`<App>`) | Reload or go to homepage |
| `ErrorBoundary` | `ErrorBoundary.jsx` | Used inside individual routes/pages? | Reload or homepage |

Looking at `App.jsx:165`:
```jsx
<AppErrorBoundary>  ← wraps entire app
  <Header />
  <main>...</main>
  <Footer />
</AppErrorBoundary>
```

`ErrorBoundary` (non-App) appears to be unused or used for component-level fallbacks.

#### Component-Level Error Handling

| Component | Error Source | Display | Recovery |
|---|---|---|---|
| `LoadingState` | API error via `error` prop | Centered card with ⚠️ icon + retry button | `onRetry` prop |
| `ResultNotice` | Passed as children or `title` | Inline colored box | None (just display) |
| `CalculatorPanel` | Expression parse error | `calc-error` div below input | User corrects input |
| `GraphPanel` | Expression compile error | `graph-error` div below input | User corrects input |
| QRCodeGenerator | Library load failure | `generationError` state → inline text + `ResultNotice`-like message | Retry or clear |

### 2.3 API-Level Error Handling

| API | Error Handling | Timeout | Network Failure |
|---|---|---|---|
| `articlesApi.js` | Throws typed errors (`INVALID_JSON`, `AbortError`) | 12s via `AbortController` | Caught and rethrown |
| `seoAuditApi.js` | Throws typed errors (`HTML_RESPONSE`, `INVALID_JSON`, `WORKER_ERROR`) | Caller manages | Caller manages |
| `Feedback.jsx` | Manual timeout + `readWorkerResponse` | 12s manual `setTimeout` | Distinguishes timeout vs network |
| `URLShortener.jsx` | Via `useAsyncRequest` | Abort via `useAsyncRequest` | Shows inline error |
| `SEOAudit.jsx` | `try/catch` around `analyzeSEO()` | None (browser CORS) | Returns `{error: 'cors'}` object |
| `SEOAuditPro.jsx` | `try/catch` + `useAsyncRequest` + manual distinction | Worker call via signal | Distinguishes network vs API |

### 2.4 Critical Issue: LoadingState Uses URL Inspection for Language

`LoadingState.jsx:36-47` determines language for error/retry messages by inspecting `window.location.pathname`:

```jsx
{window.location.pathname.startsWith('/en')
  ? 'Could not load data'
  : 'Не удалось загрузить данные'}
```

This is used by `ArticlesIndex` and `ArticlePage` — the two most critical pages for error UX. It should use `useLanguage()` context instead.

**Same issue exists in `ErrorBoundary.jsx:19`** and **`AppErrorBoundary.jsx:47`**.

---

## 3. Empty States, Recovery Paths, Retry Flows

### 3.1 Empty States by Page

| Page | Empty Condition | Visual | Recovery |
|---|---|---|---|
| ArticlesIndex | `articles.length === 0 && status === 'success'` | Custom `articles-list-state` section with message | "Open all articles" link |
| ArticlePage | Never truly empty (article must exist to load) | — | — |
| SEOAudit | No URL entered | `ResultNotice` "Enter a URL" | User enters URL |
| SEOAuditPro | No URL entered | Button disabled state | User enters URL |
| URLShortener | No URL entered | No result shown | User enters URL |
| NumberToWords | No number entered | No result shown | User types number |
| VATCalculator | No amount entered | No result shown | User types amount |
| RandomNumber | No result | No result shown | User clicks Generate |
| CompoundInterest | No result | No result shown | Inputs auto-calculate |
| DateDifferenceCalculator | No dates selected | Mode-specific empty state (3 variants) | User picks dates |
| PasswordGenerator | N/A (always has generated password) | Default password on load | User changes settings |
| MetaTagsGenerator | No tags generated | Nothing shown | User fills form |
| QRCodeGenerator | No content entered | Preview area with placeholder text | User enters content |
| GraphPanel | No expression entered | Placeholder div with 📈 emoji | User types expression |
| CalculatorPanel | No expression entered | Empty screen with placeholder "0" | User types expression |
| URL shortener history | `history.length === 0` | Entire history section hidden | User creates short link |

### 3.2 Recovery Paths

| Scenario | Recovery Path |
|---|---|
| Article load fails | `LoadingState` retry button → calls `refetch()` → re-fetches from API |
| SEO audit fails | Inline error message persists; user must fix URL and resubmit |
| URL shorten fails | Error shown inline; user can retry with same or different URL |
| Feedback send fails | Status becomes `'pending'` (ambiguous timeout) or `'error'`; form stays filled; user can retry |
| Graph expression invalid | Error shown below input; user corrects expression |
| Calculator expression invalid | Error shown below input; previous valid result preserved |
| QR generation fails | `generationError` shown; preview shows error state; user corrects input |

### 3.3 Retry Flows

| Page | Retry Mechanism |
|---|---|
| ArticlesIndex | `LoadingState` retry button → `fetchIndex(language, { force: true })` |
| ArticlePage | `LoadingState` retry button → `fetchDetail(slug, language)` |
| SEOAudit | No retry button; user re-enters URL and clicks Analyze |
| SEOAuditPro | No retry button; user modifies URL and clicks Analyze |
| URLShortener | No retry button; user clicks "Shorten" again |
| Feedback | No retry button; user resubmits the form |
| ErrorBoundary (app) | "Refresh page" button → `window.location.reload()` |
| ErrorBoundary (app) | "Go to homepage" → navigates to `/ru/` or `/en/` |

---

## 4. Inconsistencies Between Pages and Components

### 4.1 Loading Indicator Inconsistency

| Tool Pages | Loading Indicator |
|---|---|
| SEOAudit, SEOAuditPro, URLShortener, Feedback | `InlineSpinner` inside button + button disabled |
| ArticlesIndex, ArticlePage | `LoadingState` skeleton |
| NumberToWords, VATCalculator, RandomNumber, CompoundInterest, DateDifferenceCalculator | **No loading indicator at all** (synchronous results) |
| QRCodeGenerator | **No loading indicator** while `qrcode` lib loads |

### 4.2 Error Display Inconsistency

| Page/Component | Error Style | A11y |
|---|---|---|
| `LoadingState` | Card with ⚠️ icon, `h2` title, `p` description, button | Button is focusable |
| `ResultNotice` | Inline `div` with tone-based coloring | No `role` |
| `RandomNumber` | `<div className="error">` plain text | No `role` |
| `URLShortener` | `<div className="error">` plain text | No `role` |
| `Feedback` | `<div className="alert alert-error" role="alert">` | Good (`role="alert"`) |
| `CalculatorPanel` | `<div className="calc-error">` | No `role` |
| `GraphPanel` | `<div className="graph-error">` | No `role` |
| `QRCodeGenerator` | Inline `generationError` text + `ResultNotice`-like display | Mixed |

### 4.3 Skeleton Inconsistency

- `RouteSkeleton` uses `skeleton-line` class with gradient animation (in `index.css`)
- `LoadingState` uses `skeleton-card` class with `skeleton-shimmer` (in `LoadingState.css`)
- These are **different CSS classes with different animations** — visually inconsistent shimmer speed/appearance
- Article skeletons use yet another animation (`article-skeleton-shimmer` in `Articles.css`)
- GraphPanel skeleton uses `graph-skeleton-line` with no animation

### 4.4 Result Display Inconsistency

| Page | Result Display |
|---|---|
| VATCalculator | `result-box success` div with inline `<p>` rows |
| RandomNumber | `result-box success` div with `.result-value` |
| CompoundInterest | uses `LineChart` + inline result text |
| NumberToWords | `ResultSection`/`ResultSummary` components + custom variants list |
| DateDifferenceCalculator | `ResultSection`/`ResultSummary`/`ResultMetric` components |
| QRCodeGenerator | Custom preview card with metrics |
| SEOAudit | `ResultSection`/`ResultSummary`/`ResultDetails` components |
| SEOAuditPro | `ResultSection`/`ResultSummary`/`ResultDetails` components |
| URLShortener | `ResultSection`/`ResultSummary` with `CopyButton` |

### 4.5 State Naming Inconsistency

| Page | Loading State | Error State | Result State |
|---|---|---|---|
| ArticlesIndex | `status === 'loading'` (via context) | `error` (via context) | `articles[]` |
| ArticlePage | `status === 'loading'` (via context) | `error` (via context) | `article` |
| SEOAudit | `loading: bool` | `error: string` | `result: object` |
| SEOAuditPro | `loading: bool` | `error: string` | `result: object` |
| URLShortener | `loading: bool` | `error: string` | `shortUrl: string` |
| Feedback | `status: 'idle'\|'sending'\|'success'\|'pending'\|'error'` | `statusMessage: string` | (form submission) |
| NumberToWords | none | none | `result: object` |
| VATCalculator | none | none | `result: object` |
| RandomNumber | none | `error: string` | `result: array` |
| CalculatorPanel | none | `error: string` | `result: any` |

---

## 5. Proposed Unified UX States Standard

### 5.1 Unified LoadingState Interface

```jsx
// Proposed unified interface for LoadingState
<LoadingState
  status="idle" | "loading" | "success" | "error"  // or separate loading/error
  loadingMessage="Загрузка..." | "Loading..."       // from i18n
  error={errorObject}
  errorTitle="Не удалось загрузить"               // from i18n
  errorDescription="Попробуйте обновить страницу"
  onRetry={refetch}
  language="ru"                                     // from context, not URL inspection
  skeletonCount={6}
/>
```

### 5.2 Three Loading State Types

| Type | Use When | Visual |
|---|---|---|
| **Skeleton** | Data fetching (articles, initial page load) | Shimmer cards matching expected content shape |
| **Inline spinner** | Action in progress (form submit, analyze, shorten) | Spinner in button + disabled state |
| **Progress bar** | Not currently used | Consider for long operations (sitemap gen, etc.) |

### 5.3 Error Display Standard

```jsx
// All errors should use a unified ErrorMessage component
<ErrorMessage
  type="error" | "warning" | "info"
  title="Error title"
  description="Details"
  action={<button onClick={retry}>Retry</button>}
  role="alert"           // always for errors
  aria-live="assertive"  // always for errors
/>
```

### 5.4 Unified Result Display

| Result Type | Component | Used For |
|---|---|---|
| Simple value | `ResultSummary` | Single value with kicker label |
| Metrics grid | `ResultMetrics` + `ResultMetric` | Multiple numeric values |
| Structured data | `ResultDetails` | Tabbed or sectioned results |
| Copyable result | `ResultActions` + `CopyButton` | URL shorteners, text generators |
| Score/grade | `ResultSummary` with `score` prop | SEO audit score |

---

## 6. Problems Summary

| # | Problem | Severity | Location |
|---|---|---|---|
| UX1 | `LoadingState` uses `window.location.pathname` for language instead of `useLanguage()` | **High** | `LoadingState.jsx:36,45` |
| UX2 | `ErrorBoundary` and `AppErrorBoundary` use URL inspection for language | **High** | `ErrorBoundary.jsx:19`, `AppErrorBoundary.jsx:47` |
| UX3 | No loading indicator during QRCode library load (1-2 sec blank screen) | **Medium** | `QRCodeGenerator.jsx:492-511` |
| UX4 | `LoadingSpinner` exported but never used — dead component | Low | `LoadingState.jsx:58-64` |
| UX5 | 3 different skeleton CSS animations (`shimmer`, `skeleton-shimmer`, `article-skeleton-shimmer`) — visually inconsistent | Medium | `index.css`, `LoadingState.css`, `Articles.css` |
| UX6 | 5 different error display patterns (`.error`, `.alert`, `ResultNotice`, `calc-error`, `graph-error`) | Medium | Various pages |
| UX7 | 3 different state naming conventions (`status: 'loading'`, `loading: bool`, `status: enum`) | Medium | Across pages |
| UX8 | No empty state for NumberToWords, VATCalculator — result area simply absent | Low | No visual indication that user should type something |
| UX9 | PasswordGenerator uses `window.alert()` for validation errors | Low | `PasswordGenerator.jsx:76` |
| UX10 | CalculatorPanel preserves last valid result on error — good UX, but inconsistent with GraphPanel which clears | Low | `CalculatorPanel.jsx:26` |

---

## 7. Recommendations Priority

### Quick Wins

1. **Fix UX1+UX2:** Add `language` prop to `LoadingState`, `ErrorBoundary`, `AppErrorBoundary`. Remove URL inspection.
2. **Fix UX3:** Add conditional rendering in QRCodeGenerator preview area during `qrCodeLib === null` state — show `InlineSpinner` or placeholder.
3. **Fix UX4:** Delete `LoadingSpinner` (exported but unused).
4. **Fix UX9:** Replace `window.alert()` in PasswordGenerator with inline error display.

### Medium Changes

5. **Fix UX5:** Unify skeleton animations into one CSS class with CSS custom properties for speed/color, shared by all skeleton implementations.
6. **Fix UX6:** Create unified `ErrorMessage` component. Replace all inline error patterns across pages.
7. **Fix UX7:** Create unified `useRemoteData` hook that standardizes `status`/`loading`/`error`/`result` state across all async pages.

### Design Decisions Needed

8. **UX8:** Decide if NumberToWords/VATCalculator need empty state visuals or if absence of result is acceptable
9. **UX10:** Document the "preserve last valid result" UX pattern and decide if GraphPanel should follow it
