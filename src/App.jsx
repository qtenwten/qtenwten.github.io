import { Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Breadcrumbs from './components/Breadcrumbs'
import ErrorBoundary from './components/ErrorBoundary'
import RouteSkeleton from './components/RouteSkeleton'
import PageTransition from './components/PageTransition'
import { useLanguage } from './contexts/LanguageContext'
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
  NotFound,
  SearchResults,
  preloadLikelyRoutes,
} from './routes/lazyPages'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  const { language } = useLanguage()
  const [homeSearch, setHomeSearch] = useState('')
  const location = useLocation()
  const mainRef = useRef(null)

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
    if (!mainRef.current) return

    window.requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true })
    })
  }, [location.pathname])

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
    SearchResults,
  }

  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">
        {language === 'en' ? 'Skip to content' : 'Перейти к содержимому'}
      </a>
      <Header searchValue={homeSearch} onSearchChange={setHomeSearch} />
      <ScrollToTop />
      <main id="main-content" ref={mainRef} className="app-main" tabIndex="-1">
        <div className="container">
          <Breadcrumbs />
        </div>
        <Suspense fallback={<RouteSkeleton />}> 
          <PageTransition routeKey={location.pathname}>
          <Routes location={location}>
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

            {/* Редиректы со старых URL без языка на /ru */}
            {Object.entries(LEGACY_ROUTE_REDIRECTS).map(([fromPath, toPath]) => (
              <Route key={fromPath} path={fromPath} element={<Navigate to={toPath} replace />} />
            ))}

            <Route path="/ru/*" element={<NotFound />} />
            <Route path="/en/*" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </PageTransition>
        </Suspense>
      </main>
      <Footer />
    </ErrorBoundary>
  )
}

export default App
