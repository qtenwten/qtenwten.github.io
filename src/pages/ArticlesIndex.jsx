import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import ToolPageShell, { ToolPageHero } from '../components/ToolPageShell'
import InlineSpinner from '../components/InlineSpinner'
import { fetchArticles } from '../lib/articlesApi'
import { preloadRoute } from '../routes/lazyPages'
import './Articles.css'

const ARTICLES_CACHE_KEY = 'qsen:articles:index:v1'
const ARTICLES_CACHE_TTL_MS = 10 * 60 * 1000

function pickCoverAlt(article, language, t) {
  if (article?.title) {
    return article.title
  }
  return language === 'en' ? 'Article cover' : t('articles.coverAlt')
}

function readInitialArticlesFromDom() {
  if (typeof document === 'undefined') return []
  const el = document.getElementById('__ARTICLES_INDEX_DATA__')
  if (!el) return []
  try {
    const parsed = JSON.parse(el.textContent || '{}')
    return Array.isArray(parsed?.items) ? parsed.items : []
  } catch {
    return []
  }
}

function readCachedArticles() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(ARTICLES_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.items) || typeof parsed?.ts !== 'number') return []
    if (Date.now() - parsed.ts > ARTICLES_CACHE_TTL_MS) return []
    return parsed.items
  } catch {
    return []
  }
}

function writeCachedArticles(items) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify({ ts: Date.now(), items }))
  } catch {
    // ignore
  }
}

function formatPublishedDate(value, language) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function ArticlesIndex() {
  const { t, language } = useLanguage()
  const [articles, setArticles] = useState(() => {
    const initial = readInitialArticlesFromDom()
    if (initial.length) return initial
    return readCachedArticles()
  })
  const [status, setStatus] = useState(() => (readInitialArticlesFromDom().length || readCachedArticles().length ? 'success' : 'loading'))
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    const hasVisibleData = articles.length > 0

    if (!hasVisibleData) {
      setStatus('loading')
    }

    fetchArticles()
      .then((items) => {
        if (cancelled) {
          return
        }

        setArticles(items)
        setStatus('success')
        writeCachedArticles(items)
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        if (!hasVisibleData) {
          setStatus('error')
          setErrorMessage(t('articles.errors.list'))
        }
      })

    return () => {
      cancelled = true
    }
  }, [t, articles.length])

  const showSkeleton = status === 'loading' && articles.length === 0

  return (
    <>
      <SEO
        title={t('seo.articles.title')}
        description={t('seo.articles.description')}
        keywords={t('seo.articles.keywords')}
        path={`/${language}/articles`}
      />

      <ToolPageShell className="articles-page">
        <ToolPageHero
          eyebrow={t('articles.eyebrow')}
          title={t('articles.title')}
          subtitle={t('articles.subtitle')}
          note={t('articles.note')}
          className="articles-hero"
        />

        {showSkeleton && (
          <section className="articles-grid articles-grid--skeleton" aria-label={t('articles.listAriaLabel')}>
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={`skeleton-${index}`} className="article-card article-card--skeleton" aria-hidden="true">
                <div className="article-skeleton__media" />
                <div className="article-skeleton__meta" />
                <div className="article-skeleton__title" />
                <div className="article-skeleton__excerpt" />
              </article>
            ))}
          </section>
        )}

        {status === 'loading' && !showSkeleton && (
          <section className="articles-list-state" role="status" aria-live="polite">
            <InlineSpinner label={t('articles.loading')} />
            <p>{t('articles.loading')}</p>
          </section>
        )}

        {status === 'error' && (
          <section className="articles-list-state articles-list-state--error" role="alert">
            <h2>{t('articles.errorTitle')}</h2>
            <p>{errorMessage}</p>
          </section>
        )}

        {status === 'success' && articles.length === 0 && (
          <section className="articles-list-state">
            <h2>{t('articles.emptyTitle')}</h2>
            <p>{t('articles.emptyDescription')}</p>
          </section>
        )}

        {articles.length > 0 && (
          <section className="articles-grid" aria-label={t('articles.listAriaLabel')}>
            {articles.map((article) => {
              const articlePath = `/${language}/articles/${article.slug}`

              return (
                <article key={article.id || article.slug} className="article-card">
                  {article.coverImage ? (
                    <Link
                      to={articlePath}
                      className="article-card__media"
                      aria-label={article.title}
                      onMouseEnter={() => preloadRoute('/articles')}
                      onFocus={() => preloadRoute('/articles')}
                      onTouchStart={() => preloadRoute('/articles')}
                    >
                      <img
                        src={article.coverImage}
                        alt={pickCoverAlt(article, language, t)}
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>
                  ) : null}

                  <div className="article-card__meta">
                    <span>{article.author || t('articles.unknownAuthor')}</span>
                    {article.publishedAt ? <span>{formatPublishedDate(article.publishedAt, language)}</span> : null}
                  </div>

                  <h2 className="article-card__title">
                    <Link
                      to={articlePath}
                      className="article-card__link"
                      onMouseEnter={() => preloadRoute('/articles')}
                      onFocus={() => preloadRoute('/articles')}
                      onTouchStart={() => preloadRoute('/articles')}
                    >
                      {article.title}
                    </Link>
                  </h2>

                  {article.excerpt ? <p className="article-card__excerpt">{article.excerpt}</p> : null}

                  <div className="article-card__actions">
                    <Link to={articlePath} className="article-card__read-more">
                      {t('articles.readMore')}
                    </Link>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </ToolPageShell>
    </>
  )
}

export default ArticlesIndex
