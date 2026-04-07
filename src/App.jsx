import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
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
  return (
    <ErrorBoundary>
      <Header />
      <ScrollToTop />
      <div className="container">
        <Breadcrumbs />
      </div>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/number-to-words" element={<NumberToWords />} />
          <Route path="/vat-calculator" element={<VATCalculator />} />
          <Route path="/random-number" element={<RandomNumber />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/time-calculator" element={<TimeCalculator />} />
          <Route path="/compound-interest" element={<CompoundInterest />} />
          <Route path="/seo-audit" element={<SEOAudit />} />
          <Route path="/meta-tags-generator" element={<MetaTagsGenerator />} />
          <Route path="/seo-audit-pro" element={<SEOAuditPro />} />
          <Route path="/qr-code-generator" element={<QRCodeGenerator />} />
          <Route path="/url-shortener" element={<URLShortener />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/password-generator" element={<PasswordGenerator />} />
        </Routes>
      </Suspense>
      <Footer />
    </ErrorBoundary>
  )
}

export default App
