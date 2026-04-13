const ARTICLES_API_BASE_URL = 'https://fancy-scene-deeb.qten.workers.dev'
const ARTICLES_REQUEST_TIMEOUT_MS = 12000

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
    title: item.title || '',
    excerpt: item.excerpt || '',
    author: item.author || '',
    coverImage: item.cover_image || null,
    publishedAt: item.published_at || '',
    seoTitle: item.seo_title || '',
    seoDescription: item.seo_description || '',
  }
}

function normalizeArticle(item = {}) {
  return {
    ...normalizeArticleListItem(item),
    content: item.content || '',
    status: item.status || 'published',
  }
}

export async function fetchArticles() {
  const data = await requestJson('/articles')
  return Array.isArray(data) ? data.map(normalizeArticleListItem) : []
}

export async function fetchArticleBySlug(slug) {
  const data = await requestJson(`/articles/${encodeURIComponent(slug)}`)
  return normalizeArticle(data)
}

export function getArticlePublicUrl(slug) {
  return buildApiUrl(`/articles/${encodeURIComponent(slug)}`)
}
