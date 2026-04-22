export function normalizeArticleBase(item = {}) {
  return {
    id: item.id,
    slug: item.slug || '',
    language: item.language === 'ru' || item.language === 'en'
      ? item.language
      : (item.lang === 'ru' || item.lang === 'en' ? item.lang : ''),
    translationKey: item.translation_key || item.translationKey || '',
    title: item.title || '',
    excerpt: item.excerpt || '',
    author: item.author || '',
    coverImage: item.cover_image || null,
    publishedAt: item.published_at || '',
    updatedAt: item.updated_at || item.updatedAt || '',
    toolSlug: item.tool_slug || null,
  }
}

export function normalizeArticleListItem(item = {}) {
  return {
    ...normalizeArticleBase(item),
    seoTitle: item.seo_title || item.seoTitle || '',
    seoDescription: item.seo_description || item.seoDescription || '',
  }
}

export function normalizeArticle(item = {}) {
  return {
    ...normalizeArticleListItem(item),
    content: item.content || '',
    status: item.status || 'published',
  }
}

export function normalizeArticleIndexItem(item = {}) {
  return normalizeArticleListItem(item)
}

export function normalizeArticleDetailItem(item = {}) {
  return {
    ...normalizeArticleListItem(item),
    content: item.content || '',
    status: item.status || 'published',
    seoTitle: item.seo_title || item.seoTitle || '',
    seoDescription: item.seo_description || item.seoDescription || '',
  }
}
