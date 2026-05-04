import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import ToolPageShell, { ToolPageHero } from '../components/ToolPageShell'
import { LoadingState } from '../components/LoadingState'
import { useArticlesIndex } from '../contexts/ArticleStoreContext'
import { ROUTE_REGISTRY } from '../config/routeRegistry'
import { preloadRoute } from '../routes/lazyPages'
import { analytics } from '../utils/analytics'
import './Articles.css'

function pickCoverAlt(article, language, t) {
  if (article?.title) {
    return article.title
  }
  return language === 'en' ? 'Article cover' : t('articles.coverAlt')
}

function getToolDisplayInfo(toolSlug, t) {
  if (!toolSlug) return null
  const normalizedSlug = toolSlug.startsWith('/') ? toolSlug : `/${toolSlug}`
  const entry = ROUTE_REGISTRY.find((r) => r.path === normalizedSlug)
  if (!entry) return null
  return { title: t(entry.titleKey), icon: entry.icon }
}

function ArticlesIndex() {
  const { t, language } = useLanguage()
  const { articles, status, error, refetch } = useArticlesIndex(language)

  useEffect(() => {
    if (status === 'success') {
      analytics.trackArticleListViewed({ language })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, language])

  const featuredArticle = articles[0] || null
  const sidebarArticles = articles.slice(1, 4)
  const editorialArticles = articles.slice(1)

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

        <LoadingState
          status={status}
          error={error}
          skeletonCount={6}
          errorTitle={t('articles.errorTitle')}
          errorDescription={t('articles.errors.list')}
          onRetry={refetch}
          language={language}
        >
          {articles.length === 0 && status === 'success' ? (
            <section className="articles-list-state">
              <h2>{t('articles.emptyTitle')}</h2>
              <p>{t('articles.emptyDescription')}</p>
            </section>
          ) : (
            <div className="articles-hub">
              {featuredArticle && (
                <section className="articles-featured-layout" aria-label={t('articles.listAriaLabel')}>
                  <article className="articles-featured-card">
                    <div className="articles-featured-card__label">{t('articles.featuredLabel')}</div>
                    <h2 className="articles-featured-card__title">
                      <Link to={`/${language}/articles/${featuredArticle.slug}/`}>{featuredArticle.title}</Link>
                    </h2>
                    {featuredArticle.excerpt ? <p className="articles-featured-card__excerpt">{featuredArticle.excerpt}</p> : null}
                    <div className="articles-featured-card__actions">
                      <Link to={`/${language}/articles/${featuredArticle.slug}/`} className="articles-primary-link">
                        {t('articles.readFeatured')}
                      </Link>
                      {featuredArticle.toolSlug && (
                        <Link to={`/${language}/${featuredArticle.toolSlug}/`} className="articles-secondary-link">
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
                            <Link to={`/${language}/articles/${article.slug}/`}>{article.title}</Link>
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
                      const articlePath = `/${language}/articles/${article.slug}/`

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

                          {article.toolSlug && (() => {
                            const info = getToolDisplayInfo(article.toolSlug, t)
                            return info ? (
                              <div className="article-card__tool-badge">
                                <Icon name={info.icon} size={12} />
                                <span>{info.title}</span>
                              </div>
                            ) : null
                          })()}

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
                              <Link to={`/${language}/${article.toolSlug}/`} className="article-card__tool-cta">
                                <Icon name="open_in_new" size={14} />
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
        </LoadingState>
      </ToolPageShell>
    </>
  )
}

export default ArticlesIndex
