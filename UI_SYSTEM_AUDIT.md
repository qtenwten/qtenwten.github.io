# UI System Audit — Components & Design Consistency

## 1. Base UI Components Inventory

### Layout Components
| Component | File | Purpose |
|---|---|---|
| `Header` | `Header.jsx` | Site header with logo, search, nav links, theme/language switchers |
| `Footer` | `Footer.jsx` | Site footer with branding, feedback link, articles link |
| `Breadcrumbs` | `Breadcrumbs.jsx` | Navigation breadcrumbs with JSON-LD structured data |
| `PageTransition` | `PageTransition.jsx` | Page transition wrapper |

### Tool Page Components
| Component | File | Purpose |
|---|---|---|
| `ToolPageShell` | `ToolPageShell.jsx` | Main layout wrapper for tool pages (`tool-container`) |
| `ToolPageHero` | `ToolPageShell.jsx` | Hero section with eyebrow, title, subtitle, note |
| `ToolPageLayout` | `ToolPageShell.jsx` | Two-column layout (controls + result) |
| `ToolPagePanel` | `ToolPageShell.jsx` | Generic panel with tone variants |
| `ToolControls` | `ToolPageShell.jsx` | Input controls section |
| `ToolResult` | `ToolPageShell.jsx` | Result/output section |
| `ToolHelp` | `ToolPageShell.jsx` | Help/documentation section |
| `ToolRelated` | `ToolPageShell.jsx` | Related tools section |
| `ToolSectionHeading` | `ToolPageShell.jsx` | Section heading with optional subtitle |

### Result Display Components
| Component | File | Purpose |
|---|---|---|
| `ResultSection` | `ResultSection.jsx` | Generic section wrapper with tone |
| `ResultSummary` | `ResultSection.jsx` | Single-value result with kicker/score |
| `ResultMetrics` | `ResultSection.jsx` | Grid of `ResultMetric` cards |
| `ResultMetric` | `ResultSection.jsx` | Single metric (label + value + hint) |
| `ResultActions` | `ResultSection.jsx` | Action buttons row |
| `ResultNotice` | `ResultSection.jsx` | Inline notice/alert with tone |

### Form Components
| Component | File | Purpose |
|---|---|---|
| `CustomSelect` | `CustomSelect.jsx` | Accessible dropdown select |
| `CopyButton` | `CopyButton.jsx` | Copy-to-clipboard button with state feedback |
| Native `<input>` | Global CSS | Text, email, search, number, date, color, range |
| Native `<select>` | Global CSS | Native select with custom arrow |
| Native `<textarea>` | Global CSS | Multi-line text |
| Native `<button>` | Global CSS | All buttons |

### Feedback Components
| Component | File | Purpose |
|---|---|---|
| `LoadingState` | `LoadingState.jsx` | Skeleton + error state for article pages |
| `LoadingSpinner` | `LoadingState.jsx` | Spinner with label (exported but unused) |
| `InlineSpinner` | `InlineSpinner.jsx` | Small spinner for inline/button use |
| `RouteSkeleton` | `RouteSkeleton.jsx` | Full-page skeleton during route lazy loading |

### Content Components
| Component | File | Purpose |
|---|---|---|
| `ToolDescriptionSection` | `ToolDescriptionSection.jsx` | Help content section with FAQ accordion |
| `ToolFaq` | `ToolDescriptionSection.jsx` | FAQ list renderer |
| `RelatedTools` | `RelatedTools.jsx` | Related tools grid |
| `ArticleMarkdown` | `articles/ArticleMarkdown.jsx` | Custom markdown renderer |
| `Icon` | `Icon.jsx` | Icon wrapper (runtime) |

### State/Context Components
| Component | File | Purpose |
|---|---|---|
| `LanguageSwitcher` | `LanguageSwitcher.jsx` | Language toggle UI |
| `ThemeSwitcher` | `ThemeSwitcher.jsx` | Dark/light theme toggle |
| `AppErrorBoundary` | `AppErrorBoundary.jsx` | App-level error boundary |
| `ErrorBoundary` | `ErrorBoundary.jsx` | Page-level error boundary (unused) |

---

## 2. CSS File Organization

| Location | Contents |
|---|---|
| `src/styles/index.css` | Global tokens, resets, typography, forms, buttons, base cards |
| `src/styles/calculator.css` | Calculator-specific styles |
| `src/components/Header.css` | Header layout and sub-components |
| `src/components/Footer.css` | Footer styles |
| `src/components/LoadingState.css` | Skeleton + loading spinner styles |
| `src/components/ToolPageShell.css` | Tool page layout components |
| `src/components/ResultSection.css` | Result display components |
| `src/components/ToolDescriptionSection.css` | Help section + FAQ styles |
| `src/components/RelatedTools.css` | Related tools grid |
| `src/components/CustomSelect.css` | Custom select dropdown |
| `src/components/ThemeSwitcher.css` | Theme toggle styles |
| `src/components/LanguageSwitcher.css` | Language toggle styles |
| `src/components/Breadcrumbs.css` | Breadcrumbs styles |
| `src/pages/Articles.css` | Article list + detail pages |
| `src/pages/QRCodeGenerator.css` | QR tool-specific (927 lines) |
| `src/pages/PasswordGenerator.css` | Password tool-specific |
| `src/pages/SEOAuditPro.css` | SEO audit PRO styles |
| `src/pages/Feedback.css` | Feedback form styles |
| `src/pages/Home.css` | Homepage styles |
| `src/pages/NumberToWords.css` | Number to words styles |
| `src/pages/DateDifferenceCalculator.css` | Date calculator styles |
| `src/pages/SearchResults.css` | Search results styles |
| `src/pages/RandomNumber.css` | Random number styles |
| `src/pages/NotFound.css` | 404 page styles |

---

## 3. Design Token System

### Existing Tokens (`src/styles/index.css:7-73`)

```css
/* Colors */
--primary: #4f46e5          /* Indigo */
--primary-hover: #4338ca
--primary-soft: rgba(var(--primary-rgb), 0.08)
--bg, --bg-secondary, --bg-elevated, --bg-tertiary
--text, --text-secondary, --text-tertiary
--border, --border-strong
--success, --success-soft
--error
--focus-ring: 0 0 0 4px rgba(var(--primary-rgb), 0.14)

/* Shadows */
--shadow: 0 8px 20px -20px rgba(15, 23, 42, 0.14)
--shadow-lg: 0 14px 28px -22px rgba(15, 23, 42, 0.18)

/* Transitions */
--transition-fast: 140ms
--transition-base: 220ms
--transition-slow: 300ms
--transition-ease: cubic-bezier(0.22, 1, 0.36, 1)

/* Typography */
font-family: system stack (-apple-system, BlinkMacSystemFont, ...)
font-size: 16px (base)
line-height: 1.65
```

### Token Gaps
- **No `--spacing-*` scale** — spacing is ad-hoc (0.25rem, 0.75rem, 1rem, 1.5rem, etc.)
- **No `--radius-*` scale** — border-radius values are hardcoded (14px, 16px, 18px, 20px, 22px)
- **No `--font-size-*` scale** — font sizes use `clamp()` inline
- **No `--z-index-*` scale** — z-index values scattered and inconsistent
- **No `--icon-size-*` scale** — icon sizes hardcoded per usage

---

## 4. Consistency Analysis

### 4.1 Spacing Inconsistencies

| Pattern | Values Used | Files |
|---|---|---|
| Container max-width | `760px` (tool), `980px` (articles), `1180px` (article-page), `1200px` (base container) | Multiple |
| Card padding | `1rem`, `1.1rem`, `1.25rem`, `1.5rem`, `2rem` | Multiple |
| Section gap | `1rem`, `1.25rem`, `1.5rem`, `2rem` | Multiple |
| Input padding | `0.875rem 1rem` (56px height) | index.css |
| Button padding | `0.9rem 1.35rem` (52px min-height) | index.css |
| Border radius | `8px`, `12px`, `14px`, `16px`, `18px`, `20px`, `22px`, `999px` | Multiple |

### 4.2 Typography Inconsistencies

| Element | Global CSS | Pages |
|---|---|---|
| h1 | `clamp(2rem, 1.7rem + 1vw, 2.6rem)`, weight 700 | Some pages use inline `style={{ fontSize: ... }}` |
| h2 | `clamp(1.35rem, ...)`, weight 600 | Some pages use inline styles |
| h3 | Not defined globally | Pages define inline |
| Body text | `1rem`, `line-height: 1.75` | Most pages OK |
| Button text | `1rem`, weight 600 | Consistent |

**Problem:** VATCalculator, RandomNumber, PasswordGenerator, CompoundInterest, MetaTagsGenerator use inline `style={{ }}` for headings instead of CSS classes or semantic HTML.

### 4.3 Button Inconsistencies

| Type | Definition | Usage |
|---|---|---|
| Primary button | `button` (global CSS) | Default for most pages |
| `.secondary` | `button.secondary` (global CSS) | Consistent |
| `.btn-primary` | Mentioned in some page CSS but not defined globally | Used in PasswordGenerator |
| `.feedback-submit` | Inline in Feedback.css | Only Feedback |
| `.copy-btn` | In index.css | Consistent via global |
| Inline `<button>` with custom styles | Various pages | VATCalculator, RandomNumber, CompoundInterest use `<button onClick ... style={{ ... }}>` directly |

### 4.4 Card Pattern Duplication

| Pattern | Class | Used By |
|---|---|---|
| Basic card | `.result-box` | VATCalculator, RandomNumber |
| Surface card | `.surface-panel` | SEOAudit, SEOAuditPro |
| Tool panel | `.tool-page-panel` | Most tool pages via ToolPageShell |
| Article card | `.article-card` | ArticlesIndex |
| Related card | `.tool-card` (in RelatedTools) | RelatedTools |
| FAQ card | `.tool-description-faq-item` | ToolDescriptionSection |
| Metric card | `.result-metric` | DateDifferenceCalculator, SEOAuditPro |

**Issue:** 7 distinct card patterns with slightly different visual treatments (shadow, border, border-radius, padding). No unified `Card` component.

### 4.5 Section Pattern Duplication

| Pattern | Class | Used By |
|---|---|---|
| Tool description | `.tool-description-section` | Most tool pages |
| Tool help | `.tool-page-help` | ToolPageShell export, not visually distinct |
| Tool related | `.tool-page-related` | ToolPageShell export |
| Related tools | `.related-tools` | RelatedTools component |
| SEO section | `.seo-audit-pro-section` | SEOAuditPro only |
| FAQ block | `.tool-description-faq-block` | ToolDescriptionSection |

### 4.6 Icon Inconsistencies (Dual System)

**Runtime icons** (`Icon.jsx` → `lucide-react`):
- Used in React components for interactive UI elements
- 24 icons in `icons/map.js` statically imported
- Only subset actually used in runtime

**Build-time icons** (`utils/iconMap.js` → raw SVG strings):
- Used exclusively in `generate-pages.js` for prerendered HTML
- Same icon names map to same SVG strings
- 16 icons defined in `ICON_SVG_MAP`

**Duplication:** Icons defined twice — once as lucide-react components, once as raw SVG strings. If an icon is updated in one place, it may not be updated in the other.

### 4.7 Eyebrow/Badge Pattern Duplication

| Pattern | Class | Used By |
|---|---|---|
| Hero eyebrow | `.tool-page-hero__eyebrow` | ToolPageHero |
| Description eyebrow | `.tool-description-section__eyebrow` | ToolDescriptionSection |
| Article card label | `.articles-featured-card__label` | ArticlesIndex |
| Article eyebrow | `.article-header-card__eyebrow` | ArticlePage |
| Tool badge | `.article-card__tool-badge` | ArticlesIndex |

All eyebows have similar styling (pill shape, `999px` border-radius, uppercase text, green dot) but different class names.

---

## 5. Inline Styles Violations

Pages with excessive inline `style={{}}` attributes:

| Page | Inline Style Count | Examples |
|---|---|---|
| `VATCalculator.jsx` | ~15 | Headings, result box, FAQ sections |
| `RandomNumber.jsx` | ~8 | Section headings, layout divs |
| `PasswordGenerator.jsx` | ~5 | Button styles |
| `CompoundInterest.jsx` | ~5 | Headings, layout |
| `MetaTagsGenerator.jsx` | ~10 | Preview divs, character counts |
| `DateDifferenceCalculator.jsx` | ~20+ | Mode buttons, result display, FAQ items |
| `QRCodeGenerator.jsx` | ~50+ | QR preview, logo upload, color pickers |

**Problem:** Inline styles bypass CSS cascade, make theming harder, and create maintenance burden. These should use CSS classes.

---

## 6. Component Abstraction Gaps

### 6.1 Missing: Unified Card Component
All 7 card patterns should be one `<Card>` component with variants:
```jsx
<Card variant="result" tone="success">...</Card>
<Card variant="surface">...</Card>
<Card variant="panel">...</Card>
<Card variant="article">...</Card>
```

### 6.2 Missing: Section Wrapper
Tool pages repeat this pattern:
```jsx
<section className="tool-page-help">  ← using ToolPageShell export
  <h2>...</h2>
  <p>...</p>
  <ToolFaq items={...} />
</section>
```

Should be:
```jsx
<ToolHelpSection title="..." items={...}>
  <p>...</p>
</ToolHelpSection>
```

### 6.3 Missing: MetricCard Component
`ResultMetric` exists but only inside `ResultMetrics`. Should be usable standalone:
```jsx
<MetricCard label="..." value="..." hint="..." />
```

### 6.4 Missing: Eyebrow Component
All eyebrow variants should be one `<Badge>` or `<Eyebrow>` component:
```jsx
<Eyebrow variant="hero">Article</Eyebrow>
<Eyebrow variant="description">Helpful Guide</Eyebrow>
<Eyebrow variant="article">Статья</Eyebrow>
```

---

## 7. CSS Architecture Issues

### 7.1 CSS Files Scattered Across 4 Locations
- `src/styles/` — global
- `src/components/*.css` — component
- `src/pages/*.css` — page-specific
- Inline `<style>` tags (none found, but inline `style={{}}` in JSX is equivalent)

### 7.2 BEM Naming Inconsistency
- Some components use BEM: `.tool-page-hero__eyebrow`, `.result-summary__title`
- Some use flat: `.tool-description-section`, `.related-tools`
- Some use modifier: `.tool-page-panel--success`, `.result-section--accent`

### 7.3 Specificity Wars
Some pages override component CSS with high-specificity selectors:
```css
/* ToolPageShell.css */
.tool-page-hero { display: grid; }

/* Articles.css — overrides hero */
.articles-hero.tool-page-hero {
  max-width: 100%;
  padding: 0.95rem 1.15rem;
  /* ... */
}
```

### 7.4 Dead CSS
- `LoadingSpinner` component is exported but never imported anywhere — its CSS in `LoadingState.css` may be dead
- `.seo-share-button` in `index.css:612-619` is used only in SEOAuditPro

---

## 8. Design System Elements Already Present

### 8.1 Design Tokens (Good)
- CSS custom properties for all colors
- Light/dark theme via `:root[data-theme='dark']`
- Consistent focus ring design token
- Consistent shadow scale
- Consistent transition tokens

### 8.2 Typography Scale (Partial)
- `clamp()` for responsive font sizes on h1, h2
- System font stack
- `-webkit-font-smoothing: antialiased`

### 8.3 Component Patterns (Partial)
- ToolPageShell provides consistent page structure
- ResultSection family provides consistent result display
- `CopyButton` is well-designed and reusable
- `CustomSelect` is a proper accessible component

### 8.4 Dark Mode (Good)
- All colors have dark variants
- Dark mode gradient blobs on `app-main`
- No hardcoded colors in components

---

## 9. Problems Summary

| # | Problem | Severity | Location |
|---|---|---|---|
| UI1 | 7 distinct card patterns with no unified `<Card>` component | Medium | Across pages |
| UI2 | Excessive inline `style={{}}` in pages — bypasses CSS cascade | High | VATCalculator, RandomNumber, CompoundInterest, DateDifferenceCalculator, QRCodeGenerator |
| UI3 | Dual icon system (lucide-react + raw SVG strings) — maintenance duplication | Medium | `icons/map.js` vs `utils/iconMap.js` |
| UI4 | 4 different eyebrow/badge patterns | Low | ToolPageHero, ToolDescriptionSection, ArticlePage, ArticlesIndex |
| UI5 | No `--spacing-*` scale — spacing is ad-hoc | Medium | Global CSS |
| UI6 | No `--z-index-*` scale — z-index values scattered | Low | Various |
| UI7 | `LoadingSpinner` exported but never used — dead component | Low | `LoadingState.jsx` |
| UI8 | Multiple section patterns (`.tool-description-section`, `.tool-page-help`, `.related-tools`) with unclear hierarchy | Medium | ToolPageShell exports |
| UI9 | CSS files in 4 locations — hard to know where to add styles | Low | Project structure |
| UI10 | `ToolFaq` hardcoded heading level (`<h3>`) — inflexible | Low | `ToolDescriptionSection.jsx` |

---

## 10. Recommendations (No Full Redesign)

### Quick Wins

1. **Create `--spacing-*` scale** in `index.css`:
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-12: 3rem;     /* 48px */
```
Then replace ad-hoc values gradually.

2. **Delete `LoadingSpinner`** — it's exported but unused. If needed later, recreate.

3. **Add `language` prop to `LoadingState`** — stop URL inspection pattern.

4. **Unify eyebrow pattern** — create a `Badge` component with `variant` prop (`hero`, `description`, `article`).

### Medium Changes

5. **Create unified `Card` component** with variants:
```jsx
<Card variant="panel" tone="default">...</Card>
<Card variant="result" tone="success">...</Card>
<Card variant="surface">...</Card>
```

6. **Replace inline `style={{}}` in pages with CSS classes** — especially for headings and spacing. Create page-specific CSS files if needed.

7. **Extract common patterns to CSS:**
   - `.eyebrow` — all eyebrow variants use same base styles
   - `.section-title` — all h2/h3 in sections have similar styles

8. **Document component prop conventions** — add JSDoc or TypeScript types to `ToolPageShell`, `ResultSection`, `ToolDescriptionSection` so pages know which variants exist.

### Design Decisions Needed

9. **Consolidate icon system** — decide if `utils/iconMap.js` is needed (only used in build script) or if build script should import from `icons/map.js`

10. **Clarify section hierarchy** — is `ToolDescriptionSection` meant to be the only help section? Should `ToolHelp` and `ToolRelated` be merged or removed?
