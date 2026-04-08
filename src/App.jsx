import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Breadcrumbs from './components/Breadcrumbs'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'

const NumberToWords = lazy(() => import('./pages/NumberToWords'))
const VATCalculator = lazy(() => import('./pages/VATCalculator'))
const RandomNumber = lazy(() => import('./pages/RandomNumber'))
const Calculator = lazy(() => import('./pages/Calculator'))
const TimeCalculator = lazy(() => import('./pages/TimeCalculator'))
const CompoundInterest = lazy(() => import('./pages/CompoundInterest'))
const SEOAudit = lazy(() => import('./pages/SEOAudit'))
const MetaTagsGenerator = lazy(() => import('./pages/MetaTagsGenerator'))
const SEOAuditPro = lazy(() => import('./pages/SEOAuditPro'))
const QRCodeGenerator = lazy(() => import('./pages/QRCodeGenerator'))
const URLShortener = lazy(() => import('./pages/URLShortener'))
const Feedback = lazy(() => import('./pages/Feedback'))
const PasswordGenerator = lazy(() => import('./pages/PasswordGenerator'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  const [homeSearch, setHomeSearch] = useState('')
  const location = useLocation()

  return (
    <ErrorBoundary>
      <Header searchValue={homeSearch} onSearchChange={setHomeSearch} />
      <ScrollToTop />
      <div className="container">
        <Breadcrumbs />
      </div>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>}>
        <div key={location.pathname} className="page-transition-wrapper">
          <Routes location={location}>
            {/* Редирект с корня на /ru */}
            <Route path="/" element={<Navigate to="/ru" replace />} />

          {/* Русская версия */}
          <Route path="/ru" element={<Home searchValue={homeSearch} onSearchChange={setHomeSearch} />} />
          <Route path="/ru/number-to-words" element={<NumberToWords />} />
          <Route path="/ru/vat-calculator" element={<VATCalculator />} />
          <Route path="/ru/random-number" element={<RandomNumber />} />
          <Route path="/ru/calculator" element={<Calculator />} />
          <Route path="/ru/time-calculator" element={<TimeCalculator />} />
          <Route path="/ru/compound-interest" element={<CompoundInterest />} />
          <Route path="/ru/seo-audit" element={<SEOAudit />} />
          <Route path="/ru/meta-tags-generator" element={<MetaTagsGenerator />} />
          <Route path="/ru/seo-audit-pro" element={<SEOAuditPro />} />
          <Route path="/ru/qr-code-generator" element={<QRCodeGenerator />} />
          <Route path="/ru/url-shortener" element={<URLShortener />} />
          <Route path="/ru/feedback" element={<Feedback />} />
          <Route path="/ru/password-generator" element={<PasswordGenerator />} />

          {/* Английская версия */}
          <Route path="/en" element={<Home searchValue={homeSearch} onSearchChange={setHomeSearch} />} />
          <Route path="/en/number-to-words" element={<NumberToWords />} />
          <Route path="/en/vat-calculator" element={<VATCalculator />} />
          <Route path="/en/random-number" element={<RandomNumber />} />
          <Route path="/en/calculator" element={<Calculator />} />
          <Route path="/en/time-calculator" element={<TimeCalculator />} />
          <Route path="/en/compound-interest" element={<CompoundInterest />} />
          <Route path="/en/seo-audit" element={<SEOAudit />} />
          <Route path="/en/meta-tags-generator" element={<MetaTagsGenerator />} />
          <Route path="/en/seo-audit-pro" element={<SEOAuditPro />} />
          <Route path="/en/qr-code-generator" element={<QRCodeGenerator />} />
          <Route path="/en/url-shortener" element={<URLShortener />} />
          <Route path="/en/feedback" element={<Feedback />} />
          <Route path="/en/password-generator" element={<PasswordGenerator />} />

          {/* Редиректы со старых URL без языка на /ru */}
          <Route path="/number-to-words" element={<Navigate to="/ru/number-to-words" replace />} />
          <Route path="/vat-calculator" element={<Navigate to="/ru/vat-calculator" replace />} />
          <Route path="/random-number" element={<Navigate to="/ru/random-number" replace />} />
          <Route path="/calculator" element={<Navigate to="/ru/calculator" replace />} />
          <Route path="/time-calculator" element={<Navigate to="/ru/time-calculator" replace />} />
          <Route path="/compound-interest" element={<Navigate to="/ru/compound-interest" replace />} />
          <Route path="/seo-audit" element={<Navigate to="/ru/seo-audit" replace />} />
          <Route path="/meta-tags-generator" element={<Navigate to="/ru/meta-tags-generator" replace />} />
          <Route path="/seo-audit-pro" element={<Navigate to="/ru/seo-audit-pro" replace />} />
          <Route path="/qr-code-generator" element={<Navigate to="/ru/qr-code-generator" replace />} />
          <Route path="/url-shortener" element={<Navigate to="/ru/url-shortener" replace />} />
          <Route path="/feedback" element={<Navigate to="/ru/feedback" replace />} />
          <Route path="/password-generator" element={<Navigate to="/ru/password-generator" replace />} />
        </Routes>
        </div>
      </Suspense>
      <Footer />
    </ErrorBoundary>
  )
}

export default App
