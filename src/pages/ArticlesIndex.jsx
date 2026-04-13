import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import ToolPageShell, { ToolPageHero } from '../components/ToolPageShell'
import InlineSpinner from '../components/InlineSpinner'
import { fetchArticles } from '../lib/articlesApi'
import { preloadRoute } from '../routes/lazyPages'
import './Articles.css'

function pickCoverAlt(article, language, t) {
  if (article?.title) {
    return article.title
  }
  return language === 'en' ? 'Article cover' : t('articles.coverAlt')
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
  const [articles, setArticles] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    fetchArticles()
      .then((items) => {
        if (cancelled) {
          return
        }

        setArticles(items)
        setStatus('success')
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setStatus('error')
        setErrorMessage(t('articles.errors.list'))
      })

    return () => {
      cancelled = true
    }
  }, [t])

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

        {status === 'loading' && (
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

        {status === 'success' && articles.length > 0 && (
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
