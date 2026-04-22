import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useLanguage } from '../contexts/LanguageContext'
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext'
import SEO from '../components/SEO'
import ToolPageShell from '../components/ToolPageShell'
import ArticleMarkdown from '../components/articles/ArticleMarkdown'
import { LoadingState } from '../components/LoadingState'
import { useArticleDetail, useArticlesIndex } from '../contexts/ArticleStoreContext'
import { articleMatchesLanguage, filterArticlesForLanguage } from '../utils/articleLanguage'
import { getLocalizedRouteUrl } from '../config/routeSeo'
import { analytics, ANALYTICS_EVENTS } from '../utils/analytics'
import { validateOgImageDimensions, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from '../components/SEO'
import './Articles.css'

function pickCoverAlt(article, language, t) {
  if (article?.title) {
    return article.title
  }
  return language === 'en' ? 'Article cover' : t('articles.coverAlt')
}

function ArticlePage() {
  const { slug = '' } = useParams()
  const { t, language } = useLanguage()
  const { setArticleTitle } = useBreadcrumbs()

  const { article, status, error, refetch } = useArticleDetail(slug, language)
  const { articles: allArticles, refetch: refetchIndex } = useArticlesIndex(language)

  const visibleArticle = article && articleMatchesLanguage(article, language) ? article : null

  useEffect(() => {
    if (visibleArticle?.title) {
      setArticleTitle(visibleArticle.title)
    }
    return () => setArticleTitle(null)
  }, [visibleArticle?.title, setArticleTitle])

  const relatedRefreshKeyRef = useRef('')

  const localizedRelatedArticles = useMemo(() => {
    return filterArticlesForLanguage(allArticles, language)
  }, [allArticles, language])

  const hasRelatedCandidates = localizedRelatedArticles.some((item) => item?.slug && item.slug !== slug)

  useEffect(() => {
    if (visibleArticle) {
      analytics.trackArticleViewed(visibleArticle.slug, visibleArticle.translationKey)
    }
  }, [visibleArticle?.slug, visibleArticle?.translationKey])

  useEffect(() => {
    if (!visibleArticle?.coverImage) return
    validateOgImageDimensions(visibleArticle.coverImage).then((dims) => {
      if (dims && (dims.width !== OG_IMAGE_WIDTH || dims.height !== OG_IMAGE_HEIGHT)) {
        console.warn(`[SEO] Article cover image has non-standard dimensions: ${dims.width}x${dims.height} (expected ${OG_IMAGE_WIDTH}x${OG_IMAGE_HEIGHT}) — ${visibleArticle.slug}`)
      }
    })
  }, [visibleArticle?.coverImage, visibleArticle?.slug])

  useEffect(() => {
    const refreshKey = `${language}:${slug}`
    if (relatedRefreshKeyRef.current === refreshKey) return
    relatedRefreshKeyRef.current = refreshKey

    if (!hasRelatedCandidates) {
      refetchIndex()
    }
  }, [hasRelatedCandidates, language, slug, refetchIndex])

  const translationKey = visibleArticle?.translationKey || visibleArticle?.translation_key || ''
  const translatedSlugs = useMemo(() => {
    if (!translationKey) {
      return { ru: '', en: '' }
    }

    const ru = localizedRelatedArticles.find((item) => (item?.translationKey || item?.translation_key) === translationKey && articleMatchesLanguage(item, 'ru'))?.slug || ''
    const en = localizedRelatedArticles.find((item) => (item?.translationKey || item?.translation_key) === translationKey && articleMatchesLanguage(item, 'en'))?.slug || ''
    return { ru, en }
  }, [localizedRelatedArticles, translationKey])

  const canonicalPath = useMemo(() => `/${language}/articles/${slug}`, [language, slug])
  const canonicalUrl = useMemo(() => getLocalizedRouteUrl(language, `/articles/${slug}`), [language, slug])
  const ruUrl = useMemo(() => {
    if (translatedSlugs.ru) return getLocalizedRouteUrl('ru', `/articles/${translatedSlugs.ru}`)
    return getLocalizedRouteUrl('ru', '/articles')
  }, [translatedSlugs.ru])
  const enUrl = useMemo(() => {
    if (translatedSlugs.en) return getLocalizedRouteUrl('en', `/articles/${translatedSlugs.en}`)
    return getLocalizedRouteUrl('en', '/articles')
  }, [translatedSlugs.en])

  const articleTitle = visibleArticle?.title || t('articles.detailFallbackTitle')
  const articleDescription = visibleArticle?.seoDescription || visibleArticle?.excerpt || t('articles.subtitle')
  const articleSeoTitle = visibleArticle?.seoTitle || (status === 'success' ? `${articleTitle} | QSEN.RU` : t('articles.detailLoadingTitle'))
  const ogImage = visibleArticle?.coverImage || 'https://qsen.ru/og-image.png'

  const visibleRelatedArticles = useMemo(() => {
    return localizedRelatedArticles
      .filter((item) => item.slug && item.slug !== slug)
      .slice(0, 3)
  }, [localizedRelatedArticles, slug])

  const structuredData = useMemo(() => {
    const baseUrl = `https://qsen.ru`
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: articleTitle,
      description: articleDescription,
      author: visibleArticle?.author ? { '@type': 'Person', name: visibleArticle.author } : undefined,
      datePublished: visibleArticle?.publishedAt || undefined,
      dateModified: visibleArticle?.updatedAt || undefined,
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
      image: visibleArticle?.coverImage ? [visibleArticle.coverImage] : undefined,
      publisher: {
        '@type': 'Organization',
        name: 'QSEN.RU',
        url: baseUrl,
      },
    }
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'en' ? 'Home' : 'Главная',
          item: `${baseUrl}/${language}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: language === 'en' ? 'Articles' : 'Статьи',
          item: `${baseUrl}/${language}/articles`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: articleTitle,
        },
      ],
    }
    return {
      '@context': 'https://schema.org',
      '@graph': [articleSchema, breadcrumbSchema],
    }
  }, [visibleArticle, language, articleTitle, articleDescription, canonicalUrl])

  return (
    <>
      <SEO
        title={articleSeoTitle}
        description={articleDescription}
        keywords={t('seo.articles.keywords')}
        image={ogImage}
        ogType="article"
        path={canonicalPath}
        structuredData={structuredData}
      />

      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
        {translatedSlugs.ru && translatedSlugs.en ? (
          <>
            <link rel="alternate" hreflang="ru" href={ruUrl} />
            <link rel="alternate" hreflang="en" href={enUrl} />
            <link rel="alternate" hreflang="x-default" href={ruUrl} />
          </>
        ) : translatedSlugs.ru ? (
          <link rel="alternate" hreflang="ru" href={ruUrl} />
        ) : translatedSlugs.en ? (
          <link rel="alternate" hreflang="en" href={enUrl} />
        ) : null}
      </Helmet>

      <ToolPageShell className="articles-page article-page">
        <LoadingState
          status={status}
          error={error}
          skeletonCount={1}
          errorTitle={t('articles.errorTitle')}
          errorDescription={error?.status === 404 ? t('articles.errors.notFound') : t('articles.errors.single')}
          onRetry={refetch}
          language={language}
        >
          {visibleArticle && (
            <div className={`article-layout ${visibleRelatedArticles.length ? 'article-layout--with-related' : ''}`.trim()}>
              <div className="article-main-column">
                <article>
                  <header className="article-header-card">
                    <div className="article-header-card__eyebrow">{t('articles.detailEyebrow')}</div>

                    {visibleArticle.coverImage ? (
                      <div className="article-cover">
                        <img src={visibleArticle.coverImage} alt={pickCoverAlt(visibleArticle, language, t)} loading="eager" decoding="async" />
                      </div>
                    ) : null}

                    <h1>{visibleArticle.title}</h1>
                    {visibleArticle.excerpt ? <p className="article-header-card__excerpt">{visibleArticle.excerpt}</p> : null}

                    <Link to={`/${language}/articles/`} className="article-back-link">
                      {t('articles.backToList')}
                    </Link>
                  </header>
                </article>

                <section className="article-content-card">
                  <ArticleMarkdown
                    content={visibleArticle.content}
                    title={visibleArticle.title}
                    lead={visibleArticle.excerpt || ''}
                  />
                </section>
              </div>

              {visibleRelatedArticles.length > 0 && (
                <aside className="articles-related-card">
                  <div className="articles-section-card__eyebrow">{t('articles.relatedEyebrow')}</div>
                  <h2>{t('articles.relatedTitle')}</h2>
                  <div className="articles-related-list">
                    {visibleRelatedArticles.map((relatedArticle) => (
                      <article key={relatedArticle.id || relatedArticle.slug} className="articles-list-compact">
                        <h3 className="articles-list-compact__title">
                          <Link to={`/${language}/articles/${relatedArticle.slug}`}>{relatedArticle.title}</Link>
                        </h3>
                        {relatedArticle.excerpt ? <p className="articles-list-compact__excerpt">{relatedArticle.excerpt}</p> : null}
                      </article>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          )}
        </LoadingState>
      </ToolPageShell>
    </>
  )
}

export default ArticlePage
