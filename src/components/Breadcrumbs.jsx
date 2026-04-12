import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useLanguage } from '../contexts/LanguageContext'
import { getRouteEntry } from '../config/routeRegistry'
import './Breadcrumbs.css'

function Breadcrumbs() {
  const location = useLocation()
  const { t, language } = useLanguage()
  const pathname = location.pathname

  // Убираем языковой префикс из pathname
  const cleanPath = pathname.replace(/^\/(ru|en)/, '') || '/'

  // Не показываем на главной
  if (cleanPath === '/') return null

  const config = getRouteEntry(cleanPath)

  if (config?.breadcrumbMode === 'home-current') {
    const breadcrumbs = [
      { name: t('breadcrumbs.home'), url: `https://qsen.ru/${language}/`, path: `/${language}/` },
      { name: t(config.nameKey), url: `https://qsen.ru${pathname}`, path: null }
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
              <span className="breadcrumbs-current" aria-current="page">{t(config.nameKey)}</span>
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
    { name: t(config.categoryKey), url: `https://qsen.ru/${language}/?category=${config.categorySlug}`, path: `/${language}/?category=${config.categorySlug}` },
    { name: t(config.titleKey), url: `https://qsen.ru${pathname}`, path: null }
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
            <Link to={`/${language}/?category=${config.categorySlug}`} className="breadcrumbs-link">{t(config.categoryKey)}</Link>
          </li>
          <li className="breadcrumbs-separator" aria-hidden="true">→</li>
          <li className="breadcrumbs-item">
            <span className="breadcrumbs-current" aria-current="page">{t(config.titleKey)}</span>
          </li>
        </ol>
      </nav>
    </>
  )
}

export default Breadcrumbs
