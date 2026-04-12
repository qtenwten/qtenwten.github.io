const seoAuditMessages = {
  ru: {
    invalidProtocol: 'URL должен начинаться с http:// или https://',
    cors: 'Невозможно проанализировать сайт из-за ограничений CORS. Для анализа внешних сайтов используйте расширение браузера или серверный инструмент.',
    missingTitle: 'Отсутствует тег <title>',
    addTitle: 'Добавьте уникальный заголовок страницы (50-60 символов)',
    shortTitle: 'Тег <title> слишком короткий',
    extendTitle: 'Увеличьте длину заголовка до 50-60 символов',
    longTitle: 'Тег <title> слишком длинный',
    reduceTitle: 'Сократите заголовок до 50-60 символов',
    missingDescription: 'Отсутствует meta description',
    addDescription: 'Добавьте описание страницы (150-160 символов)',
    shortDescription: 'Meta description слишком короткое',
    extendDescription: 'Увеличьте описание до 150-160 символов',
    longDescription: 'Meta description слишком длинное',
    reduceDescription: 'Сократите описание до 150-160 символов',
    missingH1: 'Отсутствует тег <h1>',
    addH1: 'Добавьте один главный заголовок H1 на страницу',
    manyH1: (count) => `Найдено ${count} тегов <h1>`,
    oneH1: 'Используйте только один H1 на странице',
    missingH2: 'Отсутствуют теги <h2>',
    addH2: 'Добавьте подзаголовки H2 для структурирования контента',
    imagesWithoutAlt: (count) => `${count} изображений без атрибута alt`,
    addAlt: 'Добавьте описательные alt-атрибуты ко всем изображениям',
    missingOgTitle: 'Отсутствует og:title',
    addOg: 'Добавьте Open Graph теги для соцсетей',
    missingOgDescription: 'Отсутствует og:description',
    missingOgImage: 'Отсутствует og:image',
    missingStructuredData: 'Отсутствуют структурированные данные (JSON-LD)',
    addStructuredData: 'Добавьте Schema.org разметку для улучшения отображения в поиске'
  },
  en: {
    invalidProtocol: 'URL must start with http:// or https://',
    cors: 'Unable to analyze this website because of CORS restrictions. Use a browser extension or the server-side audit tool for external websites.',
    missingTitle: 'Missing <title> tag',
    addTitle: 'Add a unique page title (50-60 characters)',
    shortTitle: '<title> tag is too short',
    extendTitle: 'Increase the title length to 50-60 characters',
    longTitle: '<title> tag is too long',
    reduceTitle: 'Shorten the title to 50-60 characters',
    missingDescription: 'Missing meta description',
    addDescription: 'Add a page description (150-160 characters)',
    shortDescription: 'Meta description is too short',
    extendDescription: 'Increase the description to 150-160 characters',
    longDescription: 'Meta description is too long',
    reduceDescription: 'Shorten the description to 150-160 characters',
    missingH1: 'Missing <h1> tag',
    addH1: 'Add one main H1 heading to the page',
    manyH1: (count) => `Found ${count} <h1> tags`,
    oneH1: 'Use only one H1 on the page',
    missingH2: 'Missing <h2> tags',
    addH2: 'Add H2 subheadings to structure the content',
    imagesWithoutAlt: (count) => `${count} images without alt attributes`,
    addAlt: 'Add descriptive alt attributes to all images',
    missingOgTitle: 'Missing og:title',
    addOg: 'Add Open Graph tags for social sharing',
    missingOgDescription: 'Missing og:description',
    missingOgImage: 'Missing og:image',
    missingStructuredData: 'Missing structured data (JSON-LD)',
    addStructuredData: 'Add Schema.org markup to improve search appearance'
  }
}

export async function analyzeSEO(url, language = 'ru') {
  const messages = seoAuditMessages[language] || seoAuditMessages.ru

  try {
    // Validate URL
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const urlObj = new URL(normalizedUrl)
    if (!urlObj.protocol.startsWith('http')) {
      return { error: messages.invalidProtocol }
    }

    // Fetch HTML (will fail due to CORS for most sites)
    const response = await fetch(normalizedUrl, { mode: 'cors' })
    const html = await response.text()

    // Parse HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    return analyzeDocument(doc, normalizedUrl, messages, {
      finalUrl: response.url || normalizedUrl,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type') || 'text/html',
    })
  } catch (error) {
    // CORS error - provide instructions
    return {
      error: 'cors',
      message: messages.cors,
      url: url
    }
  }
}

function countWords(text = '') {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized ? normalized.split(' ').length : 0
}

function analyzeDocument(doc, url, messages, responseMeta = {}) {
  const issues = []
  const suggestions = []
  let score = 100

  // 1. META TAGS
  const title = doc.querySelector('title')
  const metaDescription = doc.querySelector('meta[name="description"]')
  const metaKeywords = doc.querySelector('meta[name="keywords"]')
  const canonical = doc.querySelector('link[rel="canonical"]')
  const robots = doc.querySelector('meta[name="robots"]')
  const viewport = doc.querySelector('meta[name="viewport"]')
  const lang = doc.documentElement?.getAttribute('lang') || null

  if (!title || !title.textContent.trim()) {
    issues.push({ type: 'error', text: messages.missingTitle })
    suggestions.push(messages.addTitle)
    score -= 15
  } else if (title.textContent.length < 30) {
    issues.push({ type: 'warning', text: messages.shortTitle })
    suggestions.push(messages.extendTitle)
    score -= 5
  } else if (title.textContent.length > 70) {
    issues.push({ type: 'warning', text: messages.longTitle })
    suggestions.push(messages.reduceTitle)
    score -= 5
  }

  if (!metaDescription || !metaDescription.content.trim()) {
    issues.push({ type: 'error', text: messages.missingDescription })
    suggestions.push(messages.addDescription)
    score -= 15
  } else if (metaDescription.content.length < 120) {
    issues.push({ type: 'warning', text: messages.shortDescription })
    suggestions.push(messages.extendDescription)
    score -= 5
  } else if (metaDescription.content.length > 170) {
    issues.push({ type: 'warning', text: messages.longDescription })
    suggestions.push(messages.reduceDescription)
    score -= 5
  }

  // 2. HEADINGS
  const h1Tags = doc.querySelectorAll('h1')
  const h2Tags = doc.querySelectorAll('h2')
  const h3Tags = doc.querySelectorAll('h3')

  if (h1Tags.length === 0) {
    issues.push({ type: 'error', text: messages.missingH1 })
    suggestions.push(messages.addH1)
    score -= 15
  } else if (h1Tags.length > 1) {
    issues.push({ type: 'warning', text: messages.manyH1(h1Tags.length) })
    suggestions.push(messages.oneH1)
    score -= 10
  }

  if (h1Tags.length > 0 && h2Tags.length === 0) {
    issues.push({ type: 'info', text: messages.missingH2 })
    suggestions.push(messages.addH2)
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
    issues.push({ type: 'warning', text: messages.imagesWithoutAlt(imagesWithoutAlt) })
    suggestions.push(messages.addAlt)
    score -= Math.min(imagesWithoutAlt * 2, 15)
  }

  // 4. OPEN GRAPH
  const ogTitle = doc.querySelector('meta[property="og:title"]')
  const ogDescription = doc.querySelector('meta[property="og:description"]')
  const ogImage = doc.querySelector('meta[property="og:image"]')
  const twitterCard = doc.querySelector('meta[name="twitter:card"]')
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]')
  const twitterDescription = doc.querySelector('meta[name="twitter:description"]')
  const twitterImage = doc.querySelector('meta[name="twitter:image"]')

  if (!ogTitle) {
    issues.push({ type: 'info', text: messages.missingOgTitle })
    suggestions.push(messages.addOg)
    score -= 5
  }

  if (!ogDescription) {
    issues.push({ type: 'info', text: messages.missingOgDescription })
    score -= 3
  }

  if (!ogImage) {
    issues.push({ type: 'info', text: messages.missingOgImage })
    score -= 3
  }

  // 5. STRUCTURED DATA
  const structuredDataScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
  const structuredData = structuredDataScripts[0] || null
  if (!structuredData) {
    issues.push({ type: 'info', text: messages.missingStructuredData })
    suggestions.push(messages.addStructuredData)
    score -= 5
  }

  // 6. LINKS AND CONTENT
  const pageUrl = new URL(responseMeta.finalUrl || url)
  const allLinks = Array.from(doc.querySelectorAll('a[href]'))
  let internalLinks = 0
  let externalLinks = 0

  allLinks.forEach((link) => {
    try {
      const href = link.getAttribute('href')
      if (!href) return

      const resolved = new URL(href, pageUrl)
      if (!['http:', 'https:'].includes(resolved.protocol)) return

      if (resolved.hostname === pageUrl.hostname) {
        internalLinks += 1
      } else {
        externalLinks += 1
      }
    } catch {
      // ignore malformed links in the lightweight browser fallback
    }
  })

  const bodyText = doc.body?.textContent || ''
  const wordCount = countWords(bodyText)

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score))

  return {
    score,
    issues,
    suggestions,
    details: {
      title: title?.textContent || null,
      description: metaDescription?.content || null,
      finalUrl: responseMeta.finalUrl || url,
      status: responseMeta.status ?? null,
      ok: responseMeta.ok ?? true,
      contentType: responseMeta.contentType || 'text/html',
      canonical: canonical?.href || canonical?.getAttribute('href') || null,
      robots: robots?.content || null,
      h1Text: h1Tags[0]?.textContent?.trim() || null,
      h1Count: h1Tags.length,
      h2Count: h2Tags.length,
      h3Count: h3Tags.length,
      imagesTotal: images.length,
      imagesWithoutAlt,
      hasOG: !!(ogTitle && ogDescription && ogImage),
      openGraph: {
        title: ogTitle?.content || null,
        description: ogDescription?.content || null,
        image: ogImage?.content || null,
      },
      twitter: {
        card: twitterCard?.content || null,
        title: twitterTitle?.content || null,
        description: twitterDescription?.content || null,
        image: twitterImage?.content || null,
      },
      hasStructuredData: !!structuredData,
      schemaTypes: structuredDataScripts.length,
      lang,
      viewport: viewport?.content || null,
      internalLinks,
      externalLinks,
      wordCount,
    }
  }
}
