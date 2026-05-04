import { articleMatchesLanguage, filterArticlesForLanguage } from '../utils/articleLanguage.js'
import { normalizeArticleListItem as sharedNormalizeListItem, normalizeArticle as sharedNormalizeArticle } from '../utils/articleNormalization.js'

const ARTICLES_API_BASE_URL = 'https://fancy-scene-deeb.qten.workers.dev'
const ARTICLES_REQUEST_TIMEOUT_MS = 12000
const ARTICLES_INDEX_CACHE_KEY = 'qsen:articles:index:v5'
const ARTICLE_DETAIL_CACHE_PREFIX = 'qsen:articles:detail:'
const ARTICLES_CACHE_TTL_MS = 10 * 60 * 1000
const ARTICLES_PAGE_SIZE = 50

function buildApiUrl(pathname) {
  return `${ARTICLES_API_BASE_URL}${pathname}`
}

async function readApiResponse(response) {
  const text = await response.text()

  if (!text.trim()) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    const error = new Error('Invalid JSON response')
    error.code = 'INVALID_JSON'
    error.status = response.status
    throw error
  }
}

async function requestJson(pathname) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), ARTICLES_REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(buildApiUrl(pathname), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    const data = await readApiResponse(response)

    if (!response.ok || (data && typeof data.error === 'string')) {
      const message = data?.error || `Request failed with status ${response.status}`
      const isAIServiceError = message.includes('model does not support') || message.includes('AI') || message.includes('image input')
      const error = new Error(isAIServiceError ? 'Service temporarily unavailable. Please try again.' : message)
      error.status = response.status
      error.payload = data
      throw error
    }

    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error('Request timed out. Please try again.')
      error.status = 504
      throw error
    }
    throw err
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function readInlineJsonPayload(scriptId) {
  if (typeof window === 'undefined') {
    return null
  }

  // First try the captured prerender data (most reliable during hydration)
  const globalPayload = window.__QSEN_PRERENDER_DATA__?.[scriptId]
  if (typeof globalPayload === 'string' && globalPayload.trim()) {
    try {
      return JSON.parse(globalPayload)
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: try to find script directly in document
  const element = document.getElementById(scriptId)
  if (!element || element.tagName !== 'SCRIPT') {
    return null
  }
  if (element && element.tagName === 'SCRIPT' && element.textContent) {
    try {
      return JSON.parse(element.textContent)
    } catch {
      return null
    }
  }

  return null
}

function readSessionCache(cacheKey) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(cacheKey)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (typeof parsed?.ts !== 'number' || Date.now() - parsed.ts > ARTICLES_CACHE_TTL_MS) {
      return null
    }

    return parsed.value ?? null
  } catch {
    return null
  }
}

function writeSessionCache(cacheKey, value) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), value }))
  } catch {
    // ignore cache write failures
  }
}

export function readInitialArticlesIndex(language) {
  const payload = readInlineJsonPayload('__ARTICLES_INDEX_DATA__')
  if (!Array.isArray(payload?.items)) {
    return []
  }

  const items = payload.items.filter((item) => item && typeof item === 'object')
  const hasExplicitLanguage = items.some(
    (item) => item.language === 'ru' || item.language === 'en',
  )

  if (hasExplicitLanguage) {
    return items.filter((item) => item.language === language)
  }

  return items
}

export function readCachedArticlesIndex() {
  const cachedValue = readSessionCache(ARTICLES_INDEX_CACHE_KEY)
  return Array.isArray(cachedValue) ? cachedValue : []
}

export function writeCachedArticlesIndex(items) {
  writeSessionCache(ARTICLES_INDEX_CACHE_KEY, items)
}

export function readInitialArticleDetail(slug, language) {
  const payload = readInlineJsonPayload('__ARTICLE_DETAIL_DATA__')
  if (!payload || payload.slug !== slug) {
    return null
  }

  const article = sharedNormalizeArticle(payload)
  return articleMatchesLanguage(article, language) ? article : null
}

export function readCachedArticleDetail(slug, language) {
  const cachedValue = readSessionCache(`${ARTICLE_DETAIL_CACHE_PREFIX}${slug}`)
  if (!cachedValue || cachedValue.slug !== slug) {
    return null
  }

  const article = sharedNormalizeArticle(cachedValue)
  return articleMatchesLanguage(article, language) ? article : null
}

export function writeCachedArticleDetail(article) {
  if (!article?.slug) {
    return
  }

  writeSessionCache(`${ARTICLE_DETAIL_CACHE_PREFIX}${article.slug}`, article)
}

export async function fetchArticles(language) {
  const allItems = []
  let offset = 0
  let total = null

  while (total === null || offset < total) {
    const data = await requestJson(`/articles?limit=${ARTICLES_PAGE_SIZE}&offset=${offset}`)
    if (data === null || data === undefined) {
      const error = new Error('Failed to load articles — empty response')
      error.status = 502
      throw error
    }

    if (Array.isArray(data)) {
      return data.map(sharedNormalizeListItem)
    }

    const pageItems = Array.isArray(data?.articles)
      ? data.articles.map(sharedNormalizeListItem)
      : []

    allItems.push(...pageItems)

    total = Number.isFinite(Number(data?.total)) ? Number(data.total) : allItems.length
    if (pageItems.length === 0 || pageItems.length < ARTICLES_PAGE_SIZE) {
      break
    }
    offset += pageItems.length
  }

  return allItems
}

export async function fetchArticleBySlug(slug, language) {
  const data = await requestJson(`/articles/${encodeURIComponent(slug)}`)
  if (!data || typeof data !== 'object') {
    const error = new Error('Invalid article response')
    error.status = 502
    throw error
  }

  const article = sharedNormalizeArticle(data)

  if (!articleMatchesLanguage(article, language)) {
    const error = new Error('Article not found')
    error.status = 404
    throw error
  }

  return article
}

export function getArticlePublicUrl(slug) {
  return buildApiUrl(`/articles/${encodeURIComponent(slug)}`)
}
