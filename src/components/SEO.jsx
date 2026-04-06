import { Helmet } from 'react-helmet-async'

function SEO({ title, description, path = '', keywords = '', image = 'https://qsen.ru/og-image.svg' }) {
  const siteName = 'QSEN.RU'
  const fullTitle = title || 'QSEN.RU - Онлайн калькуляторы и SEO инструменты'
  const fullUrl = `https://qsen.ru${path}`
  const defaultKeywords = 'калькулятор онлайн, НДС калькулятор, число прописью, SEO аудит, генератор мета-тегов, сложные проценты'
  const fullKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords

  // JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': siteName,
    'url': 'https://qsen.ru',
    'description': description || 'Бесплатные онлайн калькуляторы, SEO инструменты и утилиты для бизнеса',
    'publisher': {
      '@type': 'Organization',
      'name': siteName,
      'url': 'https://qsen.ru',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://qsen.ru/logo.png'
      }
    },
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://qsen.ru/?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={fullKeywords} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ru_RU" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="yandex" content="index, follow" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  )
}

export default SEO
