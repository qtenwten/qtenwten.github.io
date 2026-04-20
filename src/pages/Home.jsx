import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import { getHomeRouteEntries } from '../config/routeRegistry'
import { getRouteSeo } from '../config/routeSeo'
import { buildSearchIndex, searchRoutes } from '../config/searchIndex'
import { fetchArticles, readCachedArticlesIndex, readInitialArticlesIndex, writeCachedArticlesIndex } from '../lib/articlesApi'
import { filterArticlesForLanguage } from '../lib/articleLanguage'
import { preloadRoute } from '../routes/lazyPages'
import './Home.css'

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

function Home({ searchValue, onSearchChange }) {
  const { t, language } = useLanguage()
  const [searchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category')
  const homeSeo = getRouteSeo(language, '/')

  const tools = getHomeRouteEntries().map((entry) => ({
    id: entry.key,
    path: entry.path,
    icon: entry.icon,
    titleKey: entry.titleKey,
    descriptionKey: entry.descriptionKey,
    category: entry.categorySlug,
  }))
  const toolsById = useMemo(() => Object.fromEntries(tools.map((tool) => [tool.id, tool])), [tools])

  const searchIndex = useMemo(() => buildSearchIndex(language, t), [language, t])

  const [latestArticles, setLatestArticles] = useState(() => readCachedArticlesIndex(language).slice(0, 3))
  const visibleLatestArticles = filterArticlesForLanguage(latestArticles, language).slice(0, 3)

  const filteredTools = useMemo(() => {
    let result = searchIndex.map((item) => ({
      ...toolsById[item.id],
    }))

    // Фильтр по категории из URL
    if (categoryFilter) {
      result = result.filter(tool => tool.category === categoryFilter)
    }

    // Фильтр по поиску
    if (searchValue && searchValue.trim() !== '') {
      const hits = new Set(searchRoutes(searchIndex, searchValue).map((item) => item.id))
      result = result.filter((tool) => hits.has(tool.id))
    }

    return result
  }, [searchValue, categoryFilter, language, t, searchIndex, toolsById])

  // Группировка инструментов по категориям
  const groupedTools = useMemo(() => filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {}), [filteredTools])

  // Порядок отображения категорий
  const categoryOrder = ['generators', 'calculators', 'converters', 'tools']

  useEffect(() => {
    let cancelled = false

    if (visibleLatestArticles.length > 0) {
      return () => {
        cancelled = true
      }
    }

    fetchArticles(language)
      .then((items) => {
        if (cancelled) {
          return
        }

        setLatestArticles(items.slice(0, 3))
        writeCachedArticlesIndex(items)
      })
      .catch(() => {
        // latest articles block is optional on the home page
      })

    return () => {
      cancelled = true
    }
  }, [language, visibleLatestArticles.length])

  return (
    <>
      <SEO
        path={`/${language}/`}
      />

      <div className="home">
        <div className="container">
          <section className="home-hero" aria-labelledby="home-heading">
            <h1 id="home-heading">{homeSeo.h1}</h1>
            <p>{t('home.subtitle')}</p>
            <div className="home-trust">
              <span className="home-trust-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                {t('home.trustFree')}
              </span>
              <span className="home-trust-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                {t('home.trustNoRegister')}
              </span>
              <span className="home-trust-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                {t('home.trustFastResult')}
              </span>
            </div>
          </section>

          {filteredTools.length > 0 ? (
            searchValue && searchValue.trim() !== '' ? (
              // Показываем все результаты поиска без категорий
              <div className="tools-grid">
                {filteredTools.map(tool => (
                  <Link
                    to={`/${language}${tool.path}`}
                    key={tool.id}
                    className="tool-card"
                    onMouseEnter={() => preloadRoute(tool.path)}
                    onFocus={() => preloadRoute(tool.path)}
                    onTouchStart={() => preloadRoute(tool.path)}
                  >
                    <Icon name={tool.icon} className="tool-icon" />
                    <h3>{t(tool.titleKey)}</h3>
                    <p>{t(tool.descriptionKey)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              // Показываем по категориям в сетке 2x2
              <div className="categories-grid">
                {categoryOrder.map(category => {
                  const categoryTools = groupedTools[category]
                  if (!categoryTools || categoryTools.length === 0) return null

                  return (
                    <div key={category} className="category-section">
                      <h2 className="category-title">
                        {category === 'generators' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                        )}
                        {category === 'calculators' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="16" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="14" x2="8" y2="18"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
                        )}
                        {category === 'converters' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 3l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 21l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        )}
                        {category === 'tools' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                        )}
                        {t(`categories.${category}`)}
                      </h2>
                      <div className="tools-grid">
                        {categoryTools.map(tool => (
                          <Link
                            to={`/${language}${tool.path}`}
                            key={tool.id}
                            className="tool-card"
                            onMouseEnter={() => preloadRoute(tool.path)}
                            onFocus={() => preloadRoute(tool.path)}
                            onTouchStart={() => preloadRoute(tool.path)}
                          >
                            <Icon name={tool.icon} className="tool-icon" />
                            <h3>{t(tool.titleKey)}</h3>
                            <p>{t(tool.descriptionKey)}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <div className="no-results">
              <p>{t('common.noResults')}</p>
            </div>
          )}

          {!searchValue && !categoryFilter && visibleLatestArticles.length > 0 && (
            <section className="home-articles" aria-labelledby="home-articles-heading">
              <div className="home-articles__header">
                <div>
                  <span className="home-articles__eyebrow">{t('home.latestArticlesEyebrow')}</span>
                  <h2 id="home-articles-heading">{t('home.latestArticlesTitle')}</h2>
                  <p>{t('home.latestArticlesDescription')}</p>
                </div>
                <Link
                  to={`/${language}/articles/`}
                  className="home-articles__link"
                  onMouseEnter={() => preloadRoute('/articles')}
                  onFocus={() => preloadRoute('/articles')}
                  onTouchStart={() => preloadRoute('/articles')}
                >
                  {t('home.latestArticlesAction')}
                </Link>
              </div>

              <div className="home-articles__grid">
                {visibleLatestArticles.map((article) => (
                  <article key={article.id || article.slug} className="home-article-card">
                    {article.publishedAt ? (
                      <div className="home-article-card__meta">
                        <span>{formatPublishedDate(article.publishedAt, language)}</span>
                      </div>
                    ) : null}
                    <h3>
                      <Link
                        to={`/${language}/articles/${article.slug}`}
                        onMouseEnter={() => preloadRoute('/articles')}
                        onFocus={() => preloadRoute('/articles')}
                        onTouchStart={() => preloadRoute('/articles')}
                      >
                        {article.title}
                      </Link>
                    </h3>
                    {article.excerpt ? <p>{article.excerpt}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

export default Home
