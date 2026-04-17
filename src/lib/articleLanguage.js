function sanitizeArticleText(value) {
  return String(value || '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/[`*_#>-]/g, ' ')
}

function countMatches(value, pattern) {
  const matches = value.match(pattern)
  return matches ? matches.length : 0
}

export function detectArticleLanguage(article = {}) {
  if (!article || typeof article !== 'object') {
    return 'ru'
  }

  if (article.language === 'ru' || article.language === 'en') {
    return article.language
  }

  const primaryText = sanitizeArticleText([
    article.title,
    article.excerpt,
    article.seoTitle,
    article.seo_title,
    article.seoDescription,
    article.seo_description,
  ].join(' '))

  const fallbackText = sanitizeArticleText(article.content)
  const text = primaryText.trim() || fallbackText

  const cyrillicCount = countMatches(text, /[А-Яа-яЁё]/g)
  const latinCount = countMatches(text, /[A-Za-z]/g)

  if (cyrillicCount === 0 && latinCount === 0) {
    return 'ru'
  }

  return cyrillicCount > latinCount ? 'ru' : 'en'
}

export function articleMatchesLanguage(article, language) {
  if (language !== 'ru' && language !== 'en') {
    return true
  }

  if (['ru', 'en'].includes(article?.language)) {
    return article.language === language
  }

  return detectArticleLanguage(article) === language
}

export function filterArticlesForLanguage(items = [], language) {
  return items.filter((item) => item && articleMatchesLanguage(item, language))
}
