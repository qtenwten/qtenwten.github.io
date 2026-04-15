import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import ToolPageShell, { ToolPageHero } from '../components/ToolPageShell'
import InlineSpinner from '../components/InlineSpinner'
import {
  fetchArticles,
  readCachedArticlesIndex,
  readInitialArticlesIndex,
  writeCachedArticlesIndex,
} from '../lib/articlesApi'
import { filterArticlesForLanguage } from '../lib/articleLanguage'
import { preloadRoute } from '../routes/lazyPages'
import './Articles.css'

function pickCoverAlt(article, language, t) {
  if (article?.title) {
    return article.title
  }
  return language === 'en' ? 'Article cover' : t('articles.coverAlt')
}

function ArticlesIndex() {
  const { t, language } = useLanguage()
  const initialArticles = readInitialArticlesIndex(language)
  const cachedArticles = initialArticles.length ? [] : readCachedArticlesIndex(language)
  const bootstrapArticles = initialArticles.length ? initialArticles : cachedArticles
  const [articles, setArticles] = useState(() => {
    return bootstrapArticles
  })
  const [status, setStatus] = useState(() => (bootstrapArticles.length ? 'success' : 'loading'))
  const [errorMessage, setErrorMessage] = useState('')
  const visibleArticles = filterArticlesForLanguage(articles, language)

  useEffect(() => {
    let cancelled = false
    const hasVisibleData = visibleArticles.length > 0
    let refreshTimerId = 0

    if (!hasVisibleData) {
      setStatus('loading')
    }

    const runRefresh = () => fetchArticles(language)
      .then((items) => {
        if (cancelled) {
          return
        }

        setArticles(items)
        setStatus('success')
        writeCachedArticlesIndex(items)
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

    if (hasVisibleData) {
      refreshTimerId = window.setTimeout(runRefresh, 1800)
    } else {
      runRefresh()
    }

    return () => {
      cancelled = true
      window.clearTimeout(refreshTimerId)
    }
  }, [language, t, visibleArticles.length])

  const showSkeleton = status === 'loading' && visibleArticles.length === 0
  const featuredArticle = visibleArticles[0] || null
  const sidebarArticles = visibleArticles.slice(1, 4)
  const editorialArticles = visibleArticles.slice(1, 7)

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

        {status === 'success' && visibleArticles.length === 0 && (
          <section className="articles-list-state">
            <h2>{t('articles.emptyTitle')}</h2>
            <p>{t('articles.emptyDescription')}</p>
          </section>
        )}

        {visibleArticles.length > 0 && (
          <div className="articles-hub">
            {featuredArticle && (
              <section className="articles-featured-layout" aria-label={t('articles.listAriaLabel')}>
                <article className="articles-featured-card">
                  <div className="articles-featured-card__label">{t('articles.featuredLabel')}</div>
                  <h2 className="articles-featured-card__title">
                    <Link to={`/${language}/articles/${featuredArticle.slug}`}>{featuredArticle.title}</Link>
                  </h2>
                  {featuredArticle.excerpt ? <p className="articles-featured-card__excerpt">{featuredArticle.excerpt}</p> : null}
                  <div className="articles-featured-card__actions">
                    <Link to={`/${language}/articles/${featuredArticle.slug}`} className="articles-primary-link">
                      {t('articles.readFeatured')}
                    </Link>
                    {featuredArticle.toolSlug && (
                      <Link to={`/${language}/${featuredArticle.toolSlug}`} className="articles-secondary-link">
                        {t('articles.readMore')}
                      </Link>
                    )}
                  </div>
                </article>

                <aside className="articles-sidebar-card">
                  <h2>{t('articles.latestTitle')}</h2>
                  <div className="articles-sidebar-list">
                    {sidebarArticles.map((article) => (
                      <article key={article.id || article.slug} className="articles-list-compact">
                        <h3 className="articles-list-compact__title">
                          <Link to={`/${language}/articles/${article.slug}`}>{article.title}</Link>
                        </h3>
                        {article.excerpt ? <p className="articles-list-compact__excerpt">{article.excerpt}</p> : null}
                      </article>
                    ))}
                  </div>
                </aside>
              </section>
            )}

            {editorialArticles.length > 0 && (
              <section className="articles-section-card">
                <div className="articles-section-card__eyebrow">{t('articles.editorialEyebrow')}</div>
                <h2>{t('articles.editorialTitle')}</h2>
                <p>{t('articles.editorialDescription')}</p>
                <div className="articles-section-grid">
                  {editorialArticles.map((article) => {
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

                        <h3 className="articles-section-card__title">
                          <Link
                            to={articlePath}
                            className="article-card__link"
                            onMouseEnter={() => preloadRoute('/articles')}
                            onFocus={() => preloadRoute('/articles')}
                            onTouchStart={() => preloadRoute('/articles')}
                          >
                            {article.title}
                          </Link>
                        </h3>

                        {article.excerpt ? <p className="articles-section-card__excerpt">{article.excerpt}</p> : null}

                        <div className="article-card__actions">
                          <Link to={articlePath} className="article-card__read-more">
                            {t('articles.readFeatured')}
                          </Link>
                          {article.toolSlug && (
                            <Link to={`/${language}/${article.toolSlug}`} className="article-card__tool-link">
                              {t('articles.readMore')}
                            </Link>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </ToolPageShell>
    </>
  )
}

export default ArticlesIndex
