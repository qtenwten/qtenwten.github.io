import { useLanguage } from '../contexts/LanguageContext'
import { useState } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import InlineSpinner from '../components/InlineSpinner'
import { analyzeSEO } from '../utils/seoAudit'

function SEOAudit() {
  const { t, language } = useLanguage()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const copy = language === 'en'
    ? {
        seo: {
          title: 'Free SEO Audit Tool | Check Titles, Headings, and Tags',
          description: 'Run a quick SEO audit online to check titles, meta descriptions, headings, image alt text, and Open Graph markup.',
          keywords: 'free seo audit tool, seo audit online, meta tag checker, heading checker, on-page seo audit'
        },
        title: 'Free SEO Audit Tool',
        subtitle: 'Check titles, headings, images, and metadata in seconds',
        urlLabel: 'Website URL',
        emptyUrl: 'Enter a URL to analyze',
        analyzeError: 'An error occurred during the analysis. Check the URL and try again.',
        limitation: 'Limitation:',
        tip: 'Tip:',
        corsTip: 'This tool works only for websites without CORS restrictions. For full analysis of external sites, use the server-side SEO audit tool.',
        analyze: 'Analyze',
        analyzing: 'Analyzing...',
        score: 'SEO Score',
        excellent: 'Excellent optimization',
        good: 'Good, but there is room to improve',
        poor: 'Optimization is needed',
        issues: 'Found issues',
        suggestions: 'Recommendations',
        details: 'Analysis details',
        missing: 'Missing',
        h1: 'H1 headings',
        h2: 'H2 headings',
        images: 'Images',
        withoutAlt: 'without alt',
        ogReady: 'Configured',
        ogMissing: 'Missing',
        structuredYes: 'Present',
        structuredNo: 'Missing',
        infoTitle: 'A fast on-page SEO check for one URL',
        infoDescription: 'Use this free SEO audit tool to review the most important on-page signals on a page. It is designed for quick checks before publishing, updating metadata, or reviewing basic page quality.',
        checksTitle: 'What this SEO checker reviews:',
        checks: [
          'Title tags and meta descriptions',
          'Heading structure such as H1, H2, and H3',
          'Image alt attributes',
          'Open Graph tags for social sharing',
          'Structured data where it is available'
        ],
        limitsTitle: 'When to use this version:',
        limitsText: 'This fast browser-based audit is useful for basic checks. For deeper checks on external websites, use the full audit tool.',
        ratingTitle: 'How to read the score:',
        rating: ['80-100 points - strong baseline SEO', '60-79 points - decent, but there is room to improve', '0-59 points - important on-page issues need attention'],
        faqTitle: 'FAQ',
        faq: [
          { q: 'How do I audit a page for SEO online?', a: 'Enter the page URL and the tool will check basic on-page elements such as titles, descriptions, headings, images, and social tags.' },
          { q: 'What does this SEO audit tool check?', a: 'It checks common on-page SEO elements like title tags, meta descriptions, heading structure, alt text, and Open Graph markup.' },
          { q: 'Is this a full technical SEO crawl?', a: 'No. This tool is meant for quick page-level checks rather than a full site crawl.' },
          { q: 'Can I use it before publishing a page?', a: 'Yes. It is useful for reviewing important on-page SEO elements before launch or after an edit.' }
        ]
      }
    : {
        seo: {
          title: 'Экспресс SEO-аудит страницы онлайн — проверить title, description и H1',
          description: 'Быстрая SEO-проверка страницы онлайн: title, description, H1-H3, alt и Open Graph. Экспресс-аудит базовых ошибок без установки сервисов.',
          keywords: 'seo аудит онлайн, экспресс seo аудит, проверка meta тегов, проверка h1 страницы, аудит страницы онлайн'
        },
        title: 'Экспресс SEO-аудит страницы',
        subtitle: 'Проверьте основные SEO-элементы страницы за пару секунд',
        urlLabel: 'URL сайта',
        emptyUrl: 'Введите URL для анализа',
        analyzeError: 'Ошибка при анализе сайта. Проверьте URL и попробуйте снова.',
        limitation: 'Ограничение:',
        tip: 'Совет:',
        corsTip: 'Этот инструмент работает только для сайтов без CORS ограничений. Для полного анализа внешних сайтов рекомендуем использовать серверный инструмент SEO-аудита.',
        analyze: 'Анализировать',
        analyzing: 'Анализ...',
        score: 'SEO Оценка',
        excellent: 'Отличная оптимизация',
        good: 'Хорошо, но есть что улучшить',
        poor: 'Требуется оптимизация',
        issues: 'Найденные проблемы',
        suggestions: 'Рекомендации',
        details: 'Детали анализа',
        missing: 'Отсутствует',
        h1: 'H1 заголовков',
        h2: 'H2 заголовков',
        images: 'Изображений',
        withoutAlt: 'без alt',
        ogReady: 'Настроен',
        ogMissing: 'Отсутствует',
        structuredYes: 'Есть',
        structuredNo: 'Нет',
        infoTitle: 'Что показывает экспресс SEO-аудит',
        infoDescription: 'Этот инструмент нужен для быстрой проверки страницы перед публикацией или доработкой. Он помогает увидеть, есть ли основные SEO-элементы: заголовок, description, H1-H2, alt у изображений и базовая Open Graph-разметка.',
        checksTitle: 'Что проверяется в первую очередь:',
        checks: [
          'Title и meta description — наличие и длина для сниппета',
          'Структура заголовков H1, H2, H3 на странице',
          'Alt-атрибуты у изображений',
          'Open Graph для корректного превью в соцсетях',
          'Структурированные данные (JSON-LD), если они есть'
        ],
        limitsTitle: 'Когда использовать этот режим:',
        limitsText: 'Экспресс-аудит подходит для быстрой проверки своей страницы или страницы без CORS-ограничений. Для более глубокой проверки внешних сайтов используйте PRO-режим.',
        ratingTitle: 'Как читать оценку:',
        rating: ['80-100 баллов - отличная SEO оптимизация', '60-79 баллов - хорошо, но есть что улучшить', '0-59 баллов - требуется серьезная оптимизация'],
        faqTitle: 'FAQ',
        faq: [
          { q: 'Как проверить SEO страницы онлайн?', a: 'Введите адрес страницы, и сервис покажет, есть ли title, description, H1-H3, alt и базовая Open Graph-разметка.' },
          { q: 'Подходит ли этот аудит для быстрой проверки перед публикацией?', a: 'Да, экспресс-аудит помогает быстро проверить страницу перед запуском рекламы, индексацией или SEO-доработкой.' },
          { q: 'Чем экспресс-аудит отличается от PRO?', a: 'Экспресс-режим подходит для базовой проверки, а PRO-режим удобнее для более подробного анализа внешних сайтов.' },
          { q: 'Нужно ли устанавливать что-то дополнительно?', a: 'Нет, инструмент работает прямо в браузере и не требует установки программ.' }
        ]
      }

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError(copy.emptyUrl)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const analysis = await analyzeSEO(url, language)

      if (analysis.error) {
        if (analysis.error === 'cors') {
          setError(analysis.message)
        } else {
          setError(analysis.error)
        }
      } else {
        setResult(analysis)
      }
    } catch (err) {
      setError(copy.analyzeError)
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

  return (
    <>
      <SEO
        title={copy.seo.title}
        description={copy.seo.description}
        path={`/${language}/seo-audit`}
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
            <strong>⚠️ {copy.limitation}</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>{error}</p>
            <p style={{ marginTop: '0.5rem', marginBottom: '0', fontSize: '0.9rem' }}>
              💡 <strong>{copy.tip}</strong> {copy.corsTip}
            </p>
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
                      {result.details.title ? `${result.details.title.substring(0, 50)}...` : copy.missing}
                    </div>
                  </div>
                  <div>
                    <strong>{copy.h1}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.h1Count}
                    </div>
                  </div>
                  <div>
                    <strong>{copy.h2}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.h2Count}
                    </div>
                  </div>
                  <div>
                    <strong>{copy.images}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.imagesTotal} ({copy.withoutAlt}: {result.details.imagesWithoutAlt})
                    </div>
                  </div>
                  <div>
                    <strong>Open Graph:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.hasOG ? `✅ ${copy.ogReady}` : `❌ ${copy.ogMissing}`}
                    </div>
                  </div>
                  <div>
                    <strong>{language === 'en' ? 'Structured data' : 'Структурированные данные'}:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.hasStructuredData ? `✅ ${copy.structuredYes}` : `❌ ${copy.structuredNo}`}
                    </div>
                  </div>
                </div>
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

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.limitsTitle}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.limitsText}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.ratingTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.rating.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <ToolFaq title={copy.faqTitle} items={copy.faq || []} />
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/seo-audit`} />
      </div>
    </>
  )
}

export default SEOAudit
