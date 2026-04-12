import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { seoAuditCache } from '../utils/apiCache'
import { analyzeSEO } from '../utils/seoAudit'
import InlineSpinner from '../components/InlineSpinner'

const SEO_AUDIT_WORKER_URL = 'https://seo-audit-api.qten.workers.dev/'

async function readApiResponse(response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  const bodyText = await response.text()
  const trimmedBody = bodyText.trim()

  const looksLikeHtml =
    contentType.includes('text/html') ||
    trimmedBody.startsWith('<!DOCTYPE') ||
    trimmedBody.startsWith('<html') ||
    trimmedBody.startsWith('<')

  if (looksLikeHtml) {
    const error = new Error('API returned HTML instead of JSON')
    error.code = 'HTML_RESPONSE'
    error.html = bodyText
    error.status = response.status
    throw error
  }

  try {
    return trimmedBody ? JSON.parse(bodyText) : {}
  } catch (error) {
    const parseError = new Error('API returned invalid JSON')
    parseError.code = 'INVALID_JSON'
    parseError.status = response.status
    parseError.cause = error
    throw parseError
  }
}

function normalizeAuditUrl(rawUrl) {
  const trimmedUrl = rawUrl.trim()

  if (!trimmedUrl) {
    return ''
  }

  const normalizedUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
  const parsedUrl = new URL(normalizedUrl)

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Invalid URL protocol')
  }

  return parsedUrl.toString()
}

async function requestWorkerAudit(normalizedUrl) {
  const response = await fetch(`${SEO_AUDIT_WORKER_URL}?url=${encodeURIComponent(normalizedUrl)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const data = await readApiResponse(response)

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Worker request failed')
    error.code = 'WORKER_ERROR'
    error.status = response.status
    throw error
  }

  if (data?.error) {
    const error = new Error(data.error)
    error.code = 'WORKER_ERROR'
    throw error
  }

  return data
}

function createWorkerAnalysis(data, copy) {
  const normalizedData = {
    source: 'worker',
    finalUrl: data.finalUrl || null,
    status: data.status ?? null,
    ok: data.ok !== false,
    contentType: data.contentType || null,
    title: data.title || null,
    description: data.metaDescription || null,
    keywords: null,
    robots: data.robots || null,
    canonical: data.canonical || null,
    h1Text: data.h1 || null,
    h1Count: data.h1 ? 1 : 0,
    h2Count: null,
    h3Count: null,
    imagesTotal: null,
    imagesWithoutAlt: null,
    hasStructuredData: null,
    openGraph: null,
  }

  const issues = []
  const suggestions = []
  let score = 100

  if (normalizedData.status && (normalizedData.status < 200 || normalizedData.status >= 400 || normalizedData.ok === false)) {
    issues.push({ type: 'error', text: copy.analysis.badStatus(normalizedData.status) })
    suggestions.push(copy.analysis.reviewStatus)
    score -= 20
  }

  if (normalizedData.contentType && !normalizedData.contentType.includes('text/html')) {
    issues.push({ type: 'warning', text: copy.analysis.nonHtmlContent })
    suggestions.push(copy.analysis.checkContentType)
    score -= 10
  }

  if (!normalizedData.title) {
    issues.push({ type: 'error', text: copy.analysis.missingTitle })
    suggestions.push(copy.analysis.addTitle)
    score -= 15
  } else if (normalizedData.title.length < 30) {
    issues.push({ type: 'warning', text: copy.analysis.shortTitle })
    suggestions.push(copy.analysis.extendTitle)
    score -= 5
  } else if (normalizedData.title.length > 70) {
    issues.push({ type: 'warning', text: copy.analysis.longTitle })
    suggestions.push(copy.analysis.reduceTitle)
    score -= 5
  }

  if (!normalizedData.description) {
    issues.push({ type: 'error', text: copy.analysis.missingDescription })
    suggestions.push(copy.analysis.addDescription)
    score -= 15
  } else if (normalizedData.description.length < 120) {
    issues.push({ type: 'warning', text: copy.analysis.shortDescription })
    suggestions.push(copy.analysis.extendDescription)
    score -= 5
  } else if (normalizedData.description.length > 170) {
    issues.push({ type: 'warning', text: copy.analysis.longDescription })
    suggestions.push(copy.analysis.reduceDescription)
    score -= 5
  }

  if (!normalizedData.h1Text) {
    issues.push({ type: 'error', text: copy.analysis.missingH1 })
    suggestions.push(copy.analysis.addH1)
    score -= 15
  }

  if (!normalizedData.canonical) {
    issues.push({ type: 'info', text: copy.analysis.missingCanonical })
    suggestions.push(copy.analysis.addCanonical)
    score -= 3
  }

  if (normalizedData.robots && /noindex/i.test(normalizedData.robots)) {
    issues.push({ type: 'warning', text: copy.analysis.noindexRobots })
    suggestions.push(copy.analysis.reviewRobots)
    score -= 10
  }

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    issues,
    suggestions,
    data: normalizedData,
  }
}

function createFallbackAnalysis(fallbackResult, normalizedUrl) {
  return {
    score: fallbackResult.score,
    issues: fallbackResult.issues,
    suggestions: fallbackResult.suggestions,
    data: {
      source: 'browser',
      finalUrl: normalizedUrl,
      status: null,
      ok: true,
      contentType: 'text/html (browser fallback)',
      title: fallbackResult.details?.title || null,
      description: fallbackResult.details?.description || null,
      keywords: fallbackResult.details?.keywords || null,
      robots: null,
      canonical: null,
      h1Text: null,
      h1Count: fallbackResult.details?.h1Count ?? 0,
      h2Count: fallbackResult.details?.h2Count ?? 0,
      h3Count: fallbackResult.details?.h3Count ?? 0,
      imagesTotal: fallbackResult.details?.imagesTotal ?? 0,
      imagesWithoutAlt: fallbackResult.details?.imagesWithoutAlt ?? 0,
      hasStructuredData: fallbackResult.details?.hasStructuredData ?? false,
      openGraph: {
        title: fallbackResult.details?.hasOG ? 'present' : null,
        description: fallbackResult.details?.hasOG ? 'present' : null,
        image: fallbackResult.details?.hasOG ? 'present' : null,
      },
    },
  }
}

function SEOAuditPro() {
  const { t, language } = useLanguage()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const copy = language === 'en'
    ? {
        seo: {
          title: 'SEO Audit Tool Online | Full On-Page SEO Checker',
          description: 'Run a full on-page SEO audit for any URL. Check titles, meta descriptions, headings, Open Graph tags, images, and page structure.',
          keywords: 'seo audit tool, on-page seo checker, website seo audit, seo checker online, technical seo audit'
        },
        title: 'SEO Audit Tool Online',
        subtitle: 'Run a deeper on-page SEO audit for any public URL',
        urlLabel: 'Website URL',
        emptyUrl: 'Enter a URL to analyze',
        invalidUrl: 'Enter a valid website URL',
        genericError: 'An error occurred while analyzing the website',
        genericRetry: 'An error occurred during the analysis. Check the URL and try again.',
        invalidApiResponse: 'The remote audit service returned an unexpected response.',
        fallbackNotice: 'The remote audit service could not be reached, so a limited browser-based audit was used instead.',
        fallbackFailed: 'The remote audit service is unavailable, and the page could not be checked from the browser because of cross-origin restrictions.',
        errorTitle: 'Error:',
        analyze: 'Analyze',
        analyzing: 'Analyzing page...',
        score: 'SEO Score',
        excellent: 'Excellent optimization',
        good: 'Good, but there is room to improve',
        poor: 'Optimization is needed',
        share: 'Share result',
        shareSuccess: '✅ Link copied to clipboard!\n\nSend it to someone so they can open the analysis result.',
        sharePrompt: 'Copy this link:',
        issues: 'Found issues',
        suggestions: 'Recommendations',
        details: 'Analysis details',
        missing: 'Missing',
        keywordsMissing: 'Missing',
        h1: 'H1 headings',
        h2: 'H2 headings',
        h3: 'H3 headings',
        images: 'Images',
        withoutAlt: 'without alt',
        finalUrl: 'Final URL',
        status: 'HTTP status',
        contentType: 'Content type',
        canonical: 'Canonical URL',
        robotsLabel: 'Robots',
        notAvailable: 'Not available',
        ogReady: 'Configured',
        ogPartial: 'Incomplete',
        structuredYes: 'Present',
        structuredNo: 'Missing',
        infoTitle: 'A deeper SEO audit for real page reviews',
        infoDescription: 'Use this SEO audit tool to review a public page the way you would during a real on-page audit. It is useful for competitor research, landing page reviews, client work, and quick technical checks before publishing.',
        checksTitle: 'What the audit checks:',
        checks: [
          'Title tags and meta descriptions',
          'Heading structure including H1, H2, and H3',
          'Image alt text coverage',
          'Open Graph tags for sharing',
          'Structured data where present',
          'Robots directives and basic crawl hints'
        ],
        benefitsTitle: 'Why use this audit tool:',
        benefits: [
          'Audit public pages without browser-side CORS limits',
          'Review metadata, headings, and structure in one report',
          'Spot quick wins before publishing or updating a page',
          'Use it for competitor reviews and landing page checks',
          'Get a simple score for prioritizing fixes'
        ],
        ratingTitle: 'How to read the score:',
        rating: ['80-100 points - strong on-page SEO signals', '60-79 points - solid, but there is room to improve', '0-59 points - several important issues need work'],
        faqTitle: 'FAQ',
        faq: [
          { q: 'How do I run an SEO audit for a page?', a: 'Enter the page URL and the tool will analyze key on-page elements such as titles, descriptions, headings, alt text, and social tags.' },
          { q: 'Can I audit competitor pages?', a: 'Yes. This tool works well for reviewing public competitor pages and comparing basic on-page SEO signals.' },
          { q: 'What is the difference between this tool and the quick audit?', a: 'This version is designed for deeper page-level checks on public URLs and is better suited for competitive review and detailed inspection.' },
          { q: 'Is this useful for landing pages and blog posts?', a: 'Yes. It works well for landing pages, product pages, blog posts, and other public URLs that need on-page SEO review.' }
        ],
        sharedPreview: (sharedUrl, sharedScore, sharedIssues) => `📊 SEO analysis preview for ${sharedUrl}\n\nScore: ${sharedScore}/100\nIssues: ${sharedIssues}\n\nClick "Analyze" to load the full report.`,
        analysis: {
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
          missingKeywords: 'Missing meta keywords',
          addKeywords: 'Add meta keywords only if your workflow still uses them as supplemental metadata',
          missingH1: 'Missing <h1> tag',
          addH1: 'Add one main H1 heading to the page',
          badStatus: (status) => `Page returned HTTP ${status}`,
          reviewStatus: 'Check whether the page is reachable and returns a successful status code',
          nonHtmlContent: 'The response is not an HTML document',
          checkContentType: 'Verify that the URL points to a regular HTML page',
          missingCanonical: 'Missing canonical URL',
          addCanonical: 'Add a canonical URL to help search engines understand the preferred page version',
          noindexRobots: 'Robots tag contains noindex',
          reviewRobots: 'Review the robots directive if the page is meant to be indexed',
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
    : {
        seo: {
          title: 'SEO-аудит сайта онлайн — подробная проверка SEO страницы',
          description: 'Подробный SEO-аудит сайта онлайн: title, description, H1-H3, alt, robots, Open Graph, keywords и структура страницы. Подходит для технического анализа и быстрой проверки.',
          keywords: 'seo аудит сайта, seo аудит сайта онлайн, проверка seo сайта, аудит сайта онлайн, анализ страницы'
        },
        title: 'SEO-аудит сайта PRO',
        subtitle: 'Подробная проверка мета-тегов, заголовков и структуры любой страницы',
        urlLabel: 'URL сайта',
        emptyUrl: 'Введите URL для анализа',
        invalidUrl: 'Введите корректный URL сайта',
        genericError: 'Ошибка при анализе сайта',
        genericRetry: 'Ошибка при анализе сайта. Проверьте URL и попробуйте снова.',
        invalidApiResponse: 'Удалённый сервис SEO-аудита вернул неожиданный ответ.',
        fallbackNotice: 'Удалённый SEO-аудит временно недоступен, поэтому была использована ограниченная браузерная проверка страницы.',
        fallbackFailed: 'Удалённый SEO-аудит недоступен, а проверить страницу из браузера не удалось из-за ограничений CORS.',
        errorTitle: 'Ошибка:',
        analyze: 'Анализировать',
        analyzing: 'Анализируем страницу...',
        score: 'SEO Оценка',
        excellent: 'Отличная оптимизация',
        good: 'Хорошо, но есть что улучшить',
        poor: 'Требуется оптимизация',
        share: 'Поделиться результатом',
        shareSuccess: '✅ Ссылка скопирована в буфер обмена!\n\nОтправьте её другу, чтобы он увидел результаты анализа.',
        sharePrompt: 'Скопируйте эту ссылку:',
        issues: 'Найденные проблемы',
        suggestions: 'Рекомендации',
        details: 'Детали анализа',
        missing: 'Отсутствует',
        keywordsMissing: 'Отсутствуют',
        h1: 'H1 заголовков',
        h2: 'H2 заголовков',
        h3: 'H3 заголовков',
        images: 'Изображений',
        withoutAlt: 'без alt',
        finalUrl: 'Итоговый URL',
        status: 'HTTP статус',
        contentType: 'Тип контента',
        canonical: 'Canonical URL',
        robotsLabel: 'Robots',
        notAvailable: 'Нет данных',
        ogReady: 'Настроен',
        ogPartial: 'Не полностью',
        structuredYes: 'Есть',
        structuredNo: 'Нет',
        infoTitle: 'Что дает подробный SEO-аудит страницы',
        infoDescription: 'PRO-режим помогает проверить внешнюю страницу целиком и увидеть, как она подготовлена к индексации и сниппетам. Это удобно для аудита конкурентов, новых посадочных страниц, клиентских проектов и технической проверки перед публикацией.',
        checksTitle: 'Какие SEO-сигналы проверяются:',
        checks: [
          'Title и meta description — наличие, длина и базовая релевантность',
          'Meta keywords — дополнительный сигнал для Яндекса',
          'Структура заголовков H1, H2, H3 на странице',
          'Alt-атрибуты у изображений',
          'Open Graph для мессенджеров и соцсетей',
          'Структурированные данные (JSON-LD)',
          'Robots meta-тег и технические подсказки для индексации'
        ],
        benefitsTitle: 'Почему этот формат полезен:',
        benefits: [
          'Проверяет внешние сайты без ограничений браузера',
          'Показывает ключевые SEO-ошибки на одной странице',
          'Подходит для аудита конкурентов и новых посадочных страниц',
          'Дает понятные рекомендации по доработке',
          'Помогает быстро понять приоритет исправлений'
        ],
        ratingTitle: 'Как трактовать оценку:',
        rating: ['80-100 баллов - отличная SEO оптимизация', '60-79 баллов - хорошо, но есть что улучшить', '0-59 баллов - требуется серьезная оптимизация'],
        faqTitle: 'FAQ',
        faq: [
          { q: 'Как сделать SEO-аудит сайта онлайн?', a: 'Введите URL страницы, и сервис выполнит подробную проверку title, description, H1-H3, alt, Open Graph и других базовых SEO-сигналов.' },
          { q: 'Можно ли проверить чужой сайт?', a: 'Да, PRO-режим рассчитан на аудит внешних страниц и анализ конкурентов.' },
          { q: 'Для чего нужен такой аудит?', a: 'Он помогает быстро найти ошибки в мета-тегах, структуре заголовков и оформлении страницы перед SEO-доработкой.' },
          { q: 'Подходит ли инструмент для технического SEO-анализа?', a: 'Да, это удобный стартовый инструмент для технической проверки страницы и первичного SEO-скрининга.' }
        ],
        sharedPreview: (sharedUrl, sharedScore, sharedIssues) => `📊 Результат SEO анализа для ${sharedUrl}\n\nОценка: ${sharedScore}/100\nПроблем: ${sharedIssues}\n\nНажмите "Анализировать" для полного отчета`,
        analysis: {
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
          missingKeywords: 'Отсутствуют meta keywords',
          addKeywords: 'Добавьте ключевые слова (важно для Яндекса)',
          missingH1: 'Отсутствует тег <h1>',
          addH1: 'Добавьте один главный заголовок H1 на страницу',
          badStatus: (status) => `Страница вернула HTTP ${status}`,
          reviewStatus: 'Проверьте, что страница открывается и возвращает успешный код ответа',
          nonHtmlContent: 'Ответ не является HTML-страницей',
          checkContentType: 'Убедитесь, что URL ведёт на обычную HTML-страницу',
          missingCanonical: 'Отсутствует canonical URL',
          addCanonical: 'Добавьте canonical URL, чтобы указать поисковикам предпочтительную версию страницы',
          noindexRobots: 'В robots указан noindex',
          reviewRobots: 'Проверьте robots-директиву, если страница должна индексироваться',
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
        }
      }

  useEffect(() => {
    // Check if URL parameters exist (shared link)
    const params = new URLSearchParams(window.location.search)
    const sharedUrl = params.get('url')
    const sharedScore = params.get('score')
    const sharedIssues = params.get('issues')

    if (sharedUrl) {
      setUrl(sharedUrl)
      // Auto-analyze if shared link
      if (sharedScore && sharedIssues) {
        setError(copy.sharedPreview(sharedUrl, sharedScore, sharedIssues))
      }
    }
  }, [language])

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError(copy.emptyUrl)
      return
    }

    let normalizedUrl

    try {
      normalizedUrl = normalizeAuditUrl(url)
    } catch {
      setError(copy.invalidUrl)
      return
    }

    // Check cache first
    const cacheKey = normalizedUrl.toLowerCase()
    const cachedResult = seoAuditCache.get(cacheKey)

    if (cachedResult) {
      setError('')
      setNotice('')
      setResult(cachedResult)
      return
    }

    setLoading(true)
    setError('')
    setNotice('')
    setResult(null)

    try {
      const data = await requestWorkerAudit(normalizedUrl)
      const analysis = createWorkerAnalysis(data, copy)

      seoAuditCache.set(cacheKey, analysis)
      setResult(analysis)
    } catch (err) {
      if (err.code === 'HTML_RESPONSE' || err.code === 'INVALID_JSON' || err.code === 'WORKER_ERROR' || err.name === 'TypeError') {
        try {
          const fallbackResult = await analyzeSEO(normalizedUrl, language)

          if (fallbackResult?.error) {
            setError(copy.fallbackFailed)
          } else if (fallbackResult) {
            const fallbackAnalysis = createFallbackAnalysis(fallbackResult, normalizedUrl)
            seoAuditCache.set(cacheKey, fallbackAnalysis)
            setResult(fallbackAnalysis)
            setNotice(copy.fallbackNotice)
          } else {
            setError(copy.invalidApiResponse)
          }
        } catch {
          setError(copy.invalidApiResponse)
        }
      } else {
        setError(err.message || copy.genericRetry)
      }
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)'
    if (score >= 60) return '#f59e0b'
    return 'var(--error)'
  }

  const getIssueIcon = (type) => {
    if (type === 'error') return '🔴'
    if (type === 'warning') return '🟡'
    return '🔵'
  }

  const handleShare = () => {
    if (!result) return

    // Create shareable URL with encoded parameters
    const shareUrl = `${window.location.origin}/${language}/seo-audit-pro?url=${encodeURIComponent(url)}&score=${result.score}&issues=${result.issues.length}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(copy.shareSuccess)
       }).catch(() => {
         prompt(copy.sharePrompt, shareUrl)
       })
     } else {
       prompt(copy.sharePrompt, shareUrl)
      }
  }

  const isFallbackResult = result?.data?.source === 'browser'

  return (
    <>
      <SEO
        title={copy.seo.title}
        description={copy.seo.description}
        path={`/${language}/seo-audit-pro`}
        keywords={copy.seo.keywords}
      />

      <div className="tool-container">
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>

        <div className="field">
          <label htmlFor="url">{copy.urlLabel}</label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="https://example.com"
            autoComplete="off"
          />
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid var(--error)',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: 'var(--text)'
          }}>
            <strong>⚠️ {copy.errorTitle}</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{ width: '100%', marginBottom: '2rem' }}
        >
          {loading ? (
            <span className="button-spinner">
              <InlineSpinner label={copy.analyzing} />
            </span>
          ) : copy.analyze}
        </button>

        {result && (
          <>
            <div className="result-box success" style={{ marginBottom: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: getScoreColor(result.score) }}>
                  {result.score}
                </div>
                <div style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>
                  {copy.score}
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {result.score >= 80 && `✅ ${copy.excellent}`}
                  {result.score >= 60 && result.score < 80 && `⚠️ ${copy.good}`}
                {result.score < 60 && `❌ ${copy.poor}`}
              </div>
                <button
                  onClick={handleShare}
                  style={{
                    marginTop: '1rem',
                    background: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                   📤 {copy.share}
                 </button>
              </div>
            </div>

            {result.issues.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{copy.issues}</h2>
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                  {result.issues.map((issue, index) => (
                    <div key={index} style={{
                      padding: '0.75rem 0',
                      borderBottom: index < result.issues.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}>
                      <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{getIssueIcon(issue.type)}</span>
                      <span style={{ color: 'var(--text)' }}>{issue.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.suggestions.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{copy.suggestions}</h2>
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                  <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{copy.details}</h2>
              <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <strong>Title:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.title ? `${result.data.title.substring(0, 50)}...` : copy.missing}
                    </div>
                  </div>
                  <div>
                    <strong>Description:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.description ? `${result.data.description.substring(0, 50)}...` : copy.missing}
                    </div>
                  </div>
                  <div>
                    <strong>{copy.h1}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.h1Text || result.data.h1Count || copy.missing}
                    </div>
                  </div>
                  <div>
                    <strong>{copy.canonical}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.canonical || copy.notAvailable}
                    </div>
                  </div>
                  <div>
                    <strong>{copy.robotsLabel}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.robots || copy.notAvailable}
                    </div>
                  </div>
                  <div>
                    <strong>{copy.finalUrl}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.finalUrl || copy.notAvailable}
                    </div>
                  </div>
                  <div>
                    <strong>{copy.status}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.status ?? copy.notAvailable}
                    </div>
                  </div>
                  <div>
                    <strong>{copy.contentType}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.contentType || copy.notAvailable}
                    </div>
                  </div>
                  {result.data.keywords && (
                    <div>
                      <strong>Keywords:</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {result.data.keywords}
                      </div>
                    </div>
                  )}
                  {result.data.h2Count !== null && (
                    <div>
                      <strong>{copy.h2}:</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {result.data.h2Count}
                      </div>
                    </div>
                  )}
                  {result.data.h3Count !== null && (
                    <div>
                      <strong>{copy.h3}:</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {result.data.h3Count}
                      </div>
                    </div>
                  )}
                  {result.data.imagesTotal !== null && (
                    <div>
                      <strong>{copy.images}:</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {result.data.imagesTotal} ({copy.withoutAlt}: {result.data.imagesWithoutAlt})
                      </div>
                    </div>
                  )}
                  {result.data.openGraph && (
                    <div>
                      <strong>Open Graph:</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {result.data.openGraph.title && result.data.openGraph.description && result.data.openGraph.image ? `✅ ${copy.ogReady}` : `❌ ${copy.ogPartial}`}
                      </div>
                    </div>
                  )}
                  {typeof result.data.hasStructuredData === 'boolean' && (
                    <div>
                      <strong>{language === 'en' ? 'Structured data' : 'Структурированные данные'}:</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {result.data.hasStructuredData ? `✅ ${copy.structuredYes}` : `❌ ${copy.structuredNo}`}
                      </div>
                    </div>
                  )}
                </div>
                {(isFallbackResult && notice) && (
                  <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {notice}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <ToolDescriptionSection>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{copy.infoTitle}</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            {copy.infoDescription}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.checksTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.checks.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.benefitsTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.benefits.map((item) => <li key={item}>✅ {item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.ratingTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.rating.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <ToolFaq title={copy.faqTitle} items={copy.faq || []} />
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/seo-audit-pro`} />
      </div>
    </>
  )
}

export default SEOAuditPro
