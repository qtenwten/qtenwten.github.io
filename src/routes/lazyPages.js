import { createElement } from 'react'
import HomePage from '../pages/Home'

const ROUTE_MODULE_RELOAD_KEY = 'qsen:route-module-error-reloaded'
const ROUTE_MODULE_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Route module did not expose a default component/i,
]

function clearRouteModuleReloadFlag() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    sessionStorage.removeItem(ROUTE_MODULE_RELOAD_KEY)
  } catch {
    // Ignore storage access errors; route rendering should not depend on storage.
  }
}

function scheduleRouteModuleReload(error) {
  if (typeof window === 'undefined') {
    return false
  }

  const message = error?.message || ''
  if (!ROUTE_MODULE_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return false
  }

  try {
    if (sessionStorage.getItem(ROUTE_MODULE_RELOAD_KEY)) {
      return false
    }

    sessionStorage.setItem(ROUTE_MODULE_RELOAD_KEY, '1')
  } catch {
    return false
  }

  window.location.reload()
  return true
}

function createLazyPage(importer) {
  let LoadedComponent = null
  let loadPromise = null

  function load() {
    if (!loadPromise) {
      loadPromise = importer()
        .then((module) => {
          const Component = module?.default
          if (!Component) {
            throw new TypeError('Route module did not expose a default component')
          }

          LoadedComponent = Component
          clearRouteModuleReloadFlag()
          return module
        })
        .catch((error) => {
          loadPromise = null

          if (scheduleRouteModuleReload(error)) {
            return new Promise(() => {})
          }

          throw error
        })
    }

    return loadPromise
  }

  function PreloadablePage(props) {
    if (LoadedComponent) {
      return createElement(LoadedComponent, props)
    }

    throw load()
  }

  PreloadablePage.preload = load
  return PreloadablePage
}

export const Home = Object.assign(HomePage, {
  preload: () => Promise.resolve({ default: HomePage }),
})
export const NumberToWords = createLazyPage(() => import('../pages/NumberToWords'))
export const VATCalculator = createLazyPage(() => import('../pages/VATCalculator'))
export const RandomNumber = createLazyPage(() => import('../pages/RandomNumber'))
export const Calculator = createLazyPage(() => import('../pages/Calculator'))
export const DateDifferenceCalculator = createLazyPage(() => import('../pages/DateDifferenceCalculator'))
export const CompoundInterest = createLazyPage(() => import('../pages/CompoundInterest'))
export const SEOAudit = createLazyPage(() => import('../pages/SEOAudit'))
export const MetaTagsGenerator = createLazyPage(() => import('../pages/MetaTagsGenerator'))
export const SEOAuditPro = createLazyPage(() => import('../pages/SEOAuditPro'))
export const QRCodeGenerator = createLazyPage(() => import('../pages/QRCodeGenerator'))
export const URLShortener = createLazyPage(() => import('../pages/URLShortener'))
export const Feedback = createLazyPage(() => import('../pages/Feedback'))
export const PasswordGenerator = createLazyPage(() => import('../pages/PasswordGenerator'))
export const ArticlesIndex = createLazyPage(() => import('../pages/ArticlesIndex'))
export const ArticlePage = createLazyPage(() => import('../pages/ArticlePage'))
export const NotFound = createLazyPage(() => import('../pages/NotFound'))
export const SearchResults = createLazyPage(() => import('../pages/SearchResults'))
export const Terms = createLazyPage(() => import('../pages/Terms'))
export const Privacy = createLazyPage(() => import('../pages/Privacy'))

const routePreloaders = {
  '/': Home.preload,
  '/number-to-words': NumberToWords.preload,
  '/vat-calculator': VATCalculator.preload,
  '/random-number': RandomNumber.preload,
  '/calculator': Calculator.preload,
  '/date-difference': DateDifferenceCalculator.preload,
  '/compound-interest': CompoundInterest.preload,
  '/seo-audit': SEOAudit.preload,
  '/meta-tags-generator': MetaTagsGenerator.preload,
  '/seo-audit-pro': SEOAuditPro.preload,
  '/qr-code-generator': QRCodeGenerator.preload,
  '/url-shortener': URLShortener.preload,
  '/search': SearchResults.preload,
  '/feedback': Feedback.preload,
  '/password-generator': PasswordGenerator.preload,
  '/articles': ArticlesIndex.preload,
  '/terms': Terms.preload,
  '/privacy': Privacy.preload,
}

export function preloadRoute(path) {
  const cleanPathWithSlash = (path || '/').replace(/^\/(ru|en)(?=\/|$)/, '') || '/'
  const cleanPath = cleanPathWithSlash !== '/' && cleanPathWithSlash.endsWith('/')
    ? cleanPathWithSlash.slice(0, -1)
    : cleanPathWithSlash
  const preload = routePreloaders[cleanPath]

  if (!preload) {
    return Promise.resolve()
  }

  return preload().catch(() => undefined)
}

export function preloadLikelyRoutes() {
  ;['/vat-calculator', '/number-to-words', '/seo-audit-pro', '/feedback'].forEach((path) => {
    preloadRoute(path)
  })
}
