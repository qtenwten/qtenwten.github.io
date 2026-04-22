import { normalizeUrl } from './urlUtils'

function isPrivateIPv4(address) {
  const octets = address.split('.').map(Number)
  if (octets.length !== 4 || octets.some(Number.isNaN)) return false
  const [a, b] = octets
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function isPrivateIPv6(address) {
  const normalized = address.toLowerCase()
  if (normalized === '::1' || normalized === '::') return true
  if (normalized.startsWith('::ffff:')) return isPrivateIPv4(normalized.slice(7))
  return (
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('ff')
  )
}

const BLOCKED_HOSTNAMES = new Set(['localhost'])
const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa']

function isPrivateHost(hostname) {
  const normalized = hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(normalized)) return true
  if (BLOCKED_SUFFIXES.some((s) => normalized.endsWith(s))) return true
  if (netIsIP(normalized)) {
    return netIsIP(normalized) === 4 ? isPrivateIPv4(normalized) : isPrivateIPv6(normalized)
  }
  return false
}

function netIsIP(addr) {
  if (!addr) return 0
  const parts = addr.split('.')
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) return 4
  if (addr.includes(':')) return 6
  return 0
}

export function createAnalyzeSEO(getMessage) {
  async function analyzeSEO(url) {
    const msg = (key, ...args) => {
      const template = getMessage(`seoAudit.messages.${key}`)
      if (!template || typeof template !== 'string') return key
      if (args.length === 0) return template
      return args.reduce((acc, arg, i) => acc.replace(`{${i}}`, String(arg)), template)
    }

    try {
      const normalizedUrl = normalizeUrl(url)
      const urlObj = new URL(normalizedUrl)
      if (!urlObj.protocol.startsWith('http')) {
        return { error: msg('invalidProtocol') }
      }

      if (isPrivateHost(urlObj.hostname)) {
        return { error: msg('privateHost') }
      }

      const response = await fetch(normalizedUrl, { mode: 'cors' })
      const html = await response.text()

      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      return analyzeDocument(doc, normalizedUrl, msg, {
        finalUrl: response.url || normalizedUrl,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type') || 'text/html',
      })
    } catch {
      return {
        error: 'cors',
        message: msg('cors'),
        url: url,
        details: {
          finalUrl: normalizeUrl(url),
          status: null,
          ok: false,
          contentType: null,
        },
      }
    }
  }

  function countWords(text = '') {
    const normalized = text.replace(/\s+/g, ' ').trim()
    return normalized ? normalized.split(' ').length : 0
  }

  function analyzeDocument(doc, url, msg, responseMeta = {}) {
    const issues = []
    const suggestions = []
    let score = 100

    const title = doc.querySelector('title')
    const metaDescription = doc.querySelector('meta[name="description"]')
    const canonical = doc.querySelector('link[rel="canonical"]')
    const robots = doc.querySelector('meta[name="robots"]')
    const viewport = doc.querySelector('meta[name="viewport"]')
    const lang = doc.documentElement?.getAttribute('lang') || null

    if (!title || !title.textContent.trim()) {
      issues.push({ type: 'error', text: msg('missingTitle') })
      suggestions.push(msg('addTitle'))
      score -= 15
    } else if (title.textContent.length < 30) {
      issues.push({ type: 'warning', text: msg('shortTitle') })
      suggestions.push(msg('extendTitle'))
      score -= 5
    } else if (title.textContent.length > 70) {
      issues.push({ type: 'warning', text: msg('longTitle') })
      suggestions.push(msg('reduceTitle'))
      score -= 5
    }

    if (!metaDescription || !metaDescription.content.trim()) {
      issues.push({ type: 'error', text: msg('missingDescription') })
      suggestions.push(msg('addDescription'))
      score -= 15
    } else if (metaDescription.content.length < 120) {
      issues.push({ type: 'warning', text: msg('shortDescription') })
      suggestions.push(msg('extendDescription'))
      score -= 5
    } else if (metaDescription.content.length > 170) {
      issues.push({ type: 'warning', text: msg('longDescription') })
      suggestions.push(msg('reduceDescription'))
      score -= 5
    }

    const h1Tags = doc.querySelectorAll('h1')
    const h2Tags = doc.querySelectorAll('h2')
    const h3Tags = doc.querySelectorAll('h3')

    if (h1Tags.length === 0) {
      issues.push({ type: 'error', text: msg('missingH1') })
      suggestions.push(msg('addH1'))
      score -= 15
    } else if (h1Tags.length > 1) {
      issues.push({ type: 'warning', text: msg('manyH1', h1Tags.length) })
      suggestions.push(msg('oneH1'))
      score -= 10
    }

    if (h1Tags.length > 0 && h2Tags.length === 0) {
      issues.push({ type: 'info', text: msg('missingH2') })
      suggestions.push(msg('addH2'))
      score -= 5
    }

    const images = doc.querySelectorAll('img')
    let imagesWithoutAlt = 0
    images.forEach(img => {
      if (!img.hasAttribute('alt') || !img.getAttribute('alt').trim()) {
        imagesWithoutAlt++
      }
    })

    if (imagesWithoutAlt > 0) {
      issues.push({ type: 'warning', text: msg('imagesWithoutAlt', imagesWithoutAlt) })
      suggestions.push(msg('addAlt'))
      score -= Math.min(imagesWithoutAlt * 2, 15)
    }

    const ogTitle = doc.querySelector('meta[property="og:title"]')
    const ogDescription = doc.querySelector('meta[property="og:description"]')
    const ogImage = doc.querySelector('meta[property="og:image"]')
    const twitterCard = doc.querySelector('meta[name="twitter:card"]')
    const twitterTitle = doc.querySelector('meta[name="twitter:title"]')
    const twitterDescription = doc.querySelector('meta[name="twitter:description"]')
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')

    if (!ogTitle) {
      issues.push({ type: 'info', text: msg('missingOgTitle') })
      suggestions.push(msg('addOg'))
      score -= 5
    }

    if (!ogDescription) {
      issues.push({ type: 'info', text: msg('missingOgDescription') })
      score -= 3
    }

    if (!ogImage) {
      issues.push({ type: 'info', text: msg('missingOgImage') })
      score -= 3
    }

    const structuredDataScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
    const structuredData = structuredDataScripts[0] || null
    if (!structuredData) {
      issues.push({ type: 'info', text: msg('missingStructuredData') })
      suggestions.push(msg('addStructuredData'))
      score -= 5
    }

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
      } catch {}
    })

    const bodyText = doc.body?.textContent || ''
    const wordCount = countWords(bodyText)

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

  return analyzeSEO
}

const DEFAULT_MESSAGES = {
  ru: {
    invalidProtocol: 'URL должен начинаться с http:// или https://',
    privateHost: 'Анализ локальных и внутренних адресов невозможен.',
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
    privateHost: 'Analysis of local and internal network addresses is not possible.',
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

export function createLanguageAwareSEOAnalyzer(language) {
  const lang = language === 'en' ? 'en' : 'ru'
  const messages = DEFAULT_MESSAGES[lang]
  return createAnalyzeSEO((key) => {
    const msgKey = key.replace('seoAudit.messages.', '')
    return messages[msgKey] || DEFAULT_MESSAGES.ru[msgKey] || key
  })
}

export function analyzeSEO(url, language = 'ru') {
  const analyzer = createLanguageAwareSEOAnalyzer(language)
  return analyzer(url)
}
