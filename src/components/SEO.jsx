import { Helmet } from 'react-helmet-async'
import { useLanguage } from '../contexts/LanguageContext'
import { getLocalizedRouteUrl, getRouteSeo, normalizeSeoPath } from '../config/routeSeo'

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export function validateOgImageDimensions(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function SEO({
  title,
  description,
  keywords,
  path = '',
  image = 'https://qsen.ru/og-image.png',
  robots = 'index,follow',
  ogType = 'website',
  structuredData,
}) {
  const { language } = useLanguage()
  const cleanPath = normalizeSeoPath(path)
  const routeSeo = getRouteSeo(language, cleanPath)

  const siteName = 'QSEN.RU'
  const fullTitle = title || routeSeo.title
  const fullDescription = description || routeSeo.description
  const fullKeywords = keywords || routeSeo.keywords
  const fullImage = image || routeSeo.image
  const fullUrl = getLocalizedRouteUrl(language, cleanPath)
  const ruUrl = getLocalizedRouteUrl('ru', cleanPath)
  const enUrl = getLocalizedRouteUrl('en', cleanPath)

  const locale = language === 'ru' ? 'ru_RU' : 'en_US'

  // JSON-LD structured data
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: 'https://qsen.ru',
    description: fullDescription,
    inLanguage: language,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: 'https://qsen.ru',
      logo: {
        '@type': 'ImageObject',
        url: 'https://qsen.ru/icon-512x512.png',
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://qsen.ru/${language}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
  const resolvedStructuredData = structuredData || defaultStructuredData

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {fullKeywords && <meta name="keywords" content={fullKeywords} />}
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
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />

      {/* Robots */}
      <meta name="robots" content={robots} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(resolvedStructuredData)}
      </script>
    </Helmet>
  )
}

export default SEO
