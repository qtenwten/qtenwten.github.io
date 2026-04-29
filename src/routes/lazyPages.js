import { createElement } from 'react'
import HomePage from '../pages/Home'

function createLazyPage(importer) {
  let LoadedComponent = null
  let loadPromise = null

  function load() {
    if (!loadPromise) {
      loadPromise = importer()
        .then((module) => {
          LoadedComponent = module.default || module
          return module
        })
        .catch((error) => {
          loadPromise = null
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
