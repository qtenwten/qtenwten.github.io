import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import { buildSearchIndex, searchRoutes } from '../config/searchIndex'
import { preloadRoute } from '../routes/lazyPages'
import ToolPageShell, { ToolPageHero, ToolResult } from '../components/ToolPageShell'
import { analytics } from '../utils/analytics'
import './SearchResults.css'

function SearchResults() {
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const searchIndex = useMemo(() => buildSearchIndex(language, t), [language, t])
  const trimmedQuery = query.trim()
  const results = useMemo(() => searchRoutes(searchIndex, trimmedQuery), [searchIndex, trimmedQuery])

  const handleSubmit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (trimmedQuery) {
      params.set('q', trimmedQuery)
      analytics.trackSearchPerformed(trimmedQuery, results.length, { source: 'search_page' })
    }
    setSearchParams(params, { replace: false })
  }

  return (
    <>
      <SEO
        title={t('searchResults.title')}
        description={t('searchResults.subtitle')}
        path={`/${language}/search`}
        robots="noindex,follow"
      />

      <ToolPageShell className="search-results-page">
        <ToolPageHero title={t('searchResults.title')} subtitle={t('searchResults.subtitle')} note={t('searchResults.searchTip')} />

        <form onSubmit={handleSubmit} className="search-results-form surface-panel">
          <label htmlFor="search-page-input" className="search-results-label">{t('searchResults.inputLabel')}</label>
          <div className="search-results-form-row">
            <input
              id="search-page-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchResults.inputPlaceholder')}
            />
            <button type="submit">{t('searchResults.submit')}</button>
          </div>
        </form>

        {!trimmedQuery ? (
          <ToolResult className="surface-panel surface-panel--subtle search-results-empty">
            <h2>{t('searchResults.startTitle')}</h2>
            <p>{t('searchResults.startText')}</p>
            <p className="search-results-meta">{language === 'en' ? `${searchIndex.length} available tools` : `Доступно инструментов: ${searchIndex.length}`}</p>
          </ToolResult>
        ) : results.length === 0 ? (
          <ToolResult className="surface-panel surface-panel--subtle search-results-empty">
            <h2>{t('searchResults.emptyTitle')}</h2>
            <p>{t('searchResults.emptyText')}</p>
          </ToolResult>
        ) : (
          <>
            <p className="search-results-meta">{language === 'en' ? `${results.length} result${results.length === 1 ? '' : 's'} for "${trimmedQuery}"` : `Результатов: ${results.length} — по запросу «${trimmedQuery}»`}</p>
            <div className="search-results-grid">
              {results.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className="search-results-card"
                  onMouseEnter={() => preloadRoute(item.routePath)}
                  onFocus={() => preloadRoute(item.routePath)}
                  onTouchStart={() => preloadRoute(item.routePath)}
                >
                  <div className="search-results-card-header">
                    <Icon name={item.icon} className="search-results-icon" />
                    <div>
                      <h2>{item.title}</h2>
                      {item.category ? <span className="search-results-category">{item.category}</span> : null}
                    </div>
                  </div>
                  <p>{item.description}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </ToolPageShell>
    </>
  )
}

export default SearchResults
