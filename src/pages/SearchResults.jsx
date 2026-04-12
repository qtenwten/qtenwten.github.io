import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import { buildSearchIndex, searchRoutes } from '../config/searchIndex'
import { preloadRoute } from '../routes/lazyPages'
import './SearchResults.css'

function SearchResults() {
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const copy = language === 'en'
    ? {
        title: 'Search tools',
        subtitle: 'Find calculators, generators, and utilities by name, description, or intent.',
        inputLabel: 'Search tools',
        inputPlaceholder: 'Search calculators, generators, SEO tools...',
        submit: 'Search',
        emptyTitle: 'No tools found',
        emptyText: 'Try a broader phrase or search by task, like “VAT”, “QR”, “password”, or “date”.',
        startTitle: 'Search the tool library',
        startText: 'Type a keyword to find the right calculator, generator, or SEO tool faster.',
        results: (count, value) => `${count} result${count === 1 ? '' : 's'} for “${value}”`,
        allTools: (count) => `${count} available tools`,
      }
    : {
        title: 'Поиск по инструментам',
        subtitle: 'Найдите нужный калькулятор, генератор или SEO-инструмент по названию, описанию и задаче.',
        inputLabel: 'Поиск по инструментам',
        inputPlaceholder: 'Найти калькулятор, генератор, SEO-инструмент...',
        submit: 'Найти',
        emptyTitle: 'Ничего не найдено',
        emptyText: 'Попробуйте более общий запрос, например: НДС, QR, пароль, дата.',
        startTitle: 'Начните поиск',
        startText: 'Введите слово или задачу, и мы покажем подходящие инструменты.',
        results: (count, value) => `Найдено: ${count} - по запросу «${value}»`,
        allTools: (count) => `Доступно инструментов: ${count}`,
      }

  const searchIndex = useMemo(() => buildSearchIndex(language, t), [language, t])
  const trimmedQuery = query.trim()
  const results = useMemo(() => searchRoutes(searchIndex, trimmedQuery), [searchIndex, trimmedQuery])

  const handleSubmit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (trimmedQuery) {
      params.set('q', trimmedQuery)
    }
    setSearchParams(params, { replace: false })
  }

  return (
    <>
      <SEO
        title={copy.title}
        description={copy.subtitle}
        path={`/${language}/search`}
        robots="noindex,follow"
      />

      <div className="tool-container search-results-page">
        <div className="search-results-hero">
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="search-results-form surface-panel">
          <label htmlFor="search-page-input" className="search-results-label">{copy.inputLabel}</label>
          <div className="search-results-form-row">
            <input
              id="search-page-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.inputPlaceholder}
            />
            <button type="submit">{copy.submit}</button>
          </div>
        </form>

        {!trimmedQuery ? (
          <div className="surface-panel surface-panel--subtle search-results-empty">
            <h2>{copy.startTitle}</h2>
            <p>{copy.startText}</p>
            <p className="search-results-meta">{copy.allTools(searchIndex.length)}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="surface-panel surface-panel--subtle search-results-empty">
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyText}</p>
          </div>
        ) : (
          <>
            <p className="search-results-meta">{copy.results(results.length, trimmedQuery)}</p>
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
      </div>
    </>
  )
}

export default SearchResults
