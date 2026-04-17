import { articleMatchesLanguage, filterArticlesForLanguage } from './articleLanguage'

const ARTICLES_API_BASE_URL = 'https://fancy-scene-deeb.qten.workers.dev'
const ARTICLES_REQUEST_TIMEOUT_MS = 12000
const ARTICLES_INDEX_CACHE_KEY = 'qsen:articles:index:v4'
const ARTICLE_DETAIL_CACHE_PREFIX = 'qsen:articles:detail:'
const ARTICLES_CACHE_TTL_MS = 10 * 60 * 1000

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

  try {
    const response = await fetch(buildApiUrl(pathname), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    const data = await readApiResponse(response)

    if (!response.ok) {
      const error = new Error(data?.error || `Request failed with status ${response.status}`)
      error.status = response.status
      error.payload = data
      throw error
    }

    return data
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function normalizeArticleListItem(item = {}) {
  return {
    id: item.id,
    slug: item.slug || '',
    language: item.language === 'ru' || item.language === 'en' ? item.language : (item.lang === 'ru' || item.lang === 'en' ? item.lang : ''),
    translationKey: item.translation_key || item.translationKey || '',
    title: item.title || '',
    excerpt: item.excerpt || '',
    author: item.author || '',
    coverImage: item.cover_image || null,
    publishedAt: item.published_at || '',
    seoTitle: item.seo_title || '',
    seoDescription: item.seo_description || '',
    toolSlug: item.tool_slug || null,
  }
}

function normalizeArticle(item = {}) {
  return {
    ...normalizeArticleListItem(item),
    content: item.content || '',
    status: item.status || 'published',
  }
}

function readInlineJsonPayload(scriptId) {
  if (typeof window === 'undefined') {
    return null
  }

  // DEBUG: Log what we're trying to read
  const hasStoredData = scriptId in (window.__QSEN_PRERENDER_DATA__ || {})
  const storedData = window.__QSEN_PRERENDER_DATA__?.[scriptId]

  // First try the captured prerender data (most reliable during hydration)
  const globalPayload = window.__QSEN_PRERENDER_DATA__?.[scriptId]
  if (typeof globalPayload === 'string' && globalPayload.trim()) {
    try {
      const result = JSON.parse(globalPayload)
      console.log('[ARTICLES API DEBUG] readInlineJsonPayload(' + scriptId + ') from __QSEN_PRERENDER_DATA__, items:', result?.items?.length, 'hasStoredData:', hasStoredData, 'storedLen:', storedData?.length)
      return result
    } catch {
      console.log('[ARTICLES API DEBUG] readInlineJsonPayload(' + scriptId + ') parse error from __QSEN_PRERENDER_DATA__, fallback to DOM')
      // Fall through to fallback
    }
  }

  // Fallback: try to find script directly in document
  // Use querySelector as additional fallback (handles edge cases with getElementById)
  let element = document.getElementById(scriptId)
  if (!element || element.tagName !== 'SCRIPT') {
    // Try querySelector as well
    element = document.querySelector(`script[id="${scriptId}"]`)
  }
  if (element && element.tagName === 'SCRIPT' && element.textContent) {
    try {
      const result = JSON.parse(element.textContent)
      console.log('[ARTICLES API DEBUG] readInlineJsonPayload(' + scriptId + ') from DOM, items:', result?.items?.length)
      return result
    } catch {
      console.log('[ARTICLES API DEBUG] readInlineJsonPayload(' + scriptId + ') parse error from DOM')
      return null
    }
  }

  console.log('[ARTICLES API DEBUG] readInlineJsonPayload(' + scriptId + ') NOT FOUND in __QSEN_PRERENDER_DATA__ or DOM, hasStoredData:', hasStoredData)
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
  const items = Array.isArray(payload?.items) ? payload.items.map(normalizeArticleListItem) : []

  console.log('[ARTICLES API DEBUG] readInitialArticlesIndex(language=' + language + ') total items:', items.length)

  if (language === 'ru' || language === 'en') {
    const hasExplicitLanguage = items.some((item) => item && (item.language === 'ru' || item.language === 'en'))
    if (hasExplicitLanguage) {
      const filtered = items.filter((item) => item && item.language === language)
      console.log('[ARTICLES API DEBUG] readInitialArticlesIndex filtered by language, result:', filtered.length)
      return filtered
    }
  }

  console.log('[ARTICLES API DEBUG] readInitialArticlesIndex returning all items:', items.length)
  return items
}

export function readCachedArticlesIndex(language) {
  const cachedValue = readSessionCache(ARTICLES_INDEX_CACHE_KEY)
  const items = Array.isArray(cachedValue) ? cachedValue.map(normalizeArticleListItem) : []
  return items
}

export function writeCachedArticlesIndex(items) {
  writeSessionCache(ARTICLES_INDEX_CACHE_KEY, items)
}

export function readInitialArticleDetail(slug, language) {
  const payload = readInlineJsonPayload('__ARTICLE_DETAIL_DATA__')
  if (!payload || payload.slug !== slug) {
    return null
  }

  const article = normalizeArticle(payload)
  return articleMatchesLanguage(article, language) ? article : null
}

export function readCachedArticleDetail(slug, language) {
  const cachedValue = readSessionCache(`${ARTICLE_DETAIL_CACHE_PREFIX}${slug}`)
  if (!cachedValue || cachedValue.slug !== slug) {
    return null
  }

  const article = normalizeArticle(cachedValue)
  return articleMatchesLanguage(article, language) ? article : null
}

export function writeCachedArticleDetail(article) {
  if (!article?.slug) {
    return
  }

  writeSessionCache(`${ARTICLE_DETAIL_CACHE_PREFIX}${article.slug}`, article)
}

export async function fetchArticles(language) {
  const data = await requestJson('/articles')
  const items = Array.isArray(data) ? data.map(normalizeArticleListItem) : []
  return items
}

export async function fetchArticleBySlug(slug, language) {
  const data = await requestJson(`/articles/${encodeURIComponent(slug)}`)
  const article = normalizeArticle(data)

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
