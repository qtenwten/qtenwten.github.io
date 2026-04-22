import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useRef } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON } from '../utils/storage'

function MetaTagsGenerator() {
  const { t, language } = useLanguage()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [author, setAuthor] = useState('')
  const [url, setUrl] = useState('')
  const [image, setImage] = useState('')
  const saveTimeoutRef = useRef(null)

    useEffect(() => {
    const saved = safeGetItem('metaTagsGenerator')
    if (saved) {
      const data = safeParseJSON(saved, {})
      setTitle(data.title || '')
      setDescription(data.description || '')
      setKeywords(data.keywords || '')
      setAuthor(data.author || '')
      setUrl(data.url || '')
      setImage(data.image || '')
    }
  }, [])

  useEffect(() => {
    // Debounce localStorage saves to avoid excessive writes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      safeSetItem('metaTagsGenerator', JSON.stringify({
        title,
        description,
        keywords,
        author,
        url,
        image
      }))
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, description, keywords, author, url, image])

  const generateMetaTags = () => {
    const tags = []

    // Basic HTML meta tags
    if (title) {
      tags.push(`<title>${title}</title>`)
    }
    if (description) {
      tags.push(`<meta name="description" content="${description}">`)
    }
    if (keywords) {
      tags.push(`<meta name="keywords" content="${keywords}">`)
    }
    if (author) {
      tags.push(`<meta name="author" content="${author}">`)
    }
    tags.push(`<meta name="robots" content="index, follow">`)
    tags.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`)
    tags.push(`<meta charset="UTF-8">`)

    // Open Graph tags
    if (title) {
      tags.push(`<meta property="og:title" content="${title}">`)
    }
    if (description) {
      tags.push(`<meta property="og:description" content="${description}">`)
    }
    if (url) {
      tags.push(`<meta property="og:url" content="${url}">`)
    }
    if (image) {
      tags.push(`<meta property="og:image" content="${image}">`)
    }
    tags.push(`<meta property="og:type" content="website">`)

    // Twitter Card tags
    tags.push(`<meta name="twitter:card" content="summary_large_image">`)
    if (title) {
      tags.push(`<meta name="twitter:title" content="${title}">`)
    }
    if (description) {
      tags.push(`<meta name="twitter:description" content="${description}">`)
    }
    if (image) {
      tags.push(`<meta name="twitter:image" content="${image}">`)
    }

    return tags.join('\n')
  }

  const handleClear = () => {
    setTitle('')
    setDescription('')
    setKeywords('')
    setAuthor('')
    setUrl('')
    setImage('')
    safeRemoveItem('metaTagsGenerator')
  }

  const metaTags = generateMetaTags()

  return (
    <>
      <SEO
        title={t('seo.metaTagsGenerator.title')}
        description={t('seo.metaTagsGenerator.description')}
        path={`/${language}/meta-tags-generator`}
        keywords={t('seo.metaTagsGenerator.keywords')}
      />

      <div className="tool-container">
        <h1>{t('metaTagsGenerator.title')}</h1>
        <p>{t('metaTagsGenerator.subtitle')}</p>

        <div className="field">
          <label htmlFor="title">{t('metaTagsGenerator.titleLabel')}</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('metaTagsGenerator.titlePlaceholder')}
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            {language === 'en' ? `Recommended: 50-60 characters. Current length: ${title.length}` : `Оптимально: 50-60 символов. Текущая длина: ${title.length}`}
          </small>
        </div>

        <div className="field">
          <label htmlFor="description">{t('metaTagsGenerator.descriptionLabel')}</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('metaTagsGenerator.descriptionPlaceholder')}
            rows="3"
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            {language === 'en' ? `Recommended: 150-160 characters. Current length: ${description.length}` : `Оптимально: 150-160 символов. Текущая длина: ${description.length}`}
          </small>
        </div>

        <div className="field">
          <label htmlFor="keywords">{t('metaTagsGenerator.keywordsLabel')}</label>
          <input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={t('metaTagsGenerator.keywordsPlaceholder')}
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            {t('metaTagsGenerator.keywordsHint')}
          </small>
        </div>

        <div className="field">
          <label htmlFor="author">{t('metaTagsGenerator.authorLabel')}</label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t('metaTagsGenerator.authorPlaceholder')}
          />
        </div>

        <div className="field">
          <label htmlFor="url">{t('metaTagsGenerator.urlLabel')}</label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="field">
          <label htmlFor="image">{t('metaTagsGenerator.imageLabel')}</label>
          <input
            id="image"
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            {t('metaTagsGenerator.imageHint')}
          </small>
        </div>

        {title && description && (
          <>
            <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('metaTagsGenerator.previewTitle')}</h2>
              <div style={{
                background: 'var(--bg)',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                padding: '1.5rem',
                maxWidth: '600px'
              }}>
                <div style={{ color: '#1a0dab', fontSize: '1.125rem', marginBottom: '0.25rem', fontWeight: '500' }}>
                  {title}
                </div>
                <div style={{ color: '#006621', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {url || 'https://example.com'}
                </div>
                <div style={{ color: '#545454', fontSize: '0.875rem', lineHeight: '1.6' }}>
                  {description}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('metaTagsGenerator.generatedTitle')}</h2>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                padding: '1.5rem',
                position: 'relative'
              }}>
                <pre style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {metaTags}
                </pre>
                <div style={{ marginTop: '1rem' }}>
                  <CopyButton text={metaTags} analytics={{ toolSlug: 'meta-tags-generator', linkType: 'result' }} />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="btn-group" style={{ marginTop: '1.5rem' }}>
          <button onClick={handleClear} className="secondary">
            {t('metaTagsGenerator.clear')}
          </button>
        </div>

        <ToolDescriptionSection>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('metaTagsGenerator.infoTitle')}</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            {t('metaTagsGenerator.infoDescription')}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{t('metaTagsGenerator.basicTitle')}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {Object.values(t('metaTagsGenerator.basicItems')).map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{t('metaTagsGenerator.ogTitle')}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            {t('metaTagsGenerator.ogDescription')}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{t('metaTagsGenerator.twitterTitle')}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            {t('metaTagsGenerator.twitterDescription')}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{t('metaTagsGenerator.tipsTitle')}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {Object.values(t('metaTagsGenerator.tips')).map((item) => <li key={item}>{item}</li>)}
          </ul>

          <ToolFaq title={t('metaTagsGenerator.faqTitle')} items={Object.entries(t('metaTagsGenerator.faq')).reduce((acc, [key, val], idx) => { if (key.startsWith('q')) { const num = key.slice(1); const aKey = 'a' + num; const aVal = t('metaTagsGenerator.faq.' + aKey); acc.push({ q: val, a: aVal || '' }); } return acc; }, []).filter(item => item.q && item.a)} />
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/meta-tags-generator`} />
      </div>
    </>
  )
}

export default MetaTagsGenerator
