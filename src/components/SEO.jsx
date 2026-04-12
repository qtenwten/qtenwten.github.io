import { Helmet } from 'react-helmet-async'
import { useLanguage } from '../contexts/LanguageContext'
import { getLocalizedRouteUrl, getRouteSeo, normalizeSeoPath } from '../config/routeSeo'

function SEO({ title, description, path = '', keywords = '', image = 'https://qsen.ru/og-image.svg', robots = 'index,follow' }) {
  const { language } = useLanguage()
  const cleanPath = normalizeSeoPath(path)
  const routeSeo = getRouteSeo(language, cleanPath)

  const siteName = 'QSEN.RU'
  const fullTitle = routeSeo.title || title
  const fullDescription = routeSeo.description || description
  const fullKeywords = routeSeo.keywords || keywords
  const fullImage = routeSeo.image || image
  const fullUrl = getLocalizedRouteUrl(language, cleanPath)
  const ruUrl = getLocalizedRouteUrl('ru', cleanPath)
  const enUrl = getLocalizedRouteUrl('en', cleanPath)

  const locale = language === 'ru' ? 'ru_RU' : 'en_US'

  // JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': siteName,
    'url': 'https://qsen.ru',
    'description': fullDescription,
    'inLanguage': language,
    'publisher': {
      '@type': 'Organization',
      'name': siteName,
      'url': 'https://qsen.ru',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://qsen.ru/icon-512x512.png'
      }
    },
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `https://qsen.ru/${language}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={fullKeywords} />
      <link rel="canonical" href={fullUrl} />
      <html lang={language} />

      {/* Hreflang tags */}
      <link rel="alternate" hreflang="ru" href={ruUrl} />
      <link rel="alternate" hreflang="en" href={enUrl} />
      <link rel="alternate" hreflang="x-default" href={ruUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />

      {/* Additional SEO */}
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="yandex" content={robots} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  )
}

export default SEO
