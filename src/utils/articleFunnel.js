import { ROUTE_REGISTRY } from '../config/routeRegistry.js'
import { getLocalizedRoutePath } from '../config/routeSeo.js'
import { articleMatchesLanguage } from './articleLanguage.js'

const ARTICLE_TOOL_CTA_COPY = {
  ru: {
    title: 'Попробуйте инструмент',
    text: 'Эта статья связана с инструментом QSEN. Откройте его, чтобы сразу применить расчёт или шаблон на практике.',
    button: 'Открыть инструмент',
    buttonPrefix: 'Открыть',
  },
  en: {
    title: 'Try the tool',
    text: 'This article is connected to a QSEN tool. Open it to apply the calculation, template, or workflow right away.',
    button: 'Open tool',
    buttonPrefix: 'Open',
  },
}

const ARTICLE_RELATED_COPY = {
  ru: {
    title: 'Ещё по теме',
  },
  en: {
    title: 'Related articles',
  },
}

function getArticleSlug(article = {}) {
  return article.slug || article.article_slug || ''
}

function getArticleToolSlug(article = {}) {
  return article.toolSlug || article.tool_slug || ''
}

function lowerFirst(value, language) {
  if (!value) return ''

  const locale = language === 'en' ? 'en-US' : 'ru-RU'
  return `${value.charAt(0).toLocaleLowerCase(locale)}${value.slice(1)}`
}

function getArticleTimestamp(article = {}) {
  const value = article.publishedAt || article.published_at || article.updatedAt || article.updated_at || ''
  if (!value) return null

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function normalizeArticleToolPath(toolSlug) {
  if (!toolSlug || typeof toolSlug !== 'string') {
    return ''
  }

  const cleanSlug = toolSlug.trim().replace(/^\/+|\/+$/g, '')
  if (!cleanSlug || cleanSlug.includes('://')) {
    return ''
  }

  return `/${cleanSlug}`
}

export function getArticleToolRouteEntry(articleOrSlug) {
  const toolSlug = typeof articleOrSlug === 'string'
    ? articleOrSlug
    : getArticleToolSlug(articleOrSlug)
  const toolPath = normalizeArticleToolPath(toolSlug)

  if (!toolPath) {
    return null
  }

  return ROUTE_REGISTRY.find((entry) => entry.path === toolPath) || null
}

export function getArticleToolCta(article, language = 'ru', translate = null) {
  const entry = getArticleToolRouteEntry(article)
  if (!entry) {
    return null
  }

  const copy = ARTICLE_TOOL_CTA_COPY[language] || ARTICLE_TOOL_CTA_COPY.ru
  const translatedTitle = typeof translate === 'function' ? translate(entry.titleKey) : ''
  const toolTitle = translatedTitle && translatedTitle !== entry.titleKey ? translatedTitle : ''
  const buttonLabel = toolTitle
    ? language === 'en'
      ? `${copy.buttonPrefix} ${toolTitle}`
      : `${copy.buttonPrefix} ${lowerFirst(toolTitle, language)}`
    : copy.button

  return {
    title: copy.title,
    text: copy.text,
    buttonLabel,
    href: getLocalizedRoutePath(language, entry.path),
    toolPath: entry.path,
    toolSlug: entry.path.replace(/^\//, ''),
    toolTitle,
    routeKey: entry.key,
  }
}

export function getArticleRelatedCopy(language = 'ru') {
  return ARTICLE_RELATED_COPY[language] || ARTICLE_RELATED_COPY.ru
}

export function getRelatedArticlesForTool(article, articlesIndex = [], language = 'ru', { limit = 4 } = {}) {
  const currentSlug = getArticleSlug(article)
  const toolEntry = getArticleToolRouteEntry(article)

  if (!currentSlug || !toolEntry || !Array.isArray(articlesIndex)) {
    return []
  }

  return articlesIndex
    .map((item, index) => ({ item, index, timestamp: getArticleTimestamp(item) }))
    .filter(({ item }) => {
      if (!item || getArticleSlug(item) === currentSlug || !articleMatchesLanguage(item, language)) {
        return false
      }

      const relatedToolEntry = getArticleToolRouteEntry(item)
      return relatedToolEntry?.path === toolEntry.path
    })
    .sort((a, b) => {
      const aHasDate = Number.isFinite(a.timestamp)
      const bHasDate = Number.isFinite(b.timestamp)

      if (aHasDate && bHasDate && a.timestamp !== b.timestamp) {
        return b.timestamp - a.timestamp
      }

      if (aHasDate !== bHasDate) {
        return aHasDate ? -1 : 1
      }

      return a.index - b.index
    })
    .slice(0, limit)
    .map(({ item }) => item)
}
