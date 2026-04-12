import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import { preloadRoute } from '../routes/lazyPages'
import './Home.css'

function Home({ searchValue, onSearchChange }) {
  const { t, language } = useLanguage()
  const [searchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category')

  const tools = [
    {
      id: 'number-to-words',
      path: '/number-to-words',
      icon: 'text_fields',
      titleKey: 'tools.numberToWords.title',
      descriptionKey: 'tools.numberToWords.description',
      category: 'converters'
    },
    {
      id: 'vat-calculator',
      path: '/vat-calculator',
      icon: 'payments',
      titleKey: 'tools.vatCalculator.title',
      descriptionKey: 'tools.vatCalculator.description',
      category: 'calculators'
    },
    {
      id: 'compound-interest',
      path: '/compound-interest',
      icon: 'trending_up',
      titleKey: 'tools.compoundInterest.title',
      descriptionKey: 'tools.compoundInterest.description',
      category: 'calculators'
    },
    {
      id: 'seo-audit-pro',
      path: '/seo-audit-pro',
      icon: 'rocket_launch',
      titleKey: 'tools.seoAuditPro.title',
      descriptionKey: 'tools.seoAuditPro.description',
      category: 'tools'
    },
    {
      id: 'qr-code-generator',
      path: '/qr-code-generator',
      icon: 'qr_code',
      titleKey: 'tools.qrCodeGenerator.title',
      descriptionKey: 'tools.qrCodeGenerator.description',
      category: 'generators'
    },
    {
      id: 'url-shortener',
      path: '/url-shortener',
      icon: 'link',
      titleKey: 'tools.urlShortener.title',
      descriptionKey: 'tools.urlShortener.description',
      category: 'generators'
    },
    {
      id: 'password-generator',
      path: '/password-generator',
      icon: 'lock',
      titleKey: 'tools.passwordGenerator.title',
      descriptionKey: 'tools.passwordGenerator.description',
      category: 'generators'
    },
    {
      id: 'meta-tags-generator',
      path: '/meta-tags-generator',
      icon: 'label',
      titleKey: 'tools.metaTagsGenerator.title',
      descriptionKey: 'tools.metaTagsGenerator.description',
      category: 'tools'
    },
    {
      id: 'random-number',
      path: '/random-number',
      icon: 'casino',
      titleKey: 'tools.randomNumber.title',
      descriptionKey: 'tools.randomNumber.description',
      category: 'generators'
    },
    {
      id: 'calculator',
      path: '/calculator',
      icon: 'calculate',
      titleKey: 'tools.calculator.title',
      descriptionKey: 'tools.calculator.description',
      category: 'calculators'
    },
    {
      id: 'date-difference',
      path: '/date-difference',
      icon: 'calendar_month',
      titleKey: 'tools.dateDifference.title',
      descriptionKey: 'tools.dateDifference.description',
      category: 'calculators'
    }
  ]

  const filteredTools = useMemo(() => {
    let result = tools

    // Фильтр по категории из URL
    if (categoryFilter) {
      result = result.filter(tool => tool.category === categoryFilter)
    }

    // Фильтр по поиску
    if (searchValue && searchValue.trim() !== '') {
      const query = searchValue.toLowerCase()
      result = result.filter(
        tool =>
          t(tool.titleKey).toLowerCase().includes(query) ||
          t(tool.descriptionKey).toLowerCase().includes(query)
      )
    }

    return result
  }, [searchValue, categoryFilter, language, t])

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
        title={t('seo.home.title')}
        description={t('seo.home.description')}
        path={`/${language}/`}
        keywords={t('seo.home.keywords')}
      />

      <div className="home">
        <div className="container">
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
