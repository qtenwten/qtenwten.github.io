import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import InlineSpinner from '../components/InlineSpinner'
import { useAsyncRequest } from '../hooks/useAsyncRequest'
import { ResultActions, ResultSection, ResultSummary } from '../components/ResultSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolRelated } from '../components/ToolPageShell'
import { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON } from '../utils/storage'

function URLShortener() {
  const { t, language } = useLanguage()
  const { runRequest } = useAsyncRequest()
  const [longUrl, setLongUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  useEffect(() => {
    const saved = safeGetItem('urlShortenerHistory')
    if (saved) {
      setHistory(safeParseJSON(saved, []))
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
    if (loading) {
      return
    }

    setError('')
    setShortUrl('')

    if (!longUrl.trim()) {
      setError(t('urlShortener.errorEmpty'))
      return
    }

    // Add https:// only if no protocol scheme is present
    let urlToShorten = longUrl.trim()
    if (!urlToShorten.includes('://')) {
      urlToShorten = 'https://' + urlToShorten
    }

    if (!isValidUrl(urlToShorten)) {
      setError(t('urlShortener.errorInvalid'))
      return
    }

    setLoading(true)

    const outcome = await runRequest(async ({ signal, isCurrent }) => {
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(urlToShorten)}`, { signal })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.shorturl) {
        throw new Error(data.errormessage || t('urlShortener.errorFailed'))
      }

      if (!isCurrent()) {
        return null
      }

      return {
        shortUrl: data.shorturl,
        longUrl: urlToShorten,
        date: new Date().toISOString(),
      }
    })

    if (outcome.status === 'success' && outcome.result) {
      setShortUrl(outcome.result.shortUrl)
      setHistory((prevHistory) => {
        const newHistory = [
          { long: outcome.result.longUrl, short: outcome.result.shortUrl, date: outcome.result.date },
          ...prevHistory.slice(0, 9)
        ]
        safeSetItem('urlShortenerHistory', JSON.stringify(newHistory))
        return newHistory
      })
    } else if (outcome.status === 'error' && outcome.error?.name !== 'AbortError') {
      console.error('URL Shortener error:', outcome.error)
      setError(outcome.error?.message || t('urlShortener.errorFailed'))
    }

    setLoading(false)
  }

  const handleClear = () => {
    setLongUrl('')
    setShortUrl('')
    setError('')
  }

  const handleClearHistory = () => {
    setHistory([])
    safeRemoveItem('urlShortenerHistory')
  }

  const faqItems = t('urlShortener.faqTitle')
    ? [
        { q: t('urlShortener.faqList.q1'), a: t('urlShortener.faqList.a1') },
        { q: t('urlShortener.faqList.q2'), a: t('urlShortener.faqList.a2') },
        { q: t('urlShortener.faqList.q3'), a: t('urlShortener.faqList.a3') },
        { q: t('urlShortener.faqList.q4'), a: t('urlShortener.faqList.a4') },
      ]
    : []

  return (
    <>
      <SEO
        title={t('seo.urlShortener.title')}
        description={t('seo.urlShortener.description')}
        path={`/${language}/url-shortener`}
        keywords={t('seo.urlShortener.keywords')}
      />

      <ToolPageShell>
        <ToolPageHero title={t('urlShortener.title')} subtitle={t('urlShortener.subtitle')} />

        <ToolControls>
        <div className="field">
          <label htmlFor="longUrl">{t('urlShortener.longUrlLabel')}</label>
          <textarea
            id="longUrl"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleShorten()}
            placeholder={t('urlShortener.longUrlPlaceholder')}
            rows="3"
            style={{ resize: 'vertical', minHeight: '80px' }}
          />
        </div>

        {error && <div className="error">{error}</div>}

        {shortUrl && (
          <ResultSection tone="success">
            <ResultSummary
              kicker={t('urlShortener.shortLinkLabel')}
              title={<a href={shortUrl} target="_blank" rel="noopener noreferrer" className="inline-link">{shortUrl}</a>}
            />
            <ResultActions>
              <CopyButton text={shortUrl} analytics={{ toolSlug: 'url-shortener', linkType: 'result' }} />
            </ResultActions>
          </ResultSection>
        )}

        <div className="btn-group">
          <button onClick={handleShorten} disabled={loading}>
            {loading ? (
              <span className="button-spinner">
                <InlineSpinner label={t('urlShortener.shortening')} />
              </span>
            ) : t('urlShortener.shortenButton')}
          </button>
          <button onClick={handleClear} className="secondary">
            {t('urlShortener.clearButton')}
          </button>
        </div>

        {history.length > 0 && (
          <>
            <h2 style={{ marginTop: '2rem' }}>{t('urlShortener.historyTitle')}</h2>
            <div className="stack-list">
              {history.map((item, index) => (
                <ResultSection key={index} className="surface-panel--subtle">
                  <div className="meta-item-value" style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                    {new Date(item.date).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}
                  </div>
                  <div className="meta-item-value" style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                    <strong>{t('urlShortener.historyLong')}</strong> {item.long}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <strong>{t('urlShortener.historyShort')}</strong>
                    <a href={item.short} target="_blank" rel="noopener noreferrer" className="inline-link">
                      {item.short}
                    </a>
                    <CopyButton text={item.short} />
                  </div>
                </ResultSection>
              ))}
              <button onClick={handleClearHistory} className="secondary" style={{ width: '100%' }}>
                {t('urlShortener.clearHistory')}
              </button>
            </div>
          </>
        )}
        </ToolControls>

        <ToolHelp>
        <ToolDescriptionSection>
          <div className="tool-help-prose">
          <h2 className="tool-help-heading">
            {t('urlShortener.infoTitle')}
          </h2>
          <p>
            {t('urlShortener.infoDescription')}
          </p>

          <h2 className="tool-help-heading">
            {t('urlShortener.featuresTitle')}
          </h2>
          <ul>
            <li>{t('urlShortener.featuresList.noRegistration')}</li>
            <li>{t('urlShortener.featuresList.instant')}</li>
            <li>{t('urlShortener.featuresList.history')}</li>
            <li>{t('urlShortener.featuresList.oneCopy')}</li>
            <li>{t('urlShortener.featuresList.anyUrl')}</li>
          </ul>

          <h3 className="tool-help-subheading">
            {t('urlShortener.howToTitle')}
          </h3>
          <ol>
            <li>{t('urlShortener.howToList.step1')}</li>
            <li>{t('urlShortener.howToList.step2')}</li>
            <li>{t('urlShortener.howToList.step3')}</li>
          </ol>

          <h3 className="tool-help-subheading">
            {t('urlShortener.whereTitle')}
          </h3>

          <div className="tool-description-paragraph-stack">
            <p>
              <strong>{t('urlShortener.whereSocial')}</strong> {t('urlShortener.whereSocialDesc')}
            </p>

            <p>
              <strong>{t('urlShortener.whereSms')}</strong> {t('urlShortener.whereSmsDesc')}
            </p>

            <p>
              <strong>{t('urlShortener.whereEmail')}</strong> {t('urlShortener.whereEmailDesc')}
            </p>

            <p>
              <strong>{t('urlShortener.wherePrint')}</strong> {t('urlShortener.wherePrintDesc')}
            </p>
          </div>

          <h3 className="tool-help-subheading">
            {t('urlShortener.popularTitle')}
          </h3>
          <ul>
            <li>{t('urlShortener.popularList.q1')}</li>
            <li>{t('urlShortener.popularList.q2')}</li>
            <li>{t('urlShortener.popularList.q3')}</li>
            <li>{t('urlShortener.popularList.q4')}</li>
            <li>{t('urlShortener.popularList.q5')}</li>
            <li>{t('urlShortener.popularList.q6')}</li>
          </ul>

          {t('urlShortener.faqTitle') && (
            <>
              <ToolFaq title={t('urlShortener.faqTitle')} items={faqItems} />
            </>
          )}
          </div>
        </ToolDescriptionSection>

        </ToolHelp>

        <ToolRelated>
          <RelatedTools currentPath={`/${language}/url-shortener`} />
        </ToolRelated>
      </ToolPageShell>
    </>
  )
}

export default URLShortener
