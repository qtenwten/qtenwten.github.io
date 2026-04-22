# Analytics & Event Tracking Audit

## 1. Existing Analytics Infrastructure

### 1.1 Custom AnalyticsService (`src/utils/analytics.js`)

A custom `AnalyticsService` class exists with GA4 (`window.gtag`) integration and a handler system for custom backends.

**Event registry:**
```js
const ANALYTICS_EVENTS = {
  TOOL_USED: 'tool_used',
  QR_GENERATED: 'qr_generated',
  LINK_COPIED: 'link_copied',
  PASSWORD_GENERATED: 'password_generated',
  SEO_AUDIT_COMPLETED: 'seo_audit_completed',
  CALCULATOR_USED: 'calculator_used',
  ARTICLE_VIEWED: 'article_viewed',
  FEEDBACK_SENT: 'feedback_sent',
  SEARCH_PERFORMED: 'search_performed',
}
```

**Features:**
- Session ID generation per browser session
- `on(event, handler)` — subscribe to events (used nowhere)
- `emit(event, properties)` — fire events to all handlers + GA4
- Per-event track methods (e.g., `trackToolUsed(slug, props)`)
- URL, timestamp, sessionId auto-attached to every event
- GA4 forwarding via `window.gtag('event', event, props)`

**Critical problem:** `analytics.init()` is **never called**. The service is instantiated as a singleton (`export const analytics = new AnalyticsService()`) but has no initialization method to call. The class has no init method anyway — it's stateless. All methods are called directly on the singleton. This works but the design conflates the service instance with the initialization pattern.

### 1.2 Yandex.Metrika (`index.html:183-193`)

```html
ym(108416207, 'init', {
  ssr:true, webvisor:true, clickmap:true,
  ecommerce:"dataLayer", referrer: document.referrer,
  url: location.href, accurateTrackBounce:true, trackLinks:true
});
```

- `ecommerce:"dataLayer"` — dataLayer is set up for ecommerce events, but **no `dataLayer` pushes exist** in the codebase
- `clickmap:true` — Yandex tracks clicks via its own script
- `trackLinks:true` — Yandex tracks outbound link clicks via its own script
- **No custom Yandex event calls** (`ym()`) anywhere in the app code

### 1.3 Google Analytics 4

GA4 script is not in `index.html`. The `analytics.js` code references `window.gtag` but it is never loaded. When `window.gtag` is absent (which it always is), events are silently discarded — the check is `if (typeof window !== 'undefined' && window.gtag)`.

### 1.4 What Is Actually Tracked

Only **one** analytics call exists in the entire codebase:

```js
// src/pages/ArticlePage.jsx:50
analytics.trackArticleViewed(visibleArticle.slug, visibleArticle.translationKey)
```

Every other track method (`trackToolUsed`, `trackQRGenerated`, `trackLinkCopied`, etc.) is **defined but never called**.

---

## 2. Gap Analysis — What Is Not Tracked

### 2.1 Page Views

**Status:** Not tracked anywhere.

Yandex.Metrika tracks page views automatically on navigation (it monitors `history.pushState`), but:
- No explicit `pageview` events sent to GA4
- No `location.href` passed to Yandex beyond initial init
- Language-switch page views are not differentiated
- Article page views rely on Metrika auto-tracking, not explicit events

**Impact:** Cannot answer: "How many users visit tool X vs tool Y?", "What is the bounce rate per tool page?", "How do RU vs EN users behave differently?"

### 2.2 Tool Usage

**Status:** Not tracked — `trackToolUsed()` defined but never called.

Tools with interactive "Generate/Analyze" buttons:
| Tool | Primary Action | Tracking Needed |
|---|---|---|
| `QRCodeGenerator` | Generate QR | Type (text/url/wifi/etc.), format, logo |
| `PasswordGenerator` | Generate password | Length, options used |
| `RandomNumber` | Generate number | Range, count |
| `SEOAudit` / `SEOAuditPro` | Run audit | URL domain, score result |
| `URLShortener` | Shorten URL | Original URL domain |
| `MetaTagsGenerator` | Generate tags | All fields filled |
| `DateDifferenceCalculator` | Calculate date diff | Mode (days/time/countdown) |
| `CompoundInterest` | Calculate interest | All inputs |
| `VATCalculator` | Calculate VAT | Direction (add/remove) |
| `NumberToWords` | Convert number | Currency, options |
| `Calculator` | Graph / calculate | Expression type, graph vs calc |
| `Feedback` | Submit feedback | Rating, has message |

### 2.3 Copy Actions

**Status:** Not tracked — `CopyButton` has no analytics integration.

`CopyButton` is used in 8+ pages:
- `NumberToWords` — copy result text
- `VATCalculator` — copy 3 different results
- `URLShortener` — copy short URL (also in history items)
- `RandomNumber` — copy generated numbers
- `PasswordGenerator` — copy generated password
- `MetaTagsGenerator` — copy meta tags block
- `DateDifferenceCalculator` — copy date diff results
- `CompoundInterest` — copy calculation results

No tracking of: what was copied (never the actual content — just the context), which tool, copy success/fail.

### 2.4 Generate / Download Actions

**Status:** Not tracked.

- `QRCodeGenerator.handleDownload()` — downloads QR in PNG/JPG/SVG/PDF/WebP. No tracking of format chosen, whether logo was included, QR type.
- `PasswordGenerator` — generates on load and on option change. No tracking of generation parameters.
- `QRCodeGenerator` — generates live preview on every input change. Not tracked (and shouldn't be — too noisy, but final generation/download should be).

### 2.5 Article Views

**Status:** Partially tracked — only in `ArticlePage`, only for articles from D1 API.

Not tracked:
- Article list page views (`/ru/articles/`, `/en/articles/`)
- Related article clicks (users navigating from one article to another)
- Search result clicks within articles

### 2.6 Search Usage

**Status:** Not tracked — `trackSearchPerformed()` defined but never called.

- `SearchResults.jsx` runs `searchRoutes()` but never calls `trackSearchPerformed(query, resultCount)`
- Home page search bar submits to `/search?q=...` — no tracking on home search input
- Header search link click not tracked

### 2.7 Outbound Clicks

**Status:** Not tracked. Yandex.Metrika has `trackLinks:true` which may capture some outbound links, but:
- `URLShortener` opens shortened URLs in new tab (`target="_blank"`) — no tracking of which domains users navigate to
- Article `ArticleMarkdown` renders external links with `target="_blank"` — no tracking
- No distinction between internal nav and external redirects

### 2.8 SEO Audit Sharing

**Status:** Not tracked — `handleShare` copies URL to clipboard but no analytics event.

The share URL format: `${origin}/${language}/seo-audit-pro?url=...&score=...&issues=...`

Should track: share action triggered, score at share time.

### 2.9 Language / Theme Switching

**Status:** Not tracked.

- `LanguageSwitcher` switches language — no event
- `ThemeSwitcher` toggles theme — no event

### 2.10 Error / Empty States

**Status:** Not tracked.

No tracking of:
- Audit results that are all-warnings (score 100 but with suggestions)
- Audit failures / fallback mode used
- Tool errors (invalid input, calculation errors)

---

## 3. Proposed Event Model

### 3.1 Event Taxonomy

```
page_view
  └─ path, language, referrer

tool_used
  └─ tool_slug, action_type, [tool_specific_params]

qr_generated
  └─ qr_type (text/url/email/wifi/phone/sms/wifi), format (png/jpg/svg/pdf/webp), has_logo, logo_position

password_generated
  └─ length, has_symbols, has_numbers, has_uppercase, has_lowercase, strength_score

link_copied
  └─ tool_slug, link_type (result/url/history), success

seo_audit_completed
  └─ score, url_domain, issues_count, method (worker/fallback), shared

article_viewed
  └─ slug, translation_key, language

article_list_viewed
  └─ language

search_performed
  └─ query (hashed or bucketed), result_count, source (header/home/search_page)

outbound_click
  └─ url_domain, link_context (article/short_url/tool_page), tool_slug

feedback_sent
  └─ has_rating, has_message, language

calculator_used
  └─ expression_type (arithmetic/graph), expression_length

calculator_history_restored
  └─ tool_slug

tool_cleared
  └─ tool_slug

language_switched
  └─ from_lang, to_lang, path

theme_switched
  └─ from_theme, to_theme
```

### 3.2 Page View

```js
// On every route change (via useEffect in App or a dedicated hook)
analytics.emit('page_view', {
  path: location.pathname,           // e.g. /ru/qr-code-generator
  language: currentLanguage,          // 'ru' | 'en'
  referrer: document.referrer,       // external referrer or '' if direct
})
```

### 3.3 Tool Usage

```js
// QRCodeGenerator — on download
analytics.emit('qr_generated', {
  qr_type: qrType,           // 'text' | 'url' | 'wifi' | 'email' | 'phone' | 'sms'
  format: selectedFormat,   // 'png' | 'jpg' | 'svg' | 'pdf' | 'webp'
  has_logo: Boolean(logoImage),
})

// PasswordGenerator — on generate
analytics.emit('password_generated', {
  length,
  has_symbols: options.symbols,
  has_numbers: options.numbers,
  has_uppercase: options.uppercase,
  has_lowercase: options.lowercase,
  strength_score: strength.score,
})

// SEOAuditPro — on share
analytics.emit('seo_audit_completed', {
  score: result.score,
  url_domain: new URL(url).hostname,
  issues_count: result.issues.length,
  method: result.data?.source === 'worker' ? 'api' : 'browser',
  shared: true,
})
```

### 3.4 Copy Actions

```js
// CopyButton needs a new prop: analyticsContext
<CopyButton
  text={result}
  analyticsContext={{ tool_slug: 'number-to-words', link_type: 'result' }}
/>

// Inside CopyButton handleCopy success:
analytics.emit('link_copied', {
  tool_slug: analyticsContext.tool_slug,
  link_type: analyticsContext.link_type,
  success: true,
})
```

### 3.5 Article Views

Already partially implemented. Add article list tracking:

```js
// ArticlesIndex.jsx — when article list renders
analytics.emit('article_list_viewed', { language })

// ArticlePage.jsx — existing, but add translation_key always
analytics.trackArticleViewed(slug, translationKey, { language })
```

### 3.6 Search Usage

```js
// SearchResults.jsx — when user submits or results change
analytics.emit('search_performed', {
  query: hashQuery(query.trim()),  // don't send raw query (privacy)
  result_count: results.length,
  source: 'search_page',
})

// Header.jsx — on Enter in search bar
analytics.emit('search_performed', {
  query: hashQuery(query.trim()),
  result_count: null,  // unknown from header
  source: 'header',
})
```

### 3.7 Outbound Clicks

```js
// Need a shared OutboundLink component or a useOutboundClick hook
// Attach to all external links via a Link wrapper

analytics.emit('outbound_click', {
  url_domain: new URL(href).hostname,
  link_context: 'article' | 'short_url' | 'tool_page',
  tool_slug: currentToolSlug || null,
})
```

### 3.8 Calculator Usage

```js
// Calculator.jsx — on graph toggle or significant calculation
analytics.emit('calculator_used', {
  expression_type: mode,  // 'calculation' | 'graph'
  expression_length: expression.length,
})
```

---

## 4. Proposed Analytics Layer Architecture

### 4.1 Minimal V1 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Analytics Layer                   │
│                  src/utils/analytics.js              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐   ┌──────────────┐               │
│  │ Event Emit   │──▶│  Handlers    │               │
│  │ (public API) │   │  (GA4, YM,   │               │
│  │              │   │   custom)    │               │
│  └──────────────┘   └──────┬───────┘               │
│                            │                        │
│  ┌──────────────┐          ▼                        │
│  │ Middleware   │   ┌──────────────┐               │
│  │ (url, ts,    │──▶│  Destinations │               │
│  │  sessionId)  │   │  - window.gtag│               │
│  └──────────────┘   │  - window.ym │               │
│                     │  - console   │               │
│                     └──────────────┘               │
└─────────────────────────────────────────────────────┘
```

### 4.2 Initialization Pattern

The current singleton approach works but needs an explicit init call. Recommended pattern:

```js
// src/utils/analytics.js

class AnalyticsService {
  constructor() {
    this.handlers = []
    this.sessionId = this.generateSessionId()
    this.initialized = false
  }

  init() {
    this.initialized = true
  }

  emit(event, properties = {}) {
    if (!this.initialized) return  // silent no-op before init

    const payload = {
      event,
      properties: {
        url: typeof window !== 'undefined' ? window.location.pathname : '',
        language: window.__QSEN_INITIAL_LANGUAGE__ || 'ru',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        ...properties,
      },
    }

    // Send to GA4 if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, payload.properties)
    }

    // Send to Yandex.Metrika if available
    if (typeof window !== 'undefined' && window.ym) {
      window.ym(108416207, 'reachGoal', event, payload.properties)
    }

    // Send to custom handlers
    this.handlers
      .filter(({ event: e }) => e === event || e === '*')
      .forEach(({ handler }) => {
        try { handler(payload) } catch {}
      })
  }
}

export const analytics = new AnalyticsService()
```

Call `analytics.init()` once in `main.jsx` after app mounts.

### 4.3 Component Integration

Create a `useAnalytics` hook for components:

```js
// src/hooks/useAnalytics.js
import { analytics } from '../utils/analytics'

export function useAnalytics() {
  return {
    emit: analytics.emit.bind(analytics),
    trackToolUsed: analytics.trackToolUsed.bind(analytics),
    trackQRGenerated: analytics.trackQRGenerated.bind(analytics),
    trackLinkCopied: analytics.trackLinkCopied.bind(analytics),
    trackArticleViewed: analytics.trackArticleViewed.bind(analytics),
    trackSearchPerformed: analytics.trackSearchPerformed.bind(analytics),
    trackFeedbackSent: analytics.trackFeedbackSent.bind(analytics),
  }
}
```

### 4.4 Page View Tracking

Add a `PageViewTracker` component that uses `useLocation`:

```js
// src/components/PageViewTracker.jsx
function PageViewTracker() {
  const location = useLocation()
  const { language } = useLanguage()

  useEffect(() => {
    analytics.emit('page_view', {
      path: location.pathname,
      language,
      referrer: document.referrer,
    })
  }, [location.pathname, location.search, language])

  return null
}

// Add to App.jsx inside the main Routes wrapper
```

### 4.5 CopyButton Enhancement

Add optional `analytics` prop to `CopyButton` without requiring context:

```jsx
// CopyButton accepts:
<CopyButton
  text={value}
  analytics={{ tool_slug: 'vat-calculator', link_type: 'result' }}
/>

// Internally fires on successful copy:
if (this.props.analytics) {
  analytics.emit('link_copied', {
    tool_slug: this.props.analytics.tool_slug,
    link_type: this.props.analytics.link_type,
    success: true,
  })
}
```

### 4.6 Outbound Link Tracking

Create an `OutboundLink` wrapper component that auto-attaches click tracking:

```jsx
// src/components/OutboundLink.jsx
function OutboundLink({ href, toolSlug, context, children, ...props }) {
  const handleClick = (e) => {
    const domain = new URL(href, window.location.origin).hostname
    analytics.emit('outbound_click', {
      url_domain: domain,
      link_context: context,
      tool_slug: toolSlug,
    })
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
```

Use in `ArticleMarkdown`, `URLShortener`, etc.

### 4.7 GA4 Enhanced Ecommerce (Yandex DataLayer)

Yandex is configured with `ecommerce:"dataLayer"`. The app should push ecommerce events:

```js
// On tool usage that generates a result:
window.dataLayer = window.dataLayer || []
window.dataLayer.push({
  event: 'tool_used',
  ecommerce: {
    currency: 'USD',
    value: 1,
    items: [{
      item_id: toolSlug,
      item_name: toolName,
      item_category: 'tools',
    }],
  },
})
```

This enables Yandex.Metrika to build product lists and analyze tool performance.

---

## 5. Implementation Priorities

### P0 — Critical (no code changes needed, just config)

1. **Add GA4 script to `index.html`** — without this, all `window.gtag` calls are no-ops. GA4 is the primary analytics destination for Western users.

2. **Add `analytics.init()` call in `main.jsx`** — establishes session tracking.

3. **Add `PageViewTracker` component** — fires on every route change. Without this, page-level analysis is impossible.

### P1 — High Value, Small Effort

4. **Track tool generate/download actions** — add `analytics.emit()` calls to:
   - `QRCodeGenerator.handleDownload()` — format, QR type, logo presence
   - `PasswordGenerator` — on generate, length + options
   - `SEOAuditPro` — on audit complete, score + URL domain
   - `SEOAudit` — same
   - `URLShortener` — on shorten success

5. **Track copy actions** — add `analytics` prop to `CopyButton` instances with tool context.

6. **Track search** — add `trackSearchPerformed` to `SearchResults.jsx`.

7. **Track article views** — verify `ArticlePage` tracking works reliably, add list page tracking.

### P2 — Medium Effort, Nice to Have

8. **Track share action** in `SEOAuditPro.handleShare`.

9. **Add outbound link tracking** — create `OutboundLink` component, replace existing external `<a>` tags.

10. **Track language/theme switches**.

11. **Track calculator usage** — add `trackCalculatorUsed` on graph/calculation toggle.

### P3 — Nice to Have

12. **Hash query values** in search events for privacy.

13. **Add custom handler** for dev-mode console output of all events.

14. **Add Yandex.Metrika goal IDs** for specific conversions (feedback sent, SEO audit completed).

---

## 6. Key Anti-Patterns to Avoid

- **Never send raw PII** — do not include email, name, or specific user input in event properties. Hash or bucket queries.
- **Never track on every keystroke** — debounce/throttle tracking for live-preview tools (e.g., QR live preview should not fire events on each character typed).
- **Never log sensitive data** — passwords, private URLs, API keys.
- **Do not track failed copy attempts as failures** — copy failure is a browser security restriction, not a user action worth analyzing separately.
- **Do not add analytics script blocking** — the analytics script in `index.html` is synchronous and parser-blocking. Keep it lean.
