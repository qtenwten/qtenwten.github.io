import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import './Breadcrumbs.css'

const routeConfig = {
  '/number-to-words': {
    name: 'Число прописью',
    category: 'Конвертеры'
  },
  '/vat-calculator': {
    name: 'Калькулятор НДС',
    category: 'Калькуляторы'
  },
  '/calculator': {
    name: 'Калькулятор',
    category: 'Калькуляторы'
  },
  '/time-calculator': {
    name: 'Калькулятор времени',
    category: 'Калькуляторы'
  },
  '/compound-interest': {
    name: 'Сложные проценты',
    category: 'Калькуляторы'
  },
  '/random-number': {
    name: 'Генератор чисел',
    category: 'Генераторы'
  }
}

function Breadcrumbs() {
  const location = useLocation()
  const pathname = location.pathname

  // Не показываем на главной
  if (pathname === '/') return null

  const config = routeConfig[pathname]
  if (!config) return null

  const breadcrumbs = [
    { name: 'Главная', url: 'https://qsen.ru/' },
    { name: config.category, url: null },
    { name: config.name, url: `https://qsen.ru${pathname}` }
  ]

  // JSON-LD структурированные данные для SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': crumb.url || undefined
    }))
  }

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <nav className="breadcrumbs" aria-label="Навигация">
        <ol className="breadcrumbs-list">
          <li className="breadcrumbs-item">
            <Link to="/" className="breadcrumbs-link">Главная</Link>
          </li>
          <li className="breadcrumbs-separator" aria-hidden="true">→</li>
          <li className="breadcrumbs-item">
            <span className="breadcrumbs-category">{config.category}</span>
          </li>
          <li className="breadcrumbs-separator" aria-hidden="true">→</li>
          <li className="breadcrumbs-item">
            <span className="breadcrumbs-current" aria-current="page">{config.name}</span>
          </li>
        </ol>
      </nav>
    </>
  )
}

export default Breadcrumbs
