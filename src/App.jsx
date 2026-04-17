import { Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Breadcrumbs from './components/Breadcrumbs'
import ErrorBoundary from './components/ErrorBoundary'
import RouteSkeleton from './components/RouteSkeleton'
import PageTransition from './components/PageTransition'
import { useLanguage } from './contexts/LanguageContext'
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
  const { language } = useLanguage()
  const [homeSearch, setHomeSearch] = useState('')
  const location = useLocation()
  const pageTransitionKey = normalizeLocalePath(location.pathname)
  const previousFocusLogicalPathRef = useRef(pageTransitionKey)
  const mainRef = useRef(null)
  const hasMountedRef = useRef(false)

  // DIAG: Semantic DOM comparison — ignores attribute order
  useEffect(() => {
    function getSemanticAttrs(el) {
      if (!el) return null
      const attrs = {}
      if (el.hasAttributes()) {
        for (const attr of el.attributes) {
          attrs[attr.name] = attr.value
        }
      }
      return attrs
    }
    function classSet(el) {
      return el ? Array.from(el.classList || []) : []
    }
    function compareSemantic(label, beforeEl, afterEl) {
      const beforeTag = beforeEl?.tagName
      const afterTag = afterEl?.tagName
      const tagMatch = beforeTag === afterTag
      const beforeAttrs = getSemanticAttrs(beforeEl)
      const afterAttrs = getSemanticAttrs(afterEl)
      const beforeAttrKeys = Object.keys(beforeAttrs || {}).sort()
      const afterAttrKeys = Object.keys(afterAttrs || {}).sort()
      const attrsMatch = JSON.stringify(beforeAttrKeys) === JSON.stringify(afterAttrKeys) &&
        beforeAttrKeys.every((k) => beforeAttrs[k] === afterAttrs[k])
      const beforeClassSet = classSet(beforeEl)
      const afterClassSet = classSet(afterEl)
      const classMatch = JSON.stringify(beforeClassSet.sort()) === JSON.stringify(afterClassSet.sort())
      const textMatch = beforeEl?.textContent === afterEl?.textContent
      const childCountMatch = beforeEl?.childNodes.length === afterEl?.childNodes.length
      const equal = tagMatch && attrsMatch && classMatch && textMatch && childCountMatch
      console.log(`🔍 [SEMANTIC] ${label}: ${equal ? '✅ MATCH' : '❌ MISMATCH'}`)
      if (!equal) {
        if (!tagMatch) console.log(`  tagName: "${beforeTag}" → "${afterTag}"`)
        if (!attrsMatch) {
          const allKeys = [...new Set([...beforeAttrKeys, ...afterAttrKeys])].sort()
          allKeys.forEach((k) => {
            if (beforeAttrs[k] !== afterAttrs[k]) {
              console.log(`  attr "${k}": "${beforeAttrs[k]}" → "${afterAttrs[k]}"`)
            }
          })
        }
        if (!classMatch) console.log(`  classSet: [${beforeClassSet}] → [${afterClassSet}]`)
        if (!textMatch) console.log(`  textContent: "${beforeEl?.textContent?.slice(0, 60)}" → "${afterEl?.textContent?.slice(0, 60)}"`)
        if (!childCountMatch) console.log(`  childNodes.length: ${beforeEl?.childNodes.length} → ${afterEl?.childNodes.length}`)
      }
      return equal
    }

    const before = window.__QSEN_BEFORE_HYDRATION__ || {}
    const themeSwitcherBefore = before.themeSwitcherOuterHTML ? document.createElement('div') : null
    if (themeSwitcherBefore) {
      themeSwitcherBefore.innerHTML = before.themeSwitcherOuterHTML
    }
    const langSwitcherBefore = before.langSwitcherOuterHTML ? document.createElement('div') : null
    if (langSwitcherBefore) {
      langSwitcherBefore.innerHTML = before.langSwitcherOuterHTML
    }
    const footerBefore = before.footerOuterHTML ? document.createElement('div') : null
    if (footerBefore) {
      footerBefore.innerHTML = before.footerOuterHTML
    }

    const themeSwitcher = document.querySelector('.theme-switcher')
    const langSwitcher = document.querySelector('.language-switcher')
    const footerEl = document.querySelector('.footer')
    const headerSearch = document.getElementById('header-search')

    compareSemantic('ThemeSwitcher button', themeSwitcherBefore?.firstElementChild || null, themeSwitcher)
    compareSemantic('LanguageSwitcher button', langSwitcherBefore?.firstElementChild || null, langSwitcher)
    compareSemantic('Footer', footerBefore?.firstElementChild || null, footerEl)
    compareSemantic('Header search input', before.headerSearchValue !== undefined ? { tagName: 'INPUT', value: before.headerSearchValue, defaultValue: before.headerSearchDefaultValue, attrs: { id: 'header-search', type: 'search', 'aria-label': '' }, classSet: [], textContent: '', childNodes: { length: 0 } } : null, headerSearch)
  }, [])

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
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">
        {language === 'en' ? 'Skip to content' : 'Перейти к содержимому'}
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
    </ErrorBoundary>
  )
}

function LegacyArticleRedirect() {
  const { slug = '' } = useParams()
  return <Navigate to={`/ru/articles/${slug}`} replace />
}

export default App
