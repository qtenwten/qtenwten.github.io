import { useState, useEffect, useRef } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'

function MetaTagsGenerator() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [author, setAuthor] = useState('')
  const [url, setUrl] = useState('')
  const [image, setImage] = useState('')
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('metaTagsGenerator')
    if (saved) {
      const data = JSON.parse(saved)
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
      localStorage.setItem('metaTagsGenerator', JSON.stringify({
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
    localStorage.removeItem('metaTagsGenerator')
  }

  const metaTags = generateMetaTags()

  return (
    <>
      <SEO
        title="Генератор мета-тегов для SEO - Яндекс и Google"
        description="Создавайте мета-теги и ключевые слова для продвижения сайта в Яндексе и Google. Генератор Open Graph и Twitter Cards."
        path="/meta-tags-generator"
        keywords="генератор мета-тегов, мета-теги, SEO теги, Open Graph, Twitter Cards, keywords, description"
      />

      <div className="tool-container">
        <h1>Генератор мета-тегов</h1>
        <p>Создайте SEO мета-теги для вашего сайта</p>

        <div className="field">
          <label htmlFor="title">Заголовок страницы (Title)</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Лучший онлайн калькулятор - Бесплатные инструменты"
            autoFocus
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            Оптимально: 50-60 символов. Текущая длина: {title.length}
          </small>
        </div>

        <div className="field">
          <label htmlFor="description">Описание (Description)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Бесплатные онлайн калькуляторы: НДС, сумма прописью, генератор чисел. Быстрые расчеты без регистрации."
            rows="3"
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            Оптимально: 150-160 символов. Текущая длина: {description.length}
          </small>
        </div>

        <div className="field">
          <label htmlFor="keywords">Ключевые слова (Keywords)</label>
          <input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="калькулятор, НДС, онлайн, бесплатно"
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            Важно для Яндекса. Разделяйте запятыми.
          </small>
        </div>

        <div className="field">
          <label htmlFor="author">Автор (необязательно)</label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Имя автора или компании"
          />
        </div>

        <div className="field">
          <label htmlFor="url">URL страницы</label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="field">
          <label htmlFor="image">URL изображения для соцсетей</label>
          <input
            id="image"
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            Рекомендуемый размер: 1200x630 пикселей
          </small>
        </div>

        {title && description && (
          <>
            <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Превью в поисковой выдаче</h2>
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
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Сгенерированные мета-теги</h2>
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
            Очистить
          </button>
        </div>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как использовать генератор мета-тегов</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Генератор мета-тегов помогает создать правильные SEO теги для продвижения сайта в Яндексе и Google.
            Заполните поля и скопируйте готовый код в секцию &lt;head&gt; вашего сайта.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Основные мета-теги:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li><strong>Title</strong> - заголовок страницы (50-60 символов)</li>
            <li><strong>Description</strong> - описание страницы (150-160 символов)</li>
            <li><strong>Keywords</strong> - ключевые слова (важно для Яндекса)</li>
            <li><strong>Robots</strong> - инструкции для поисковых роботов</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Open Graph теги:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            Open Graph теги определяют, как ваша страница будет отображаться при публикации в социальных сетях
            (ВКонтакте, Facebook, Telegram). Обязательно укажите изображение размером 1200x630 пикселей.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Twitter Cards:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            Twitter Cards управляют отображением ссылок в Twitter. Генератор создает теги для карточки
            с большим изображением (summary_large_image).
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Советы по оптимизации:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Используйте уникальные title и description для каждой страницы</li>
            <li>Включайте ключевые слова в начало заголовка</li>
            <li>Пишите описания, которые побуждают к клику</li>
            <li>Для Яндекса обязательно заполняйте keywords</li>
            <li>Проверяйте длину текста - слишком длинные теги обрезаются</li>
          </ul>
        </div>

        <RelatedTools currentPath="/meta-tags-generator" />
      </div>
    </>
  )
}

export default MetaTagsGenerator
