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
      setError(t('urlShortener.errorEmpty'))
      return
    }

    // Добавляем https:// если протокол не указан
    let urlToShorten = longUrl.trim()
    if (!urlToShorten.match(/^https?:\/\//i)) {
      urlToShorten = 'https://' + urlToShorten
    }

    if (!isValidUrl(urlToShorten)) {
      setError(t('urlShortener.errorInvalid'))
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(urlToShorten)}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.shorturl) {
        setShortUrl(data.shorturl)

        // Сохраняем в историю
        const newHistory = [
          { long: urlToShorten, short: data.shorturl, date: new Date().toISOString() },
          ...history.slice(0, 9) // Храним последние 10
        ]
        setHistory(newHistory)
        localStorage.setItem('urlShortenerHistory', JSON.stringify(newHistory))
      } else {
        setError(data.errormessage || t('urlShortener.errorFailed'))
      }
    } catch (err) {
      console.error('URL Shortener error:', err)
      setError(t('urlShortener.errorFailed'))
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
        title={t('seo.urlShortener.title')}
        description={t('seo.urlShortener.description')}
        path={`/${language}/url-shortener`}
        keywords={t('seo.urlShortener.keywords')}
      />

      <div className="tool-container">
        <h1>{t('urlShortener.title')}</h1>
        <p>{t('urlShortener.subtitle')}</p>

        <div className="field">
          <label htmlFor="longUrl">{t('urlShortener.longUrlLabel')}</label>
          <textarea
            id="longUrl"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleShorten()}
            placeholder={t('urlShortener.longUrlPlaceholder')}
            rows="3"
            style={{ resize: 'vertical', minHeight: '80px' }}
            autoFocus
          />
        </div>

        {error && <div className="error">{error}</div>}

        {shortUrl && (
          <div className="result-box success">
            <p><strong>{t('urlShortener.shortLinkLabel')}</strong></p>
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
            {loading ? t('urlShortener.shortening') : t('urlShortener.shortenButton')}
          </button>
          <button onClick={handleClear} className="secondary">
            {t('urlShortener.clearButton')}
          </button>
        </div>

        {history.length > 0 && (
          <>
            <h2 style={{ marginTop: '2rem' }}>{t('urlShortener.historyTitle')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map((item, index) => (
                <div key={index} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    {new Date(item.date).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}
                  </div>
                  <div style={{ marginBottom: '0.75rem', wordBreak: 'break-all', textAlign: 'center' }}>
                    <strong>{t('urlShortener.historyLong')}</strong> {item.long}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <strong>{t('urlShortener.historyShort')}</strong>
                    <a href={item.short} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                      {item.short}
                    </a>
                    <CopyButton text={item.short} />
                  </div>
                </div>
              ))}
              <button onClick={handleClearHistory} className="secondary" style={{ width: '100%' }}>
                {t('urlShortener.clearHistory')}
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('urlShortener.infoTitle')}
          </h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text)', lineHeight: '1.8', fontSize: '1.05rem' }}>
            {t('urlShortener.infoDescription')}
          </p>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('urlShortener.featuresTitle')}
          </h2>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '2', paddingLeft: '0.5rem' }}>
            <li>{t('urlShortener.featuresList.noRegistration')}</li>
            <li>{t('urlShortener.featuresList.instant')}</li>
            <li>{t('urlShortener.featuresList.history')}</li>
            <li>{t('urlShortener.featuresList.oneCopy')}</li>
            <li>{t('urlShortener.featuresList.anyUrl')}</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('urlShortener.howToTitle')}
          </h3>
          <ol style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '2', paddingLeft: '0.5rem' }}>
            <li>{t('urlShortener.howToList.step1')}</li>
            <li>{t('urlShortener.howToList.step2')}</li>
            <li>{t('urlShortener.howToList.step3')}</li>
          </ol>

          <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('urlShortener.whereTitle')}
          </h3>

          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '1rem' }}>
            <strong>{t('urlShortener.whereSocial')}</strong> {t('urlShortener.whereSocialDesc')}
          </p>

          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '1rem' }}>
            <strong>{t('urlShortener.whereSms')}</strong> {t('urlShortener.whereSmsDesc')}
          </p>

          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '1rem' }}>
            <strong>{t('urlShortener.whereEmail')}</strong> {t('urlShortener.whereEmailDesc')}
          </p>

          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '1rem' }}>
            <strong>{t('urlShortener.wherePrint')}</strong> {t('urlShortener.wherePrintDesc')}
          </p>

          <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('urlShortener.popularTitle')}
          </h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '0.5rem' }}>
            <li>{t('urlShortener.popularList.q1')}</li>
            <li>{t('urlShortener.popularList.q2')}</li>
            <li>{t('urlShortener.popularList.q3')}</li>
            <li>{t('urlShortener.popularList.q4')}</li>
            <li>{t('urlShortener.popularList.q5')}</li>
            <li>{t('urlShortener.popularList.q6')}</li>
          </ul>
        </div>

        <RelatedTools currentPath={`/${language}/url-shortener`} />
      </div>
    </>
  )
}

export default URLShortener
