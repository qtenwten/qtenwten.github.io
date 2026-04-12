import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllLocalizedSeoPages, getLocalizedRouteUrl } from '../src/config/routeSeo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')
const publicPath = path.resolve(__dirname, '../public')
const templatePath = path.join(distPath, 'index.html')
const ROOT_REDIRECT_URL = 'https://qsen.ru/ru/'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function replaceOrInsert(html, pattern, replacement, anchorPattern) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement)
  }

  return html.replace(anchorPattern, `${replacement}\n$&`)
}

function getRandomNumberSubtitle(language) {
  return language === 'ru'
    ? 'Рандомайзер для розыгрышей, выборки и случайного выбора чисел'
    : 'Generate random numbers online for raffles, games, sampling, and quick picks'
}

function buildRandomNumberPrerenderRoot(page) {
  return `<div id="root"><div class="tool-container random-number-page"><section class="random-number-hero" aria-labelledby="random-number-heading"><h1 id="random-number-heading" class="random-number-hero__title"><span class="random-number-hero__title-wrap"><svg aria-hidden="true" class="random-number-hero__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1"></circle><circle cx="15.5" cy="8.5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="8.5" cy="15.5" r="1"></circle><circle cx="15.5" cy="15.5" r="1"></circle></svg><span class="random-number-hero__title-text">${escapeHtml(page.h1)}</span></span></h1><p class="random-number-hero__subtitle">${escapeHtml(getRandomNumberSubtitle(page.language))}</p></section></div></div>`
}

function getHomePrerenderCopy(language) {
  return language === 'ru'
    ? {
        subtitle: 'Бесплатные сервисы для расчетов, документов, ссылок, QR-кодов и проверки сайта',
        search: 'Поиск инструмента...',
        skipLink: 'Перейти к содержимому',
      }
    : {
        subtitle: 'Use fast online tools for calculations, QR codes, links, passwords, dates, and quick SEO checks with no setup required.',
        search: 'Search for a tool...',
        skipLink: 'Skip to content',
      }
}

function buildHomePrerenderRoot(page) {
  const copy = getHomePrerenderCopy(page.language)
  const homePath = `/${page.language}/`
  const isRussian = page.language === 'ru'

  return `<div id="root"><a href="#main-content" class="skip-link">${escapeHtml(copy.skipLink)}</a><header class="header"><div class="container header-content is-home-search"><a href="${homePath}" class="logo"><svg aria-hidden="true" class="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"></path><path d="M5 20V8l8-5 6 4"></path><path d="M13 7v13"></path><path d="M9 11h.01"></path><path d="M9 14h.01"></path><path d="M9 17h.01"></path></svg><div class="logo-wrapper"><span class="logo-text">Utility Tools</span><span class="logo-subtitle">${escapeHtml(page.h1)}</span></div></a><div class="header-search-box"><label for="header-search" class="sr-only">${escapeHtml(copy.search)}</label><input id="header-search" type="search" placeholder="${escapeHtml(copy.search)}" aria-label="${escapeHtml(copy.search)}" value="" /></div><div class="header-actions"><div class="language-switcher"><button class="lang-btn${isRussian ? ' active' : ''}" aria-label="Русский">RU</button><span class="lang-separator">|</span><button class="lang-btn${isRussian ? '' : ' active'}" aria-label="English">EN</button></div></div></div></header><main id="main-content" class="app-main" tabindex="-1"><div class="container"></div><div class="page-transition-wrapper"><div class="home"><div class="container"><section class="home-hero" aria-labelledby="home-heading"><h1 id="home-heading">${escapeHtml(page.h1)}</h1><p>${escapeHtml(copy.subtitle)}</p></section></div></div></div></main></div>`
}

function buildStructuredData({ language, title, description, url }) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url,
    description,
    inLanguage: language,
    isPartOf: {
      '@type': 'WebSite',
      name: 'QSEN.RU',
      url: 'https://qsen.ru',
    },
  })
}

function buildAlternateLinks(pathName) {
  const ruUrl = getLocalizedRouteUrl('ru', pathName)
  const enUrl = getLocalizedRouteUrl('en', pathName)

  return [
    `<link rel="alternate" hreflang="ru" href="${ruUrl}" />`,
    `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${ruUrl}" />`,
  ].join('\n    ')
}

function buildSeoTags(page) {
  const alternateLinks = buildAlternateLinks(page.path)

  return `
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="keywords" content="${escapeHtml(page.keywords)}" />
    <link rel="canonical" href="${page.url}" />
    ${alternateLinks}
    <meta property="og:site_name" content="QSEN.RU" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${page.url}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${page.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${page.locale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${page.image}" />
    <meta name="robots" content="${page.robots}" />
    <meta name="googlebot" content="${page.robots}" />
    <meta name="yandex" content="${page.robots}" />
  `.trim()
}

function injectSeo(template, page) {
  const seoTags = buildSeoTags(page)
  const structuredData = buildStructuredData(page)

  let html = template
    .replace(/<html lang="[^"]*">/, `<html lang="${page.language}">`)
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)

  html = html.replace(/<meta name="description" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="keywords" content=".*?" \/>\s*/g, '')
  html = html.replace(/<link rel="canonical" href=".*?" \/>\s*/g, '')
  html = html.replace(/<link rel="alternate" hreflang=".*?" href=".*?" \/>\s*/g, '')
  html = html.replace(/<meta property="og:(site_name|title|description|url|type|image|image:width|image:height|locale)" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="twitter:(card|title|description|image)" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="robots" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="googlebot" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="yandex" content=".*?" \/>\s*/g, '')

  html = replaceOrInsert(
    html,
    /<meta name="description" content=".*?" \/>/,
    seoTags,
    /<link rel="icon"/,
  )

  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${structuredData}</script>`)
  const isHomePage = page.path === '/'
    || /^\/?(?:ru|en)\/?$/.test(page.path)
    || /^\/?(?:ru|en)\/?$/.test(page.route)
  const isRandomNumberPage = page.path === '/random-number'

  const prerenderRoot = isHomePage
    ? buildHomePrerenderRoot(page)
    : isRandomNumberPage
      ? buildRandomNumberPrerenderRoot(page)
    : `<div id="root"><div><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.description)}</p></div></div>`

  html = html.replace(/<div id="root"><\/div>/, prerenderRoot)

  return html
}

function writeFileSafely(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

function generatePage(template, page) {
  const outputPath = path.join(distPath, page.route, 'index.html')
  writeFileSafely(outputPath, injectSeo(template, page))
  console.log(`✓ Generated: ${page.route}`)
}

function buildRootRedirectPage(template) {
  let html = template
    .replace(/<html lang="[^"]*">/, '<html lang="ru">')
    .replace(/<title>.*?<\/title>/, '<title>Redirecting to QSEN.RU</title>')

  html = html.replace(/<meta name="description" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="keywords" content=".*?" \/>\s*/g, '')
  html = html.replace(/<link rel="canonical" href=".*?" \/>\s*/g, '')
  html = html.replace(/<link rel="alternate" hreflang=".*?" href=".*?" \/>\s*/g, '')
  html = html.replace(/<meta property="og:(site_name|title|description|url|type|image|image:width|image:height|locale)" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="twitter:(card|title|description|image)" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="robots" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="googlebot" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="yandex" content=".*?" \/>\s*/g, '')
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')

  const redirectMeta = `
    <meta name="description" content="Redirecting to the default language version of QSEN.RU." />
    <link rel="canonical" href="${ROOT_REDIRECT_URL}" />
    <meta name="robots" content="noindex,follow" />
    <meta http-equiv="refresh" content="0; url=${ROOT_REDIRECT_URL}" />
    <script>window.location.replace('${ROOT_REDIRECT_URL}' + window.location.search + window.location.hash)</script>
  `.trim()

  html = replaceOrInsert(html, /<meta name="description" content=".*?" \/>/, redirectMeta, /<link rel="icon"/)
  html = html.replace(/<div id="root"><\/div>/, '<div id="root"></div>')

  return html
}

function buildSitemap(pages) {
  const items = pages
    .filter((page) => page.includeInSitemap !== false)
    .map((page) => {
    const cleanPath = page.path
    const ruUrl = getLocalizedRouteUrl('ru', cleanPath)
    const enUrl = getLocalizedRouteUrl('en', cleanPath)

    return `  <url>
    <loc>${page.url}</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="${ruUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${ruUrl}" />
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>${cleanPath === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${cleanPath === '/' ? '1.0' : cleanPath === '/seo-audit-pro' ? '0.9' : '0.8'}</priority>
  </url>`
    }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${items}
</urlset>
`
}

function main() {
  console.log('🚀 Starting pre-render generation...\n')

  if (!fs.existsSync(distPath)) {
    console.error('❌ dist/ folder not found!')
    process.exit(1)
  }

  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/index.html not found!')
    process.exit(1)
  }

  const template = fs.readFileSync(templatePath, 'utf-8')
  const pages = getAllLocalizedSeoPages()

  pages.forEach((page) => generatePage(template, page))

  writeFileSafely(path.join(distPath, 'index.html'), buildRootRedirectPage(template))

  const sitemap = buildSitemap(pages)
  writeFileSafely(path.join(distPath, 'sitemap.xml'), sitemap)
  writeFileSafely(path.join(publicPath, 'sitemap.xml'), sitemap)

  console.log(`\n✅ Successfully generated ${pages.length} pages`)
  console.log('📁 Output: dist/ folder with pre-rendered HTML, redirect root, and sitemap\n')
}

main()
