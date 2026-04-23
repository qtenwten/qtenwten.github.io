import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllLocalizedSeoPages, getLocalizedRouteUrl } from '../src/config/routeSeo.js'
import { articleMatchesLanguage, filterArticlesForLanguage } from '../src/utils/articleLanguage.js'
import { normalizeArticleIndexItem, normalizeArticleDetailItem } from '../src/utils/articleNormalization.js'
import { getIconSvg, ICON_SVG_MAP } from '../src/utils/iconMap.js'
import { ROUTE_REGISTRY } from '../src/config/routeRegistry.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')
const publicPath = path.resolve(__dirname, '../public')
const templatePath = path.join(distPath, 'index.html')
const localesPath = path.resolve(__dirname, '../src/locales')
const ROOT_REDIRECT_URL = 'https://qsen.ru/ru/'
const ARTICLES_API_BASE_URL = 'https://fancy-scene-deeb.qten.workers.dev'
const ARTICLES_REQUEST_TIMEOUT_MS = 20000
const HEADER_LOGO_PATH = '/qsen-logo.png'

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
    if (data?.error) throw new Error(data.error)
    const items = Array.isArray(data?.articles)
      ? data.articles.map(normalizeArticleIndexItem)
      : Array.isArray(data?.results)
        ? data.results.map(normalizeArticleIndexItem)
        : Array.isArray(data) ? data.map(normalizeArticleIndexItem) : []
    if (items.length === 0) {
      throw new Error(`Articles index returned 0 items — check Worker response format`)
    }
    return items
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchArticleDetail(slug) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ARTICLES_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${ARTICLES_API_BASE_URL}/articles/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Article detail request failed for ${slug} with status ${response.status}`)
    }

    const data = await response.json()
    return normalizeArticleDetailItem(data)
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchArticleDetails(indexItems = []) {
  const settledResults = await Promise.allSettled(indexItems.map((item) => fetchArticleDetail(item.slug)))

  return settledResults.reduce((accumulator, result, index) => {
    if (result.status === 'fulfilled') {
      accumulator.push(result.value)
      return accumulator
    }

    console.warn(`⚠️ Skipped article detail prerender for slug: ${indexItems[index]?.slug || 'unknown'}`)
    return accumulator
  }, [])
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
        homeTitle: 'QSEN — быстрые сервисы для расчётов, ссылок, текста и SEO',
        subtitle: 'Практичные онлайн-инструменты, которые помогают быстрее решать повседневные задачи — от документов и ссылок до QR-кодов и проверки сайта.',
        headerSubtitle: 'Quick Service Engine',
        search: 'Поиск инструмента...',
        articles: 'Статьи',
        switchToDarkTheme: 'Переключить тему',
        skipLink: 'Перейти к содержимому',
        switchToRu: 'Переключить язык на русский',
        switchToEn: 'Switch language to English',
        breadcrumbsNav: 'Навигация',
        footerFeedback: 'Есть идеи или предложения?',
        footerWriteUs: 'Написать нам',
        footerTagline: 'Бесплатные онлайн-инструменты для расчётов, ссылок и SEO.',
        footerCopyright: '© 2026 QSEN. Quick Service Engine. Все права защищены.',
      }
    : {
        homeTitle: 'QSEN — fast online services for calculations, links, text, and SEO',
        subtitle: 'Practical online tools that help people solve everyday tasks faster — from documents and links to QR codes and quick website checks.',
        headerSubtitle: 'Quick Service Engine',
        search: 'Search for a tool...',
        articles: 'Articles',
        switchToDarkTheme: 'Toggle theme',
        skipLink: 'Skip to content',
        switchToRu: 'Switch to Russian',
        switchToEn: 'Switch language to English',
        breadcrumbsNav: 'Navigation',
        footerFeedback: 'Have ideas or suggestions?',
        footerWriteUs: 'Contact us',
        footerTagline: 'Free online tools for calculations, links, and SEO.',
        footerCopyright: '© 2026 QSEN. Quick Service Engine. All rights reserved.',
      }
}

function buildLanguageSwitcherPrerender(language) {
  const copy = getPrerenderCopy(language)
  const isEnglish = language === 'en'

  return `<button type="button" class="language-switcher ${isEnglish ? 'is-en' : 'is-ru'}" aria-label="${escapeHtml(isEnglish ? copy.switchToRu : copy.switchToEn)}" aria-pressed="${isEnglish ? 'true' : 'false'}" title="${escapeHtml(isEnglish ? copy.switchToRu : copy.switchToEn)}"><span class="language-switcher__thumb" aria-hidden="true"></span><span class="language-switcher__labels" aria-hidden="true"><span class="language-switcher__label ${language === 'ru' ? 'is-active' : ''}">RU</span><span class="language-switcher__label ${isEnglish ? 'is-active' : ''}">EN</span></span></button>`
}

function buildFooterPrerender(language) {
  const copy = getPrerenderCopy(language)
  const articlesPath = `/${language}/articles`
  const feedbackPath = `/${language}/feedback`

  return `<footer class="footer"><div class="container"><div class="footer-brand"><span class="footer-brand__name">QSEN</span><p class="footer-brand__tagline">${escapeHtml(copy.footerTagline)}</p></div><div class="footer-feedback"><p class="feedback-text">${escapeHtml(copy.footerFeedback)}</p><a href="${feedbackPath}" class="feedback-button">${escapeHtml(copy.footerWriteUs)}</a></div><nav class="footer-links" aria-label="${escapeHtml(copy.breadcrumbsNav)}"><a href="${articlesPath}" class="footer-link">${escapeHtml(copy.articles)}</a></nav><p class="footer-copyright">${escapeHtml(copy.footerCopyright)}</p></div></footer>`
}

function buildHeaderPrerender(page, { isHomePage = false } = {}) {
  const copy = getPrerenderCopy(page.language)
  const homePath = `/${page.language}/`
  const articlesPath = `/${page.language}/articles/`
  const searchPath = `/${page.language}/search`

  return `<header class="header"><div class="container header-content ${isHomePage ? 'is-home-search' : 'is-compact'}"><a href="${homePath}" class="logo"><img src="${HEADER_LOGO_PATH}" alt="" class="logo-icon logo-image" aria-hidden="true" width="48" height="48" /><div class="logo-wrapper"><span class="logo-text">QSEN</span><span class="logo-subtitle">${escapeHtml(copy.headerSubtitle)}</span></div></a>${isHomePage ? `<div class="header-search-box"><label for="header-search" class="sr-only">${escapeHtml(copy.search)}</label><input id="header-search" type="search" placeholder="${escapeHtml(copy.search)}" aria-label="${escapeHtml(copy.search)}" value="" /></div>` : ''}<div class="header-actions"><a href="${articlesPath}" class="header-nav-link"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg><span>${escapeHtml(copy.articles)}</span></a>${isHomePage ? '' : `<a href="${searchPath}" class="header-search-link"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg><span>${escapeHtml(copy.search)}</span></a>`}<button type="button" class="theme-switcher" aria-label="${escapeHtml(copy.switchToDarkTheme)}" title="${escapeHtml(copy.switchToDarkTheme)}"><span class="theme-switcher__thumb" aria-hidden="true"></span><span class="theme-switcher__labels" aria-hidden="true"><span class="theme-switcher__label">☀</span><span class="theme-switcher__label">☾</span></span></button>${buildLanguageSwitcherPrerender(page.language)}</div></div></header>`
}

function buildAppPrerenderRoot(page, content, { isHomePage = false, skipHydration = false } = {}) {
  const copy = getPrerenderCopy(page.language)
  const rootAttributes = skipHydration ? ' data-no-hydrate="true"' : ''

  return `<div id="root"${rootAttributes}><a href="#main-content" class="skip-link">${escapeHtml(copy.skipLink)}</a>${buildHeaderPrerender(page, { isHomePage })}<main id="main-content" class="app-main" tabindex="-1">${isHomePage ? '<div class="container"></div>' : `<div class="container"><nav class="breadcrumbs" aria-label="${escapeHtml(copy.breadcrumbsNav)}"><ol class="breadcrumbs-list"></ol></nav></div>`}<div class="page-transition-wrapper">${content}</div></main>${buildFooterPrerender(page.language)}</div>`
}

function buildRandomNumberPrerenderContent(page) {
  const hero = getToolHeroContent(page)

  return `<div class="tool-container random-number-page"><section class="random-number-hero" aria-labelledby="random-number-heading"><h1 id="random-number-heading" class="random-number-hero__title"><span class="random-number-hero__title-wrap"><svg aria-hidden="true" class="random-number-hero__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1"></circle><circle cx="15.5" cy="8.5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="8.5" cy="15.5" r="1"></circle><circle cx="15.5" cy="15.5" r="1"></circle></svg><span class="random-number-hero__title-text">${escapeHtml(hero.title)}</span></span></h1><p class="random-number-hero__subtitle">${escapeHtml(hero.subtitle)}</p></section></div>`
}

function buildHomePrerenderContent(page, articlesIndex = []) {
  const copy = getPrerenderCopy(page.language)
  const localizedArticles = filterArticlesForLanguage(articlesIndex, page.language)
  const latestArticles = localizedArticles.slice(0, 3)
  const latestArticlesTitle = escapeHtml(getLocaleValue(page.language, 'home.latestArticlesTitle', page.language === 'en' ? 'Latest articles' : 'Последние статьи'))
  const latestArticlesAction = escapeHtml(getLocaleValue(page.language, 'home.latestArticlesAction', page.language === 'en' ? 'Open all articles' : 'Открыть все статьи'))
  const latestArticlesEyebrow = escapeHtml(getLocaleValue(page.language, 'home.latestArticlesEyebrow', page.language === 'en' ? 'Fresh reads' : 'Свежие материалы'))
  const latestArticlesDescription = escapeHtml(getLocaleValue(page.language, 'home.latestArticlesDescription', page.language === 'en' ? 'Browse the latest guides and practical notes from the editorial hub.' : 'Свежие руководства и практические материалы из editorial-раздела сайта.'))
  const latestArticlesMarkup = (page.isPrerenderHomePage && latestArticles.length)
    ? `<section class="home-articles" aria-labelledby="home-articles-heading"><div class="home-articles__header"><div><span class="home-articles__eyebrow">${latestArticlesEyebrow}</span><h2 id="home-articles-heading">${latestArticlesTitle}</h2><p>${latestArticlesDescription}</p></div><a href="/${page.language}/articles" class="home-articles__link">${latestArticlesAction}</a></div><div class="home-articles__grid">${latestArticles.map((article) => `<article class="home-article-card">${article.publishedAt ? `<div class="home-article-card__meta"><span>${escapeHtml(formatPublishedDate(article.publishedAt, page.language))}</span></div>` : ''}<h3><a href="/${page.language}/articles/${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h3>${article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : ''}</article>`).join('')}</div></section>`
    : ''
  const initialDataScript = latestArticles.length
    ? `<script id="__ARTICLES_INDEX_DATA__" type="application/json">${safeJsonForInlineScript({ items: localizedArticles, generatedAt: new Date().toISOString() })}</script>`
    : ''

  const categoryOrder = ['generators', 'calculators', 'converters', 'tools']
  const homeRouteEntries = ROUTE_REGISTRY.filter((entry) => entry.showOnHome)

  const categoryIconMap = {
    generators: getIconSvg('lightbulb'),
    calculators: getIconSvg('calculate'),
    converters: getIconSvg('refresh'),
    tools: getIconSvg('construction'),
  }

  const trustBadges = page.isPrerenderHomePage
    ? `<div class="home-trust"><span class="home-trust-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>${escapeHtml(getLocaleValue(page.language, 'home.trustFree', 'Free'))}</span><span class="home-trust-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>${escapeHtml(getLocaleValue(page.language, 'home.trustNoRegister', 'No registration'))}</span><span class="home-trust-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>${escapeHtml(getLocaleValue(page.language, 'home.trustFastResult', 'Instant result'))}</span></div>`
    : ''

  const categoriesMarkup = categoryOrder.map((categorySlug) => {
    const categoryTools = homeRouteEntries.filter((entry) => entry.categorySlug === categorySlug)
    if (!categoryTools || categoryTools.length === 0) return ''

    const categoryLabel = escapeHtml(getLocaleValue(page.language, `categories.${categorySlug}`, categorySlug))
    const categoryIcon = categoryIconMap[categorySlug] || ''
    const toolsMarkup = categoryTools.map((entry) => {
      const title = escapeHtml(getLocaleValue(page.language, entry.titleKey, entry.titleKey))
      const description = escapeHtml(getLocaleValue(page.language, entry.descriptionKey, entry.descriptionKey))
      const iconSvg = getIconSvg(entry.icon)
      return `<a href="/${page.language}${entry.path}" class="tool-card">${iconSvg}<h3>${title}</h3><p>${description}</p></a>`
    }).join('')

    return `<div class="category-section"><h2 class="category-title">${categoryIcon}${categoryLabel}</h2><div class="tools-grid">${toolsMarkup}</div></div>`
  }).join('')

  const toolsGridMarkup = homeRouteEntries.length > 0
    ? `<div class="categories-grid">${categoriesMarkup}</div>`
    : ''

  return `<div class="home"><div class="container"><section class="home-hero" aria-labelledby="home-heading"><h1 id="home-heading">${escapeHtml(page.h1)}</h1><p>${escapeHtml(copy.subtitle)}</p>${trustBadges}</section>${toolsGridMarkup}${latestArticlesMarkup}${initialDataScript}</div></div>`
}

function buildQRCodeGeneratorPrerenderContent(page) {
  const hero = getToolHeroContent(page)
  const heroClasses = ['tool-page-hero', 'is-centered']
  if (hero.eyebrow) heroClasses.push('has-eyebrow')
  if (hero.subtitle) heroClasses.push('has-subtitle')
  if (hero.note) heroClasses.push('has-note')

  return `<div class="tool-container tool-page-shell qr-code-generator-page"><section class="${heroClasses.join(' ')}">${hero.eyebrow ? `<div class="tool-page-hero__eyebrow">${escapeHtml(hero.eyebrow)}</div>` : ''}<h1 class="tool-page-hero__title">${escapeHtml(hero.title)}</h1>${hero.subtitle ? `<p class="tool-page-hero__subtitle">${escapeHtml(hero.subtitle)}</p>` : ''}${hero.note ? `<p class="tool-page-hero__note">${escapeHtml(hero.note)}</p>` : ''}</section><div class="qr-generator-shell"><div class="qr-type-selector-skeleton"><div class="qr-type-skeleton-item"></div><div class="qr-type-skeleton-item"></div><div class="qr-type-skeleton-item"></div></div><div class="qr-preview-shell-skeleton"><div class="qr-preview-skeleton-inner"></div></div></div></div>`
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
  const localizedArticles = filterArticlesForLanguage(articles, page.language)
  const cards = localizedArticles.map((article) => {
    const href = `/${page.language}/articles/${encodeURIComponent(article.slug)}`
    const media = article.coverImage
      ? `<a href="${href}" class="article-card__media" aria-label="${escapeHtml(article.title)}"><img src="${escapeHtml(article.coverImage)}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async" /></a>`
      : ''
    const excerpt = article.excerpt ? `<p class="article-card__excerpt">${escapeHtml(article.excerpt)}</p>` : ''
    const readMore = escapeHtml(getLocaleValue(page.language, 'articles.readMore', page.language === 'en' ? 'Open article' : 'Открыть статью'))

    return `<article class="article-card">${media}<h2 class="article-card__title"><a class="article-card__link" href="${href}">${escapeHtml(article.title)}</a></h2>${excerpt}<div class="article-card__actions"><a class="article-card__read-more" href="${href}">${readMore}</a></div></article>`
  }).join('')

  const skeletonCard = `<article class="article-card article-card--skeleton"><div class="article-skeleton__media"></div><div class="article-skeleton__meta"></div><div class="article-skeleton__title"></div><div class="article-skeleton__excerpt"></div></article>`
  const fallbackSkeleton = Array.from({ length: 6 }).map(() => skeletonCard).join('')

  const list = `<section class="articles-grid" aria-label="${ariaLabel}">${cards || fallbackSkeleton}</section>`

  const initialDataScript = `<script id="__ARTICLES_INDEX_DATA__" type="application/json">${safeJsonForInlineScript({ items: localizedArticles, generatedAt: new Date().toISOString() })}</script>`

  return `<div class="tool-container tool-page-shell articles-page"><section class="${heroClasses.join(' ')}">${hero.eyebrow ? `<div class="tool-page-hero__eyebrow">${escapeHtml(hero.eyebrow)}</div>` : ''}<h1 class="tool-page-hero__title">${escapeHtml(hero.title)}</h1>${hero.subtitle ? `<p class="tool-page-hero__subtitle">${escapeHtml(hero.subtitle)}</p>` : ''}${hero.note ? `<p class="tool-page-hero__note">${escapeHtml(hero.note)}</p>` : ''}</section>${list}${initialDataScript}</div>`
}

function buildArticleDetailPrerenderContent(page, article, articlesIndex = []) {
  const detailEyebrow = escapeHtml(getLocaleValue(page.language, 'articles.detailEyebrow', page.language === 'en' ? 'Article' : 'Статья'))
  const backLabel = escapeHtml(getLocaleValue(page.language, 'articles.backToList', page.language === 'en' ? 'Back to articles' : 'Вернуться к списку статей'))
  const media = article.coverImage
    ? `<div class="article-cover"><img src="${escapeHtml(article.coverImage)}" alt="${escapeHtml(article.title)}" loading="eager" decoding="async" /></div>`
    : ''
  const excerpt = article.excerpt ? `<p class="article-header-card__excerpt">${escapeHtml(article.excerpt)}</p>` : ''
  const initialDataScript = `<script id="__ARTICLE_DETAIL_DATA__" type="application/json">${safeJsonForInlineScript(article)}</script>`
  const indexDataScript = articlesIndex.length
    ? `<script id="__ARTICLES_INDEX_DATA__" type="application/json">${safeJsonForInlineScript({ items: articlesIndex, generatedAt: new Date().toISOString() })}</script>`
    : ''

  return `<div class="tool-container tool-page-shell articles-page article-page"><article class="article-layout"><header class="article-header-card"><div class="article-header-card__eyebrow">${detailEyebrow}</div>${media}<h1>${escapeHtml(article.title)}</h1>${excerpt}<a href="/${page.language}/articles" class="article-back-link">${backLabel}</a></header></article>${initialDataScript}${indexDataScript}</div>`
}

function buildLegacyToolPrerenderContent(page) {
  return `<div class="tool-container"><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.description)}</p></div>`
}

function buildStructuredData({ language, title, description, url, structuredData }) {
  if (structuredData) {
    return JSON.stringify(structuredData)
  }

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

function buildAlternateLinks(pathName, availableLanguages = ['ru', 'en']) {
  const links = []
  if (availableLanguages.includes('ru')) {
    links.push(`<link rel="alternate" hreflang="ru" href="${getLocalizedRouteUrl('ru', pathName)}" />`)
  }
  if (availableLanguages.includes('en')) {
    links.push(`<link rel="alternate" hreflang="en" href="${getLocalizedRouteUrl('en', pathName)}" />`)
  }
  if (links.length > 1) {
    links.push(`<link rel="alternate" hreflang="x-default" href="${getLocalizedRouteUrl('ru', pathName)}" />`)
  }
  return links.join('\n    ')
}

function buildSeoTags(page) {
  const availableLangs = page.availableLanguages || ['ru', 'en']
  const alternateLinks = buildAlternateLinks(page.path, availableLangs)

  return `
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="keywords" content="${escapeHtml(page.keywords)}" />
    <link rel="canonical" href="${page.url}" />
    ${alternateLinks}
    <meta property="og:site_name" content="QSEN.RU" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${page.url}" />
    <meta property="og:type" content="${page.ogType || 'website'}" />
    <meta property="og:image" content="${page.image}" />
    <meta property="og:image:alt" content="${escapeHtml(page.title)}" />
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

function buildArticleDetailPage(language, article, availableLanguages) {
  const articlePath = `/articles/${article.slug}`

  return {
    language,
    path: articlePath,
    route: language === 'en' ? `/en${articlePath}` : `/ru${articlePath}`,
    url: getLocalizedRouteUrl(language, articlePath),
    locale: language === 'en' ? 'en_US' : 'ru_RU',
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt || getLocaleValue(language, 'articles.subtitle', ''),
    keywords: getLocaleValue(language, 'seo.articles.keywords', ''),
    h1: article.title,
    image: article.coverImage || 'https://qsen.ru/og-image.png',
    ogType: 'article',
    availableLanguages,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.seoDescription || article.excerpt || getLocaleValue(language, 'articles.subtitle', ''),
      author: article.author ? { '@type': 'Person', name: article.author } : undefined,
      datePublished: article.publishedAt || undefined,
      image: article.coverImage ? [article.coverImage] : undefined,
      mainEntityOfPage: getLocalizedRouteUrl(language, articlePath),
      url: getLocalizedRouteUrl(language, articlePath),
      publisher: {
        '@type': 'Organization',
        name: 'QSEN.RU',
        url: 'https://qsen.ru',
      },
    },
    robots: 'index,follow',
    includeInSitemap: true,
    datePublished: article.publishedAt || undefined,
  }
}

const STALE_META_PATTERNS = [
  /<meta name="description" content=".*?" \/>\s*/g,
  /<meta name="keywords" content=".*?" \/>\s*/g,
  /<link rel="canonical" href=".*?" \/>\s*/g,
  /<link rel="alternate" hreflang=".*?" href=".*?" \/>\s*/g,
  /<meta property="og:(site_name|title|description|url|type|image|image:width|image:height|locale)" content=".*?" \/>\s*/g,
  /<meta name="twitter:(card|title|description|image)" content=".*?" \/>\s*/g,
  /<meta name="robots" content=".*?" \/>\s*/g,
  /<meta name="googlebot" content=".*?" \/>\s*/g,
  /<meta name="yandex" content=".*?" \/>\s*/g,
]

function stripStaleMeta(html) {
  return STALE_META_PATTERNS.reduce((result, pattern) => result.replace(pattern, ''), html)
}

function injectSeo(template, page, { articlesIndex = [], customPrerenderContent = null, customSkipHydration = null } = {}) {
  const seoTags = buildSeoTags(page)
  const structuredData = buildStructuredData(page)

  let html = template
    .replace(/<html lang="[^"]*">/, `<html lang="${page.language}">`)
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)

  html = stripStaleMeta(html)

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
  const isQRCodeGeneratorPage = page.path === '/qr-code-generator'
  const usesToolPageShell = TOOL_PAGE_SHELL_PATHS.has(page.path)
  const shouldSkipHydration = CLIENT_RENDER_TOOL_PATHS.has(page.path)

  const prerenderContent = customPrerenderContent || (page.path === '/articles'
    ? buildArticlesIndexPrerenderContent(page, articlesIndex)
    : isQRCodeGeneratorPage
      ? buildQRCodeGeneratorPrerenderContent(page)
      : usesToolPageShell
        ? buildToolPageShellPrerenderContent(page)
        : buildLegacyToolPrerenderContent(page))
  const skipHydration = customSkipHydration ?? shouldSkipHydration

  const prerenderRoot = isHomePage
    ? buildAppPrerenderRoot(page, buildHomePrerenderContent({ ...page, isPrerenderHomePage: true }, articlesIndex), { isHomePage: true, skipHydration: true })
    : isRandomNumberPage
      ? buildAppPrerenderRoot(page, buildRandomNumberPrerenderContent(page))
      : buildAppPrerenderRoot(page, prerenderContent, { skipHydration })

  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, prerenderRoot)

  return html
}

function writeFileSafely(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

function writePage(route, content) {
  const outputPath = path.join(distPath, route, 'index.html')
  writeFileSafely(outputPath, content)
  console.log(`✓ Generated: ${route}`)
}

function generatePage(template, page, { injectOptions = {} } = {}) {
  const outputPath = path.join(distPath, page.route, 'index.html')
  writeFileSafely(outputPath, injectSeo(template, page, injectOptions))
  console.log(`✓ Generated: ${page.route}`)
}

function buildRootRedirectPage(template) {
  let html = template
    .replace(/<html lang="[^"]*">/, '<html lang="ru">')
    .replace(/<title>.*?<\/title>/, '<title>Redirecting to QSEN.RU</title>')

  html = stripStaleMeta(html)
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')

  const redirectMeta = `
    <link rel="canonical" href="${ROOT_REDIRECT_URL}" />
    <script>window.location.replace('${ROOT_REDIRECT_URL}' + window.location.search + window.location.hash)</script>
  `.trim()

  html = replaceOrInsert(html, /<meta name="description" content=".*?" \/>/, redirectMeta, /<link rel="icon"/)
  html = html.replace(/<div id="root"><\/div>/, '<div id="root"><noscript><meta http-equiv="refresh" content="0; url=' + ROOT_REDIRECT_URL + '" /></noscript></div>')

  return html
}

function buildSitemap(pages) {
  const filteredPages = pages.filter((page) => page.includeInSitemap !== false)

  // For article detail pages, build a map of slug -> available languages
  // so we only generate hreflang for languages that actually exist
  const articleSlugLanguages = {}
  filteredPages
    .filter((page) => page.ogType === 'article')
    .forEach((page) => {
      const slug = page.path.replace('/articles/', '')
      if (!articleSlugLanguages[slug]) {
        articleSlugLanguages[slug] = []
      }
      articleSlugLanguages[slug].push(page.language)
    })

  const items = filteredPages.map((page) => {
    const cleanPath = page.path
    const ruUrl = getLocalizedRouteUrl('ru', cleanPath)
    const enUrl = getLocalizedRouteUrl('en', cleanPath)
    const isArticle = page.ogType === 'article'
    const slug = isArticle ? cleanPath.replace('/articles/', '') : null
    const availableLangs = slug ? (articleSlugLanguages[slug] || []) : ['ru', 'en']

    const alternateLinks = []
    if (availableLangs.includes('ru')) {
      alternateLinks.push(`    <xhtml:link rel="alternate" hreflang="ru" href="${ruUrl}" />`)
    }
    if (availableLangs.includes('en')) {
      alternateLinks.push(`    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`)
    }
    if (availableLangs.length > 1) {
      alternateLinks.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${ruUrl}" />`)
    }

    const lastmod = page.datePublished
      ? new Date(page.datePublished).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)

    return `  <url>
    <loc>${page.url}</loc>
${alternateLinks.join('\n')}
    <lastmod>${lastmod}</lastmod>
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
    .then(async (articlesIndex) => {
      const articleDetails = await fetchArticleDetails(articlesIndex)

      const articlePages = []

      pages.forEach((page) => {
        const injectOptions = page.path === '/articles' || page.path === '/' ? { articlesIndex } : {}
        generatePage(template, page, { injectOptions })
      })

      articleDetails.forEach((article) => {
        const availableLanguages = (['ru', 'en']).filter((lang) => articleMatchesLanguage(article, lang))
        ;['ru', 'en'].forEach((language) => {
          if (!articleMatchesLanguage(article, language)) {
            return
          }

          const page = buildArticleDetailPage(language, article, availableLanguages)
          articlePages.push(page)
          const localizedArticlesIndex = filterArticlesForLanguage(articlesIndex, language)
          const html = injectSeo(template, page, {
            customPrerenderContent: buildArticleDetailPrerenderContent(page, article, localizedArticlesIndex),
            customSkipHydration: true,
          })

          writePage(page.route, html)
        })
      })

      writeFileSafely(path.join(distPath, 'index.html'), buildRootRedirectPage(template))

      const sitemap = buildSitemap([...pages, ...articlePages])
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
