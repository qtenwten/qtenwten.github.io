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

const TOOL_CATEGORY_MAP = {
  'generator-adresata': 'documents',
  'vat-calculator': 'finance',
  'amount-in-words': 'documents',
  'number-to-words': 'documents',
  'qr-code-generator': 'qr-links',
  'url-shortener': 'qr-links',
  'password-generator': 'security',
  'seo-audit': 'seo',
  'seo-audit-pro': 'seo',
  'meta-tags-generator': 'seo',
  'random-number': 'random',
  'compound-interest': 'finance',
  'date-difference': 'dates',
  'calculator': 'calculators',
}

const CATEGORY_KEYS = {
  documents: 'categoryDocuments',
  finance: 'categoryFinance',
  'qr-links': 'categoryQrLinks',
  security: 'categorySecurity',
  seo: 'categorySeo',
  dates: 'categoryDates',
  random: 'categoryRandom',
}

const FALLBACK_CATEGORY_KEYS = ['documents', 'finance', 'qr-links', 'security', 'seo', 'dates', 'random']

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

function getToolCategoriesWithCounts(articles, language) {
  const categoryMap = {}
  const toolCounts = {}

  articles
    .filter((a) => a.language === language && a.toolSlug)
    .forEach((a) => {
      const slug = a.toolSlug.startsWith('/') ? a.toolSlug : `/${a.toolSlug}`
      toolCounts[slug] = (toolCounts[slug] || 0) + 1
      const cat = TOOL_CATEGORY_MAP[a.toolSlug] || TOOL_CATEGORY_MAP[a.toolSlug.replace(/^\//, '')] || 'tools'
      if (!categoryMap[cat]) categoryMap[cat] = []
      if (!categoryMap[cat].some((t) => t.path === slug)) {
        categoryMap[cat].push(slug)
      }
    })

  return { categoryMap, toolCounts }
}

function getToolsWithArticleCounts(articles, language, t) {
  const { toolCounts } = getToolCategoriesWithCounts(articles, language)
  return Object.entries(toolCounts)
    .map(([toolSlug, count]) => {
      const info = getToolDisplayInfo(toolSlug, t)
      if (!info) return null
      return { slug: toolSlug, title: info.title, icon: info.icon, count }
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count)
}

function getFallbackHubTools(t) {
  return ROUTE_REGISTRY
    .filter((entry) => entry.showOnHome && entry.path !== '/seo-audit')
    .slice(0, 9)
    .map((entry) => ({
      slug: entry.path,
      title: t(entry.titleKey),
      icon: entry.icon,
    }))
}

function ArticlesIndex() {
  const { t, language } = useLanguage()
  const { articles, status, error, refetch } = useArticlesIndex(language)

  useEffect(() => {
    if (status === 'success') {
      analytics.trackArticleListViewed({ language })
    }
  }, [status, language])

  const localizedArticles = articles.filter((a) => a.language === language)
  const { categoryMap } = getToolCategoriesWithCounts(localizedArticles, language)
  const toolsWithCounts = getToolsWithArticleCounts(localizedArticles, language, t)
  const categoriesOrder = ['documents', 'finance', 'qr-links', 'security', 'seo', 'dates', 'random']
  const activeCategories = categoriesOrder.filter((c) => categoryMap[c] && categoryMap[c].length > 0)
  const hubTools = toolsWithCounts.slice(0, 8)
  const fallbackHubTools = getFallbackHubTools(t)
  const hasLocalizedArticles = localizedArticles.length > 0
  const showEmptyHub = status === 'success' && !hasLocalizedArticles

  const featuredArticle = articles[0] || null
  const sidebarArticles = articles.slice(1, 4)
  const editorialArticles = articles.slice(1)

  if (showEmptyHub) {
    return (
      <>
        <SEO title={t('seo.articles.title')} description={t('seo.articles.description')} keywords={t('seo.articles.keywords')} path={`/${language}/articles`} />
        <ToolPageShell className="articles-page">
          <ToolPageHero eyebrow={t('articles.eyebrow')} title={t('articles.title')} subtitle={t('articles.subtitle')} note={t('articles.note')} className="articles-hero" />
          <div className="articles-hub articles-hub--empty">
            <section className="hub-intro-section" aria-labelledby="hub-intro-heading">
              <div className="hub-intro-section__content">
                <h2 id="hub-intro-heading" className="hub-intro-section__title">{t('articles.hubIntroHeading')}</h2>
                <p className="hub-intro-section__text">{t('articles.hubIntroText1')}</p>
                <p className="hub-intro-section__text">{t('articles.hubIntroText2')}</p>
              </div>
            </section>

            <section className="hub-categories-section" aria-labelledby="hub-categories-heading">
              <h2 id="hub-categories-heading" className="hub-section-title">{t('articles.categoriesTitle')}</h2>
              <div className="hub-categories-grid">
                {FALLBACK_CATEGORY_KEYS.map((catKey) => (
                  <div key={catKey} className="hub-category-card">
                    <span className="hub-category-card__label">{t(`articles.${CATEGORY_KEYS[catKey]}`)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="hub-tools-section" aria-labelledby="hub-tools-heading">
              <h2 id="hub-tools-heading" className="hub-section-title">{t('articles.emptyToolsTitle')}</h2>
              <div className="hub-tools-grid">
                {fallbackHubTools.map((tool) => (
                  <Link key={tool.slug} to={`/${language}${tool.slug}/`} className="hub-tool-card">
                    <Icon name={tool.icon} size={16} />
                    <span className="hub-tool-card__title">{tool.title}</span>
                    <span className="hub-tool-card__count">{t('articles.emptyToolCardHint')}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="articles-empty-hub" aria-labelledby="articles-empty-heading">
              <div>
                <p className="articles-empty-hub__eyebrow">{t('articles.emptyEyebrow')}</p>
                <h2 id="articles-empty-heading">{t('articles.emptyTitle')}</h2>
                <p>{t('articles.emptyDescription')}</p>
              </div>
              <Link to={`/${language}/`} className="articles-primary-link">{t('articles.hubCtaButton')}</Link>
            </section>
          </div>
        </ToolPageShell>
      </>
    )
  }

  return (
    <>
      <SEO title={t('seo.articles.title')} description={t('seo.articles.description')} keywords={t('seo.articles.keywords')} path={`/${language}/articles`} />
      <ToolPageShell className="articles-page">
        <ToolPageHero eyebrow={t('articles.eyebrow')} title={t('articles.title')} subtitle={t('articles.subtitle')} note={t('articles.note')} className="articles-hero" />
        <LoadingState status={status} error={error} skeletonCount={6} errorTitle={t('articles.errorTitle')} errorDescription={t('articles.errors.list')} onRetry={refetch} language={language}>
          <div className="articles-hub">
            <section className="hub-intro-section" aria-labelledby="hub-intro-heading">
              <div className="hub-intro-section__content">
                <h2 id="hub-intro-heading" className="hub-intro-section__title">{t('articles.hubIntroHeading')}</h2>
                <p className="hub-intro-section__text">{t('articles.hubIntroText1')}</p>
                <p className="hub-intro-section__text">{t('articles.hubIntroText2')}</p>
              </div>
            </section>

            {activeCategories.length > 0 && (
              <section className="hub-categories-section" aria-labelledby="hub-categories-heading">
                <h2 id="hub-categories-heading" className="hub-section-title">{t('articles.categoriesTitle')}</h2>
                <div className="hub-categories-grid">
                  {activeCategories.map((catKey) => (
                    <div key={catKey} className="hub-category-card">
                      <span className="hub-category-card__label">{t(`articles.${CATEGORY_KEYS[catKey]}`)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {hubTools.length > 0 && (
              <section className="hub-tools-section" aria-labelledby="hub-tools-heading">
                <h2 id="hub-tools-heading" className="hub-section-title">{t('articles.toolsWithGuidesTitle')}</h2>
                <div className="hub-tools-grid">
                  {hubTools.map((tool) => {
                    const toolPath = tool.slug.startsWith('/') ? tool.slug : `/${tool.slug}`
                    return (
                      <Link key={tool.slug} to={`/${language}${toolPath}/`} className="hub-tool-card">
                        <Icon name={tool.icon} size={16} />
                        <span className="hub-tool-card__title">{tool.title}</span>
                        <span className="hub-tool-card__count">{tool.count} {t('articles.toolsWithGuidesCount')}</span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            <section className="hub-cta-section" aria-labelledby="hub-cta-heading">
              <div className="hub-cta-section__content">
                <h2 id="hub-cta-heading" className="hub-cta-section__title">{t('articles.hubCtaTitle')}</h2>
                <p className="hub-cta-section__text">{t('articles.hubCtaText')}</p>
              </div>
              <Link to={`/${language}/`} className="hub-cta-section__button">{t('articles.hubCtaButton')}</Link>
            </section>

            {featuredArticle && (
              <section className="articles-featured-layout" aria-label={t('articles.listAriaLabel')}>
                <article className="articles-featured-card">
                  <div className="articles-featured-card__label">{t('articles.featuredLabel')}</div>
                  <h2 className="articles-featured-card__title">
                    <Link to={`/${language}/articles/${featuredArticle.slug}/`}>{featuredArticle.title}</Link>
                  </h2>
                  {featuredArticle.excerpt && <p className="articles-featured-card__excerpt">{featuredArticle.excerpt}</p>}
                  <div className="articles-featured-card__actions">
                    <Link to={`/${language}/articles/${featuredArticle.slug}/`} className="articles-primary-link">{t('articles.readFeatured')}</Link>
                    {featuredArticle.toolSlug && (
                      <Link to={`/${language}/${featuredArticle.toolSlug}/`} className="articles-secondary-link">{t('articles.readMore')}</Link>
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
                        {article.excerpt && <p className="articles-list-compact__excerpt">{article.excerpt}</p>}
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
                        {article.coverImage && (
                          <Link to={articlePath} className="article-card__media" aria-label={article.title}
                            onMouseEnter={() => preloadRoute('/articles')}
                            onFocus={() => preloadRoute('/articles')}
                            onTouchStart={() => preloadRoute('/articles')}>
                            <img src={article.coverImage} alt={pickCoverAlt(article, language, t)} loading="lazy" decoding="async" />
                          </Link>
                        )}
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
                          <Link to={articlePath} className="article-card__link"
                            onMouseEnter={() => preloadRoute('/articles')}
                            onFocus={() => preloadRoute('/articles')}
                            onTouchStart={() => preloadRoute('/articles')}>
                            {article.title}
                          </Link>
                        </h3>
                        {article.excerpt && <p className="articles-section-card__excerpt">{article.excerpt}</p>}
                        <div className="article-card__actions">
                          <Link to={articlePath} className="article-card__read-more">{t('articles.readFeatured')}</Link>
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
        </LoadingState>
      </ToolPageShell>
    </>
  )
}

export default ArticlesIndex