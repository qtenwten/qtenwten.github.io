import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import { seoAuditCache } from '../utils/apiCache'

function SEOAuditPro() {
  const { t, language } = useLanguage()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const copy = language === 'en'
    ? {
        seo: {
          title: 'SEO Audit PRO - Professional Website Analysis',
          description: 'Professional SEO audit for any website: meta tags, headings, images, page structure, and social markup. Works through server-side analysis.',
          keywords: 'SEO audit pro, website analysis, technical SEO audit, meta tags audit, website SEO checker'
        },
        title: 'SEO Audit PRO',
        subtitle: 'Professional SEO analysis for any website',
        urlLabel: 'Website URL',
        emptyUrl: 'Enter a URL to analyze',
        genericError: 'An error occurred while analyzing the website',
        genericRetry: 'An error occurred during the analysis. Check the URL and try again.',
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
        ogReady: 'Configured',
        ogPartial: 'Incomplete',
        structuredYes: 'Present',
        structuredNo: 'Missing',
        infoTitle: 'Professional SEO audit',
        infoDescription: 'SEO Audit PRO analyzes websites without browser CORS limitations. Server-side processing lets you inspect external websites the way professional SEO tools do.',
        checksTitle: 'What is checked:',
        checks: [
          'Title and meta description - presence and optimal length',
          'Meta keywords - still relevant for Yandex',
          'Heading structure: H1, H2, H3',
          'Image alt attributes',
          'Open Graph tags for social sharing',
          'Structured data (JSON-LD)',
          'Robots meta tag'
        ],
        benefitsTitle: 'PRO benefits:',
        benefits: [
          'Works with any website without CORS limitations',
          'Server-side request processing',
          'Fast analysis in up to 10 seconds',
          'Detailed improvement suggestions',
          'SEO score from 0 to 100'
        ],
        ratingTitle: 'Score guide:',
        rating: ['80-100 points - excellent SEO', '60-79 points - good, but can be improved', '0-59 points - serious optimization needed'],
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
          addKeywords: 'Add meta keywords if Yandex traffic matters for this project',
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
        genericError: 'Ошибка при анализе сайта',
        genericRetry: 'Ошибка при анализе сайта. Проверьте URL и попробуйте снова.',
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

    // Check cache first
    const cacheKey = url.trim().toLowerCase()
    const cachedResult = seoAuditCache.get(cacheKey)

    if (cachedResult) {
      const analysis = analyzeData(cachedResult)
      setError('')
      setResult(analysis)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`/api/seo-audit?url=${encodeURIComponent(url)}`, {
        method: 'GET'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || copy.genericError)
        return
      }

      // Cache the result
      seoAuditCache.set(cacheKey, data)

      const analysis = analyzeData(data)
      setResult(analysis)
    } catch (err) {
      setError(err.message || copy.genericRetry)
    } finally {
      setLoading(false)
    }
  }

  const analyzeData = (data) => {
    const issues = []
    const suggestions = []
    let score = 100

    // Title
    if (!data.title) {
      issues.push({ type: 'error', text: copy.analysis.missingTitle })
      suggestions.push(copy.analysis.addTitle)
      score -= 15
    } else if (data.title.length < 30) {
      issues.push({ type: 'warning', text: copy.analysis.shortTitle })
      suggestions.push(copy.analysis.extendTitle)
      score -= 5
    } else if (data.title.length > 70) {
      issues.push({ type: 'warning', text: copy.analysis.longTitle })
      suggestions.push(copy.analysis.reduceTitle)
      score -= 5
    }

    // Description
    if (!data.description) {
      issues.push({ type: 'error', text: copy.analysis.missingDescription })
      suggestions.push(copy.analysis.addDescription)
      score -= 15
    } else if (data.description.length < 120) {
      issues.push({ type: 'warning', text: copy.analysis.shortDescription })
      suggestions.push(copy.analysis.extendDescription)
      score -= 5
    } else if (data.description.length > 170) {
      issues.push({ type: 'warning', text: copy.analysis.longDescription })
      suggestions.push(copy.analysis.reduceDescription)
      score -= 5
    }

    // Keywords
    if (!data.keywords) {
      issues.push({ type: 'info', text: copy.analysis.missingKeywords })
      suggestions.push(copy.analysis.addKeywords)
      score -= 5
    }

    // H1
    if (data.h1Count === 0) {
      issues.push({ type: 'error', text: copy.analysis.missingH1 })
      suggestions.push(copy.analysis.addH1)
      score -= 15
    } else if (data.h1Count > 1) {
      issues.push({ type: 'warning', text: copy.analysis.manyH1(data.h1Count) })
      suggestions.push(copy.analysis.oneH1)
      score -= 10
    }

    // H2
    if (data.h1Count > 0 && data.h2Count === 0) {
      issues.push({ type: 'info', text: copy.analysis.missingH2 })
      suggestions.push(copy.analysis.addH2)
      score -= 5
    }

    // Images
    if (data.imagesWithoutAlt > 0) {
      issues.push({ type: 'warning', text: copy.analysis.imagesWithoutAlt(data.imagesWithoutAlt) })
      suggestions.push(copy.analysis.addAlt)
      score -= Math.min(data.imagesWithoutAlt * 2, 15)
    }

    // Open Graph
    if (!data.openGraph.title) {
      issues.push({ type: 'info', text: copy.analysis.missingOgTitle })
      suggestions.push(copy.analysis.addOg)
      score -= 5
    }

    if (!data.openGraph.description) {
      issues.push({ type: 'info', text: copy.analysis.missingOgDescription })
      score -= 3
    }

    if (!data.openGraph.image) {
      issues.push({ type: 'info', text: copy.analysis.missingOgImage })
      score -= 3
    }

    // Structured Data
    if (!data.hasStructuredData) {
      issues.push({ type: 'info', text: copy.analysis.missingStructuredData })
      suggestions.push(copy.analysis.addStructuredData)
      score -= 5
    }

    score = Math.max(0, Math.min(100, score))

    return {
      score,
      issues,
      suggestions,
      data
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
            autoFocus
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
          {loading ? copy.analyzing : copy.analyze}
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
                    <strong>Keywords:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                       {result.data.keywords || copy.keywordsMissing}
                    </div>
                  </div>
                  <div>
                     <strong>{copy.h1}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.h1Count}
                    </div>
                  </div>
                  <div>
                     <strong>{copy.h2}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.h2Count}
                    </div>
                  </div>
                  <div>
                     <strong>{copy.h3}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.h3Count}
                    </div>
                  </div>
                  <div>
                     <strong>{copy.images}:</strong>
                     <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                       {result.data.imagesTotal} ({copy.withoutAlt}: {result.data.imagesWithoutAlt})
                     </div>
                  </div>
                  <div>
                    <strong>Open Graph:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                       {result.data.openGraph.title && result.data.openGraph.description && result.data.openGraph.image ? `✅ ${copy.ogReady}` : `❌ ${copy.ogPartial}`}
                    </div>
                  </div>
                  <div>
                    <strong>{language === 'en' ? 'Structured data' : 'Структурированные данные'}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                       {result.data.hasStructuredData ? `✅ ${copy.structuredYes}` : `❌ ${copy.structuredNo}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
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
        </div>

        <RelatedTools currentPath={`/${language}/seo-audit-pro`} />
      </div>
    </>
  )
}

export default SEOAuditPro
