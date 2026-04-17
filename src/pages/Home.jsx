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

// DEBUG: Diagnostic counter for tracking renders
const _debugRenderCount = { value: 0 }

function Home({ searchValue, onSearchChange }) {
  const { t, language } = useLanguage()
  const [searchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category')
  const homeSeo = getRouteSeo(language, '/')

  // DIAG: mount/unmount
  useEffect(() => {
    console.log('🏠 [Home] MOUNT', {
      language,
      searchValue: searchValue || '',
      categoryFilter: categoryFilter || '',
    })
    return () => {
      console.log('🏠 [Home] UNMOUNT', {
        language,
        searchValue: searchValue || '',
        categoryFilter: categoryFilter || '',
      })
    }
  }, [])

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

  // DEBUG: Track readInitialArticlesIndex result
  const _debugInitialArticles = readInitialArticlesIndex(language)
  const [latestArticles, setLatestArticles] = useState(() => (_debugInitialArticles.length ? _debugInitialArticles : readCachedArticlesIndex(language)).slice(0, 3))
  const visibleLatestArticles = filterArticlesForLanguage(latestArticles, language).slice(0, 3)

  // DEBUG: Track render cycle
  _debugRenderCount.value++
  const _thisRender = _debugRenderCount.value

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

    // DEBUG: Log when fetch is triggered
    console.log('[HOME DEBUG] FetchArticles triggered, visibleLatestArticles.length =', visibleLatestArticles.length, 'render #', _thisRender)

    fetchArticles(language)
      .then((items) => {
        if (cancelled) {
          return
        }

        console.log('[HOME DEBUG] FetchArticles resolved, items count =', items?.length, 'render #', _thisRender)
        setLatestArticles(items.slice(0, 3))
        writeCachedArticlesIndex(items)
      })
      .catch((err) => {
        console.log('[HOME DEBUG] FetchArticles rejected:', err?.message, 'render #', _thisRender)
        // latest articles block is optional on the home page
      })

    return () => {
      cancelled = true
    }
  }, [language, visibleLatestArticles.length])

  // DEBUG: Track state on every render
  useEffect(() => {
    console.log('[HOME DEBUG] Render #' + _thisRender, {
      language,
      initialArticlesLength: _debugInitialArticles.length,
      latestArticlesLength: latestArticles.length,
      visibleLatestArticlesLength: visibleLatestArticles.length,
      shouldShowArticles: !searchValue && !categoryFilter && visibleLatestArticles.length > 0,
      searchValue: searchValue || '',
      categoryFilter: categoryFilter || ''
    })
  })

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
                      <h2 className="category-title">{t(`categories.${category}`)}</h2>
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
