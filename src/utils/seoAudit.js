export async function analyzeSEO(url) {
  try {
    // Validate URL
    const urlObj = new URL(url)
    if (!urlObj.protocol.startsWith('http')) {
      return { error: 'URL должен начинаться с http:// или https://' }
    }

    // Fetch HTML (will fail due to CORS for most sites)
    const response = await fetch(url, { mode: 'cors' })
    const html = await response.text()

    // Parse HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    return analyzeDocument(doc, url)
  } catch (error) {
    // CORS error - provide instructions
    return {
      error: 'cors',
      message: 'Невозможно проанализировать сайт из-за ограничений CORS. Для анализа внешних сайтов используйте расширение браузера или серверный инструмент.',
      url: url
    }
  }
}

function analyzeDocument(doc, url) {
  const issues = []
  const suggestions = []
  let score = 100

  // 1. META TAGS
  const title = doc.querySelector('title')
  const metaDescription = doc.querySelector('meta[name="description"]')
  const metaKeywords = doc.querySelector('meta[name="keywords"]')

  if (!title || !title.textContent.trim()) {
    issues.push({ type: 'error', text: 'Отсутствует тег <title>' })
    suggestions.push('Добавьте уникальный заголовок страницы (50-60 символов)')
    score -= 15
  } else if (title.textContent.length < 30) {
    issues.push({ type: 'warning', text: 'Тег <title> слишком короткий' })
    suggestions.push('Увеличьте длину заголовка до 50-60 символов')
    score -= 5
  } else if (title.textContent.length > 70) {
    issues.push({ type: 'warning', text: 'Тег <title> слишком длинный' })
    suggestions.push('Сократите заголовок до 50-60 символов')
    score -= 5
  }

  if (!metaDescription || !metaDescription.content.trim()) {
    issues.push({ type: 'error', text: 'Отсутствует meta description' })
    suggestions.push('Добавьте описание страницы (150-160 символов)')
    score -= 15
  } else if (metaDescription.content.length < 120) {
    issues.push({ type: 'warning', text: 'Meta description слишком короткое' })
    suggestions.push('Увеличьте описание до 150-160 символов')
    score -= 5
  } else if (metaDescription.content.length > 170) {
    issues.push({ type: 'warning', text: 'Meta description слишком длинное' })
    suggestions.push('Сократите описание до 150-160 символов')
    score -= 5
  }

  // 2. HEADINGS
  const h1Tags = doc.querySelectorAll('h1')
  const h2Tags = doc.querySelectorAll('h2')
  const h3Tags = doc.querySelectorAll('h3')

  if (h1Tags.length === 0) {
    issues.push({ type: 'error', text: 'Отсутствует тег <h1>' })
    suggestions.push('Добавьте один главный заголовок H1 на страницу')
    score -= 15
  } else if (h1Tags.length > 1) {
    issues.push({ type: 'warning', text: `Найдено ${h1Tags.length} тегов <h1>` })
    suggestions.push('Используйте только один H1 на странице')
    score -= 10
  }

  if (h1Tags.length > 0 && h2Tags.length === 0) {
    issues.push({ type: 'info', text: 'Отсутствуют теги <h2>' })
    suggestions.push('Добавьте подзаголовки H2 для структурирования контента')
    score -= 5
  }

  // 3. IMAGES
  const images = doc.querySelectorAll('img')
  let imagesWithoutAlt = 0
  images.forEach(img => {
    if (!img.hasAttribute('alt') || !img.getAttribute('alt').trim()) {
      imagesWithoutAlt++
    }
  })

  if (imagesWithoutAlt > 0) {
    issues.push({ type: 'warning', text: `${imagesWithoutAlt} изображений без атрибута alt` })
    suggestions.push('Добавьте описательные alt-атрибуты ко всем изображениям')
    score -= Math.min(imagesWithoutAlt * 2, 15)
  }

  // 4. OPEN GRAPH
  const ogTitle = doc.querySelector('meta[property="og:title"]')
  const ogDescription = doc.querySelector('meta[property="og:description"]')
  const ogImage = doc.querySelector('meta[property="og:image"]')

  if (!ogTitle) {
    issues.push({ type: 'info', text: 'Отсутствует og:title' })
    suggestions.push('Добавьте Open Graph теги для соцсетей')
    score -= 5
  }

  if (!ogDescription) {
    issues.push({ type: 'info', text: 'Отсутствует og:description' })
    score -= 3
  }

  if (!ogImage) {
    issues.push({ type: 'info', text: 'Отсутствует og:image' })
    score -= 3
  }

  // 5. STRUCTURED DATA
  const structuredData = doc.querySelector('script[type="application/ld+json"]')
  if (!structuredData) {
    issues.push({ type: 'info', text: 'Отсутствуют структурированные данные (JSON-LD)' })
    suggestions.push('Добавьте Schema.org разметку для улучшения отображения в поиске')
    score -= 5
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score))

  return {
    score,
    issues,
    suggestions,
    details: {
      title: title?.textContent || null,
      description: metaDescription?.content || null,
      h1Count: h1Tags.length,
      h2Count: h2Tags.length,
      h3Count: h3Tags.length,
      imagesTotal: images.length,
      imagesWithoutAlt,
      hasOG: !!(ogTitle && ogDescription && ogImage),
      hasStructuredData: !!structuredData
    }
  }
}
