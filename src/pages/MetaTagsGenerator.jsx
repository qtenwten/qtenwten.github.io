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

  const copy = language === 'en'
    ? {
        seo: {
          title: 'Meta Tags Generator | Create SEO Meta Tags Online',
          description: 'Create title tags, meta descriptions, Open Graph tags, and Twitter cards for any page. Fast, simple, and ready to copy into your site.',
          keywords: 'meta tags generator, seo meta tags, title tag generator, meta description generator, open graph generator'
        },
        title: 'Meta Tags Generator',
        subtitle: 'Create title tags, meta descriptions, and Open Graph tags fast',
        titleLabel: 'Page Title',
        titlePlaceholder: 'Free VAT Calculator Online | Add, Remove, and Extract VAT',
        titleHint: (length) => `Recommended: 50-60 characters. Current length: ${length}`,
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'Use this free VAT calculator online to add VAT, remove VAT from a total amount, or calculate the tax portion in seconds.',
        descriptionHint: (length) => `Recommended: 150-160 characters. Current length: ${length}`,
        keywordsLabel: 'Keywords',
        keywordsPlaceholder: 'vat calculator, add vat, remove vat, vat calculator online',
        keywordsHint: 'Use a few relevant keyword variations, separated by commas.',
        authorLabel: 'Author (optional)',
        authorPlaceholder: 'Author or company name',
        urlLabel: 'Page URL',
        imageLabel: 'Social image URL',
        imageHint: 'Recommended size: 1200x630 pixels',
        previewTitle: 'Search preview',
        generatedTitle: 'Generated meta tags',
        clear: 'Clear',
        infoTitle: 'Build SEO meta tags for any page in minutes',
        infoDescription: 'Use this meta tags generator to create clean, ready-to-copy title tags, meta descriptions, Open Graph tags, and Twitter cards. It is a quick way to draft metadata for landing pages, articles, product pages, and tool pages.',
        basicTitle: 'What you can generate:',
        basicItems: [
          'Title tags for search results and browser tabs',
          'Meta descriptions for clearer search snippets',
          'Keyword fields for projects that still use them',
          'Robots directives for basic crawl instructions'
        ],
        ogTitle: 'Open Graph tags:',
        ogDescription: 'Open Graph tags control how your page appears when someone shares it in messaging apps and social networks. Add a clear title, description, and image to improve click-through rate.',
        twitterTitle: 'Twitter Cards:',
        twitterDescription: 'Twitter card tags help links look cleaner on X/Twitter and in tools that support Twitter metadata.',
        tipsTitle: 'What strong pages usually do:',
        tips: [
          'Use unique metadata for each page instead of one site-wide template',
          'Place the main keyword early in the title when it fits naturally',
          'Write descriptions that explain value and encourage clicks',
          'Keep titles and descriptions within clean, readable lengths',
          'Add social metadata when the page will be shared in chat or social apps'
        ],
        faqTitle: 'FAQ',
        faq: [
          { q: 'How do I create meta tags for a page?', a: 'Fill in the title, description, and other fields, then copy the generated code into the head section of your page.' },
          { q: 'What is the ideal title tag length?', a: 'A common best practice is about 50-60 characters, depending on the query and page intent.' },
          { q: 'Why do I need Open Graph tags?', a: 'Open Graph tags improve how a page looks when it is shared in messaging apps and social networks.' },
          { q: 'Can I use this tool for product pages and blog posts?', a: 'Yes. It works well for landing pages, articles, category pages, tools, and product pages.' }
        ]
      }
    : {
        seo: {
          title: 'Генератор мета-тегов для сайта — title, description, Open Graph',
          description: 'Генератор мета-тегов для сайта: title, description, keywords, Open Graph и Twitter Card. Помогает быстро подготовить SEO-теги для Яндекса и Google.',
          keywords: 'генератор мета тегов, генератор мета тегов для сайта, title description keywords, open graph генератор, meta description'
        },
        title: 'Генератор мета-тегов онлайн',
        subtitle: 'Создайте title, description, keywords и Open Graph для страницы сайта',
        titleLabel: 'Title страницы',
        titlePlaceholder: 'Калькулятор НДС онлайн — выделить и начислить НДС',
        titleHint: (length) => `Оптимально: 50-60 символов. Текущая длина: ${length}`,
        descriptionLabel: 'Описание (Description)',
        descriptionPlaceholder: 'Калькулятор НДС онлайн для быстрого расчета налога: выделить НДС из суммы, начислить сверху и получить точный результат за секунды.',
        descriptionHint: (length) => `Оптимально: 150-160 символов. Текущая длина: ${length}`,
        keywordsLabel: 'Ключевые слова (Keywords)',
        keywordsPlaceholder: 'калькулятор ндс, выделить ндс, начислить ндс, ндс онлайн',
        keywordsHint: 'Важно для Яндекса. Разделяйте запятыми.',
        authorLabel: 'Автор (необязательно)',
        authorPlaceholder: 'Имя автора или компании',
        urlLabel: 'URL страницы',
        imageLabel: 'URL изображения для соцсетей',
        imageHint: 'Рекомендуемый размер: 1200x630 пикселей',
        previewTitle: 'Превью в поисковой выдаче',
        generatedTitle: 'Сгенерированные мета-теги',
        clear: 'Очистить',
        infoTitle: 'Как использовать генератор мета-тегов для сайта',
        infoDescription: 'Генератор мета-тегов помогает быстро подготовить SEO-теги для страницы сайта: title, description, keywords, Open Graph и Twitter Card. Это удобно, когда нужно оформить мета-теги под Яндекс и Google без ручной верстки.',
        basicTitle: 'Какие мета-теги здесь можно создать:',
        basicItems: [
          'Title — заголовок страницы для поисковой выдачи и вкладки браузера',
          'Description — описание страницы для сниппета в Яндексе и Google',
          'Keywords — список ключевых слов, который до сих пор используют в части проектов под Яндекс',
          'Robots — базовые инструкции для поисковых роботов'
        ],
        ogTitle: 'Open Graph теги для соцсетей:',
        ogDescription: 'Open Graph влияет на то, как ссылка выглядит в Telegram, ВКонтакте, Facebook и других соцсетях. Правильные OG-теги помогают получить понятный заголовок, описание и превью изображения.',
        twitterTitle: 'Twitter Cards:',
        twitterDescription: 'Twitter Cards пригодятся, если страницу нужно корректно показывать в X/Twitter и сервисах, которые поддерживают этот формат карточек.',
        tipsTitle: 'Что обычно делают страницы из топа Яндекса:',
        tips: [
          'Используют уникальные title и description для каждой страницы, а не шаблон на весь сайт',
          'Ставят основной ключ ближе к началу title, но без переспама',
          'Пишут description как короткое обещание пользы, а не набор ключевых слов',
          'Заполняют Open Graph, если страницу будут отправлять в соцсети и мессенджеры',
          'Проверяют длину, чтобы сниппет не обрезался в выдаче'
        ],
        faqTitle: 'FAQ',
        faq: [
          { q: 'Как сделать meta title и description для страницы?', a: 'Заполните поля title и description, после чего генератор сразу подготовит готовые мета-теги для вставки в код страницы.' },
          { q: 'Нужны ли keywords для Яндекса?', a: 'В большинстве случаев они не ключевой фактор, но для части проектов под Яндекс их все еще используют как дополнительный сигнал.' },
          { q: 'Зачем нужны Open Graph теги?', a: 'Они отвечают за красивое превью ссылки в Telegram, ВКонтакте, Facebook и других соцсетях.' },
          { q: 'Подходит ли генератор для SEO-оптимизации сайта?', a: 'Да, он помогает быстро подготовить базовые SEO-теги для новой страницы, статьи, каталога или лендинга.' }
        ]
      }

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
        title={copy.seo.title}
        description={copy.seo.description}
        path={`/${language}/meta-tags-generator`}
        keywords={copy.seo.keywords}
      />

      <div className="tool-container">
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>

        <div className="field">
          <label htmlFor="title">{copy.titleLabel}</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={copy.titlePlaceholder}
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            {copy.titleHint(title.length)}
          </small>
        </div>

        <div className="field">
          <label htmlFor="description">{copy.descriptionLabel}</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={copy.descriptionPlaceholder}
            rows="3"
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            {copy.descriptionHint(description.length)}
          </small>
        </div>

        <div className="field">
          <label htmlFor="keywords">{copy.keywordsLabel}</label>
          <input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={copy.keywordsPlaceholder}
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            {copy.keywordsHint}
          </small>
        </div>

        <div className="field">
          <label htmlFor="author">{copy.authorLabel}</label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={copy.authorPlaceholder}
          />
        </div>

        <div className="field">
          <label htmlFor="url">{copy.urlLabel}</label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="field">
          <label htmlFor="image">{copy.imageLabel}</label>
          <input
            id="image"
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            {copy.imageHint}
          </small>
        </div>

        {title && description && (
          <>
            <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{copy.previewTitle}</h2>
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
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{copy.generatedTitle}</h2>
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
                  <CopyButton text={metaTags} />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="btn-group" style={{ marginTop: '1.5rem' }}>
          <button onClick={handleClear} className="secondary">
            {copy.clear}
          </button>
        </div>

        <ToolDescriptionSection>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{copy.infoTitle}</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            {copy.infoDescription}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.basicTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.basicItems.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.ogTitle}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.ogDescription}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.twitterTitle}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.twitterDescription}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.tipsTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.tips.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <ToolFaq title={copy.faqTitle} items={copy.faq || []} />
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/meta-tags-generator`} />
      </div>
    </>
  )
}

export default MetaTagsGenerator
