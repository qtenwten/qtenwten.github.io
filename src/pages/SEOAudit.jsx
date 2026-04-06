import { useState } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import { analyzeSEO } from '../utils/seoAudit'

function SEOAudit() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Введите URL для анализа')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const analysis = await analyzeSEO(url)

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
      setError('Ошибка при анализе сайта. Проверьте URL и попробуйте снова.')
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
        title="SEO Аудит сайта онлайн - Проверка SEO оптимизации"
        description="Бесплатный инструмент для SEO аудита сайта. Проверка meta-тегов, заголовков, изображений и Open Graph."
        path="/seo-audit"
      />

      <div className="tool-container">
        <h1>SEO Аудит сайта</h1>
        <p>Проверьте SEO оптимизацию вашего сайта</p>

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
            <strong>⚠️ Ограничение:</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>{error}</p>
            <p style={{ marginTop: '0.5rem', marginBottom: '0', fontSize: '0.9rem' }}>
              💡 <strong>Совет:</strong> Этот инструмент работает только для сайтов без CORS ограничений.
              Для полного анализа внешних сайтов рекомендуем использовать серверные инструменты или расширения браузера.
            </p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{ width: '100%', marginBottom: '2rem' }}
        >
          {loading ? 'Анализ...' : 'Анализировать'}
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
                      {result.details.title ? `${result.details.title.substring(0, 50)}...` : 'Отсутствует'}
                    </div>
                  </div>
                  <div>
                    <strong>H1 заголовков:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.h1Count}
                    </div>
                  </div>
                  <div>
                    <strong>H2 заголовков:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.h2Count}
                    </div>
                  </div>
                  <div>
                    <strong>Изображений:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.imagesTotal} (без alt: {result.details.imagesWithoutAlt})
                    </div>
                  </div>
                  <div>
                    <strong>Open Graph:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.hasOG ? '✅ Настроен' : '❌ Отсутствует'}
                    </div>
                  </div>
                  <div>
                    <strong>Структурированные данные:</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {result.details.hasStructuredData ? '✅ Есть' : '❌ Нет'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как пользоваться SEO аудитом</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Инструмент для быстрой проверки базовых SEO параметров сайта. Анализирует meta-теги,
            заголовки, изображения и Open Graph разметку.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Что проверяется:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Title и meta description - наличие и оптимальная длина</li>
            <li>Структура заголовков H1, H2, H3</li>
            <li>Alt-атрибуты у изображений</li>
            <li>Open Graph теги для соцсетей</li>
            <li>Структурированные данные (JSON-LD)</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Ограничения:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            Инструмент работает на стороне клиента и может анализировать только сайты без CORS ограничений.
            Для полного анализа внешних сайтов используйте серверные инструменты SEO аудита.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Оценка:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>80-100 баллов - отличная SEO оптимизация</li>
            <li>60-79 баллов - хорошо, но есть что улучшить</li>
            <li>0-59 баллов - требуется серьезная оптимизация</li>
          </ul>
        </div>

        <RelatedTools currentPath="/seo-audit" />
      </div>
    </>
  )
}

export default SEOAudit
