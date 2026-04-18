import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import ToolPageShell from '../components/ToolPageShell'
import InlineSpinner from '../components/InlineSpinner'
import ArticleMarkdown from '../components/articles/ArticleMarkdown'
import {
  fetchArticles,
  fetchArticleBySlug,
  readCachedArticlesIndex,
  readCachedArticleDetail,
  readInitialArticlesIndex,
  readInitialArticleDetail,
  writeCachedArticlesIndex,
  writeCachedArticleDetail,
} from '../lib/articlesApi'
import { articleMatchesLanguage, filterArticlesForLanguage } from '../lib/articleLanguage'
import { getLocalizedRouteUrl } from '../config/routeSeo'
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
  const initialArticle = readInitialArticleDetail(slug, language)
  const cachedArticle = initialArticle || readCachedArticleDetail(slug, language)
  const [article, setArticle] = useState(cachedArticle)
  const [status, setStatus] = useState(cachedArticle ? 'success' : 'loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [relatedArticles, setRelatedArticles] = useState(() => {
    const seededArticles = readInitialArticlesIndex(language)
    return seededArticles.length ? seededArticles : readCachedArticlesIndex(language)
  })
  const relatedRefreshKeyRef = useRef('')

  useEffect(() => {
    let cancelled = false
    let refreshTimerId = 0
    const seedArticle = readInitialArticleDetail(slug, language) || readCachedArticleDetail(slug, language)
    const hasVisibleArticle = Boolean((article && article.slug === slug && articleMatchesLanguage(article, language)) || seedArticle)

    setErrorMessage('')

    if (!hasVisibleArticle) {
      setArticle(null)
      setStatus('loading')
    } else if (seedArticle && (!article || article.slug !== slug)) {
      setArticle(seedArticle)
      setStatus('success')
    }

    const runRefresh = () => fetchArticleBySlug(slug, language)
      .then((data) => {
        if (cancelled) {
          return
        }

        setArticle(data)
        setStatus('success')
        writeCachedArticleDetail(data)
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        if (!hasVisibleArticle) {
          setStatus('error')
          setErrorMessage(
            error?.status === 404
              ? t('articles.errors.notFound')
              : t('articles.errors.single')
          )
        }
      })

    if (hasVisibleArticle) {
      refreshTimerId = window.setTimeout(runRefresh, 1800)
    } else {
      runRefresh()
    }

    return () => {
      cancelled = true
      window.clearTimeout(refreshTimerId)
    }
  }, [language, slug, t])

  const localizedRelatedArticles = filterArticlesForLanguage(relatedArticles, language)
  const hasRelatedCandidates = localizedRelatedArticles.some((item) => item?.slug && item.slug !== slug)

  useEffect(() => {
    let cancelled = false
    const seedArticles = readInitialArticlesIndex(language)

    if (seedArticles.length) {
      setRelatedArticles(seedArticles)
      writeCachedArticlesIndex(seedArticles)
    }

    if (hasRelatedCandidates) {
      return () => {
        cancelled = true
      }
    }

    // If the current related index is present but yields no visible related items
    // (after language filtering + excluding current slug), refresh once.
    const refreshKey = `${language}:${slug}`
    if (relatedRefreshKeyRef.current === refreshKey) {
      return () => {
        cancelled = true
      }
    }

    relatedRefreshKeyRef.current = refreshKey

    fetchArticles(language)
      .then((items) => {
        if (cancelled) {
          return
        }

        setRelatedArticles(items)
        writeCachedArticlesIndex(items)
      })
      .catch(() => {
        // keep article page usable without related items
      })

    return () => {
      cancelled = true
    }
  }, [hasRelatedCandidates, language, slug])

  const visibleArticle = article && articleMatchesLanguage(article, language) ? article : null
  const translationKey = visibleArticle?.translationKey || visibleArticle?.translation_key || ''
  const translatedSlugs = useMemo(() => {
    if (!translationKey) {
      return { ru: '', en: '' }
    }

    const ru = relatedArticles.find((item) => (item?.translationKey || item?.translation_key) === translationKey && articleMatchesLanguage(item, 'ru'))?.slug || ''
    const en = relatedArticles.find((item) => (item?.translationKey || item?.translation_key) === translationKey && articleMatchesLanguage(item, 'en'))?.slug || ''
    return { ru, en }
  }, [relatedArticles, translationKey])
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
  const visibleRelatedArticles = localizedRelatedArticles
    .filter((item) => item.slug && item.slug !== slug)
    .slice(0, 3)
  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleTitle,
    description: articleDescription,
    author: visibleArticle?.author ? { '@type': 'Person', name: visibleArticle.author } : undefined,
    datePublished: visibleArticle?.publishedAt || undefined,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    image: visibleArticle?.coverImage ? [visibleArticle.coverImage] : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'QSEN.RU',
      url: 'https://qsen.ru',
    },
  }), [visibleArticle?.author, visibleArticle?.coverImage, visibleArticle?.publishedAt, articleDescription, articleTitle, canonicalUrl])

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
        {status === 'loading' && (
          <section className="articles-list-state" role="status" aria-live="polite">
            <InlineSpinner label={t('articles.loadingArticle')} />
            <p>{t('articles.loadingArticle')}</p>
          </section>
        )}

        {status === 'error' && (
          <section className="articles-list-state articles-list-state--error" role="alert">
            <h1>{t('articles.errorTitle')}</h1>
            <p>{errorMessage}</p>
            <Link to={`/${language}/articles/`} className="article-back-link">
              {t('articles.backToList')}
            </Link>
          </section>
        )}

        {status === 'success' && visibleArticle && (
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
      </ToolPageShell>
    </>
  )
}

export default ArticlePage
