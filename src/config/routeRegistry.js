function createRouteEntry(entry) {
  const normalized = {
    descriptionKey: null,
    categoryKey: null,
    categorySlug: null,
    icon: null,
    showOnHome: false,
    showInSearch: true,
    breadcrumbMode: 'category-current',
    ...entry,
  }

  if (import.meta.env?.DEV) {
    const requiredFields = ['key', 'path', 'componentKey', 'titleKey']
    requiredFields.forEach((field) => {
      if (typeof normalized[field] !== 'string' || normalized[field].length === 0) {
        console.warn(`[routeRegistry] Invalid or missing required field "${field}" for route:`, normalized)
      }
    })

    if (normalized.breadcrumbMode === 'category-current' && (!normalized.categoryKey || !normalized.categorySlug)) {
      console.warn('[routeRegistry] category-current route is missing category metadata:', normalized)
    }

    if (normalized.breadcrumbMode === 'standalone') {
      delete normalized.categoryKey
      delete normalized.categorySlug
      delete normalized.icon
    }

    if (normalized.breadcrumbMode === 'home-current' && !normalized.titleKey) {
      console.warn('[routeRegistry] home-current route is missing titleKey:', normalized)
    }
  }

  return normalized
}

function normalizeRegistryPath(pathname = '/') {
  if (typeof pathname !== 'string' || pathname.length === 0) {
    return '/'
  }

  if (pathname === '/') {
    return '/'
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

export const ROUTE_REGISTRY = [
  {
    key: 'numberToWords',
    path: '/number-to-words',
    componentKey: 'NumberToWords',
    titleKey: 'tools.numberToWords.title',
    descriptionKey: 'tools.numberToWords.description',
    categoryKey: 'categories.converters',
    categorySlug: 'converters',
    icon: 'text_fields',
    showOnHome: true,
  },
  {
    key: 'vatCalculator',
    path: '/vat-calculator',
    componentKey: 'VATCalculator',
    titleKey: 'tools.vatCalculator.title',
    descriptionKey: 'tools.vatCalculator.description',
    categoryKey: 'categories.calculators',
    categorySlug: 'calculators',
    icon: 'payments',
    showOnHome: true,
  },
  {
    key: 'randomNumber',
    path: '/random-number',
    componentKey: 'RandomNumber',
    titleKey: 'tools.randomNumber.title',
    descriptionKey: 'tools.randomNumber.description',
    categoryKey: 'categories.generators',
    categorySlug: 'generators',
    icon: 'casino',
    showOnHome: true,
  },
  {
    key: 'calculator',
    path: '/calculator',
    componentKey: 'Calculator',
    titleKey: 'tools.calculator.title',
    descriptionKey: 'tools.calculator.description',
    categoryKey: 'categories.calculators',
    categorySlug: 'calculators',
    icon: 'calculate',
    showOnHome: true,
  },
  {
    key: 'dateDifference',
    path: '/date-difference',
    componentKey: 'DateDifferenceCalculator',
    titleKey: 'tools.dateDifference.title',
    descriptionKey: 'tools.dateDifference.description',
    categoryKey: 'categories.calculators',
    categorySlug: 'calculators',
    icon: 'calendar_month',
    showOnHome: true,
  },
  {
    key: 'compoundInterest',
    path: '/compound-interest',
    componentKey: 'CompoundInterest',
    titleKey: 'tools.compoundInterest.title',
    descriptionKey: 'tools.compoundInterest.description',
    categoryKey: 'categories.calculators',
    categorySlug: 'calculators',
    icon: 'trending_up',
    showOnHome: true,
  },
  {
    key: 'seoAudit',
    path: '/seo-audit',
    componentKey: 'SEOAudit',
    titleKey: 'tools.seoAudit.title',
    descriptionKey: 'tools.seoAudit.description',
    categoryKey: 'categories.tools',
    categorySlug: 'tools',
    icon: 'show_chart',
    showOnHome: false,
    showInSearch: false,
  },
  {
    key: 'metaTagsGenerator',
    path: '/meta-tags-generator',
    componentKey: 'MetaTagsGenerator',
    titleKey: 'tools.metaTagsGenerator.title',
    descriptionKey: 'tools.metaTagsGenerator.description',
    categoryKey: 'categories.tools',
    categorySlug: 'tools',
    icon: 'label',
    showOnHome: true,
  },
  {
    key: 'seoAuditPro',
    path: '/seo-audit-pro',
    componentKey: 'SEOAuditPro',
    titleKey: 'tools.seoAuditPro.title',
    descriptionKey: 'tools.seoAuditPro.description',
    categoryKey: 'categories.tools',
    categorySlug: 'tools',
    icon: 'rocket_launch',
    showOnHome: true,
  },
  {
    key: 'qrCodeGenerator',
    path: '/qr-code-generator',
    componentKey: 'QRCodeGenerator',
    titleKey: 'tools.qrCodeGenerator.title',
    descriptionKey: 'tools.qrCodeGenerator.description',
    categoryKey: 'categories.generators',
    categorySlug: 'generators',
    icon: 'qr_code',
    showOnHome: true,
  },
  {
    key: 'urlShortener',
    path: '/url-shortener',
    componentKey: 'URLShortener',
    titleKey: 'tools.urlShortener.title',
    descriptionKey: 'tools.urlShortener.description',
    categoryKey: 'categories.generators',
    categorySlug: 'generators',
    icon: 'link',
    showOnHome: true,
  },
  {
    key: 'search',
    path: '/search',
    componentKey: 'SearchResults',
    titleKey: 'common.search',
    breadcrumbMode: 'standalone',
    showOnHome: false,
    showInSearch: false,
  },
  {
    key: 'feedback',
    path: '/feedback',
    componentKey: 'Feedback',
    titleKey: 'footer.writeUs',
    breadcrumbMode: 'standalone',
    showOnHome: false,
    showInSearch: false,
  },
  {
    key: 'passwordGenerator',
    path: '/password-generator',
    componentKey: 'PasswordGenerator',
    titleKey: 'tools.passwordGenerator.title',
    descriptionKey: 'tools.passwordGenerator.description',
    categoryKey: 'categories.generators',
    categorySlug: 'generators',
    icon: 'lock',
    showOnHome: true,
  },
  {
    key: 'articles',
    path: '/articles',
    componentKey: 'ArticlesIndex',
    titleKey: 'articles.title',
    descriptionKey: 'articles.subtitle',
    breadcrumbMode: 'standalone',
    showOnHome: false,
    showInSearch: false,
  },
].map(createRouteEntry)

export const LEGACY_ROUTE_REDIRECTS = {
  '/number-to-words': '/ru/number-to-words/',
  '/vat-calculator': '/ru/vat-calculator/',
  '/random-number': '/ru/random-number/',
  '/calculator': '/ru/calculator/',
  '/time-calculator': '/ru/date-difference/',
  '/compound-interest': '/ru/compound-interest/',
  '/seo-audit': '/ru/seo-audit/',
  '/meta-tags-generator': '/ru/meta-tags-generator/',
  '/seo-audit-pro': '/ru/seo-audit-pro/',
  '/qr-code-generator': '/ru/qr-code-generator/',
  '/url-shortener': '/ru/url-shortener/',
  '/feedback': '/ru/feedback/',
  '/password-generator': '/ru/password-generator/',
  '/date-difference': '/ru/date-difference/',
  '/articles': '/ru/articles/',
  '/terms': '/ru/terms/',
  '/privacy': '/ru/privacy/',
}

export function getRouteEntry(pathname) {
  const normalizedPath = normalizeRegistryPath(pathname)

  // Try exact match first
  const exactMatch = ROUTE_REGISTRY.find((entry) => entry.path === normalizedPath)
  if (exactMatch) return exactMatch

  // Try parent paths for sub-path routes (e.g., /random-number/picker -> /random-number)
  const segments = normalizedPath.split('/').filter(Boolean)
  while (segments.length > 1) {
    const parentPath = '/' + segments.join('/')
    const parentMatch = ROUTE_REGISTRY.find((entry) => entry.path === parentPath)
    if (parentMatch) return parentMatch
    segments.pop()
  }

  return null
}

export function getHomeRouteEntries() {
  return ROUTE_REGISTRY.filter((entry) => entry.showOnHome)
}
