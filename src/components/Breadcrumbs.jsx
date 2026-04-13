import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useLanguage } from '../contexts/LanguageContext'
import { getRouteEntry } from '../config/routeRegistry'
import './Breadcrumbs.css'

function isArticleDetailPath(pathname = '') {
  return /^\/articles\/[^/]+$/.test(pathname)
}

function formatFallbackLabel(pathname) {
  const lastSegment = pathname.split('/').filter(Boolean).pop() || ''
  if (!lastSegment) return ''

  const humanized = decodeURIComponent(lastSegment).replace(/[-_]+/g, ' ')
  return humanized.charAt(0).toUpperCase() + humanized.slice(1)
}

function getSafeLabel(t, translationKey, fallbackLabel) {
  if (typeof translationKey === 'string' && translationKey.length > 0) {
    return t(translationKey)
  }

  if (import.meta.env.DEV) {
    console.warn('[Breadcrumbs] Missing translation key, using fallback label:', { translationKey, fallbackLabel })
  }

  return fallbackLabel
}

function Breadcrumbs() {
  const location = useLocation()
  const { t, language } = useLanguage()
  const pathname = location.pathname

  // Убираем языковой префикс из pathname
  const cleanPath = pathname.replace(/^\/(ru|en)/, '') || '/'

  // Не показываем на главной
  if (cleanPath === '/') return null

  const config = getRouteEntry(cleanPath)
  const fallbackLabel = formatFallbackLabel(cleanPath)

  if (isArticleDetailPath(cleanPath)) {
    const articleLabel = formatFallbackLabel(cleanPath)
    const breadcrumbs = [
      { name: t('breadcrumbs.home'), url: `https://qsen.ru/${language}/`, path: `/${language}/` },
      { name: t('articles.title'), url: `https://qsen.ru/${language}/articles`, path: `/${language}/articles` },
      { name: articleLabel, url: `https://qsen.ru${pathname}`, path: null },
    ]

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': crumb.name,
        'item': crumb.url || undefined,
      })),
    }

    return (
      <>
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        </Helmet>

        <nav className="breadcrumbs" aria-label={t('breadcrumbs.navigation')}>
          <ol className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link to={`/${language}/`} className="breadcrumbs-link">{t('breadcrumbs.home')}</Link>
            </li>
            <li className="breadcrumbs-separator" aria-hidden="true">→</li>
            <li className="breadcrumbs-item">
              <Link to={`/${language}/articles`} className="breadcrumbs-link">{t('articles.title')}</Link>
            </li>
            <li className="breadcrumbs-separator" aria-hidden="true">→</li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-current" aria-current="page">{articleLabel}</span>
            </li>
          </ol>
        </nav>
      </>
    )
  }

  if (config?.breadcrumbMode === 'home-current') {
    const breadcrumbs = [
      { name: t('breadcrumbs.home'), url: `https://qsen.ru/${language}/`, path: `/${language}/` },
      { name: getSafeLabel(t, config.titleKey, fallbackLabel), url: `https://qsen.ru${pathname}`, path: null }
    ]

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': crumb.name,
        'item': crumb.url || undefined
      }))
    }

    return (
      <>
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        </Helmet>

        <nav className="breadcrumbs" aria-label={t('breadcrumbs.navigation')}>
          <ol className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link to={`/${language}/`} className="breadcrumbs-link">{t('breadcrumbs.home')}</Link>
            </li>
            <li className="breadcrumbs-separator" aria-hidden="true">→</li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-current" aria-current="page">{getSafeLabel(t, config.titleKey, fallbackLabel)}</span>
            </li>
          </ol>
        </nav>
      </>
    )
  }

  // Всегда рендерим контейнер для резервирования места
  if (!config) {
    return <nav className="breadcrumbs" aria-label={t('breadcrumbs.navigation')}></nav>
  }

  const breadcrumbs = [
    { name: t('breadcrumbs.home'), url: `https://qsen.ru/${language}/`, path: `/${language}/` },
    { name: getSafeLabel(t, config.categoryKey, ''), url: `https://qsen.ru/${language}/?category=${config.categorySlug}`, path: `/${language}/?category=${config.categorySlug}` },
    { name: getSafeLabel(t, config.titleKey, fallbackLabel), url: `https://qsen.ru${pathname}`, path: null }
  ]

  // JSON-LD структурированные данные для SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': crumb.url || undefined
    }))
  }

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <nav className="breadcrumbs" aria-label={t('breadcrumbs.navigation')}>
        <ol className="breadcrumbs-list">
          <li className="breadcrumbs-item">
            <Link to={`/${language}/`} className="breadcrumbs-link">{t('breadcrumbs.home')}</Link>
            </li>
            <li className="breadcrumbs-separator" aria-hidden="true">→</li>
            <li className="breadcrumbs-item">
              <Link to={`/${language}/?category=${config.categorySlug}`} className="breadcrumbs-link">{getSafeLabel(t, config.categoryKey, '')}</Link>
            </li>
            <li className="breadcrumbs-separator" aria-hidden="true">→</li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-current" aria-current="page">{getSafeLabel(t, config.titleKey, fallbackLabel)}</span>
            </li>
          </ol>
        </nav>
    </>
  )
}

export default Breadcrumbs
