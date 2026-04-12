import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import { getHomeRouteEntries } from '../config/routeRegistry'
import { getRouteSeo } from '../config/routeSeo'
import { buildSearchIndex, searchRoutes } from '../config/searchIndex'
import { preloadRoute } from '../routes/lazyPages'
import './Home.css'

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
        </div>
      </div>
    </>
  )
}

export default Home
