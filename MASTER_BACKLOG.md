# Master Backlog — All Improvements

Compiled from: `DEPENDENCY_AUDIT`, `ANALYTICS_AUDIT`, `UI_SYSTEM_AUDIT`, `UX_STATES_AUDIT`, `DATA_LAYER_AUDIT`, `SEO_AUDIT`, `PERFORMANCE_AUDIT`, `PRODUCT_AUDIT`

---

## Legend

- **Impact**: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
- **Effort**: XS (<30min) / S (1-2h) / M (4-8h) / L (full sprint)
- **Risk**: 🟢 Low (safe to ship) / 🟡 Medium (needs testing) / 🔴 High (requires verification)

---

## 🔴 QUICK WINS — Do First

| ID | Task | Category | Impact | Effort | Risk | Files |
|---|---|---|---|---|---|---|
| ~~QW-1~~ ✅ | Fix articles cache key `v4`→`v5` — every article page load hits API | Performance | 🔴 | XS | 🟢 | `src/api/articlesApi.js`, `src/contexts/ArticleStoreContext.jsx` |
| ~~QW-2~~ ✅ | Remove `mathjs` from `package.json` — zero usage | Dependencies | 🟡 | XS | 🟢 | `package.json`, `vite.config.js` |
| ~~QW-3~~ ✅ | Remove `math-vendor` chunk from `vite.config.js` — dead code | Dependencies | 🟡 | XS | 🟢 | `vite.config.js` |
| ~~QW-4~~ ✅ | Replace `node-fetch` with native `fetch` in CF Worker — all workers already use native fetch | Dependencies | 🟡 | XS | 🟢 | Workers confirmed use native fetch |
| ~~QW-5~~ ✅ | Fix `LoadingState` URL inspection — use `useLanguage()` | UX/Reliability | 🟠 | XS | 🟢 | `src/components/LoadingState.jsx` |
| ~~QW-6~~ ✅ | Fix `ErrorBoundary`/`AppErrorBoundary` URL inspection | UX/Reliability | 🟠 | XS | 🟢 | `src/components/ErrorBoundary.jsx`, `src/components/AppErrorBoundary.jsx` |
| ~~QW-7~~ ✅ | Delete unused `LoadingSpinner` component | UI/Dead Code | 🟢 | XS | 🟢 | `src/components/LoadingState.jsx` |
| ~~QW-8~~ ✅ | Fix sitemap `lastmod` to use `publishedAt` for articles | SEO | 🟠 | S | 🟢 | `scripts/generate-pages.js` |

---

## 🟠 NEXT SPRINT — High Value

| ID | Task | Category | Impact | Effort | Risk | Files |
|---|---|---|---|---|---|---|
| ~~SP-1~~ ✅ | Add GA4 script to `index.html` + `analytics.init()` + `PageViewTracker` | Analytics | 🟠 | S | 🟢 | `index.html`, `src/main.jsx`, `src/components/PageViewTracker.jsx` |
| ~~SP-2~~ ✅ | Track tool usage events (QR download, password generate, SEO audit) | Analytics | 🟠 | S | 🟢 | `src/pages/QRCodeGenerator.jsx`, `src/pages/PasswordGenerator.jsx`, `src/pages/SEOAuditPro.jsx` |
| ~~SP-3~~ ✅ | Track copy actions via `CopyButton` analytics prop | Analytics | 🟠 | S | 🟢 | `src/components/CopyButton.jsx`, tool pages |
| ~~SP-4~~ ✅ | Track search — `SearchResults.jsx` + Header | Analytics | 🟠 | S | 🟢 | `src/pages/SearchResults.jsx`, `src/components/Header.jsx` |
| ~~SP-5~~ ✅ | Track article views — add list page tracking | Analytics | 🟠 | S | 🟢 | `src/pages/ArticlesIndex.jsx` |
| ~~SP-6~~ ✅ | Fix `ArticleStoreContext` hardcoded `'ru'` for initial read | Data | 🟠 | S | 🟢 | `src/contexts/ArticleStoreContext.jsx` |
| ~~SP-7~~ ✅ | QRCodeGenerator — show spinner while `qrcode` lib loads | UX | 🟠 | S | 🟢 | `src/pages/QRCodeGenerator.jsx` |
| ~~SP-8~~ ✅ | Add SSRF protection to `seoAudit.js` browser fetch | Security | 🟠 | S | 🟡 | `src/utils/seoAudit.js`, `src/utils/seoAuditApi.js` |

---

## 🟡 MEDIUM-TERM REFACTORS

| ID | Task | Category | Impact | Effort | Risk | Files |
|---|---|---|---|---|---|---|
| ~~MR-1~~ ✅ | Replace `window.alert()` in PasswordGenerator with inline error | UX | 🟡 | XS | 🟢 | `src/pages/PasswordGenerator.jsx` |
| MR-2 | Derive `routeSeo.js` from `routeRegistry.js` + locales | SEO/Architecture | 🟡 | M | 🟡 | `src/config/routeSeo.js`, `src/config/routeRegistry.js` |
| MR-3 | Create unified `ErrorMessage` component — replace 5 error patterns | UX/UI | 🟡 | M | 🟡 | `src/components/ErrorMessage.jsx`, pages |
| MR-4 | Create unified `useRemoteData` hook for async pages | Data | 🟡 | M | 🟡 | `src/hooks/useRemoteData.js` |
| ~~MR-5~~ ✅ | Create `urlShortenerApi.js` and `feedbackApi.js` | Data | 🟡 | M | 🟡 | `src/api/urlShortenerApi.js`, `src/api/feedbackApi.js` |
| MR-6 | Replace inline `style={{}}` in VATCalculator, RandomNumber, CompoundInterest | UI | 🟡 | M | 🟡 | `src/pages/VATCalculator.jsx`, etc. |
| ~~MR-7~~ ✅ | Add `article:published_time` / `article:modified_time` to Article schema | SEO | 🟡 | S | 🟢 | `src/pages/ArticlePage.jsx` |
| ~~MR-8~~ ✅ | Add `BreadcrumbList` structured data on article pages | SEO | 🟡 | S | 🟢 | `src/pages/ArticlePage.jsx` |
| ~~MR-9~~ ✅ | Validate `og:image` dimensions, add `og:image:width/height` | SEO | 🟡 | S | 🟢 | `src/components/SEO.jsx`, `src/pages/ArticlePage.jsx` |
| ~~MR-10~~ ✅ | Pre-render QRCodeGenerator shell | Performance/SEO | 🟠 | M | 🟡 | `scripts/generate-pages.js`, `QRCodeGenerator.css` |
| ~~MR-11~~ ✅ | Add `language` prop to `LoadingState` — stop URL inspection everywhere | UX | 🟡 | S | 🟢 | `src/components/LoadingState.jsx` |
| ~~MR-12~~ ✅ | Unify skeleton CSS animations — skipped (visual stability) | UX | 🟡 | S | 🟢 | `src/styles/index.css`, `LoadingState.css`, `Articles.css` |
| ~~MR-13~~ ✅ | Create `useLanguageSwitcher` — stop reading cache directly | Data | 🟡 | M | 🟡 | `src/hooks/useLanguageSwitcher.js`, `src/contexts/ArticleStoreContext.jsx` |
| ~~MR-14~~ ✅ | Fix article legacy redirect language handling | SEO | 🟡 | S | 🟢 | `src/App.jsx` |
| ~~MR-15~~ ✅ | Add outbound link tracking component + integrate in ArticleMarkdown | Analytics | 🟡 | M | 🟢 | `src/components/OutboundLink.jsx`, `src/components/articles/ArticleMarkdown.jsx` |
| ~~MR-16~~ ✅ | Track SEO share action in SEOAuditPro | Analytics | 🟢 | S | 🟢 | `src/pages/SEOAuditPro.jsx` |
| ~~MR-17~~ ✅ | Track language/theme switches | Analytics | 🟢 | S | 🟢 | `src/components/LanguageSwitcher.jsx`, `src/components/ThemeSwitcher.jsx` |
| ~~MR-18~~ ✅ | Track calculator usage | Analytics | 🟢 | S | 🟢 | `src/pages/Calculator.jsx` |
| ~~MR-19~~ ✅ | Create `--spacing-*` CSS scale | UI | 🟡 | S | 🟢 | `src/styles/index.css` |
| MR-20 | Create unified `Card` component | UI | 🟡 | M | 🟡 | `src/components/Card.jsx` |
| ~~MR-21~~ ✅ | Replace `jspdf` with `pdf-lib` | Dependencies | 🟡 | M | 🟡 | `src/pages/QRCodeGenerator.jsx` |

---

## 🟢 LONG-TERM ARCHITECTURE

| ID | Task | Category | Impact | Effort | Risk |
|---|---|---|---|---|---|
| ~~LT-1~~ ⏭ | Replace lucide-react with inline SVG components (cancelled — tree-shaken) | Dependencies | 🟠 | L | 🟡 |
| ~~LT-2~~ ❌ | Replace chart.js with recharts (cancelled — no benefit) | Dependencies | 🟡 | L | 🟡 |
| ~~LT-3~~ ❌ | Split `ArticleStoreContext` into Index + Detail contexts (cancelled — high risk) | Architecture | 🟡 | L | 🔴 |
| ~~LT-4~~ ❌ | Add full TypeScript coverage (cancelled — too large) | Type Safety | 🟠 | L | 🔴 |
| ~~LT-5~~ ✅ | Implement E2E tests (Playwright) | Testing | 🟠 | L | 🟡 |
| ~~LT-6~~ ✅ | Add error tracking service (Sentry) | Reliability | 🟠 | M | 🟢 |
| ~~LT-7~~ ❌ | Add dataLayer ecommerce events to Yandex (cancelled — not e-commerce) | Analytics | 🟡 | M | 🟢 |

---

## Deduplicated Issue Map (cross-audit duplicates)

| Issue | Found In | Unified ID |
|---|---|---|
| Articles cache key v4/v5 | DATA_LAYER, PERFORMANCE | QW-1 |
| mathjs unused | DEPENDENCY, PERFORMANCE | QW-2 |
| node-fetch unused in CF Worker | DEPENDENCY | QW-4 |
| LoadingState URL inspection | UX_STATES, DATA_LAYER | QW-5 |
| QRCodeGenerator blank load | UX_STATES, PERFORMANCE | SP-7 |
| SSRF in seoAudit | (RELIABILITY_AUDIT.md not persisted) | SP-8 |

---

## Security Issues (separate track)

| ID | Task | Impact | Effort | Risk |
|---|---|---|---|---|
| SEC-1 | SSRF protection in `seoAudit.js` — block private IPs, localhost | 🔴 | S | 🟡 |
| ~~SEC-2~~ ✅ | Initialize `errorMonitor` or remove dead code | 🟠 | XS | 🟢 |
| SEC-3 | Add abort timeout to math expression evaluation | 🟡 | S | 🟢 |
| SEC-4 | Add QR payload length check | 🟢 | XS | 🟢 |
| SEC-5 | Escape `sharedIssues` in SEOAuditPro share URL | 🟢 | XS | 🟢 |
| SEC-6 | Add `maxLength` validation to article slug | 🟢 | XS | 🟢 |

---

## Completed ✓

| ID | Task | Sprint | Date |
|---|---|---|---|
| QW-1 | Fix articles cache key `v4`→`v5` | Sprint 2 | 2026-04-22 |
| QW-2 | Remove `mathjs` from `package.json` | Sprint 2 | 2026-04-22 |
| QW-3 | Remove `math-vendor` chunk from `vite.config.js` | Sprint 2 | 2026-04-22 |
| QW-5 | Fix `LoadingState` URL inspection — `language` prop | Sprint 2 | 2026-04-22 |
| QW-6 | ErrorBoundary/AppErrorBoundary URL inspection | Sprint 2 | 2026-04-22 |
| SP-8 | SSRF protection in `seoAudit.js` | Sprint 2 | 2026-04-22 |
| SP-1 | GA4 foundation — PageViewTracker + analytics.init() | Sprint 3 | 2026-04-22 |
| SP-2 | Track tool usage events (QR, password, SEO audit) | Sprint 3 | 2026-04-22 |
| SP-3 | Track copy actions via CopyButton analytics prop | Sprint 3 | 2026-04-22 |
| SP-4 | Track search (SearchResults + Header) | Sprint 3 | 2026-04-22 |
| SP-5 | Track article list views | Sprint 4 | 2026-04-22 |
| SP-6 | Fix ArticleStoreContext hardcoded 'ru' | Sprint 4 | 2026-04-22 |
| SP-7 | QRCodeGenerator loading spinner | Sprint 4 | 2026-04-22 |
| QW-7 | Delete unused LoadingSpinner component | Polish | 2026-04-22 |
| QW-8 | Fix sitemap lastmod to use publishedAt for articles | Polish | 2026-04-22 |
| MR-1 | Replace window.alert in PasswordGenerator with inline error | Polish | 2026-04-22 |
| MR-8 | Add BreadcrumbList structured data on article pages | Polish | 2026-04-22 |
| MR-14 | Fix article legacy redirect language handling | Polish | 2026-04-22 |
| MR-15 | Add outbound link tracking component + integrate in ArticleMarkdown | Polish | 2026-04-22 |
| MR-17 | Track language/theme switches | Polish | 2026-04-22 |
| MR-18 | Track calculator usage | Polish | 2026-04-22 |
| MR-19 | Create --spacing-* CSS scale | Polish | 2026-04-22 |
| SEC-2 | Remove dead errorMonitor code | Polish | 2026-04-22 |
| SEC-3 | Add abort timeout to math expression evaluation | Polish | 2026-04-22 |
| SEC-6 | Add maxLength validation to article slug | Polish | 2026-04-22 |
| MR-9 | Validate og:image dimensions | Polish Sprint 2 | 2026-04-22 |
| MR-10 | Pre-render QRCodeGenerator shell | Polish Sprint 2 | 2026-04-22 |
| MR-11 | Verify LoadingState language prop coverage | Polish Sprint 2 | 2026-04-22 |
| MR-13 | Cleanup ArticleStoreContext unused setLanguage + languageRef | Polish Sprint 2 | 2026-04-22 |
| MR-21 | Replace jspdf with pdf-lib | Polish Sprint 2 | 2026-04-22 |
| LT-5 | Playwright E2E tests setup | Long-term | 2026-04-22 |
| LT-6 | Sentry error tracking integration | Long-term | 2026-04-22 |
