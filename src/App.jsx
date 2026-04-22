import { Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Breadcrumbs from './components/Breadcrumbs'
import AppErrorBoundary from './components/AppErrorBoundary'
import RouteSkeleton from './components/RouteSkeleton'
import PageTransition from './components/PageTransition'
import PageViewTracker from './components/PageViewTracker'
import { useLanguage } from './contexts/LanguageContext'
import { ArticleStoreProvider } from './contexts/ArticleStoreContext'
import { BreadcrumbsProvider } from './contexts/BreadcrumbsContext'
import './components/ToolPageShell.css'
import './pages/RandomNumber.css'
import { LEGACY_ROUTE_REDIRECTS, ROUTE_REGISTRY } from './config/routeRegistry'
import {
  Home,
  NumberToWords,
  VATCalculator,
  RandomNumber,
  Calculator,
  DateDifferenceCalculator,
  CompoundInterest,
  SEOAudit,
  MetaTagsGenerator,
  SEOAuditPro,
  QRCodeGenerator,
  URLShortener,
  Feedback,
  PasswordGenerator,
  ArticlesIndex,
  ArticlePage,
  NotFound,
  SearchResults,
  preloadLikelyRoutes,
} from './routes/lazyPages'

function normalizeLocalePath(pathname) {
  const normalizedPath = pathname.replace(/^\/(ru|en)(?=\/|$)/, '')
  return normalizedPath || '/'
}

function clampScrollPosition(scrollY) {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  return Math.min(Math.max(scrollY, 0), maxScroll)
}

function ScrollManager() {
  const location = useLocation()
  const logicalPath = normalizeLocalePath(location.pathname)
  const previousLogicalPathRef = useRef(logicalPath)
  const previousPathnameRef = useRef(location.pathname)

  useEffect(() => {
    const isLocaleSwitch = location.state?.localeSwitch === true && previousLogicalPathRef.current === logicalPath
    const isHashNavigation = Boolean(location.hash)
    const isQueryOnlyChange = previousPathnameRef.current === location.pathname && previousLogicalPathRef.current === logicalPath
    let frameId = 0
    let cancelled = false

    const restoreLocaleScroll = (targetScrollY, attempt = 0) => {
      if (cancelled) return

      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

      if (maxScroll >= targetScrollY || attempt >= 12) {
        window.scrollTo(0, clampScrollPosition(targetScrollY))
        return
      }

      frameId = window.requestAnimationFrame(() => {
        restoreLocaleScroll(targetScrollY, attempt + 1)
      })
    }

    if (isLocaleSwitch) {
      const savedScrollY = typeof location.state?.scrollY === 'number' ? location.state.scrollY : window.scrollY

      restoreLocaleScroll(savedScrollY)
    } else if (isQueryOnlyChange) {
      // Keep scroll position stable for same-page query param updates (e.g. tool options in URL).
    } else if (!isHashNavigation) {
      window.scrollTo(0, 0)
    }

    previousLogicalPathRef.current = logicalPath
    previousPathnameRef.current = location.pathname

    return () => {
      cancelled = true

      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [location.key, location.hash, location.state, logicalPath])

  return null
}

function App() {
  const { language, t } = useLanguage()
  const [homeSearch, setHomeSearch] = useState('')
  const location = useLocation()
  const pageTransitionKey = normalizeLocalePath(location.pathname)
  const previousFocusLogicalPathRef = useRef(pageTransitionKey)
  const mainRef = useRef(null)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    const preload = () => preloadLikelyRoutes()

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1200 })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = window.setTimeout(preload, 500)
    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const isLocaleSwitch = location.state?.localeSwitch === true && previousFocusLogicalPathRef.current === pageTransitionKey

    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      previousFocusLogicalPathRef.current = pageTransitionKey
      return
    }

    if (!mainRef.current) return

    previousFocusLogicalPathRef.current = pageTransitionKey

    if (isLocaleSwitch) {
      return
    }

    window.requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true })
    })
  }, [location.pathname, location.state, pageTransitionKey])

  const componentMap = {
    Home,
    NumberToWords,
    VATCalculator,
    RandomNumber,
    Calculator,
    DateDifferenceCalculator,
    CompoundInterest,
    SEOAudit,
    MetaTagsGenerator,
    SEOAuditPro,
    QRCodeGenerator,
    URLShortener,
    Feedback,
    PasswordGenerator,
    ArticlesIndex,
    SearchResults,
  }

  return (
    <ArticleStoreProvider>
      <BreadcrumbsProvider>
        <AppErrorBoundary>
          <a href="#main-content" className="skip-link">
            {t('common.skipToContent')}
          </a>
          <Header searchValue={homeSearch} onSearchChange={setHomeSearch} />
          <ScrollManager />
          <main id="main-content" ref={mainRef} className="app-main" tabIndex="-1">
            <div className="container">
              <Breadcrumbs />
            </div>
          <Suspense fallback={<RouteSkeleton />}>
            <PageTransition key={pageTransitionKey}>
              <Routes location={location}>
                <Route element={<PageViewTracker />} />
                {/* Корень остаётся dev/runtime fallback, production redirect генерируется статически */}
                <Route path="/" element={<Home searchValue={homeSearch} onSearchChange={setHomeSearch} />} />

                {/* Home */}
                <Route path="/ru" element={<Home searchValue={homeSearch} onSearchChange={setHomeSearch} />} />
                <Route path="/ru/" element={<Home searchValue={homeSearch} onSearchChange={setHomeSearch} />} />
                <Route path="/en" element={<Home searchValue={homeSearch} onSearchChange={setHomeSearch} />} />
                <Route path="/en/" element={<Home searchValue={homeSearch} onSearchChange={setHomeSearch} />} />

                {ROUTE_REGISTRY.map((route) => {
                  const Component = componentMap[route.componentKey]
                  return (
                    <Route key={`ru-${route.path}`} path={`/ru${route.path}`} element={<Component />} />
                  )
                })}

                {ROUTE_REGISTRY.map((route) => {
                  const Component = componentMap[route.componentKey]
                  return (
                    <Route key={`en-${route.path}`} path={`/en${route.path}`} element={<Component />} />
                  )
                })}

                <Route path="/ru/articles/:slug" element={<ArticlePage />} />
                <Route path="/en/articles/:slug" element={<ArticlePage />} />

                {/* Редиректы со старых URL без языка на /ru */}
                {Object.entries(LEGACY_ROUTE_REDIRECTS).map(([fromPath, toPath]) => (
                  <Route key={fromPath} path={fromPath} element={<Navigate to={toPath} replace />} />
                ))}

                <Route path="/articles/:slug" element={<LegacyArticleRedirect />} />

                <Route path="/ru/*" element={<NotFound />} />
                <Route path="/en/*" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </Suspense>
        </main>
        <Footer />
      </AppErrorBoundary>
    </BreadcrumbsProvider>
    </ArticleStoreProvider>
  )
}

function LegacyArticleRedirect() {
  const { slug = '' } = useParams()
  const { language } = useLanguage()
  const safeSlug = slug.length > 200 ? slug.slice(0, 200) : slug
  return <Navigate to={`/${language}/articles/${safeSlug}`} replace />
}

export default App
