import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllLocalizedSeoPages, getLocalizedRouteUrl } from '../src/config/routeSeo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')
const publicPath = path.resolve(__dirname, '../public')
const templatePath = path.join(distPath, 'index.html')
const localesPath = path.resolve(__dirname, '../src/locales')
const ROOT_REDIRECT_URL = 'https://qsen.ru/ru/'
const ARTICLES_API_BASE_URL = 'https://fancy-scene-deeb.qten.workers.dev'
const ARTICLES_REQUEST_TIMEOUT_MS = 9000

const localeMessages = {
  ru: JSON.parse(fs.readFileSync(path.join(localesPath, 'ru.json'), 'utf-8')),
  en: JSON.parse(fs.readFileSync(path.join(localesPath, 'en.json'), 'utf-8')),
}

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

const TOOL_PAGE_SHELL_PATHS = new Set([
  '/search',
  '/number-to-words',
  '/calculator',
  '/date-difference',
  '/seo-audit',
  '/seo-audit-pro',
  '/qr-code-generator',
  '/url-shortener',
  '/feedback',
  '/password-generator',
  '/articles',
])

const CLIENT_RENDER_TOOL_PATHS = new Set([
  '/qr-code-generator',
  '/articles',
])

const PRERENDER_TOOL_HERO_CONFIG = {
  '/search': {
    ru: {
      title: 'Поиск по инструментам',
      subtitle: 'Найдите нужный калькулятор, генератор или SEO-инструмент по названию, описанию и задаче.',
      note: 'Ищите по задаче, названию инструмента или обычной поисковой фразе.',
    },
    en: {
      title: 'Search tools',
      subtitle: 'Find calculators, generators, and utilities by name, description, or intent.',
      note: 'Search by task, tool type, or a phrase you would normally type into a search box.',
    },
  },
  '/number-to-words': {
    titleKey: 'numberToWords.title',
    subtitleKey: 'numberToWords.subtitle',
  },
  '/vat-calculator': {
    titleKey: 'vatCalculator.title',
    subtitleKey: 'vatCalculator.subtitle',
  },
  '/calculator': {
    titleKey: 'calculator.title',
    subtitleKey: 'calculator.subtitle',
  },
  '/date-difference': {
    ru: {
      title: 'Калькулятор дней между датами',
      subtitle: 'Считайте календарные и рабочие дни, точную разницу по времени и обратный отсчёт без лишних действий.',
      note: 'Выберите две даты или будущую дату события — результат появится сразу и будет понятен без дополнительных пояснений.',
    },
    en: {
      title: 'Date Difference Calculator',
      subtitle: 'Calculate calendar days, business days, time differences, or a countdown without extra steps.',
      note: 'Choose the dates you want to compare, and the tool will instantly show the result in a clear, practical format.',
    },
  },
  '/seo-audit': {
    titleKey: 'seoAudit.title',
    subtitleKey: 'seoAudit.subtitle',
  },
  '/seo-audit-pro': {
    titleKey: 'seoAuditPro.title',
    subtitleKey: 'seoAuditPro.subtitle',
  },
  '/qr-code-generator': {
    titleKey: 'qrCodeGenerator.title',
    subtitleKey: 'qrCodeGenerator.subtitle',
  },
  '/url-shortener': {
    titleKey: 'urlShortener.title',
    subtitleKey: 'urlShortener.subtitle',
  },
  '/feedback': {
    eyebrow: {
      ru: 'Свяжитесь с нами',
      en: 'Get in touch',
    },
    titleKey: 'feedback.title',
    subtitleKey: 'feedback.subtitle',
  },
  '/password-generator': {
    titleKey: 'passwordGenerator.title',
    subtitleKey: 'passwordGenerator.subtitle',
  },
  '/articles': {
    titleKey: 'articles.title',
    subtitleKey: 'articles.subtitle',
    noteKey: 'articles.note',
  },
}

function getLocaleValue(language, key, fallback = '') {
  if (!key) {
    return fallback
  }

  const value = key.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), localeMessages[language])
  return typeof value === 'string' ? value : fallback
}

function getToolHeroContent(page) {
  const config = PRERENDER_TOOL_HERO_CONFIG[page.path]

  if (!config) {
    return {
      title: page.h1,
      subtitle: page.description,
      note: '',
      eyebrow: '',
    }
  }

  const localizedConfig = config[page.language] || {}

  return {
    eyebrow: localizedConfig.eyebrow || config.eyebrow?.[page.language] || '',
    title: localizedConfig.title || getLocaleValue(page.language, config.titleKey, page.h1),
    subtitle: localizedConfig.subtitle || getLocaleValue(page.language, config.subtitleKey, page.description),
    note: localizedConfig.note || getLocaleValue(page.language, config.noteKey, ''),
  }
}

function safeJsonForInlineScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function normalizeArticleIndexItem(item = {}) {
  return {
    id: item.id,
    slug: item.slug || '',
    title: item.title || '',
    excerpt: item.excerpt || '',
    author: item.author || '',
    coverImage: item.cover_image || null,
    publishedAt: item.published_at || '',
  }
}

async function fetchArticlesIndex() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ARTICLES_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${ARTICLES_API_BASE_URL}/articles`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Articles request failed with status ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data.map(normalizeArticleIndexItem) : []
  } finally {
    clearTimeout(timeoutId)
  }
}

function formatPublishedDate(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getPrerenderCopy(language) {
  return language === 'ru'
    ? {
        homeTitle: 'Онлайн калькуляторы, генераторы и SEO-инструменты',
        subtitle: 'Бесплатные сервисы для расчетов, документов, ссылок, QR-кодов и проверки сайта',
        search: 'Поиск инструмента...',
        skipLink: 'Перейти к содержимому',
        switchToRu: 'Переключить язык на русский',
        switchToEn: 'Switch language to English',
        breadcrumbsNav: 'Навигация',
      }
    : {
        homeTitle: 'Free Online Calculators, Generators, and SEO Tools',
        subtitle: 'Use fast online tools for calculations, QR codes, links, passwords, dates, and quick SEO checks with no setup required.',
        search: 'Search for a tool...',
        skipLink: 'Skip to content',
        switchToRu: 'Переключить язык на русский',
        switchToEn: 'Switch language to English',
        breadcrumbsNav: 'Navigation',
      }
}

function buildLanguageSwitcherPrerender(language) {
  const copy = getPrerenderCopy(language)
  const isEnglish = language === 'en'

  return `<button type="button" class="language-switcher ${isEnglish ? 'is-en' : 'is-ru'}" aria-label="${escapeHtml(isEnglish ? copy.switchToRu : copy.switchToEn)}" aria-pressed="${isEnglish ? 'true' : 'false'}" title="${escapeHtml(isEnglish ? copy.switchToRu : copy.switchToEn)}"><span class="language-switcher__thumb" aria-hidden="true"></span><span class="language-switcher__labels" aria-hidden="true"><span class="language-switcher__label ${language === 'ru' ? 'is-active' : ''}">RU</span><span class="language-switcher__label ${isEnglish ? 'is-active' : ''}">EN</span></span></button>`
}

function buildHeaderPrerender(page, { isHomePage = false } = {}) {
  const copy = getPrerenderCopy(page.language)
  const homePath = `/${page.language}/`

  return `<header class="header"><div class="container header-content ${isHomePage ? 'is-home-search' : 'is-compact'}"><a href="${homePath}" class="logo"><svg aria-hidden="true" class="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"></path><path d="M5 20V8l8-5 6 4"></path><path d="M13 7v13"></path><path d="M9 11h.01"></path><path d="M9 14h.01"></path><path d="M9 17h.01"></path></svg><div class="logo-wrapper"><span class="logo-text">Utility Tools</span><span class="logo-subtitle">${escapeHtml(copy.homeTitle)}</span></div></a>${isHomePage ? `<div class="header-search-box"><label for="header-search" class="sr-only">${escapeHtml(copy.search)}</label><input id="header-search" type="search" placeholder="${escapeHtml(copy.search)}" aria-label="${escapeHtml(copy.search)}" value="" /></div>` : ''}<div class="header-actions">${isHomePage ? '' : `<a href="/${page.language}/search" class="header-search-link"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg><span>${escapeHtml(copy.search)}</span></a>`}${buildLanguageSwitcherPrerender(page.language)}</div></div></header>`
}

function buildAppPrerenderRoot(page, content, { isHomePage = false, skipHydration = false } = {}) {
  const copy = getPrerenderCopy(page.language)
  const rootAttributes = skipHydration ? ' data-no-hydrate="true"' : ''

  return `<div id="root"${rootAttributes}><a href="#main-content" class="skip-link">${escapeHtml(copy.skipLink)}</a>${buildHeaderPrerender(page, { isHomePage })}<main id="main-content" class="app-main" tabindex="-1">${isHomePage ? '<div class="container"></div>' : `<div class="container"><nav class="breadcrumbs" aria-label="${escapeHtml(copy.breadcrumbsNav)}"><ol class="breadcrumbs-list"></ol></nav></div>`}<div class="page-transition-wrapper">${content}</div></main></div>`
}

function buildRandomNumberPrerenderContent(page) {
  const hero = getToolHeroContent(page)

  return `<div class="tool-container random-number-page"><section class="random-number-hero" aria-labelledby="random-number-heading"><h1 id="random-number-heading" class="random-number-hero__title"><span class="random-number-hero__title-wrap"><svg aria-hidden="true" class="random-number-hero__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1"></circle><circle cx="15.5" cy="8.5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="8.5" cy="15.5" r="1"></circle><circle cx="15.5" cy="15.5" r="1"></circle></svg><span class="random-number-hero__title-text">${escapeHtml(hero.title)}</span></span></h1><p class="random-number-hero__subtitle">${escapeHtml(hero.subtitle)}</p></section></div>`
}

function buildHomePrerenderContent(page) {
  const copy = getPrerenderCopy(page.language)

  return `<div class="home"><div class="container"><section class="home-hero" aria-labelledby="home-heading"><h1 id="home-heading">${escapeHtml(page.h1)}</h1><p>${escapeHtml(copy.subtitle)}</p></section></div></div>`
}

function buildToolPageShellPrerenderContent(page) {
  const hero = getToolHeroContent(page)
  const heroClasses = ['tool-page-hero', 'is-centered']

  if (hero.eyebrow) heroClasses.push('has-eyebrow')
  if (hero.subtitle) heroClasses.push('has-subtitle')
  if (hero.note) heroClasses.push('has-note')

  return `<div class="tool-container tool-page-shell"><section class="${heroClasses.join(' ')}">${hero.eyebrow ? `<div class="tool-page-hero__eyebrow">${escapeHtml(hero.eyebrow)}</div>` : ''}<h1 class="tool-page-hero__title">${escapeHtml(hero.title)}</h1>${hero.subtitle ? `<p class="tool-page-hero__subtitle">${escapeHtml(hero.subtitle)}</p>` : ''}${hero.note ? `<p class="tool-page-hero__note">${escapeHtml(hero.note)}</p>` : ''}</section></div>`
}

function buildArticlesIndexPrerenderContent(page, articles = []) {
  const hero = getToolHeroContent(page)
  const heroClasses = ['tool-page-hero', 'is-centered', 'has-eyebrow', 'has-subtitle', 'has-note']
  const ariaLabel = escapeHtml(getLocaleValue(page.language, 'articles.listAriaLabel', page.language === 'en' ? 'Articles list' : 'Список статей'))
  const unknownAuthor = escapeHtml(getLocaleValue(page.language, 'articles.unknownAuthor', page.language === 'en' ? 'Editorial team' : 'Редакция'))

  const cards = articles.map((article) => {
    const href = `/${page.language}/articles/${encodeURIComponent(article.slug)}`
    const metaDate = article.publishedAt ? escapeHtml(formatPublishedDate(article.publishedAt, page.language)) : ''
    const meta = `<div class="article-card__meta"><span>${escapeHtml(article.author || unknownAuthor)}</span>${metaDate ? `<span>${metaDate}</span>` : ''}</div>`
    const media = article.coverImage
      ? `<a href="${href}" class="article-card__media" aria-label="${escapeHtml(article.title)}"><img src="${escapeHtml(article.coverImage)}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async" /></a>`
      : ''
    const excerpt = article.excerpt ? `<p class="article-card__excerpt">${escapeHtml(article.excerpt)}</p>` : ''
    const readMore = escapeHtml(getLocaleValue(page.language, 'articles.readMore', page.language === 'en' ? 'Open article' : 'Открыть статью'))

    return `<article class="article-card">${media}${meta}<h2 class="article-card__title"><a class="article-card__link" href="${href}">${escapeHtml(article.title)}</a></h2>${excerpt}<div class="article-card__actions"><a class="article-card__read-more" href="${href}">${readMore}</a></div></article>`
  }).join('')

  const skeletonCard = `<article class="article-card article-card--skeleton"><div class="article-skeleton__media"></div><div class="article-skeleton__meta"></div><div class="article-skeleton__title"></div><div class="article-skeleton__excerpt"></div></article>`
  const fallbackSkeleton = Array.from({ length: 6 }).map(() => skeletonCard).join('')

  const list = `<section class="articles-grid" aria-label="${ariaLabel}">${cards || fallbackSkeleton}</section>`

  const initialDataScript = `<script id="__ARTICLES_INDEX_DATA__" type="application/json">${safeJsonForInlineScript({ items: articles, generatedAt: new Date().toISOString() })}</script>`

  return `<div class="tool-container tool-page-shell articles-page"><section class="${heroClasses.join(' ')}">${hero.eyebrow ? `<div class="tool-page-hero__eyebrow">${escapeHtml(hero.eyebrow)}</div>` : ''}<h1 class="tool-page-hero__title">${escapeHtml(hero.title)}</h1>${hero.subtitle ? `<p class="tool-page-hero__subtitle">${escapeHtml(hero.subtitle)}</p>` : ''}${hero.note ? `<p class="tool-page-hero__note">${escapeHtml(hero.note)}</p>` : ''}</section>${list}${initialDataScript}</div>`
}

function buildLegacyToolPrerenderContent(page) {
  return `<div class="tool-container"><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.description)}</p></div>`
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

function injectSeo(template, page, { articlesIndex = [] } = {}) {
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
  const usesToolPageShell = TOOL_PAGE_SHELL_PATHS.has(page.path)
  const shouldSkipHydration = CLIENT_RENDER_TOOL_PATHS.has(page.path)

  const prerenderContent = page.path === '/articles'
    ? buildArticlesIndexPrerenderContent(page, articlesIndex)
    : usesToolPageShell
      ? buildToolPageShellPrerenderContent(page)
      : buildLegacyToolPrerenderContent(page)

  const prerenderRoot = isHomePage
    ? buildAppPrerenderRoot(page, buildHomePrerenderContent(page), { isHomePage: true })
    : isRandomNumberPage
      ? buildAppPrerenderRoot(page, buildRandomNumberPrerenderContent(page))
      : buildAppPrerenderRoot(page, prerenderContent, { skipHydration: shouldSkipHydration })

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

  fetchArticlesIndex()
    .then((articlesIndex) => {
      pages.forEach((page) => {
        const injectOptions = page.path === '/articles' ? { articlesIndex } : {}
        const outputPath = path.join(distPath, page.route, 'index.html')
        writeFileSafely(outputPath, injectSeo(template, page, injectOptions))
        console.log(`✓ Generated: ${page.route}`)
      })

      writeFileSafely(path.join(distPath, 'index.html'), buildRootRedirectPage(template))

      const sitemap = buildSitemap(pages)
      writeFileSafely(path.join(distPath, 'sitemap.xml'), sitemap)
      writeFileSafely(path.join(publicPath, 'sitemap.xml'), sitemap)

      console.log(`\n✅ Successfully generated ${pages.length} pages`)
      console.log('📁 Output: dist/ folder with pre-rendered HTML, redirect root, and sitemap\n')
    })
    .catch((error) => {
      console.error('❌ Failed to fetch articles index for prerender:', error)
      process.exit(1)
    })
}

main()
