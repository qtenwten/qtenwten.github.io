import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import { seoAuditCache } from '../utils/apiCache'

function SEOAuditPro() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

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
        // Show preview message
        const previewMessage = `📊 Результат SEO анализа для ${sharedUrl}\n\nОценка: ${sharedScore}/100\nПроблем: ${sharedIssues}\n\nНажмите "Анализировать" для полного отчета`
        setError(previewMessage)
      }
    }
  }, [])

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Введите URL для анализа')
      return
    }

    // Check cache first
    const cacheKey = url.trim().toLowerCase()
    const cachedResult = seoAuditCache.get(cacheKey)

    if (cachedResult) {
      const analysis = analyzeData(cachedResult)
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
        setError(data.error || 'Ошибка при анализе сайта')
        return
      }

      // Cache the result
      seoAuditCache.set(cacheKey, data)

      const analysis = analyzeData(data)
      setResult(analysis)
    } catch (err) {
      setError(err.message || 'Ошибка при анализе сайта. Проверьте URL и попробуйте снова.')
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
      issues.push({ type: 'error', text: 'Отсутствует тег <title>' })
      suggestions.push('Добавьте уникальный заголовок страницы (50-60 символов)')
      score -= 15
    } else if (data.title.length < 30) {
      issues.push({ type: 'warning', text: 'Тег <title> слишком короткий' })
      suggestions.push('Увеличьте длину заголовка до 50-60 символов')
      score -= 5
    } else if (data.title.length > 70) {
      issues.push({ type: 'warning', text: 'Тег <title> слишком длинный' })
      suggestions.push('Сократите заголовок до 50-60 символов')
      score -= 5
    }

    // Description
    if (!data.description) {
      issues.push({ type: 'error', text: 'Отсутствует meta description' })
      suggestions.push('Добавьте описание страницы (150-160 символов)')
      score -= 15
    } else if (data.description.length < 120) {
      issues.push({ type: 'warning', text: 'Meta description слишком короткое' })
      suggestions.push('Увеличьте описание до 150-160 символов')
      score -= 5
    } else if (data.description.length > 170) {
      issues.push({ type: 'warning', text: 'Meta description слишком длинное' })
      suggestions.push('Сократите описание до 150-160 символов')
      score -= 5
    }

    // Keywords
    if (!data.keywords) {
      issues.push({ type: 'info', text: 'Отсутствуют meta keywords' })
      suggestions.push('Добавьте ключевые слова (важно для Яндекса)')
      score -= 5
    }

    // H1
    if (data.h1Count === 0) {
      issues.push({ type: 'error', text: 'Отсутствует тег <h1>' })
      suggestions.push('Добавьте один главный заголовок H1 на страницу')
      score -= 15
    } else if (data.h1Count > 1) {
      issues.push({ type: 'warning', text: `Найдено ${data.h1Count} тегов <h1>` })
      suggestions.push('Используйте только один H1 на странице')
      score -= 10
    }

    // H2
    if (data.h1Count > 0 && data.h2Count === 0) {
      issues.push({ type: 'info', text: 'Отсутствуют теги <h2>' })
      suggestions.push('Добавьте подзаголовки H2 для структурирования контента')
      score -= 5
    }

    // Images
    if (data.imagesWithoutAlt > 0) {
      issues.push({ type: 'warning', text: `${data.imagesWithoutAlt} изображений без атрибута alt` })
      suggestions.push('Добавьте описательные alt-атрибуты ко всем изображениям')
      score -= Math.min(data.imagesWithoutAlt * 2, 15)
    }

    // Open Graph
    if (!data.openGraph.title) {
      issues.push({ type: 'info', text: 'Отсутствует og:title' })
      suggestions.push('Добавьте Open Graph теги для соцсетей')
      score -= 5
    }

    if (!data.openGraph.description) {
      issues.push({ type: 'info', text: 'Отсутствует og:description' })
      score -= 3
    }

    if (!data.openGraph.image) {
      issues.push({ type: 'info', text: 'Отсутствует og:image' })
      score -= 3
    }

    // Structured Data
    if (!data.hasStructuredData) {
      issues.push({ type: 'info', text: 'Отсутствуют структурированные данные (JSON-LD)' })
      suggestions.push('Добавьте Schema.org разметку для улучшения отображения в поиске')
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
    const shareUrl = `${window.location.origin}/seo-audit-pro?url=${encodeURIComponent(url)}&score=${result.score}&issues=${result.issues.length}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('✅ Ссылка скопирована в буфер обмена!\n\nОтправьте её другу, чтобы он увидел результаты анализа.')
      }).catch(() => {
        prompt('Скопируйте эту ссылку:', shareUrl)
      })
    } else {
      prompt('Скопируйте эту ссылку:', shareUrl)
    }
  }

  return (
    <>
      <SEO
        title="SEO-аудитор сайтов PRO - Анализ как в Яндекс Вебмастер"
        description="Профессиональный анализ SEO сайта: мета-теги, заголовки, изображения и структура страниц. Работает с любыми сайтами."
        path="/seo-audit-pro"
        keywords="SEO аудит, анализ сайта, проверка SEO, SEO анализ онлайн, аудит сайта, Яндекс Вебмастер"
      />

      <div className="tool-container">
        <h1>SEO-аудитор PRO</h1>
        <p>Профессиональный анализ SEO любого сайта</p>

        <div className="field">
          <label htmlFor="url">URL сайта</label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="https://example.com"
            autoFocus
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
            <strong>⚠️ Ошибка:</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{ width: '100%', marginBottom: '2rem' }}
        >
          {loading ? 'Анализируем страницу...' : 'Анализировать'}
        </button>

        {result && (
          <>
            <div className="result-box success" style={{ marginBottom: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: getScoreColor(result.score) }}>
                  {result.score}
                </div>
                <div style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>
                  SEO Оценка
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {result.score >= 80 && '✅ Отличная оптимизация'}
                  {result.score >= 60 && result.score < 80 && '⚠️ Хорошо, но есть что улучшить'}
                  {result.score < 60 && '❌ Требуется оптимизация'}
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
                  📤 Поделиться результатом
                </button>
              </div>
            </div>

            {result.issues.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Найденные проблемы</h2>
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
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Рекомендации</h2>
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
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Детали анализа</h2>
              <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <strong>Title:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.title ? `${result.data.title.substring(0, 50)}...` : 'Отсутствует'}
                    </div>
                  </div>
                  <div>
                    <strong>Description:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.description ? `${result.data.description.substring(0, 50)}...` : 'Отсутствует'}
                    </div>
                  </div>
                  <div>
                    <strong>Keywords:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.keywords || 'Отсутствуют'}
                    </div>
                  </div>
                  <div>
                    <strong>H1 заголовков:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.h1Count}
                    </div>
                  </div>
                  <div>
                    <strong>H2 заголовков:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.h2Count}
                    </div>
                  </div>
                  <div>
                    <strong>H3 заголовков:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.h3Count}
                    </div>
                  </div>
                  <div>
                    <strong>Изображений:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.imagesTotal} (без alt: {result.data.imagesWithoutAlt})
                    </div>
                  </div>
                  <div>
                    <strong>Open Graph:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.openGraph.title && result.data.openGraph.description && result.data.openGraph.image ? '✅ Настроен' : '❌ Не полностью'}
                    </div>
                  </div>
                  <div>
                    <strong>Структурированные данные:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.data.hasStructuredData ? '✅ Есть' : '❌ Нет'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Профессиональный SEO-аудит</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            SEO-аудитор PRO анализирует любые сайты без ограничений CORS. Серверная обработка позволяет
            проверять внешние сайты так же, как это делают профессиональные SEO инструменты.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Что проверяется:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Title и meta description - наличие и оптимальная длина</li>
            <li>Meta keywords - важно для Яндекса</li>
            <li>Структура заголовков H1, H2, H3</li>
            <li>Alt-атрибуты у изображений</li>
            <li>Open Graph теги для соцсетей</li>
            <li>Структурированные данные (JSON-LD)</li>
            <li>Robots meta-тег</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Преимущества PRO версии:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>✅ Работает с любыми сайтами (нет CORS ограничений)</li>
            <li>✅ Серверная обработка запросов</li>
            <li>✅ Быстрый анализ (до 10 секунд)</li>
            <li>✅ Детальные рекомендации по улучшению</li>
            <li>✅ Оценка SEO от 0 до 100 баллов</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Оценка:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>80-100 баллов - отличная SEO оптимизация</li>
            <li>60-79 баллов - хорошо, но есть что улучшить</li>
            <li>0-59 баллов - требуется серьезная оптимизация</li>
          </ul>
        </div>

        <RelatedTools currentPath="/seo-audit-pro" />
      </div>
    </>
  )
}

export default SEOAuditPro
