import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'

function URLShortener() {
  const { t, language } = useLanguage()
  const [longUrl, setLongUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('urlShortenerHistory')
    if (saved) {
      setHistory(JSON.parse(saved))
    }
  }, [])

  const isValidUrl = (url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleShorten = async () => {
    setError('')
    setShortUrl('')

    if (!longUrl.trim()) {
      setError('Введите ссылку для сокращения')
      return
    }

    if (!isValidUrl(longUrl)) {
      setError('Введите корректную ссылку (например: https://example.com)')
      return
    }

    setLoading(true)

    try {
      // Используем is.gd API - бесплатный сервис без регистрации
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`)
      const data = await response.json()

      if (data.shorturl) {
        setShortUrl(data.shorturl)

        // Сохраняем в историю
        const newHistory = [
          { long: longUrl, short: data.shorturl, date: new Date().toISOString() },
          ...history.slice(0, 9) // Храним последние 10
        ]
        setHistory(newHistory)
        localStorage.setItem('urlShortenerHistory', JSON.stringify(newHistory))
      } else {
        setError(data.errormessage || 'Ошибка при сокращении ссылки')
      }
    } catch (err) {
      setError('Не удалось сократить ссылку. Проверьте подключение к интернету.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setLongUrl('')
    setShortUrl('')
    setError('')
  }

  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem('urlShortenerHistory')
  }

  return (
    <>
      <SEO
        title="Сокращатель ссылок онлайн - Короткие ссылки бесплатно"
        description="Бесплатный сокращатель ссылок онлайн. Создайте короткую ссылку для соцсетей, SMS, email. Быстро и без регистрации."
        path={`/${language}/urlShortener`}
        keywords="сокращатель ссылок, короткие ссылки, сократить ссылку онлайн, url shortener, короткая ссылка"
      />

      <div className="tool-container">
        <h1>🔗 Сокращатель ссылок</h1>
        <p>Создайте короткую ссылку бесплатно</p>

        <div className="field">
          <label htmlFor="longUrl">Длинная ссылка</label>
          <textarea
            id="longUrl"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleShorten()}
            placeholder="https://example.com/very/long/url/path"
            rows="3"
            style={{ resize: 'vertical', minHeight: '80px' }}
            autoFocus
          />
        </div>

        {error && <div className="error">{error}</div>}

        {shortUrl && (
          <div className="result-box success">
            <p><strong>Короткая ссылка:</strong></p>
            <div className="result-value" style={{ fontSize: '1.25rem', wordBreak: 'break-all' }}>
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                {shortUrl}
              </a>
            </div>
            <CopyButton text={shortUrl} />
          </div>
        )}

        <div className="btn-group">
          <button onClick={handleShorten} disabled={loading}>
            {loading ? 'Сокращаем...' : 'Сократить ссылку'}
          </button>
          <button onClick={handleClear} className="secondary">
            Очистить
          </button>
        </div>

        {history.length > 0 && (
          <>
            <h2 style={{ marginTop: '2rem' }}>История сокращений</h2>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
              {history.map((item, index) => (
                <div key={index} style={{
                  padding: '1rem 0',
                  borderBottom: index < history.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {new Date(item.date).toLocaleString('ru-RU')}
                  </div>
                  <div style={{ marginBottom: '0.25rem', wordBreak: 'break-all' }}>
                    <strong>Длинная:</strong> {item.long}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>Короткая:</strong>
                    <a href={item.short} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                      {item.short}
                    </a>
                    <CopyButton text={item.short} />
                  </div>
                </div>
              ))}
              <button onClick={handleClearHistory} className="secondary" style={{ marginTop: '1rem', width: '100%' }}>
                Очистить историю
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как пользоваться сокращателем ссылок</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Бесплатный онлайн сокращатель ссылок для создания коротких URL. Идеально для соцсетей,
            SMS, email рассылок и любых мест, где важна длина ссылки.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Возможности:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Сокращение ссылок без регистрации</li>
            <li>Мгновенное создание короткой ссылки</li>
            <li>История последних 10 сокращений</li>
            <li>Кнопка быстрого копирования</li>
            <li>Работает с любыми URL</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Популярные запросы:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Сокращатель ссылок онлайн бесплатно</li>
            <li>Как сократить ссылку</li>
            <li>Короткая ссылка генератор</li>
            <li>URL shortener русский</li>
            <li>Сократить длинную ссылку</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Примеры использования:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>Для соцсетей:</strong> Сократите длинную ссылку для постов в Instagram, Twitter, VK.
            Короткие ссылки выглядят аккуратнее и не занимают много места.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Для SMS:</strong> В SMS ограничено количество символов. Короткая ссылка экономит место
            и делает сообщение читабельнее.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Для печатных материалов:</strong> Разместите короткую ссылку на визитке, флаере или
            рекламном баннере - её легко запомнить и набрать вручную.
          </p>
        </div>

        <RelatedTools currentPath={`/${language}/urlShortener`} />
      </div>
    </>
  )
}

export default URLShortener
